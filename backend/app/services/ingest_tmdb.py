"""
Ingestion script: Seed top trending and popular movies/shows from TMDB into the local/production database.
Usage: python -m app.services.ingest_tmdb --limit 100
"""

import sys
import argparse
import httpx
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.entities import Title
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tmdb_ingestion")

GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
}

IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
BACKDROP_BASE = "https://image.tmdb.org/t/p/original"

def ingest_from_tmdb(db: Session, target_count: int = 100):
    api_key = settings.TMDB_API_KEY
    if not api_key:
        logger.error("TMDB_API_KEY is not configured in environment or .env file.")
        return 0

    logger.info(f"Starting TMDB ingestion (target: {target_count} titles)...")
    base_url = "https://api.themoviedb.org/3"
    endpoints = [
        ("trending/movie/week", "movie"),
        ("movie/top_rated", "movie"),
        ("trending/tv/week", "tv"),
        ("tv/top_rated", "tv"),
    ]

    added = 0
    with httpx.Client(timeout=10.0) as client:
        for ep, media_type in endpoints:
            for page in range(1, 10):
                if added >= target_count:
                    break

                url = f"{base_url}/{ep}"
                params = {"api_key": api_key, "page": page, "language": "en-US"}
                try:
                    res = client.get(url, params=params)
                    if res.status_code != 200:
                        logger.warning(f"Failed to fetch {url}: {res.status_code}")
                        break

                    data = res.json()
                    results = data.get("results", [])
                    if not results:
                        break

                    for item in results:
                        tmdb_id = item.get("id")
                        slug = f"tmdb-{media_type}-{tmdb_id}"

                        existing = db.query(Title).filter(Title.slug == slug).first()
                        if existing:
                            continue

                        title_name = item.get("title") or item.get("name") or "Untitled"
                        rel_date = item.get("release_date") or item.get("first_air_date") or ""
                        year = int(rel_date[:4]) if rel_date and len(rel_date) >= 4 and rel_date[:4].isdigit() else None
                        
                        genre_ids = item.get("genre_ids", [])
                        genres = [GENRE_MAP[gid] for gid in genre_ids if gid in GENRE_MAP]
                        if not genres:
                            genres = ["Drama"]

                        poster_path = item.get("poster_path")
                        backdrop_path = item.get("backdrop_path")

                        title_obj = Title(
                            slug=slug,
                            title=title_name,
                            content_type=media_type,
                            synopsis=item.get("overview") or "",
                            genres=genres,
                            release_date=rel_date,
                            release_year=year,
                            language=item.get("original_language", "en"),
                            rating=round(float(item.get("vote_average", 0.0)), 1),
                            vote_count=int(item.get("vote_count", 0)),
                            poster_url=f"{IMAGE_BASE}{poster_path}" if poster_path else None,
                            backdrop_url=f"{BACKDROP_BASE}{backdrop_path}" if backdrop_path else None,
                            runtime=None,
                            cast=[],
                            creator=None,
                            popularity=float(item.get("popularity", 50.0)),
                            attribution="Metadata provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.",
                            legal_watch_url=f"https://www.themoviedb.org/{media_type}/{tmdb_id}"
                        )

                        db.add(title_obj)
                        added += 1
                        if added >= target_count:
                            break

                    db.commit()
                except Exception as e:
                    logger.error(f"Error fetching page {page} of {ep}: {e}")
                    break

    logger.info(f"Ingestion complete! Added {added} fresh titles from TMDB.")
    return added

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest titles from TMDB API")
    parser.add_argument("--limit", type=int, default=100, help="Number of titles to fetch")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        ingest_from_tmdb(db, target_count=args.limit)
    finally:
        db.close()
