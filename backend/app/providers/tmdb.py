import httpx
import logging
from typing import Optional, Dict, Any
from app.providers.base import BaseCatalogProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class TMDBProvider(BaseCatalogProvider):
    """
    TMDB catalog integration provider.
    Requires TMDB_API_KEY. Gracefully handles 401/403/429/timeout and reports errors.
    """
    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
    BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.TMDB_API_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

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
        if not self.is_configured:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

        endpoint = f"{self.BASE_URL}/search/multi"
        params = {
            "api_key": self.api_key,
            "query": query,
            "page": page,
            "include_adult": False
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(endpoint, params=params)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    normalized = []
                    for item in results:
                        media_type = item.get("media_type")
                        if media_type not in ["movie", "tv"]:
                            continue
                        normalized.append(self._normalize_tmdb_item(item, media_type))
                    
                    return {
                        "items": normalized,
                        "total": data.get("total_results", len(normalized)),
                        "page": data.get("page", 1),
                        "page_size": len(normalized),
                        "total_pages": data.get("total_pages", 1)
                    }
                else:
                    logger.warning(f"TMDB search returned status {res.status_code}: {res.text}")
                    return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        except Exception as e:
            logger.error(f"Error querying TMDB API: {e}")
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    async def get_title_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        # TMDB expects numeric ID with type or formatted prefix
        return None

    def _normalize_tmdb_item(self, item: Dict[str, Any], media_type: str) -> Dict[str, Any]:
        title = item.get("title") or item.get("name") or "Untitled"
        release_date = item.get("release_date") or item.get("first_air_date") or ""
        year = int(release_date[:4]) if release_date and len(release_date) >= 4 and release_date[:4].isdigit() else None
        poster_path = item.get("poster_path")
        backdrop_path = item.get("backdrop_path")

        return {
            "id": item.get("id"),
            "slug": f"tmdb-{media_type}-{item.get('id')}",
            "title": title,
            "content_type": media_type,
            "synopsis": item.get("overview"),
            "genres": [], # TMDB search returns genre_ids; enriched in details
            "release_date": release_date,
            "release_year": year,
            "language": item.get("original_language", "en"),
            "rating": round(float(item.get("vote_average", 0.0)), 1),
            "vote_count": int(item.get("vote_count", 0)),
            "poster_url": f"{self.IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            "backdrop_url": f"{self.BACKDROP_BASE_URL}{backdrop_path}" if backdrop_path else None,
            "runtime": None,
            "cast": [],
            "creator": None,
            "popularity": float(item.get("popularity", 0.0)),
            "attribution": "Metadata provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.",
            "legal_watch_url": f"https://www.themoviedb.org/{media_type}/{item.get('id')}"
        }
