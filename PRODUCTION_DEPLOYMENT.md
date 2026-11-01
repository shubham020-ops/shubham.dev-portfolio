# Shubham.dev Production Deployment

This guide deploys the existing React/Vite site and Express/MongoDB API without changing the site's UI or API contract. No hosting provider or production domain is configured in this repository, so values marked provider-specific must be confirmed in the chosen host's dashboard and networking documentation.

## 1. Required host secrets and settings

Configure these in the hosting provider's secret/environment settings. Do not commit real `.env` files.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Set to `production`. |
| `PORT` | Usually supplied by host | Express listen port; defaults to `3001`. |
| `MONGODB_URI` | Yes | MongoDB connection string with least-privilege credentials. |
| `JWT_SECRET` | Yes | Random secret of at least 32 characters. |
| `TRUST_PROXY` | Depends on ingress | Exact trusted proxy address/subnet or fixed hop count; never `true`. |
| `CORS_ORIGINS` | If frontend is cross-origin or HTTPS terminates at an untrusted app hop | Comma-separated exact HTTPS origins, with no paths. `FRONTEND_URL` remains supported as a single-origin fallback. |
| `REDIS_URL` | Required for multiple API instances | Private Redis URL (`rediss://` recommended for managed remote Redis). |
| `MONGODB_MAX_POOL_SIZE` | Optional | Per-process connection pool ceiling; default `20`, allowed `1..100`. |
| `MONGODB_WAIT_QUEUE_TIMEOUT_MS` | Optional | Maximum wait for a pooled connection; default `5000`. |
| `CSP_CONNECT_SOURCES` | Separate API domain only | Comma-separated HTTPS API origins allowed by the frontend CSP. |
| `RESEND_API_KEY` | Contact email only | Resend API credential. |
| `RESEND_WEBHOOK_SECRET` | Delivery webhook only | Resend webhook verification secret. |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Optional | Override contact notification recipient/sender. |
| `COOKIE_SAME_SITE`, `COOKIE_SECURE` | Optional | Cookie policy overrides. Production cookies are always Secure. |

`backend/.env.example` lists the supported settings. Keep `backend/.env` and the frontend `.env` local; the repository ignore rules exclude them.

## 2. MongoDB

1. Create a production database and a dedicated application user with only the permissions this app needs.
2. Restrict the database network allowlist to the backend host/egress addresses.
3. Configure automated backups and verify a restore procedure before launch.
4. Set `MONGODB_URI` as a host secret. Never print it in logs or paste it into support output.
5. The app uses a bounded Mongoose pool (`maxPoolSize=20` by default), a 5-second connection wait-queue timeout, a 30-second idle timeout, and a 10-second server-selection timeout. Tune pool size only after staging load tests; the total possible connections grow with the number of app instances.
6. Existing unique/content indexes remain in place. A compound `{ status, createdAt, _id }` index supports the bounded admin inbox query. Mongoose may build a missing index on startup; allow for that on a large existing collection.

The API currently bounds admin inbox reads to 100 messages and supports optional keyset pagination: pass the `X-Next-Cursor` header value back as the `cursor` query parameter. The response remains the same array shape for existing callers. Projects/portfolio data is stored as a small set of content documents. The public response is not an unbounded collection scan. Do not replace these models or migrate existing user data as part of deployment.

## 3. Redis-backed rate limits

The backend uses `express-rate-limit` with `rate-limit-redis` and the Node Redis client. When `REDIS_URL` is set, each limiter uses a distinct key prefix in the shared Redis service, so limits are consistent across app processes. Without `REDIS_URL`, the in-memory store is used for local development and single-process deployments.

Current limits, per resolved client IP:

| Scope | Limit |
| --- | --- |
| `GET/HEAD /portfolio`, `/projects`, `/skills` | 300 per minute |
| Other `/api/v1/*` routes | 60 per minute |
| `POST /auth/login` | 10 per 15 minutes |
| `POST /contact` | 5 per 15 minutes |
| `PUT /auth/password` | 5 per 15 minutes |

Health checks at `/api/v1/health` and CORS preflight requests are not counted. Responses include standard rate-limit headers and return HTTP 429 when a limit is exceeded. The app fails closed on a Redis store error; keep managed Redis available/monitored so an outage does not interrupt API requests. For multiple instances, configure Redis before scaling out. A Redis store limits per client IP; it is not a substitute for a CDN/WAF or volumetric DDoS protection.

## 4. `TRUST_PROXY` and client IP

Express must trust only the proxy hops that the hosting network controls. Forwarded IP/protocol headers can be spoofed if an untrusted client can reach the app directly.

- Direct app connection with no proxy: `TRUST_PROXY=false`.
- Preferred behind ingress: set `TRUST_PROXY` to the actual ingress IP/subnet(s) supplied by the provider (comma-separated values are supported).
- Use `TRUST_PROXY=1` only when exactly one trusted proxy is in front, the backend cannot be reached around it, and that proxy overwrites the forwarded headers.
- `TRUST_PROXY=true` is rejected by configuration.

Render, Railway, and other hosts can use different ingress/network layouts and may change them. This repository does not identify a provider, so do not copy a hop count without checking that provider's current forwarded-header behavior and origin-protection controls. Verify `req.ip` in a temporary private staging check or access log, then remove any diagnostic endpoint. Never expose an endpoint that echoes request headers publicly.

