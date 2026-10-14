import httpx
import logging
from typing import Optional, Dict, Any, List
from app.providers.base import BaseCatalogProvider

logger = logging.getLogger(__name__)

class AniListProvider(BaseCatalogProvider):
    """
    AniList GraphQL API integration provider.
    Provides anime-specific metadata, airing status, episode counts, studios, and streaming links.
    """
    API_URL = "https://graphql.anilist.co"

    SEARCH_QUERY = """
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          status
          seasonYear
          startDate {
            year
            month
            day
          }
          episodes
          duration
          genres
          averageScore
          popularity
          coverImage {
            large
            extraLarge
          }
          bannerImage
          siteUrl
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
    """

    POPULAR_QUERY = """
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
        }
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          status
          seasonYear
          startDate {
            year
            month
            day
          }
          episodes
          duration
          genres
          averageScore
          popularity
          coverImage {
            large
            extraLarge
          }
          bannerImage
          siteUrl
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
    """

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
        variables = {
            "page": page,
            "perPage": min(page_size, 30)
        }
        graphql_query = self.SEARCH_QUERY if query and query.strip() else self.POPULAR_QUERY
        if query and query.strip():
            variables["search"] = query.strip()

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(self.API_URL, json={"query": graphql_query, "variables": variables})
                if res.status_code == 200:
                    data = res.json().get("data", {}).get("Page", {})
                    media_list = data.get("media", [])
                    page_info = data.get("pageInfo", {})
                    normalized = [self._normalize_anilist_media(m) for m in media_list]

                    return {
                        "items": normalized,
                        "total": page_info.get("total", len(normalized)),
                        "page": page,
                        "page_size": len(normalized),
                        "total_pages": page_info.get("lastPage", 1)
                    }
                else:
                    logger.warning(f"AniList query returned status {res.status_code}")
                    return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        except Exception as e:
            logger.error(f"Error requesting AniList GraphQL API: {e}")
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    async def get_title_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        return None

    def _normalize_anilist_media(self, media: Dict[str, Any]) -> Dict[str, Any]:
        titles = media.get("title", {})
        display_title = titles.get("english") or titles.get("romaji") or titles.get("native") or "Untitled Anime"
        
        start = media.get("startDate", {})
        year = media.get("seasonYear") or start.get("year")
        rel_date = f"{start.get('year', '')}-{start.get('month', 1):02d}-{start.get('day', 1):02d}" if start.get("year") else ""

        # Rating scale: AniList uses 0-100 averageScore -> convert to 0-10
        raw_score = media.get("averageScore")
        rating = round(float(raw_score) / 10.0, 1) if raw_score is not None else 0.0

        # Status & studio notes
        studios_nodes = media.get("studios", {}).get("nodes", [])
        studio_name = studios_nodes[0].get("name") if studios_nodes else None
        status = media.get("status")
        episodes = media.get("episodes")
        airing_info = f"Status: {status or 'Unknown'}"
        if episodes:
            airing_info += f" • {episodes} Episodes"
        if studio_name:
            airing_info += f" • Studio: {studio_name}"

        cover = media.get("coverImage", {})
        poster_url = cover.get("extraLarge") or cover.get("large")
        backdrop_url = media.get("bannerImage") or poster_url

        # Clean HTML tags from description if present
        synopsis = media.get("description") or ""
        import re
        synopsis_clean = re.sub(r"<[^>]+>", "", synopsis)

        genres = media.get("genres", [])
        if "Anime" not in genres:
            genres = ["Anime"] + genres

        return {
            "id": media.get("id"),
            "slug": f"anilist-{media.get('id')}",
            "title": display_title,
            "content_type": "anime",
            "synopsis": synopsis_clean[:1000] if synopsis_clean else None,
            "genres": genres,
            "release_date": rel_date,
            "release_year": year,
            "language": "ja",
            "rating": rating,
            "vote_count": int(media.get("popularity", 0)),
            "poster_url": poster_url,
            "backdrop_url": backdrop_url,
            "runtime": f"{media.get('duration')} min" if media.get("duration") else None,
            "cast": [studio_name] if studio_name else [],
            "creator": studio_name or airing_info,
            "popularity": float(media.get("popularity", 0.0)),
            "attribution": "Metadata & airing schedule provided by AniList.co",
            "legal_watch_url": media.get("siteUrl") or f"https://anilist.co/anime/{media.get('id')}"
        }
