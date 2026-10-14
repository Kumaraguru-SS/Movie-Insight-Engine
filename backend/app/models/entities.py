import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, ForeignKey, 
    Enum, UniqueConstraint, Index, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class WatchlistStatus(str, enum.Enum):
    PLAN_TO_WATCH = "plan_to_watch"
    WATCHING = "watching"
    WATCHED = "watched"
    DROPPED = "dropped"

class ExplorationLevel(str, enum.Enum):
    FAMILIAR = "familiar"
    BALANCED = "balanced"
    EXPLORE = "explore"

class FeedbackType(str, enum.Enum):
    RELEVANT = "relevant"
    NOT_INTERESTED = "not_interested"
    ALREADY_WATCHED = "already_watched"
    MORE_LIKE_THIS = "more_like_this"
    EXPLORE_DIFFERENT = "explore_different"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    preference = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    watchlist_items = relationship("WatchlistItem", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("UserFeedback", back_populates="user", cascade="all, delete-orphan")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    favorite_genres = Column(JSON, default=list, nullable=False)
    explore_genres = Column(JSON, default=list, nullable=False)
    avoid_genres = Column(JSON, default=list, nullable=False)
    preferred_types = Column(JSON, default=lambda: ["movie", "tv", "anime"], nullable=False)
    preferred_languages = Column(JSON, default=lambda: ["en", "ja"], nullable=False)
    min_rating = Column(Float, default=0.0, nullable=False)
    exploration_level = Column(String(20), default=ExplorationLevel.BALANCED.value, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="preference")

class Title(Base):
    __tablename__ = "titles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    external_id = Column(String(100), index=True, nullable=True)
    source = Column(String(50), default="catalog", nullable=False)
    title = Column(String(255), nullable=False, index=True)
    content_type = Column(String(20), nullable=False, index=True) # movie, tv, anime
    synopsis = Column(Text, nullable=True)
    genres = Column(JSON, default=list, nullable=False) # list of genre strings
    release_date = Column(String(20), nullable=True)
    release_year = Column(Integer, nullable=True, index=True)
    language = Column(String(10), default="en", nullable=False, index=True)
    rating = Column(Float, default=0.0, nullable=False)
    vote_count = Column(Integer, default=0, nullable=False)
    poster_url = Column(String(500), nullable=True)
    backdrop_url = Column(String(500), nullable=True)
    runtime = Column(String(50), nullable=True)
    cast = Column(JSON, default=list, nullable=False)
    creator = Column(String(150), nullable=True)
    popularity = Column(Float, default=0.0, nullable=False)
    attribution = Column(String(255), nullable=True)
    legal_watch_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    watchlist_items = relationship("WatchlistItem", back_populates="title")
    feedback = relationship("UserFeedback", back_populates="title")

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title_id = Column(Integer, ForeignKey("titles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default=WatchlistStatus.PLAN_TO_WATCH.value, nullable=False)
    user_rating = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="watchlist_items")
    title = relationship("Title", back_populates="watchlist_items")

    __table_args__ = (
        UniqueConstraint("user_id", "title_id", name="uq_user_title_watchlist"),
    )

class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title_id = Column(Integer, ForeignKey("titles.id", ondelete="CASCADE"), nullable=False, index=True)
    feedback_type = Column(String(50), nullable=False)
    context = Column(String(50), nullable=True) # e.g. "recommendation", "comfort_zone"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="feedback")
    title = relationship("Title", back_populates="feedback")

class TrendSnapshot(Base):
    __tablename__ = "trend_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True) # "genre", "title", "content_type"
    name = Column(String(100), nullable=False, index=True)
    score = Column(Float, nullable=False)
    period = Column(String(30), default="weekly", nullable=False) # daily, weekly, monthly
    change_pct = Column(Float, default=0.0, nullable=False)
    data_source = Column(String(100), nullable=False) # e.g. "Platform Activity & Metadata Aggregator"
    is_demo = Column(Integer, default=0, nullable=False) # 0 = real/observed, 1 = demo
    timestamp = Column(DateTime, default=utc_now, nullable=False)
    coverage_notes = Column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_trends_cat_period_time", "category", "period", "timestamp"),
    )