If proxy trust is wrong, rate limits may treat all visitors as one proxy IP, or trust a spoofed `X-Forwarded-For`. If TLS terminates before Express, correct proxy trust also lets Express recognize the public HTTPS protocol for same-origin CORS/CSRF checks.

## 5. CORS, HTTPS, and cookies

### Same-origin deployment

Build the frontend and serve `dist` from the backend as documented in the project README. Set the exact public origin in `CORS_ORIGINS` (for example `https://portfolio.example.com`) when requests pass through a TLS-terminating proxy whose protocol is not trusted by Express. This is also a useful explicit allowlist. Keep the public site and API on HTTPS.

### Separate frontend and API domains

- Set `CORS_ORIGINS=https://portfolio.example.com` (add only the exact approved frontend origins).
- Set frontend build variable `VITE_API_BASE_URL=https://api.example.com/api/v1`.
- Set `CSP_CONNECT_SOURCES=https://api.example.com` in the frontend-serving backend configuration.
- Use HTTPS for both domains. Credentialed CORS does not use `*`.

In production `CORS_ORIGINS` is validated as HTTPS-only and takes precedence over `FRONTEND_URL`. Do not include a path, query, or fragment in an origin.

## 6. Build and deploy

From the project root:

```powershell
npm ci
npm run build
```

Install and verify the backend separately:

```powershell
cd backend
npm ci
npm run check
npm test
npm start
```

Set the host health check to `GET /api/v1/health`. It returns 200 only when MongoDB is connected and 503 otherwise. The production process connects to MongoDB, then Redis if configured, before accepting traffic. SIGTERM/SIGINT stops new HTTP work and closes the HTTP server, MongoDB, and Redis connections. Fatal unhandled errors trigger the same shutdown path with a non-zero process exit code so the host can restart the process.

## 7. Repeatable local/staging load test

The repository includes a non-destructive k6 script at `backend/load-test/api.js`. It only sends GET requests to `/api/v1/projects`; it does not modify content or contact messages. By default it targets `http://127.0.0.1:3001/api/v1` and refuses non-local targets unless explicitly enabled.

1. Start a disposable local/staging backend with a non-production database and Redis if you want to validate shared-store behavior.
2. Install k6 using the official instructions for your OS.
3. Run the normal read scenario:

   ```powershell
   k6 run backend/load-test/api.js
   ```

4. To deliberately exercise the public-read 429 threshold against local/staging only:

   ```powershell
   $env:RUN_RATE_LIMIT_PROBE = 'true'
   k6 run backend/load-test/api.js
   Remove-Item Env:RUN_RATE_LIMIT_PROBE
   ```

5. For a non-local **staging** URL only, set `API_BASE_URL` and `ALLOW_NONLOCAL_LOAD_TEST=yes`. Never run the probe against production or real user data. The script reports request count/rate, failures, 429 count, and latency percentiles. Capture CPU, memory, MongoDB connections/latency, and Redis latency from the staging host dashboard; k6 does not measure server resource usage by itself.

6. To check the stricter login limiter, enable `RUN_LOGIN_RATE_LIMIT_PROBE=true` for the local/staging run. It uses a deliberately nonexistent `.invalid` email, expects 401 until the limiter returns 429, and does not create an admin or modify records. The counter is shared with all requests from the load generator IP; avoid running other probes from that IP at the same time.

   ```powershell
   $env:RUN_LOGIN_RATE_LIMIT_PROBE = 'true'
   k6 run backend/load-test/api.js
   Remove-Item Env:RUN_LOGIN_RATE_LIMIT_PROBE
   ```

Use multiple load-generator IPs or a staging-only ingress test to model multi-client traffic. A single load-generator IP will intentionally hit the per-IP limit. Do not raise limits just to make a test pass; use the measurements to tune caching, pool size, host capacity, and the documented policy.

## 8. Security and readiness checklist

- [ ] Only host secret settings contain production credentials.
- [ ] `JWT_SECRET` is generated randomly and is at least 32 characters.
- [ ] `NODE_ENV=production`, HTTPS, exact CORS origins, and provider-accurate `TRUST_PROXY` are set.
- [ ] Backend origin cannot be reached around the trusted proxy when using a hop count.
- [ ] `REDIS_URL` is configured and reachable before running multiple API instances.
- [ ] MongoDB user privileges, network allowlist, backups, and restore plan are verified.
- [ ] `npm audit` and the project's backend/frontend checks pass with current lockfiles.
- [ ] Staging login, `/auth/me`, contact submit, project data, admin CRUD, and logout are smoke-tested.
- [ ] Health check returns 200 after DB connection; monitoring alerts on 5xx, 429 spikes, DB pool waits, and Redis errors.
- [ ] Load test was run against local/staging and its actual metrics reviewed.

## 9. Rollback

Keep the previous known-good build/container and environment release available. If a deploy fails its health check or smoke tests, route traffic back to the previous release and restore its environment configuration. The added MongoDB index is additive; it does not rewrite or delete records. Do not roll back by restoring or printing secret values in logs. Revoke/rotate any credential that was ever committed or exposed.

## 10. Remaining capacity limits

Rate limiting, a bounded MongoDB pool, response compression, and Redis-backed counters improve resilience; they do not guarantee unlimited traffic. Capacity still depends on the hosting plan, MongoDB/Redis tiers, proxy configuration, cache hit rate, and traffic distribution. Scale only after staging measurements and keep edge-level DDoS protection enabled.
