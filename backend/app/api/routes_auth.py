from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import User, UserPreference
from app.schemas.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if username or email exists
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists."
        )
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default preferences
    pref = UserPreference(
        user_id=user.id,
        favorite_genres=["Science Fiction", "Action", "Thriller"],
        explore_genres=["Mystery", "Psychological"],
        avoid_genres=[],
        preferred_types=["movie", "tv", "anime"],
        preferred_languages=["en", "ja"],
        exploration_level="balanced"
    )
    db.add(pref)
    db.commit()

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/google", response_model=TokenResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register user with Google OAuth credentials."""
    import json
    import base64
    import secrets

    email = req.email
    name = req.name

    # Decode Google JWT credential payload if supplied
    if req.credential:
        try:
            parts = req.credential.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * (-len(parts[1]) % 4)
                payload_json = base64.urlsafe_b64decode(padded).decode("utf-8")
                token_data = json.loads(payload_json)
                email = token_data.get("email") or email
                name = token_data.get("name") or token_data.get("given_name") or name
        except Exception:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid Google account email could not be verified."
        )

    # Check if user already exists with this email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create username from name or email prefix
        base_username = (name or email.split("@")[0]).lower().replace(" ", "_")
        clean_username = "".join(c for c in base_username if c.isalnum() or c == "_")[:35]
        if not clean_username:
            clean_username = "google_user"

        username = clean_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{clean_username}_{counter}"
            counter += 1

        random_pw = secrets.token_urlsafe(32)
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(random_pw)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize default preference for new user
        pref = UserPreference(
            user_id=user.id,
            favorite_genres=["Science Fiction", "Action", "Drama"],
            explore_genres=["Mystery", "Animation"],
            avoid_genres=[],
            preferred_types=["movie", "tv", "anime"],
            preferred_languages=["en", "ja"],
            exploration_level="balanced"
        )
        db.add(pref)
        db.commit()

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
