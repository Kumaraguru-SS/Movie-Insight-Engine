# Software Requirements Specification (SRS)

## Movie Insight Engine

**Version:** 1.0\
**Status:** Initial project specification

## 1. Purpose

Movie Insight Engine is a web application that helps users discover
movies, series, and anime through watchlist management, personalized
recommendations, trend analysis, and intentional exploration beyond
their usual genres. A future analytics module may help OTT and
broadcasting teams understand demand and engagement patterns.

## 2. Scope

### 2.1 In scope for the MVP

-   Catalog search and browsing for movies, series, and anime.
-   Title detail pages.
-   User preferences and optional onboarding.
-   Watchlist and viewing-status management.
-   Recommendation feed with reasons.
-   Cross-genre discovery controls.
-   Trend pages built from available, permitted, timestamped data.
-   Basic charts and filtering.
-   Responsive interface, account privacy, and error handling.

### 2.2 Future scope

-   Social sentiment analysis.
-   Time-series trend forecasting.
-   Regional trend comparisons.
-   Demand alerts and scheduled reports.
-   Advanced hybrid or collaborative filtering.
-   Separate business/OTT dashboard with acquisition, scheduling, and
    marketing insights.
-   More catalog providers and data partnerships.

### 2.3 Out of scope

-   Hosting or streaming copyrighted movies/episodes.
-   Circumventing paid services or provider restrictions.
-   Guaranteed predictions of future popularity or individual enjoyment.
-   Unapproved scraping of social media or private communities.

## 3. Stakeholders and user classes

-   **Viewer:** searches, saves titles, manages preferences, and
    receives recommendations.
-   **Guest:** browses public catalog and trends if guest access is
    enabled.
-   **Administrator:** manages application configuration, data-provider
    settings, moderation/operational controls, and system health.
-   **Analyst/OTT user (future):** reviews aggregated trend indicators
    and reports; this role is not required for the first viewer-focused
    MVP.

## 4. Assumptions and dependencies

-   A metadata provider such as TMDB will be selected after reviewing
    its current API terms and attribution requirements.
-   A separate anime source may be integrated if its API and terms
    support the intended use.
-   User accounts require a backend and database.
-   Trend data may be delayed, incomplete, region-limited, or
    unavailable.
-   The MVP can use a transparent baseline recommender without training
    a custom deep-learning model.
-   The project proposal lists Python, HTML/CSS/JavaScript,
    MySQL/MongoDB, scikit-learn, Pandas, NumPy, Matplotlib, and APIs
    including IMDb/TMDB/MAL. The implementation team must verify current
    availability and licensing before selecting sources.

## 5. Functional requirements

Priority: **P0** = required for MVP; **P1** = desirable next; **P2** =
future.

### FR-01: Catalog search \[P0\]

The system shall allow users to search titles by name and filter by
content type, genre, release year, language, and available metadata.

**Acceptance criteria** - Search returns matching titles or a clear
no-results state. - Invalid filter values are rejected or safely
ignored. - Provider failures show a useful message and do not crash the
page.

### FR-02: Title details \[P0\]

The system shall display available title metadata, including title,
synopsis, content type, genres, release date/year, poster, and
provider-backed ratings when permitted.

**Acceptance criteria** - Missing fields are omitted or shown as "Not
available"; no data is invented. - The metadata source is attributed
where required.

### FR-03: Account and session \[P0\]

The system shall support account creation, sign-in, sign-out, and
protected user data, or explicitly document a guest-only prototype mode.

**Acceptance criteria** - Passwords are never stored in plaintext. -
Protected endpoints reject unauthenticated requests. - Session/token
handling follows the selected framework's security guidance.

### FR-04: Preferences \[P0\]

The system shall let users select preferred genres, disliked genres
(optional), content types, languages, and an exploration level.

**Acceptance criteria** - Preferences persist for signed-in users. -
Users can edit or reset preferences. - The system does not treat
preferences as permanent or immutable.

### FR-05: Watchlist and status \[P0\]

The system shall let users add/remove titles and assign a status such as
"Plan to Watch", "Watching", "Watched", or "Dropped".

