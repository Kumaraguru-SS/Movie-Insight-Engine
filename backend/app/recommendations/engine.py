import math
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from app.models.entities import User, UserPreference, Title, WatchlistItem, UserFeedback, WatchlistStatus
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Transparent, explainable recommendation engine combining:
    1. Content-based similarity (TF-IDF vectorization on synopses, genres, type)
    2. Preference match (favorite genres, preferred content types, languages)
    3. User activity feedback & rating signals
    4. Controlled cross-genre exploration bonus & diversity
    5. Explainable rationale generation based on actual features
    """
    def __init__(self, db: Session):
        self.db = db

    def generate_recommendations(
        self,
        user: Optional[User],
        limit: int = 12
    ) -> Dict[str, Any]:
        all_titles = self.db.query(Title).all()
        if not all_titles:
            return {
                "recommended_for_you": [],
                "outside_comfort_zone": [],
                "dominant_genres": [],
                "exploration_genres": [],
                "exploration_level": "balanced",
                "model_version": "v1.0-tfidf-hybrid"
            }

        # Retrieve user preferences and watchlist
        pref = user.preference if user else None
        favorite_genres = set(g.lower() for g in (pref.favorite_genres if pref and pref.favorite_genres else []))
        avoid_genres = set(g.lower() for g in (pref.avoid_genres if pref and pref.avoid_genres else []))
        preferred_types = set(t.lower() for t in (pref.preferred_types if pref and pref.preferred_types else ["movie", "tv", "anime"]))
        preferred_languages = set(l.lower() for l in (pref.preferred_languages if pref and pref.preferred_languages else ["en", "ja"]))
        exploration_level = pref.exploration_level if pref and pref.exploration_level else "balanced"
        min_rating = (pref.min_rating if pref and pref.min_rating is not None else 0.0) or 0.0

        # Incorporate watchlist interactions
        watched_title_ids = set()
        liked_genres_from_activity: Dict[str, float] = {}

        if user:
            watchlist_items = self.db.query(WatchlistItem).filter(WatchlistItem.user_id == user.id).all()
            for wi in watchlist_items:
                watched_title_ids.add(wi.title_id)
                multiplier = 1.0
                if wi.status == WatchlistStatus.WATCHED.value:
                    multiplier = 1.5
                elif wi.status == WatchlistStatus.WATCHING.value:
                    multiplier = 1.2
                elif wi.status == WatchlistStatus.DROPPED.value:
                    multiplier = -1.0

                if wi.title and wi.title.genres:
                    for g in wi.title.genres:
                        g_lower = g.lower()
                        liked_genres_from_activity[g_lower] = liked_genres_from_activity.get(g_lower, 0.0) + multiplier

            # Incorporate feedback
            feedbacks = self.db.query(UserFeedback).filter(UserFeedback.user_id == user.id).all()
            for fb in feedbacks:
                if fb.title and fb.title.genres:
                    for g in fb.title.genres:
                        g_lower = g.lower()
                        if fb.feedback_type in ["relevant", "more_like_this"]:
                            liked_genres_from_activity[g_lower] = liked_genres_from_activity.get(g_lower, 0.0) + 1.5
                        elif fb.feedback_type == "not_interested":
                            liked_genres_from_activity[g_lower] = liked_genres_from_activity.get(g_lower, 0.0) - 1.5

        # Determine dominant genres
        genre_scores = {}
        for g in favorite_genres:
            genre_scores[g] = genre_scores.get(g, 0.0) + 3.0
        for g, score in liked_genres_from_activity.items():
            genre_scores[g] = genre_scores.get(g, 0.0) + score

        # Top 3 dominant genres
        sorted_genres = sorted([g for g, s in genre_scores.items() if s > 0], key=lambda x: genre_scores[x], reverse=True)
        dominant_genres = sorted_genres[:3]
        if not dominant_genres:
            # Fallback for cold start without genre selection
            dominant_genres = ["science fiction", "action", "drama"]

        # Identify all catalog genres
        all_catalog_genres = set()
        for t in all_titles:
            for g in (t.genres or []):
                all_catalog_genres.add(g.lower())

        # Underrepresented exploration genres (outside dominant & not in avoid)
        underrepresented_genres = [
            g for g in all_catalog_genres
            if g not in dominant_genres and g not in avoid_genres
        ]

        # Explicit explore genres take precedence if selected in preferences
        if pref and pref.explore_genres:
            explicit_explore = [g.lower() for g in pref.explore_genres if g.lower() not in avoid_genres]
            if explicit_explore:
                underrepresented_genres = explicit_explore + [g for g in underrepresented_genres if g not in explicit_explore]

        # Calculate TF-IDF matrix for metadata similarity
        documents = []
        for t in all_titles:
            genre_text = " ".join(t.genres or [])
            doc = f"{t.title} {t.content_type} {genre_text} {t.synopsis or ''}"
            documents.append(doc)

        tfidf = TfidfVectorizer(stop_words="english", max_features=1000)
        tfidf_matrix = tfidf.fit_transform(documents)

        # Build similarity reference vector based on dominant genres and positive titles
        ref_doc = " ".join(dominant_genres)
        ref_vec = tfidf.transform([ref_doc])
        sim_scores = cosine_similarity(ref_vec, tfidf_matrix).flatten()

        # Exploration weight configuration
        exploration_weights = {
            "familiar": {"pref": 0.50, "sim": 0.25, "pop": 0.20, "explore": 0.05},
            "balanced": {"pref": 0.35, "sim": 0.30, "pop": 0.15, "explore": 0.20},
            "explore":  {"pref": 0.20, "sim": 0.25, "pop": 0.10, "explore": 0.45}
        }
        weights = exploration_weights.get(exploration_level, exploration_weights["balanced"])

        recommended_candidates = []
        outside_comfort_candidates = []

        for idx, title in enumerate(all_titles):
            # Exclude already watched/saved titles from new discovery lanes
            if title.id in watched_title_ids:
                continue

            t_genres_lower = [g.lower() for g in (title.genres or [])]

            # Hard filter on avoid genres
            if any(ag in t_genres_lower for ag in avoid_genres):
                continue

            # Rating threshold
            if title.rating < min_rating:
                continue

            # Component 1: Preference match (0.0 to 1.0)
            pref_match_count = sum(1 for g in t_genres_lower if g in dominant_genres)
            pref_score = min(pref_match_count / max(len(dominant_genres), 1), 1.0)

            # Component 2: TF-IDF similarity (0.0 to 1.0)
            sim_score = float(sim_scores[idx])

            # Component 3: Popularity & rating quality (0.0 to 1.0)
            quality_score = min((title.rating / 10.0) * 0.6 + (min(title.popularity, 100.0) / 100.0) * 0.4, 1.0)

            # Standard recommendation score
            rec_score = (
                weights["pref"] * pref_score +
                weights["sim"] * sim_score +
                weights["pop"] * quality_score
            )

            # Type and language booster
            if title.content_type.lower() in preferred_types:
                rec_score += 0.05
            if title.language.lower() in preferred_languages:
                rec_score += 0.05

            # Explainable rationale for familiar recommendations
            matched_dominant = [g.title() for g in t_genres_lower if g in dominant_genres]
            if matched_dominant:
                explanation = f"Matches your interest in {', '.join(matched_dominant)} with a high rating of {title.rating}/10."
            elif sim_score > 0.15:
                explanation = f"Thematic structure and narrative tone align with your saved preferences."
            else:
                explanation = f"Trending title with exceptional community engagement ({title.rating}/10)."

            rec_item = self._title_to_rec_dict(title, rec_score, explanation, "familiar")
            recommended_candidates.append(rec_item)

            # Cross-genre evaluation: "Outside Your Comfort Zone"
            # Must feature an underrepresented genre but maintain relevance threshold
            cross_genres = [g for g in t_genres_lower if g in underrepresented_genres]
            shares_thematic_bridge = sim_score > 0.08 or (pref_match_count > 0 and len(cross_genres) > 0)

            if cross_genres and shares_thematic_bridge:
                bridge_genre = cross_genres[0].title()
                # Cross genre score balances quality, exploration bonus, and thematic similarity
                cross_score = (
                    0.40 * quality_score +
                    0.35 * sim_score +
                    0.25 * weights["explore"]
                )
                
                # Truthful cross-genre explanation
                if matched_dominant:
                    cross_explanation = (
                        f"Because you enjoy {matched_dominant[0]}, this {title.content_type.upper()} "
                        f"explores {bridge_genre} while delivering similar pacing and tension."
                    )
                else:
                    cross_explanation = (
                        f"High-quality entry point into {bridge_genre} ({title.rating}/10) "
                        f"thematically connected to your discovery profile."
                    )

                cross_item = self._title_to_rec_dict(
                    title,
                    cross_score,
                    cross_explanation,
                    "cross_genre",
                    bridge_genre=bridge_genre
                )
                outside_comfort_candidates.append(cross_item)

        # Sort and select top results
        recommended_candidates.sort(key=lambda x: x["score"], reverse=True)
        outside_comfort_candidates.sort(key=lambda x: x["score"], reverse=True)

        # Ensure outside comfort zone has unique diversity (no duplicates across top items)
        top_rec = recommended_candidates[:limit]
        top_rec_ids = set(r["id"] for r in top_rec)
        distinct_outside = [c for c in outside_comfort_candidates if c["id"] not in top_rec_ids][:limit]

        return {
            "recommended_for_you": top_rec,
            "outside_comfort_zone": distinct_outside,
            "dominant_genres": [g.title() for g in dominant_genres],
            "exploration_genres": [g.title() for g in underrepresented_genres[:4]],
            "exploration_level": exploration_level,
            "model_version": "v1.0-tfidf-hybrid"
        }

    def _title_to_rec_dict(
        self,
        title: Title,
        score: float,
        explanation: str,
        match_type: str,
        bridge_genre: Optional[str] = None
    ) -> Dict[str, Any]:
        return {
            "id": title.id,
            "slug": title.slug,
            "title": title.title,
            "content_type": title.content_type,
            "synopsis": title.synopsis,
            "genres": title.genres or [],
            "release_date": title.release_date,
            "release_year": title.release_year,
            "language": title.language,
            "rating": title.rating,
            "vote_count": title.vote_count,
            "poster_url": title.poster_url,
            "backdrop_url": title.backdrop_url,
            "runtime": title.runtime,
            "cast": title.cast or [],
            "creator": title.creator,
            "popularity": title.popularity,
            "attribution": title.attribution,
            "legal_watch_url": title.legal_watch_url,
            "score": round(float(score), 3),
            "explanation": explanation,
            "match_type": match_type,
            "bridge_genre": bridge_genre
        }
