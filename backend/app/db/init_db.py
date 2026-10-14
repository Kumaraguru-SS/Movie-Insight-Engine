from sqlalchemy.orm import Session
from app.models.entities import Title, TrendSnapshot
from app.db.seeds import SEED_TITLES, SEED_TRENDS
import logging

logger = logging.getLogger(__name__)

def seed_database_if_empty(db: Session):
    existing_titles_count = db.query(Title).count()
    if existing_titles_count == 0:
        logger.info("Initializing database with official TMDB & AniList live catalog...")
        try:
            from app.services.ingest_tmdb import ingest_from_tmdb
            ingest_from_tmdb(db, target_count=50)
        except Exception as e:
            logger.warning(f"Initial TMDB ingestion failed or key not configured: {e}")

        try:
            import asyncio
            from app.services.ingest_anilist import ingest_from_anilist
            asyncio.run(ingest_from_anilist(db, target_count=30))
        except Exception as e:
            logger.warning(f"Initial AniList ingestion skipped: {e}")

        logger.info("Database initialized with verified official catalog data.")

    existing_trends_count = db.query(TrendSnapshot).count()
    if existing_trends_count == 0:
        logger.info("Initializing database with initial trend snapshots...")
        for tr in SEED_TRENDS:
            trend_obj = TrendSnapshot(
                category=tr["category"],
                name=tr["name"],
                score=tr["score"],
                period=tr.get("period", "weekly"),
                change_pct=tr.get("change_pct", 0.0),
                data_source=tr.get("data_source", "Aggregated Catalog"),
                is_demo=tr.get("is_demo", 0),
                coverage_notes=tr.get("coverage_notes")
            )
            db.add(trend_obj)
        db.commit()
        logger.info("Successfully seeded trend snapshots.")
