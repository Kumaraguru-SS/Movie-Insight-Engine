from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.entities import Title
from app.providers.tmdb import TMDBProvider
from app.providers.anime import JikanAnimeProvider
import logging
import math

logger = logging.getLogger(__name__)

class CatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.tmdb = TMDBProvider()
        self.jikan = JikanAnimeProvider()

    def search_titles(
        self,
        query: Optional[str] = None,
        content_type: Optional[str] = None,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        language: Optional[str] = None,
        sort_by: str = "popularity", # popularity, rating, release_date
        order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Search catalog in local database.
        """
        q = self.db.query(Title)

        if query and query.strip():
            clean_q = f"%{query.strip()}%"
            q = q.filter(or_(Title.title.ilike(clean_q), Title.synopsis.ilike(clean_q)))

        if content_type and content_type.lower() != "all":
            q = q.filter(Title.content_type == content_type.lower())

        if year:
            q = q.filter(Title.release_year == year)

        if language:
            q = q.filter(Title.language == language.lower())

        # Genre filtering: Title.genres is stored as JSON array of strings
        # In SQLite/Postgres we can evaluate in Python if small or use JSON queries
        all_matches = q.all()

        if genre and genre.lower() != "all":
            target_genre = genre.lower()
            filtered = []
            for t in all_matches:
                genres_lower = [g.lower() for g in (t.genres or [])]
                if target_genre in genres_lower:
                    filtered.append(t)
            all_matches = filtered

        # Sorting
        reverse = (order.lower() == "desc")
        if sort_by == "rating":
            all_matches.sort(key=lambda x: (x.rating or 0.0), reverse=reverse)
        elif sort_by == "release_date":
            all_matches.sort(key=lambda x: (x.release_year or 0), reverse=reverse)
        else: # popularity
            all_matches.sort(key=lambda x: (x.popularity or 0.0), reverse=reverse)

        total = len(all_matches)
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        items = all_matches[start_idx:end_idx]

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    def get_title_by_id_or_slug(self, identifier: str) -> Optional[Title]:
        if identifier.isdigit():
            title = self.db.query(Title).filter(Title.id == int(identifier)).first()
            if title:
                return title
        return self.db.query(Title).filter(Title.slug == identifier).first()

    def get_related_titles(self, title: Title, limit: int = 6) -> List[Title]:
        """Find related titles sharing content type or at least one genre."""
        all_other = self.db.query(Title).filter(Title.id != title.id).all()
        scored = []
        target_genres = set(g.lower() for g in (title.genres or []))

        for candidate in all_other:
            cand_genres = set(g.lower() for g in (candidate.genres or []))
            common = target_genres.intersection(cand_genres)
            score = len(common) * 2.0
            if candidate.content_type == title.content_type:
                score += 1.0
            if score > 0:
                scored.append((score, candidate))

        scored.sort(key=lambda x: (x[0], x[1].popularity), reverse=True)
        return [item[1] for item in scored[:limit]]
