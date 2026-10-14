from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import TrendOverviewResponse
from app.trends.service import TrendService

router = APIRouter()

@router.get("", response_model=TrendOverviewResponse)
def get_trends(
    period: str = Query("weekly", description="daily, weekly, monthly"),
    db: Session = Depends(get_db)
):
    service = TrendService(db)
    result = service.get_trends_overview(period=period)
    return TrendOverviewResponse(**result)
