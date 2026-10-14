import httpx
import logging
from typing import Optional, Dict, Any, List
from app.providers.base import BaseCatalogProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class MyAnimeListProvider(BaseCatalogProvider):
    """
    MyAnimeList API v2 provider.
    Connects either:
    1. Directly via MyAnimeList API v2 (https://api.myanimelist.net/v2) with MAL_CLIENT_ID (`X-MAL-CLIENT-ID`)
    2. Or via open-source Jikan v4 REST API (no registration required fallback)
    Provides anime rankings, scores, popularity, airing season, and studio data.
    """
    MAL_API_URL = "https://api.myanimelist.net/v2"
    JIKAN_API_URL = "https://api.jikan.moe/v4"

    def __init__(self, client_id: Optional[str] = None):
        self.client_id = client_id or settings.MAL_CLIENT_ID

    @property
    def has_direct_api(self) -> bool:
        return bool(self.client_id and len(self.client_id.strip()) > 5)

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
        if self.has_direct_api:
            return await self._search_mal_v2(query, page, page_size)
        else:
            return await self._search_jikan_fallback(query, page, page_size)

    async def _search_mal_v2(self, query: str, page: int, page_size: int) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        endpoint = f"{self.MAL_API_URL}/anime"
        headers = {"X-MAL-CLIENT-ID": self.client_id}
        params = {
            "q": query or "a",
            "limit": min(page_size, 50),
            "offset": offset,
            "fields": "id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,genres,studios,status,num_episodes"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(endpoint, headers=headers, params=params)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    normalized = [self._normalize_mal_v2(item.get("node", {})) for item in data]
                    return {
                        "items": normalized,
                        "total": len(normalized) * 10,
                        "page": page,
                        "page_size": len(normalized),
                        "total_pages": page + 1
                    }
                else:
                    logger.warning(f"MAL API v2 returned {res.status_code}, trying Jikan fallback")
                    return await self._search_jikan_fallback(query, page, page_size)
        except Exception as e:
            logger.error(f"Error querying MAL API v2: {e}")
            return await self._search_jikan_fallback(query, page, page_size)

    async def _search_jikan_fallback(self, query: str, page: int, page_size: int) -> Dict[str, Any]:
        endpoint = f"{self.JIKAN_API_URL}/anime"
        params = {
            "q": query,
            "page": page,
            "limit": min(page_size, 25),
            "sfw": "true",
            "order_by": "popularity",
            "sort": "asc"
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(endpoint, params=params)
                if res.status_code == 200:
                    data = res.json()
                    items = data.get("data", [])
                    pagination = data.get("pagination", {})
                    normalized = [self._normalize_jikan(item) for item in items]
                    return {
                        "items": normalized,
                        "total": pagination.get("items", {}).get("total", len(normalized)),
                        "page": page,
                        "page_size": len(normalized),
                        "total_pages": pagination.get("last_visible_page", 1)
                    }
        except Exception as e:
            logger.info(f"Jikan MAL request failed or timed out: {e}")
        return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    async def get_title_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        return None

    def _normalize_mal_v2(self, node: Dict[str, Any]) -> Dict[str, Any]:
        pic = node.get("main_picture", {})
        poster_url = pic.get("large") or pic.get("medium")
        genres = [g.get("name") for g in node.get("genres", []) if g.get("name")]
        if "Anime" not in genres:
            genres.insert(0, "Anime")

        studios = [s.get("name") for s in node.get("studios", []) if s.get("name")]
        start_date = node.get("start_date") or ""
        year = int(start_date[:4]) if len(start_date) >= 4 and start_date[:4].isdigit() else None

        rank = node.get("rank")
        rank_str = f"Rank #{rank}" if rank else "Rank: Unranked"

        return {
            "id": node.get("id"),
            "slug": f"mal-{node.get('id')}",
            "title": node.get("title") or "Untitled Anime",
            "content_type": "anime",
            "synopsis": node.get("synopsis"),
            "genres": genres,
            "release_date": start_date,
            "release_year": year,
            "language": "ja",
            "rating": round(float(node.get("mean") or 0.0), 1),
            "vote_count": int(node.get("num_scoring_users") or node.get("num_list_users") or 0),
            "poster_url": poster_url,
            "backdrop_url": poster_url,
            "runtime": f"{node.get('num_episodes')} eps" if node.get("num_episodes") else None,
            "cast": studios,
            "creator": f"{studios[0]} • {rank_str}" if studios else rank_str,
            "popularity": float(node.get("popularity") or 50.0),
            "attribution": "Anime rankings & scores provided by MyAnimeList.net Official API v2",
            "legal_watch_url": f"https://myanimelist.net/anime/{node.get('id')}"
        }

    def _normalize_jikan(self, item: Dict[str, Any]) -> Dict[str, Any]:
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

        rank = item.get("rank")
        rank_str = f"Rank #{rank}" if rank else "Top Popular"

        studios = [s.get("name") for s in item.get("studios", []) if s.get("name")]

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
            "cast": studios,
            "creator": f"{studios[0]} • {rank_str}" if studios else rank_str,
            "popularity": float(item.get("popularity") or 50.0),
            "attribution": "Anime rankings, ratings & metadata provided by MyAnimeList.",
            "legal_watch_url": item.get("url") or f"https://myanimelist.net/anime/{item.get('mal_id')}"
        }