**Acceptance criteria** - Changes persist and are reflected after
refresh. - Duplicate watchlist entries are prevented. - A user can only
access their own private list.

### FR-06: Personalized recommendations \[P0\]

The system shall generate a ranked set of recommendations from available
title metadata, user preferences, and permitted activity signals.

**Acceptance criteria** - Each recommendation includes at least one
truthful explanation. - Watched or dismissed titles can be down-ranked
or excluded according to user settings. - If there is insufficient
history, a cold-start fallback uses selected preferences, popular
titles, or onboarding choices and labels the basis.

### FR-07: Cross-genre exploration \[P0\]

The system shall provide a discovery lane that proposes relevant titles
outside a user's dominant genres.

**Acceptance criteria** - The user can control exploration intensity. -
Recommendations identify the unfamiliar genre or connection that
motivated the suggestion. - The system preserves a relevance threshold
and does not fill the lane with random titles.

### FR-08: Trend dashboard \[P0, data-dependent\]

The system shall show trending titles and genres based on available,
timestamped signals and disclose the time window and source coverage.

**Acceptance criteria** - Every trend view states its time period and
data source/coverage. - Demo data is explicitly labeled. - Missing or
stale source data is not represented as live.

### FR-09: Trend visualization \[P1\]

The system should show trends over time with filters for content type,
genre, region, and time period where data supports them.

### FR-10: Feedback \[P1\]

The system should allow users to rate recommendations as useful/not
useful or provide lightweight feedback, with clear privacy disclosures.

### FR-11: Notifications \[P1\]

The system may notify users about watchlist updates or rising titles
only when a reliable scheduled data source is configured and the user
has opted in.

### FR-12: Analytics for OTT teams \[P2\]

The system may provide aggregated genre growth, demand estimates,
audience engagement indicators, and exportable reports. It shall not
expose individual viewers' private activity to business users.

### FR-13: Administration \[P0\]

Authorized administrators shall be able to inspect provider health,
refresh status, and application errors without seeing unnecessary
private user data.

### FR-14: Account data controls \[P1\]

The system should support account data export and deletion, subject to
applicable retention and provider obligations.

## 6. Non-functional requirements

### NFR-01: Performance

-   Common API requests should target a p95 response time below 800 ms
    excluding external-provider latency.
-   Slow provider calls should use timeouts and should not block
    unrelated pages.
-   Pagination shall be used for large results.

### NFR-02: Availability and resilience

-   The application shall handle provider timeouts, rate limits, and
    partial outages gracefully.
-   Cache provider responses only as allowed by provider terms.
-   Provide health checks for deployment monitoring.

### NFR-03: Security

-   Use HTTPS in production.
-   Hash passwords with a modern password-hashing library.
-   Validate inputs, authorize user-owned records, apply rate limits,
    and use secure secrets management.
-   Avoid exposing API keys or detailed internal errors to clients.

### NFR-04: Privacy

-   Minimize collected data and document why each field is needed.
-   Make personalization optional where feasible.
-   Do not infer sensitive personal attributes from entertainment
    activity.
-   Restrict analytics to aggregated or appropriately de-identified
    information.

### NFR-05: Usability and accessibility

-   Responsive layout across desktop, tablet, and mobile.
-   Keyboard-accessible controls and semantic labels.
-   Clear empty, loading, success, and error states.

### NFR-06: Maintainability

-   Separate frontend, API, data-provider integration, recommendation
    logic, and trend logic.
-   Use environment-based configuration and database migrations.
-   Maintain automated tests and setup/deployment documentation.

### NFR-07: Explainability

-   Show concise reasons for recommendations and describe the inputs
    behind trend scores.
-   Avoid unsupported causal claims.

### NFR-08: Reproducibility

-   Record model/configuration version, dataset time window, and
    evaluation method for experimental predictions.

## 7. Recommendation and trend logic

### 7.1 MVP recommendation baseline

Use a transparent weighted score, for example:

`score = content_similarity + preference_match + permitted_popularity_signal + diversity_bonus - repetition_penalty`

Weights must be configurable and evaluated; the equation is a starting
design, not a validated model. Do not add a component when the
underlying data is unavailable.

### 7.2 Cross-genre discovery

