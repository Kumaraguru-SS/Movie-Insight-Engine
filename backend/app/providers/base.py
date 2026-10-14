import abc
from typing import List, Optional, Dict, Any

class BaseCatalogProvider(abc.ABC):
    @abc.abstractmethod
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
        """Search titles with filters and return a normalized dict with items and pagination."""
        pass

    @abc.abstractmethod
    async def get_title_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Fetch full title details by id or slug."""
        pass
