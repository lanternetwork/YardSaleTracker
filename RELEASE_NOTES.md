# LootAura Release Notes — What’s Live and What’s Next

This page summarizes what’s in Production, current gaps, and the next milestones so any newcomer can get oriented quickly.

## What’s In Production

- App Router pages
  - Public: `/`, `/sales`, `/sales/[id]`
  - Auth: `/auth/signin`
  - Protected: `/sell/*`, `/favorites`, `/account` (middleware guards unauthenticated → `/auth/signin?returnTo=...`)

- Core APIs
  - `GET /api/sales`: PostGIS-first search on `lootaura_v2.sales` (geom + RLS), bbox fallback only on PostGIS error; response includes `durationMs`, `degraded?`, `center`, `distanceKm`, `count`
  - `GET /api/sales/search`: simple bbox search (legacy-compatible), uses `yard_sales` shape but scoped read
  - `GET /api/geocoding/zip`: local lookup in `lootaura_v2.zipcodes` with Nominatim fallback + optional writeback
  - Geolocation: `GET /api/geolocation/ip` with Vercel headers/IP fallback
  - Health: `/api/health/*` incl. `/api/health/postgis` (now reports `missing_geom`)
  - Debug: `/api/debug/stats` (live counts + category/date summaries), `/api/debug/zipcodes/status` (counts + dryRun seed log)

- Seeders (admin)
  - `POST /api/admin/seed/mock` (Idempotency-Key 24h + per-IP 5/min)
  - `POST /api/admin/seed/zipcodes` (same safety; ~40k upsert capability)

- Distance filter
  - PostGIS: `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography, km*1000)` with `ORDER BY distance, date`
  - Bbox fallback: numeric lat/lng ranges when PostGIS path fails

## Known Gaps

- Any remaining references to legacy `yard_sales` outside `/api/sales/search` should be removed in this milestone
- Explicit EXPLAIN verification for GIST index usage (ops note)
- A11y/lighthouse pass is not automated yet

## What’s Next (Milestone — Stabilization, Scale, and Polish)

- Stabilize on `lootaura_v2` (remove legacy reads; v2-only flows)
- Pagination UX + distance slider + ZIP “chip”
- Bulk mock generator (guarded by Idempotency-Key + rate limit)
- A11y improvements and basic lighthouse gating
- Observability: timings everywhere, `/api/debug/stats` extended where needed

## CI/CD (Required Checks)

- Checks enforced on PRs to `main` and pushes to `main` (see `.github/workflows/ci.yml`):
  - Build (`npm run build`)
  - Typecheck (`npm run typecheck`)
  - Unit Tests — Vitest (`npm run test`)
  - E2E Smoke — Playwright (`npm run test:e2e`)

All of the above must be green before merge.