-   Estimate dominant genres from explicit preferences and, if
    consented, saved/rated/watched activity.
-   Select candidates from less represented genres.
-   Rank candidates by metadata similarity to liked titles, selected
    themes, and reliable quality/popularity signals.
-   Apply diversity and repetition controls.
-   Explain the connection ("You liked mystery stories; this
    science-fiction title also uses a mystery structure" only if
    metadata or curated features support that reason).

### 7.3 Trend scoring

A baseline trend score may combine normalized changes in
search/saves/ratings or permitted public engagement over a defined time
window. Use only metrics actually available and document normalization.
Avoid comparing raw counts across platforms without adjustment.
Forecasting is a later stage and must be validated against a baseline.

### 7.4 Evaluation

-   Recommendation: Precision@K, Recall@K, NDCG@K where labels/data
    permit, plus diversity and cross-genre discovery acceptance.
-   Trend prediction: compare against naive persistence or
    moving-average baselines using MAE/RMSE and time-based holdout
    periods.
-   Product: search success, watchlist completion, feedback, and
    latency.
-   Do not publish an accuracy percentage without a reproducible
    evaluation.

## 8. Data requirements

Potential entities: - **User:** id, email/username, password hash or
external identity, created_at. - **UserPreference:** user_id, preferred
genres, excluded genres, content types, languages, exploration level. -
**Title:** internal id, provider IDs, title, type, synopsis, release
date, genres, language, poster path, metadata source, updated_at. -
**WatchlistItem:** user_id, title_id, status, created_at, updated_at. -
**UserFeedback:** user_id, title_id, feedback type, timestamp; retain
only what is needed. - **TrendSnapshot:** source, title/genre key,
metric, value, region/time window, collected_at, data-quality flags. -
**RecommendationLog (optional/minimized):** model version, candidate
IDs, explanation codes, timestamp; avoid retaining unnecessary personal
data.

## 9. API outline

Example REST endpoints; exact names may be adjusted during
implementation.

  Method      Endpoint                 Purpose
  ----------- ------------------------ --------------------------------
  GET         `/api/health`            Health check
  GET         `/api/titles`            Search/filter catalog
  GET         `/api/titles/{id}`       Title details
  GET         `/api/trends`            Trend list/summary
  GET         `/api/trends/genres`     Genre trend series
  GET         `/api/recommendations`   Personalized recommendations
  GET         `/api/watchlist`         Current user's watchlist
  POST        `/api/watchlist`         Add title
  PATCH       `/api/watchlist/{id}`    Change viewing status
  DELETE      `/api/watchlist/{id}`    Remove item
  GET/PATCH   `/api/preferences`       Read/update preferences
  POST        `/api/feedback`          Submit recommendation feedback

All private endpoints must enforce authentication and ownership. Define
request/response schemas and error formats in the implementation.

## 10. Testing requirements

-   Unit tests for scoring, genre normalization, trend calculations, and
    validation.
-   API tests for authentication, authorization, pagination, and
    provider failures.
-   Integration tests for database persistence and provider adapters.
-   UI tests for search, watchlist, preferences, and responsive
    navigation.
-   Security tests for cross-user access, injection, secret exposure,
    and rate limiting.
-   ML/data tests for leakage, missing values, reproducibility, and
    baseline comparison.

## 11. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  API terms or access change          Keep provider adapters modular;
                                      verify terms before use

  Incomplete trend data               Show coverage, timestamps, and
                                      confidence/quality labels

  Cold-start recommendations          Use onboarding and transparent
                                      popularity/content-based fallback

  Popularity bias                     Add controlled diversity and
                                      discovery lane

  Unreliable predictions              Compare with simple baselines and
                                      label estimates

  Privacy/security incident           Minimize data, enforce ownership
                                      checks, protect secrets, test
                                      access controls

  Project scope grows too large       Deliver the MVP before social
                                      sentiment and business forecasting
  -----------------------------------------------------------------------

## 12. Acceptance checklist

The MVP is acceptable when users can search titles, view details,
maintain a persistent watchlist, edit preferences, receive explainable
recommendations including cross-genre options, inspect a trend view with
source/time labels, and use the app responsively without leaking private
data. Tests and setup/deployment documentation must be present.
