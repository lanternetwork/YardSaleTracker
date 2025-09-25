# Ingestion (Craigslist RSS-first)

This system enables cloud-only discovery and ingestion of yard sales via Craigslist RSS, with admin-only controls and a nearby API for the UI.

## Environment Variables (set in Vercel Project Settings)

Server-only:
- CRAIGSLIST_INGEST_TOKEN
- GEOCODING_API_KEY
- FEATURE_FIND_MORE (default false)
- FEATURE_INGEST_RSS (default true)
- FEATURE_INGEST_HTML (default false)
- ADMIN_EMAILS (comma-separated)
- CRAIGSLIST_SITES (optional)

Client-visible:
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- NEXT_PUBLIC_ENABLE_DIAG (default 0)

## Vercel Cron
Configure an HTTP cron invoking:
- Path: `/api/ingest/cron`
- Method: POST
- Header: `X-INGEST-TOKEN: $CRAIGSLIST_INGEST_TOKEN`
- Cadence: hourly 5am–10pm local, off-peak every 3–6h

## Data Model
See `supabase/migrations/004_ingestion_schema.sql` for `sales` and `geocode_cache` tables. PostGIS is optional and detected automatically.

## Nearby API
Route: `/api/sales/nearby?lat=..&lng=..&radius_miles=..&limit=200`
- radius_miles ∈ {5,10,25,50,100} (default 25)
- limit ≤ 200
- Uses PostGIS if available; otherwise bounding-box + haversine fallback

## Admin Page
Route: `/admin/ingest` (admin-only via `ADMIN_EMAILS`).
- Manual trigger (dry-run) calls server route which enqueues background work.

## Background Worker
Recommended: Supabase Edge Function to perform batch ingest with politeness limits; invoked by `/api/ingest/cron` or `/api/ingest/trigger`.

## Security & RLS
- End-users have SELECT-only on `sales`.
- Admin mutations use service role server-side only.

## Test Plan (CI Only)
- Unit tests for nearby parameter validation, `isAdminEmail`, staleness transitions, RSS normalization. No external network calls.

## Post-merge Checklist
- Set all env vars in Vercel (no values in repo)
- Add Vercel Cron (path + header)
- Verify Preview deployment: map, nearby endpoint, admin page


