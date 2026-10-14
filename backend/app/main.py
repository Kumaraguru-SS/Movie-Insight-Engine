import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine, Base, get_db
from app.db.init_db import seed_database_if_empty
from app.schemas.schemas import HealthResponse

from app.api.routes_auth import router as auth_router
from app.api.routes_titles import router as titles_router
from app.api.routes_watchlist import router as watchlist_router
from app.api.routes_preferences import router as preferences_router
from app.api.routes_recommendations import router as recommendations_router
from app.api.routes_trends import router as trends_router
from app.api.routes_feedback import router as feedback_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("movie_insight_engine")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Movie Insight Engine API...")
    # Create tables if not existing
    Base.metadata.create_all(bind=engine)
    # Seed default data
    db = next(get_db())
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield
    logger.info("Shutting down Movie Insight Engine API...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Entertainment discovery platform featuring explainable recommendations and cross-genre exploration.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routes
api_prefix = "/api/v1"
app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(titles_router, prefix=f"{api_prefix}/titles", tags=["Catalog Titles"])
app.include_router(watchlist_router, prefix=f"{api_prefix}/watchlist", tags=["Watchlist"])
app.include_router(preferences_router, prefix=f"{api_prefix}/preferences", tags=["Preferences"])
app.include_router(recommendations_router, prefix=f"{api_prefix}/recommendations", tags=["Recommendations"])
app.include_router(trends_router, prefix=f"{api_prefix}/trends", tags=["Trends"])
app.include_router(feedback_router, prefix=f"{api_prefix}/feedback", tags=["Feedback"])

@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    catalog_status = "TMDB (Configured)" if settings.TMDB_API_KEY else "Built-in / Local Benchmark"

    return HealthResponse(
        status="healthy" if db_status == "ok" else "degraded",
        version="1.0.0",
        database=db_status,
        catalog_source=catalog_status,
        timestamp=datetime.now(timezone.utc)
    )
