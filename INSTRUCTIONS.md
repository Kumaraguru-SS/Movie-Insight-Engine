# Developer Instructions --- Movie Insight Engine

This guide is for setting up and building the application. Adapt
commands to the scaffold you actually create; do not assume files exist
before generating them.

## 1. Recommended MVP stack

-   Frontend: React + Vite, JavaScript, CSS.
-   Backend: Python 3.11+ with FastAPI.
-   Database: PostgreSQL recommended; MySQL is also acceptable. Choose
    one for the MVP.
-   ORM/migrations: SQLAlchemy + Alembic.
-   Data/ML: Pandas, NumPy, scikit-learn.
-   Charts: a React chart library for interactive web charts; Matplotlib
    can be used for offline analysis/report generation.
-   Catalog provider: TMDB or another provider after verifying current
    API terms, attribution, and rate limits.
-   Anime metadata: integrate a dedicated provider only after checking
    its API availability and terms.

## 2. Prerequisites

Install: - Git - Node.js LTS and npm - Python 3.11 or a compatible
supported version - PostgreSQL (or the chosen database) - A code editor

Create a provider account and API key only after reviewing its current
terms. Never put server-side API keys in frontend code.

## 3. Suggested setup

### Backend

``` bash
cd backend
python -m venv .venv
```

Activate the environment:

Windows PowerShell:

``` powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:

``` bash
source .venv/bin/activate
```

Install dependencies once `requirements.txt` has been created:

``` bash
pip install -r requirements.txt
```

Create `.env` from `.env.example` and set the values for your local
database and provider. Do not commit `.env`.

A suggested `.env.example`:

``` dotenv
APP_ENV=development
APP_SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/movie_insight
TMDB_API_KEY=
CORS_ORIGINS=http://localhost:5173
```

The exact variable names must match the implementation. `.env.example`
must contain placeholders only.

Run database migrations if configured:

``` bash
alembic upgrade head
```

Start the API, for example:

``` bash
uvicorn app.main:app --reload
```

Open the API docs at `http://127.0.0.1:8000/docs` if FastAPI's
documentation is enabled.

### Frontend

In a separate terminal:

``` bash
cd frontend
npm install
```

Create a frontend `.env` only for public configuration, such as the
backend base URL. Do not place secret API keys in `VITE_*` variables
because these are exposed to the browser.

Example:

``` dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start development mode:

``` bash
npm run dev
```

Vite usually prints the local URL, commonly `http://localhost:5173`.

## 4. Build in milestones

### Milestone 1 --- App shell

-   Set up repository, frontend, backend, linting, and environment
    configuration.
-   Build responsive navigation and basic pages.
-   Add health endpoint and consistent error response format.

### Milestone 2 --- Catalog

-   Build provider adapter on the backend.
-   Implement search, filters, pagination, title detail, provider
    attribution, timeout handling, and rate-limit handling.
-   Add mock fixtures so UI development can continue when the provider
    is unavailable.

### Milestone 3 --- User data

-   Implement authentication or document guest mode.
-   Create database migrations for preferences and watchlist.
-   Add ownership checks and tests for every private resource.

### Milestone 4 --- Recommendation MVP

-   Start with content-based similarity using genre, synopsis/keywords
    where licensed, language, and title type.
-   Use onboarding preferences for cold-start users.
-   Add a controlled exploration lane outside dominant genres.
-   Display truthful explanation labels.
-   Evaluate against a simple baseline and record limitations.

### Milestone 5 --- Trends

-   Start with a permitted dataset or API that has timestamps.
-   Define a trend metric and time window before coding the chart.
-   Show source, last-updated time, data coverage, and whether the
    result is live, delayed, or demo data.
-   Add forecast models only after enough historical data exists.

### Milestone 6 --- Quality and release

-   Add unit, integration, API, and UI tests.
-   Check keyboard navigation, contrast, mobile layout, empty states,
    and provider outages.
-   Run dependency and secret scans.
-   Prepare environment variables and deployment health checks.

## 5. Data and API guidance

-   Do not assume IMDb offers a general public API for every desired
    feature. Verify the exact dataset/API license and permitted use.
-   Check TMDB's current developer terms, attribution requirements,
    caching limits, and commercial-use restrictions before launch.
-   Verify anime API terms and rate limits independently.
-   Treat social platforms as optional integrations. Discord data should
    only come from authorized bots or communities where access and use
    are explicitly permitted. Do not ingest private messages.
-   Use YouTube/Twitch/X/Reddit data only through approved interfaces
    and in compliance with their current terms.
-   Keep data-provider code behind interfaces such as `CatalogProvider`
    and `TrendProvider`, so providers can be replaced.
-   Record source IDs and retrieval timestamps to avoid duplicate
    records and to make trend calculations reproducible.

## 6. Minimum tests

Before merging a feature, test: - valid and invalid inputs; - provider
timeout/rate limit/empty results; - anonymous versus authenticated
access; - user A cannot read or modify user B's watchlist/preferences; -
duplicate watchlist prevention; - recommendation explanations match
actual scoring signals; - cross-genre lane returns relevant candidates
and respects exploration settings; - trend charts show source and time
window; - missing data does not become a fabricated zero or a false
"live" result.

## 7. Troubleshooting

-   **Frontend cannot reach API:** confirm backend URL, CORS origins,
    port, and that the backend is running.
-   **Provider returns 401/403:** verify the key, account access,
    endpoint, and current provider terms; do not work around access
    controls.
-   **Provider returns 429:** respect rate limits, use permitted
    caching/backoff, and show a temporary fallback.
-   **Database connection fails:** verify database service, credentials,
    database name, and `DATABASE_URL`.
-   **No recommendations:** confirm the catalog contains enough metadata
    and that cold-start fallback is enabled.
-   **Charts show no data:** confirm snapshots include timestamps,
    correct units, and sufficient history.

## 8. Ready-to-ship checklist

-   [ ] `.env` is ignored by Git and no secrets appear in source or
    build artifacts.
-   [ ] Provider terms and attribution have been reviewed.
-   [ ] Database migrations work from a clean database.
-   [ ] Tests and production build pass.
-   [ ] Private routes enforce authentication and ownership.
-   [ ] Empty/loading/error states work.
-   [ ] Trend data includes source and timestamp.
-   [ ] Recommendations explain their basis and include cross-genre
    discovery.
-   [ ] Deployment, rollback, and backup steps are documented.
