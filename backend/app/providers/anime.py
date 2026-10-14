import httpx
import logging
from typing import Optional, Dict, Any
from app.providers.base import BaseCatalogProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class JikanAnimeProvider(BaseCatalogProvider):
    """
    Jikan v4 open-source anime catalog provider (backed by MyAnimeList data).
    Provides structured anime metadata with rate-limit respect and graceful error recovery.
    """
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.JIKAN_BASE_URL

    async def search_titles(
        self,
        query: str,
        content_type: Optional[str] = None,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        language: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/anime"
        params = {
            "q": query,
            "page": page,
            "limit": min(page_size, 25),
            "sfw": "true"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(endpoint, params=params)
                if res.status_code == 200:
                    data = res.json()
                    raw_items = data.get("data", [])
                    normalized = [self._normalize_jikan_item(item) for item in raw_items]
                    pagination = data.get("pagination", {})
                    return {
                        "items": normalized,
                        "total": pagination.get("items", {}).get("total", len(normalized)),
                        "page": page,
                        "page_size": len(normalized),
                        "total_pages": pagination.get("last_visible_page", 1)
                    }
                else:
                    logger.warning(f"Jikan API returned {res.status_code}")
                    return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        except Exception as e:
            logger.info(f"Jikan provider request skipped or timed out: {e}")
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    async def get_title_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        return None

    def _normalize_jikan_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        images = item.get("images", {})
        jpg = images.get("jpg", {})
        poster_url = jpg.get("large_image_url") or jpg.get("image_url")
        genres = [g.get("name") for g in item.get("genres", []) if g.get("name")]
        if "Anime" not in genres:
            genres.insert(0, "Anime")

        aired = item.get("aired", {})
        from_date = aired.get("from")
        year = item.get("year")
        if not year and from_date and len(from_date) >= 4 and from_date[:4].isdigit():
            year = int(from_date[:4])

        return {
            "id": item.get("mal_id"),
            "slug": f"mal-anime-{item.get('mal_id')}",
            "title": item.get("title") or item.get("title_english") or "Untitled Anime",
            "content_type": "anime",
            "synopsis": item.get("synopsis"),
            "genres": genres,
            "release_date": from_date[:10] if from_date else None,
            "release_year": year,
            "language": "ja",
            "rating": round(float(item.get("score") or 0.0), 1),
            "vote_count": int(item.get("scored_by") or 0),
            "poster_url": poster_url,
            "backdrop_url": poster_url,
            "runtime": f"{item.get('episodes')} eps" if item.get("episodes") else None,
            "cast": [],
            "creator": item.get("source"),
            "popularity": float(item.get("popularity") or 50.0),
            "attribution": "Anime metadata provided via Jikan / MyAnimeList public API.",
            "legal_watch_url": item.get("url")
        }
