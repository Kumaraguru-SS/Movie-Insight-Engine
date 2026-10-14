from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.entities import User
from app.schemas.schemas import RecommendationResponse
from app.recommendations.engine import RecommendationEngine
from app.api.deps import get_current_user_optional

router = APIRouter()

@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generate personalized recommendations and intentional cross-genre discovery.
    Cold-start safe: guests or new accounts receive balanced genre discovery and trending recommendations.
    """
    engine = RecommendationEngine(db)
    result = engine.generate_recommendations(user=current_user, limit=limit)
    return RecommendationResponse(**result)
