"""
IMDb Dataset Ingestion & Analytics Pipeline
Downloads and streams official IMDb datasets (title.basics and title.ratings) from https://datasets.imdbws.com/
Performs metadata parsing, rating distribution analysis, and optional database ingestion.

Usage:
  python -m app.services.ingest_imdb --analyze --limit 20000
  python -m app.services.ingest_imdb --ingest --limit 50
"""

import os
import sys
import gzip
import csv
import io
import argparse
import logging
import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.entities import Title

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("imdb_pipeline")

IMDB_RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz"
IMDB_BASICS_URL = "https://datasets.imdbws.com/title.basics.tsv.gz"

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

import urllib.request

def stream_imdb_ratings(min_votes: int = 10000, limit: int = 50000) -> Dict[str, Dict[str, float]]:
    """Stream and extract top-voted titles from title.ratings.tsv.gz without storing gigabytes on disk."""
    logger.info(f"Connecting to IMDb ratings stream ({IMDB_RATINGS_URL})...")
    ratings_map = {}

    req = urllib.request.Request(IMDB_RATINGS_URL, headers={"User-Agent": "MovieInsightEngine/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        with gzip.GzipFile(fileobj=response) as gz_stream:
            text_stream = io.TextIOWrapper(gz_stream, encoding="utf-8", errors="replace")
            reader = csv.reader(text_stream, delimiter="\t")
            header = next(reader, None)  # ['tconst', 'averageRating', 'numVotes']
            count = 0
            for row in reader:
                if len(row) >= 3:
                    tconst, avg_rating, num_votes = row[0], row[1], row[2]
                    try:
                        votes = int(num_votes)
                        if votes >= min_votes:
                            ratings_map[tconst] = {
                                "rating": float(avg_rating),
                                "votes": votes
                            }
                            count += 1
                            if count >= limit:
                                break
                    except ValueError:
                        continue

    logger.info(f"Extracted {len(ratings_map)} top-voted titles from IMDb ratings stream.")
    return ratings_map

def stream_imdb_basics_and_join(ratings_map: Dict[str, Dict[str, float]], limit: int = 100) -> List[Dict[str, Any]]:
    """Join streamed basics with pre-filtered top ratings."""
    logger.info(f"Connecting to IMDb basics stream ({IMDB_BASICS_URL})...")
    results = []

    req = urllib.request.Request(IMDB_BASICS_URL, headers={"User-Agent": "MovieInsightEngine/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        with gzip.GzipFile(fileobj=response) as gz_stream:
            text_stream = io.TextIOWrapper(gz_stream, encoding="utf-8", errors="replace")
            reader = csv.reader(text_stream, delimiter="\t")
            header = next(reader, None)
            for row in reader:
                if len(row) >= 9:
                    tconst = row[0]
                    if tconst in ratings_map:
                        title_type = row[1]
                        if title_type not in ["movie", "tvSeries", "tvMiniSeries"]:
                            continue

                        primary_title = row[2]
                        is_adult = row[4]
                        if is_adult == "1":
                            continue

                        start_year = int(row[5]) if row[5].isdigit() else None
                        runtime = f"{row[7]} min" if row[7].isdigit() else None
                        genres = [g.strip() for g in row[8].split(",") if g != "\\N"]
                        
                        rating_data = ratings_map[tconst]
                        content_type = "tv" if "tv" in title_type.lower() else "movie"

                        results.append({
                            "tconst": tconst,
                            "title": primary_title,
                            "content_type": content_type,
                            "release_year": start_year,
                            "runtime": runtime,
                            "genres": genres,
                            "rating": rating_data["rating"],
                            "votes": rating_data["votes"],
                            "legal_watch_url": f"https://www.imdb.com/title/{tconst}/"
                        })

                        if len(results) >= limit:
                            break

    return results

def analyze_imdb_dataset(limit: int = 1000):
    """Perform metadata and rating analysis."""
    print("=" * 60)
    print("IMDb DATASET STATISTICAL ANALYSIS & EXPLORATION")
    print("=" * 60)
    
    ratings_map = stream_imdb_ratings(min_votes=25000, limit=limit * 2)
    joined_data = stream_imdb_basics_and_join(ratings_map, limit=limit)
    
    if not joined_data:
        print("No records retrieved. Check connection.")
        return

    import statistics
    ratings = [d["rating"] for d in joined_data]
    votes = [d["votes"] for d in joined_data]
    genre_counts = {}
    for d in joined_data:
        for g in d["genres"]:
            genre_counts[g] = genre_counts.get(g, 0) + 1

    print(f"\nTotal Analyzed Sample Titles: {len(joined_data)}")
    print(f"Average Rating: {statistics.mean(ratings):.2f}/10")
    print(f"Median Rating: {statistics.median(ratings):.2f}/10")
    print(f"Min / Max Rating: {min(ratings):.1f} / {max(ratings):.1f}")
    print(f"Median Vote Count: {int(statistics.median(votes)):,}")

    print("\nTop Genres by Frequency in High-Rated Titles:")
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    for g, count in sorted_genres:
        pct = (count / len(joined_data)) * 100
        print(f"  * {g:16}: {count:4d} titles ({pct:.1f}%)")

    print("\nSample High-Scoring IMDb Titles:")
    top_samples = sorted(joined_data, key=lambda x: (x["rating"], x["votes"]), reverse=True)[:5]
    for s in top_samples:
        print(f"  * {s['title']} ({s['release_year']}) - Rating: {s['rating']} ({s['votes']:,} votes) | Genres: {', '.join(s['genres'])}")

    print("=" * 60)

def ingest_imdb_to_db(db: Session, limit: int = 50):
    """Ingest curated IMDb records into Movie Insight Engine database."""
    logger.info(f"Ingesting up to {limit} IMDb titles into catalog...")
    ratings_map = stream_imdb_ratings(min_votes=50000, limit=limit * 3)
    joined_data = stream_imdb_basics_and_join(ratings_map, limit=limit)

    added = 0
    for item in joined_data:
        slug = f"imdb-{item['tconst']}"
        existing = db.query(Title).filter(Title.slug == slug).first()
        if existing:
            continue

        title_obj = Title(
            slug=slug,
            external_id=item["tconst"],
            title=item["title"],
            content_type=item["content_type"],
            synopsis=f"Critically reviewed title with {item['votes']:,} global IMDb community ratings.",
            genres=item["genres"] if item["genres"] else ["Drama"],
            release_year=item["release_year"],
            release_date=str(item["release_year"]) if item["release_year"] else None,
            language="en",
            rating=item["rating"],
            vote_count=item["votes"],
            runtime=item["runtime"],
            popularity=min(float(item["votes"]) / 1000.0, 100.0),
            attribution="Information courtesy of IMDb (https://www.imdb.com). Used with permission for non-commercial analysis.",
            legal_watch_url=item["legal_watch_url"]
        )
        db.add(title_obj)
        added += 1

    db.commit()
    logger.info(f"Successfully ingested {added} high-rated IMDb titles into catalog.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IMDb Dataset Ingestion and Analysis")
    parser.add_argument("--analyze", action="store_true", help="Run analytical statistics on streamed IMDb datasets")
    parser.add_argument("--ingest", action="store_true", help="Ingest top titles into database")
    parser.add_argument("--limit", type=int, default=100, help="Number of titles to sample or ingest")
    args = parser.parse_args()

    if args.analyze:
        analyze_imdb_dataset(limit=args.limit)
    elif args.ingest:
        db = SessionLocal()
        try:
            ingest_imdb_to_db(db, limit=args.limit)
        finally:
            db.close()
    else:
        # Default behavior: run analysis
        analyze_imdb_dataset(limit=50)
