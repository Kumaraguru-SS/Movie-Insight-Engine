from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Movie Insight Engine"
    APP_SECRET_KEY: str = Field(default="dev-secret-key-super-secure-min-32-chars-long-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./movie_insight.db"

    TMDB_API_KEY: str = ""
    JIKAN_BASE_URL: str = "https://api.jikan.moe/v4"

    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
