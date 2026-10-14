from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.services.catalog import CatalogService
from app.models.entities import User, WatchlistItem
from app.schemas.schemas import TitleListResponse, TitleDetailResponse, TitleBase
from app.api.deps import get_current_user_optional

router = APIRouter()

@router.get("", response_model=TitleListResponse)
def list_titles(
    q: Optional[str] = Query(None, description="Search term for title or synopsis"),
    content_type: Optional[str] = Query("all", description="movie, tv, anime, or all"),
    genre: Optional[str] = Query("all", description="Genre filter"),
    year: Optional[int] = Query(None, description="Release year filter"),
    language: Optional[str] = Query(None, description="Language code e.g. en, ja"),
    sort_by: str = Query("popularity", description="popularity, rating, release_date"),
    order: str = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = CatalogService(db)
    result = service.search_titles(
        query=q,
        content_type=content_type,
        genre=genre,
        year=year,
        language=language,
        sort_by=sort_by,
        order=order,
        page=page,
        page_size=page_size
    )

    items = [TitleBase.model_validate(t) for t in result["items"]]
    return TitleListResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )

@router.get("/{identifier}", response_model=TitleDetailResponse)
def get_title_detail(
    identifier: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    service = CatalogService(db)
    title = service.get_title_by_id_or_slug(identifier)
    if not title:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Title with identifier '{identifier}' not found."
        )

    # Check watchlist status if user is authenticated
    in_watchlist = False
    watchlist_status = None
    user_rating = None

    if current_user:
        item = db.query(WatchlistItem).filter(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.title_id == title.id
        ).first()
        if item:
            in_watchlist = True
            watchlist_status = item.status
            user_rating = item.user_rating

    related = service.get_related_titles(title, limit=6)
    related_models = [TitleBase.model_validate(r) for r in related]

    base = TitleBase.model_validate(title)
    return TitleDetailResponse(
        **base.model_dump(),
        in_watchlist=in_watchlist,
        watchlist_status=watchlist_status,
        user_rating=user_rating,
        related_titles=related_models
    )
