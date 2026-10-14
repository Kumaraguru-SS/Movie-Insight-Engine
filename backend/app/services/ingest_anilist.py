"""
AniList Ingestion Script
Populates anime metadata, airing status, studio attribution, and cover/banner images directly into the Movie Insight Engine catalog.
Usage: python -m app.services.ingest_anilist --limit 50
"""

import sys
import argparse
import asyncio
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.entities import Title
from app.providers.anilist import AniListProvider
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("anilist_ingestion")

async def ingest_from_anilist(db: Session, target_count: int = 50):
    provider = AniListProvider()
    logger.info(f"Starting AniList catalog ingestion (target: {target_count} anime)...")
    
    page = 1
    added = 0
    while added < target_count:
        res = await provider.search_titles(query="", page=page, page_size=25)
        items = res.get("items", [])
        if not items:
            break

        for item in items:
            slug = item["slug"]
            existing = db.query(Title).filter(Title.slug == slug).first()
            if existing:
                continue

            title_obj = Title(
                slug=slug,
                title=item["title"],
                content_type="anime",
                synopsis=item.get("synopsis"),
                genres=item.get("genres", ["Anime"]),
                release_date=item.get("release_date"),
                release_year=item.get("release_year"),
                language=item.get("language", "ja"),
                rating=item.get("rating", 0.0),
                vote_count=item.get("vote_count", 0),
                poster_url=item.get("poster_url"),
                backdrop_url=item.get("backdrop_url"),
                runtime=item.get("runtime"),
                cast=item.get("cast", []),
                creator=item.get("creator"),
                popularity=item.get("popularity", 50.0),
                attribution="Metadata and airing schedules provided by AniList.co",
                legal_watch_url=item.get("legal_watch_url")
            )
            db.add(title_obj)
            added += 1
            if added >= target_count:
                break

        db.commit()
        page += 1

    logger.info(f"AniList ingestion complete! Added {added} anime titles.")
    return added

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest anime from AniList API")
    parser.add_argument("--limit", type=int, default=50, help="Number of anime to ingest")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        asyncio.run(ingest_from_anilist(db, target_count=args.limit))
    finally:
        db.close()
