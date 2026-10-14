# Deployment Guide --- Movie Insight Engine

This document describes a provider-neutral deployment approach. Exact
platform settings depend on the hosting services selected.

## 1. Deployment architecture

Recommended production arrangement:

-   **Frontend:** static React/Vite build hosted by a static hosting
    provider or CDN.
-   **Backend:** Python/FastAPI service hosted on a platform that
    supports Python web services.
-   **Database:** managed PostgreSQL or MySQL with private networking
    where available.
-   **Secrets:** hosting platform's secret/environment-variable manager.
-   **Monitoring:** application logs, health checks, error tracking, and
    uptime checks.
-   **Domain/TLS:** HTTPS enabled for the frontend and API.

Do not deploy a local development server as the production service.

## 2. Before deployment

-   [ ] Choose the frontend, backend, and database hosting providers.
-   [ ] Review the selected catalog and data providers' current terms,
    attribution rules, and production-use restrictions.
-   [ ] Create production credentials distinct from development
    credentials.
-   [ ] Configure a production database and run migrations.
-   [ ] Configure allowed frontend origins and secure
    authentication/session settings.
-   [ ] Remove sample credentials and demo-only trend labels only if
    replacing them with verified production data.
-   [ ] Run tests, linting, dependency checks, and the production build.
-   [ ] Ensure the application has no hardcoded secrets or private
    sample data.

## 3. Required configuration

Use the actual variable names defined by the application. Typical
backend variables:

``` dotenv
APP_ENV=production
APP_SECRET_KEY=<long-random-secret>
DATABASE_URL=<production-database-connection-string>
TMDB_API_KEY=<provider-key-if-used>
CORS_ORIGINS=https://your-frontend-domain.example
LOG_LEVEL=INFO
```

Typical frontend public configuration:

``` dotenv
VITE_API_BASE_URL=https://your-api-domain.example
```

Important: - Never commit production `.env` files. - Never put secret
keys in `VITE_*` variables; browser bundles are public. - Restrict CORS
to the real frontend origins. - Use a strong, unique secret and rotate
it if exposed. - Do not paste credentials into issue trackers or logs.

## 4. Frontend deployment

1.  Set the production API base URL.
2.  Install dependencies from the lockfile.
3.  Run the project's production build, commonly:

``` bash
npm ci
npm run build
```

4.  Publish the generated build directory (commonly `dist/`) using the
    hosting provider's documented method.
5.  Configure SPA fallback routing so direct navigation to client-side
    routes returns the app entry point.
6.  Enable HTTPS and configure the custom domain if applicable.
7.  Verify search, authentication, watchlist actions, recommendation
    pages, and mobile layout against the production API.

## 5. Backend deployment

1.  Configure the supported Python runtime.
2.  Install pinned dependencies.
3.  Inject production environment variables through the host's secret
    manager.
4.  Run database migrations as a controlled release step.
5.  Start the application with a production ASGI server command
    supported by the host, for example:

``` bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

If the host requires a different command or process manager, follow its
documentation. Do not use `--reload` in production.

6.  Configure health checks, request timeouts, log collection, and
    restart behavior.
7.  Ensure the backend can reach the database and approved external
    APIs.
8.  Keep API keys server-side.

## 6. Database and migrations

-   Use a managed database where practical.
-   Restrict network access to the application service.
-   Use a dedicated database user with only the required permissions.
-   Run migrations before deploying code that depends on the new schema.
-   Back up production data on a defined schedule and test restore
    procedures.
-   Never use real production data in local development unless
    specifically authorized and appropriately protected.

## 7. Security checklist

-   [ ] HTTPS is enforced.
-   [ ] Password hashing and session/token handling follow framework
    guidance.
-   [ ] Secure cookies are enabled if cookie-based sessions are used.
-   [ ] CORS is restricted to trusted origins.
-   [ ] Authentication and per-user authorization are tested.
-   [ ] Rate limiting is applied to login and sensitive/publicly
    expensive endpoints.
-   [ ] Inputs are validated and database access is parameterized.
-   [ ] Provider and database secrets are stored in a secret manager.
-   [ ] Error responses do not reveal stack traces or secrets.
-   [ ] Logs exclude passwords, tokens, and unnecessary private viewing
    data.
-   [ ] Dependency vulnerabilities are reviewed.
-   [ ] Data deletion and retention procedures are documented.

## 8. Observability and data freshness

Monitor: - API availability and latency; - 4xx/5xx error rates; -
database connection/health; - provider timeouts, quota/rate-limit
responses, and last successful refresh; - recommendation job failures; -
trend snapshot timestamps and missing-data rates.

Every trend dashboard should disclose the latest data timestamp and
source coverage. If data refresh fails, retain the last permitted
snapshot with a stale-data label or show an unavailable state; do not
label it "live".

## 9. Release and rollback

1.  Run tests and build in CI.
2.  Deploy backend and migrations in a backward-compatible order where
    possible.
3.  Deploy frontend.
4.  Smoke-test health, search, title details, login, watchlist,
    preferences, recommendations, and trends.
5.  Monitor logs and error rates after release.
6.  If critical failures occur, roll back to the last known-good
    application release and follow the database migration rollback plan.
7.  Record the release version and any model/data-pipeline version
    changes.

## 10. Backups and incident response

-   Set database backup frequency and retention according to project
    needs.
-   Test restore into a separate environment.
-   If a secret is exposed, revoke/rotate it and inspect access logs.
-   If user data is exposed, contain the incident, preserve necessary
    evidence, follow applicable notification requirements, and document
    remediation.
-   Maintain a contact and escalation process for hosting/provider
    outages.

## 11. Production acceptance checklist

-   [ ] Public frontend loads over HTTPS.
-   [ ] API health check passes.
-   [ ] Database migrations are current.
-   [ ] Search and title details work with provider failures handled.
-   [ ] User data is isolated by account.
-   [ ] Watchlist and preferences persist.
-   [ ] Recommendations are explainable and cross-genre discovery is
    enabled.
-   [ ] Trend source and freshness are visible.
-   [ ] No secret appears in browser bundles or logs.
-   [ ] Backups and rollback steps are understood.
