from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Preference Schemas
class PreferenceUpdate(BaseModel):
    favorite_genres: List[str] = []
    explore_genres: List[str] = []
    avoid_genres: List[str] = []
    preferred_types: List[str] = ["movie", "tv", "anime"]
    preferred_languages: List[str] = ["en", "ja"]
    min_rating: float = 0.0
    exploration_level: str = "balanced" # familiar, balanced, explore

class PreferenceResponse(BaseModel):
    id: int
    user_id: int
    favorite_genres: List[str]
    explore_genres: List[str]
    avoid_genres: List[str]
    preferred_types: List[str]
    preferred_languages: List[str]
    min_rating: float
    exploration_level: str
    updated_at: datetime

    class Config:
        from_attributes = True

# Title Schemas
class TitleBase(BaseModel):
    id: int
    slug: str
    title: str
    content_type: str
    synopsis: Optional[str] = None
    genres: List[str] = []
    release_date: Optional[str] = None
    release_year: Optional[int] = None
    language: str
    rating: float
    vote_count: int
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    runtime: Optional[str] = None
    cast: List[str] = []
    creator: Optional[str] = None
    popularity: float
    attribution: Optional[str] = None
    legal_watch_url: Optional[str] = None

    class Config:
        from_attributes = True

class TitleDetailResponse(TitleBase):
    in_watchlist: bool = False
    watchlist_status: Optional[str] = None
    user_rating: Optional[float] = None
    explanation: Optional[str] = None
    related_titles: List[TitleBase] = []

class TitleListResponse(BaseModel):
    items: List[TitleBase]
    total: int
    page: int
    page_size: int
    total_pages: int

# Watchlist Schemas
class WatchlistCreateRequest(BaseModel):
    title_id: int
    status: str = "plan_to_watch" # plan_to_watch, watching, watched, dropped
    user_rating: Optional[float] = None
    notes: Optional[str] = None

class WatchlistUpdateRequest(BaseModel):
    status: Optional[str] = None
    user_rating: Optional[float] = None
    notes: Optional[str] = None

class WatchlistItemResponse(BaseModel):
    id: int
    user_id: int
    title_id: int
    status: str
    user_rating: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    title: TitleBase

    class Config:
        from_attributes = True

# Recommendation Schemas
class RecommendationItem(TitleBase):
    score: float
    explanation: str
    match_type: str # familiar, cross_genre, trending, similarity
    bridge_genre: Optional[str] = None

class RecommendationResponse(BaseModel):
    recommended_for_you: List[RecommendationItem]
    outside_comfort_zone: List[RecommendationItem]
    dominant_genres: List[str]
    exploration_genres: List[str]
    exploration_level: str
    model_version: str

# Feedback Schemas
class FeedbackCreateRequest(BaseModel):
    title_id: int
    feedback_type: str # relevant, not_interested, already_watched, more_like_this, explore_different
    context: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    title_id: int
    feedback_type: str
    context: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Trend Schemas
class TrendItem(BaseModel):
    name: str
    score: float
    change_pct: float
    period: str
    category: str
    data_source: str
    is_demo: bool
    timestamp: datetime
    coverage_notes: Optional[str] = None

class TrendOverviewResponse(BaseModel):
    trending_titles: List[TitleBase]
    top_genres: List[TrendItem]
    genre_history: List[dict]
    content_type_distribution: List[dict]
    last_updated: datetime
    data_source: str
    is_demo: bool
    coverage_notes: str

# Health Schema
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    catalog_source: str
    timestamp: datetime
