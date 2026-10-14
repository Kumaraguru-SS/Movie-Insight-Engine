from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import User, WatchlistItem, Title, WatchlistStatus
from app.schemas.schemas import WatchlistCreateRequest, WatchlistUpdateRequest, WatchlistItemResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[WatchlistItemResponse])
def get_watchlist(
    status_filter: Optional[str] = Query(None, description="plan_to_watch, watching, watched, dropped"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the current authenticated user's watchlist with optional status filtering."""
    q = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id)
    if status_filter:
        q = q.filter(WatchlistItem.status == status_filter)

    items = q.order_by(WatchlistItem.updated_at.desc()).all()
    return [WatchlistItemResponse.model_validate(item) for item in items]

@router.post("", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    req: WatchlistCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = db.query(Title).filter(Title.id == req.title_id).first()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Title with ID {req.title_id} not found."
        )

    # Check for duplicate
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.title_id == req.title_id
    ).first()

    if existing:
        # Update existing status
        existing.status = req.status
        if req.user_rating is not None:
            existing.user_rating = req.user_rating
        if req.notes is not None:
            existing.notes = req.notes
        db.commit()
        db.refresh(existing)
        return WatchlistItemResponse.model_validate(existing)

    item = WatchlistItem(
        user_id=current_user.id,
        title_id=req.title_id,
        status=req.status,
        user_rating=req.user_rating,
        notes=req.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return WatchlistItemResponse.model_validate(item)

@router.patch("/{item_id}", response_model=WatchlistItemResponse)
def update_watchlist_item(
    item_id: int,
    req: WatchlistUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id,
        WatchlistItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found or does not belong to you."
        )

    if req.status is not None:
        item.status = req.status
    if req.user_rating is not None:
        item.user_rating = req.user_rating
    if req.notes is not None:
        item.notes = req.notes

    db.commit()
    db.refresh(item)
    return WatchlistItemResponse.model_validate(item)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id,
        WatchlistItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found or does not belong to you."
        )

    db.delete(item)
    db.commit()
    return None
