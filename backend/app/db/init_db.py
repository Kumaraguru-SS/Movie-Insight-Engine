from sqlalchemy.orm import Session
from app.models.entities import Title, TrendSnapshot
from app.db.seeds import SEED_TITLES, SEED_TRENDS
import logging

logger = logging.getLogger(__name__)

def seed_database_if_empty(db: Session):
    existing_titles_count = db.query(Title).count()
    if existing_titles_count == 0:
        logger.info("Initializing database with curated catalog titles...")
        for item in SEED_TITLES:
            title_obj = Title(
                slug=item["slug"],
                title=item["title"],
                content_type=item["content_type"],
                synopsis=item.get("synopsis"),
                genres=item.get("genres", []),
                release_date=item.get("release_date"),
                release_year=item.get("release_year"),
                language=item.get("language", "en"),
                rating=item.get("rating", 0.0),
                vote_count=item.get("vote_count", 0),
                poster_url=item.get("poster_url"),
                backdrop_url=item.get("backdrop_url"),
                runtime=item.get("runtime"),
                cast=item.get("cast", []),
                creator=item.get("creator"),
                popularity=item.get("popularity", 50.0),
                attribution=item.get("attribution", "Curated Knowledge Base"),
                legal_watch_url=item.get("legal_watch_url")
            )
            db.add(title_obj)
        db.commit()
        logger.info("Successfully seeded catalog titles.")

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
