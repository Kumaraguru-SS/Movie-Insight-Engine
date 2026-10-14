import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.db.init_db import seed_database_if_empty
from app.models.entities import User, WatchlistItem, UserPreference
from app.recommendations.engine import RecommendationEngine

# In-memory SQLite for isolated automated test suite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database_if_empty(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data
    assert "catalog_source" in data

def test_catalog_search_and_filters():
    # Search all
    res = client.get("/api/v1/titles")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    assert len(data["items"]) > 0

    first_item = data["items"][0]
    sample_word = first_item["title"].split()[0]

    # Search by keyword
    res = client.get(f"/api/v1/titles?q={sample_word}")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 1

    # Filter by content_type
    res = client.get("/api/v1/titles?content_type=anime")
    assert res.status_code == 200
    items = res.json()["items"]
    assert all(i["content_type"] == "anime" for i in items)

def test_title_detail():
    # Get first available title slug
    list_res = client.get("/api/v1/titles?page_size=1")
    assert list_res.status_code == 200
    first_title = list_res.json()["items"][0]
    slug = first_title["slug"]

    res = client.get(f"/api/v1/titles/{slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == first_title["title"]
    assert "related_titles" in data

def test_auth_and_user_isolation():
    # Register User A
    res_a = client.post("/api/v1/auth/register", json={
        "username": "usera",
        "email": "usera@example.com",
        "password": "Password123!"
    })
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]

    # Register User B
    res_b = client.post("/api/v1/auth/register", json={
        "username": "userb",
        "email": "userb@example.com",
        "password": "Password123!"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A adds title 1 to watchlist
    res_add = client.post("/api/v1/watchlist", json={"title_id": 1, "status": "watching"}, headers=headers_a)
    assert res_add.status_code == 201
    item_id = res_add.json()["id"]

    # User A can view watchlist
    res_wl_a = client.get("/api/v1/watchlist", headers=headers_a)
    assert res_wl_a.status_code == 200
    assert len(res_wl_a.json()) == 1
    assert res_wl_a.json()[0]["title_id"] == 1

    # User B CANNOT see User A's watchlist items (Strict Authorization)
    res_wl_b = client.get("/api/v1/watchlist", headers=headers_b)
    assert res_wl_b.status_code == 200
    assert len(res_wl_b.json()) == 0

    # User B CANNOT modify User A's watchlist item
    res_patch = client.patch(f"/api/v1/watchlist/{item_id}", json={"status": "watched"}, headers=headers_b)
    assert res_patch.status_code == 404

    # User B CANNOT delete User A's watchlist item
    res_del = client.delete(f"/api/v1/watchlist/{item_id}", headers=headers_b)
    assert res_del.status_code == 404

def test_recommendation_and_cross_genre():
    # Test recommendations endpoint
    res = client.get("/api/v1/recommendations")
    assert res.status_code == 200
    data = res.json()
    assert "recommended_for_you" in data
    assert "outside_comfort_zone" in data
    assert len(data["recommended_for_you"]) > 0
    assert len(data["outside_comfort_zone"]) > 0

    # Check that recommendations have explainable justifications
    first_outside = data["outside_comfort_zone"][0]
    assert first_outside["explanation"] is not None
    assert len(first_outside["explanation"]) > 10
    assert first_outside["match_type"] == "cross_genre"

def test_trends_endpoint():
    res = client.get("/api/v1/trends")
    assert res.status_code == 200
    data = res.json()
    assert len(data["trending_titles"]) > 0
    assert len(data["top_genres"]) > 0
    assert "last_updated" in data
    assert "data_source" in data
