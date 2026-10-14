from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import User, Title, UserFeedback
from app.schemas.schemas import FeedbackCreateRequest, FeedbackResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    req: FeedbackCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = db.query(Title).filter(Title.id == req.title_id).first()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Title with ID {req.title_id} not found."
        )

    feedback = UserFeedback(
        user_id=current_user.id,
        title_id=req.title_id,
        feedback_type=req.feedback_type,
        context=req.context
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return FeedbackResponse.model_validate(feedback)
