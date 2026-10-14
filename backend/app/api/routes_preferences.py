from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import User, UserPreference
from app.schemas.schemas import PreferenceResponse, PreferenceUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=PreferenceResponse)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        # Create default preference if none exists
        pref = UserPreference(
            user_id=current_user.id,
            favorite_genres=["Science Fiction", "Action", "Thriller"],
            explore_genres=["Mystery", "Psychological"],
            avoid_genres=[],
            preferred_types=["movie", "tv", "anime"],
            preferred_languages=["en", "ja"],
            exploration_level="balanced"
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return PreferenceResponse.model_validate(pref)

@router.patch("", response_model=PreferenceResponse)
def update_preferences(
    req: PreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    pref.favorite_genres = req.favorite_genres
    pref.explore_genres = req.explore_genres
    pref.avoid_genres = req.avoid_genres
    pref.preferred_types = req.preferred_types
    pref.preferred_languages = req.preferred_languages
    pref.min_rating = req.min_rating
    pref.exploration_level = req.exploration_level

    db.commit()
    db.refresh(pref)
    return PreferenceResponse.model_validate(pref)
