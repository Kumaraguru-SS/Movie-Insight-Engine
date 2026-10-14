# Movie Insight Engine

A web application for discovering movies, series, and anime through
personalized recommendations, emerging entertainment trends, and
deliberate exploration beyond a user's usual genres.

## Project vision

Most catalog and rating sites help users find titles similar to what
they already know. Movie Insight Engine aims to combine catalog
metadata, user preferences, public ratings, and permitted trend signals
to help viewers answer:

-   What is trending right now?
-   What should I watch next?
-   What might I enjoy outside my usual genres?
-   Why was a title recommended to me?
-   Which genres and titles are gaining attention over time?

The project also defines a future-facing analytics dashboard for
OTT/content teams, with trend charts, demand estimates, and
audience-engagement indicators.

## Core principles

1.  **Discovery, not just repetition:** recommendations should include
    relevant familiar picks and thoughtful cross-genre exploration.
2.  **Explainability:** show understandable reasons for each
    recommendation.
3.  **Evidence-aware trends:** distinguish measured signals from
    estimates and predictions.
4.  **Privacy by design:** collect only necessary user data and provide
    controls.
5.  **API and licensing compliance:** use official APIs, public
    datasets, or expressly permitted data sources; do not scrape private
    or restricted content.
6.  **Honest evaluation:** do not claim prediction accuracy or business
    impact until validated with documented data and metrics.

## MVP scope

-   User registration/sign-in or a clearly documented guest mode.
-   Search and browse movies, series, and anime.
-   Title detail pages with metadata, genres, synopsis, release year,
    ratings where licensed, and availability links where supported.
-   Watchlist and watched/plan-to-watch status.
-   Preference onboarding and editable genre preferences.
-   Hybrid recommendations based on genre/content similarity and user
    activity.
-   "Explore beyond my usual genres" recommendation lane.
-   Trend dashboard based on available, timestamped data.
-   Explainable recommendation and trend labels.
-   Responsive UI, loading/error/empty states, and basic tests.

## Suggested implementation stack

The project proposal identifies HTML, CSS, JavaScript, Python,
MySQL/MongoDB, scikit-learn, Pandas, NumPy, Matplotlib, and APIs such as
TMDB and anime catalog APIs. For a manageable first version, choose one
database rather than introducing both SQL and NoSQL without a concrete
need.

**Practical MVP default:** React + Vite frontend; Python FastAPI
backend; PostgreSQL (or MySQL) database; SQLAlchemy; Pandas/scikit-learn
for baseline recommendation experiments; TMDB API for catalog metadata,
subject to its current terms and attribution requirements. An
anime-specific source can be added after verifying its API terms and
coverage. Keep API keys on the server.

## High-level architecture

``` text
Browser (React)
    |
    | HTTPS / JSON
    v
Python API (FastAPI)
    |---- Authentication and user preferences
    |---- Catalog/search service ---- permitted metadata API
    |---- Watchlist service --------- database
    |---- Recommendation service ---- baseline ranking model
    |---- Trend service ------------- timestamped public/approved data
    |
    v
Database (users, titles, preferences, watchlist, events, trend snapshots)
```

## Repository layout

``` text
movie-insight-engine/
├── frontend/                 # React UI
├── backend/                  # FastAPI API
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── data/                     # Small sample/demo data only; no secrets
├── ml/                       # Feature preparation and model experiments
├── docs/
│   ├── README.md
│   ├── RULES.md
│   ├── SRS.md
│   ├── INSTRUCTIONS.md
│   └── DEPLOYMENT.md
├── .gitignore
└── LICENSE
```

## Quick start

The exact commands depend on the generated application scaffold. Follow
`INSTRUCTIONS.md` for setup, environment variables, data-provider
configuration, testing, and development workflow. Follow `DEPLOYMENT.md`
for production deployment.

## Data-source note

The project proposal names IMDb, MovieLens, MyAnimeList, AniList, SIMKL,
X, Reddit, Discord, Twitch, and YouTube as possible sources. These are
not interchangeable and may have different API access, licensing,
privacy, rate-limit, and redistribution restrictions. Start with a
source whose terms you have verified. Do not assume social-platform
access or real-time data is available. If live signals cannot be
accessed legally or reliably, use permitted public datasets and label
trend outputs as dataset-based or demo estimates.

## Success measures

-   Search success and response time.
-   Watchlist actions succeed reliably.
-   Recommendation relevance from user feedback and offline ranking
    metrics.
-   Diversity: share of recommendations outside the user's dominant
    genres.
-   Discovery acceptance: users save, rate, or mark as watched a
    cross-genre suggestion.
-   Trend freshness, data coverage, and clearly reported uncertainty.
-   Accessibility, responsive behavior, and error recovery.

## Project documentation

-   `RULES.md` --- engineering, product, AI, privacy, and contribution
    rules.
-   `SRS.md` --- functional and non-functional requirements.
-   `INSTRUCTIONS.md` --- local setup and development workflow.
-   `DEPLOYMENT.md` --- deployment and operations checklist.

## Disclaimer

This is a discovery and analytics project, not a streaming service. It
should link to lawful viewing options only when supported by a permitted
provider/source. Predictions are estimates, not guarantees of
popularity, quality, or personal enjoyment.
