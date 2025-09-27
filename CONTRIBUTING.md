# CONTRIBUTING.md — LootAura Working Agreement

LootAura uses **Next.js 14 + Supabase + PWA** on Vercel. Our goal is **ops-light reliability**: ship small, testable slices; keep admin surfaces safe; avoid gratuitous complexity.

---

## Roles & Responsibilities

**Owner**
- Owns product decisions, env/secrets in Vercel/Supabase, and release "go/no-go".

**Tech Lead**
- Plans architecture & milestones, defines acceptance criteria, risk controls, and owner QA.
- Writes tight, surgical prompts for Cursor (coding agent) when needed.

**Cursor (coding agent)**
- Implements changes per prompt, **commits & pushes** to the target branch, and opens/updates the PR.

> Secrets are never placed in code or prompts. All secrets live in Vercel/Supabase dashboards.

---

## How We Work

- **One PR per milestone** (e.g., *Milestone A — Wizard & Browse*).  
  Small patches to the same milestone go to the **same branch/PR**.
- **Feature flags + preview shields** unblock progress; tighten/remove after stabilization.
- **No server-side scraping** of Craigslist; user-initiated transfers only (browser extension, optional email forward).
- **Admin is gated**; diagnostics are non-public (can be preview-opened via a flag when needed).

---

## Branching & PRs

- Branch names: `feat/milestone-a-wizard-browse`, `feat/milestone-b-admin-import`, etc.  
- Avoid micro-PRs. Keep changes scoped and reviewable.  
- PRs must include the **Acceptance Checklist** (template below).  
- Cursor should **commit & push** frequently (small atomic commits).

**Commit style (Conventional Commits):**
- `feat(wizard): draft-through-auth and privacy preview`
- `fix(map): guard cluster click handler`
- `chore(build): preview-only TS/ESLint greenline`
- `test(e2e): anon → publish happy path`

---

## Environments & Secrets

- Secrets **only** in Vercel/Supabase (never in code or prompts).
- See `docs/ENVIRONMENT_BASELINE.md` and `.env.example` for the full list.
- Public flags start with `NEXT_PUBLIC_*`; server-only flags do not.

**Preview-only hardening (optional to keep deploys green):**
- TypeScript/ESLint ignores in preview builds.
- `ENABLE_PUBLIC_ADMIN` and `STABILIZE_MODE` available to speed iteration (see below).

---

## Feature Flags (current)

- `ENABLE_PUBLIC_ADMIN` (server, **preview only**): temporarily opens `/admin` and `/api/admin/*` without auth; renders a warning banner. Never enable in production.
- `STABILIZE_MODE` (server): wizard/manage pages render a lightweight placeholder to avoid SSR/import failures while other features are being fixed.
- `NEXT_PUBLIC_ENABLE_DIAGNOSTICS` (client): tiny diagnostics card **in preview** only.
- Optional future flags: `ENABLE_EXTENSION`, `ENABLE_EMAIL_INGEST`, `ENABLE_GATEWAY`.

> Flags must have **safe defaults** (off in production).

---

## Admin & Diagnostics

- `/admin` is the **single pane** for owner tasks (import, revert runs, thresholds, health).
- Admin routes and all `/api/admin/*` are **server-gated** (auth/role), with an optional **preview bypass** when `ENABLE_PUBLIC_ADMIN=1` and `VERCEL_ENV=preview`.
- Public diagnostics should be minimal or absent; detailed diagnostics live behind admin.

---

## Database & Migrations

- Migrations in `supabase/migrations/` must be **idempotent** (`IF NOT EXISTS`).
- RLS:  
  - `sales`: published visible to all; drafts only to owner/admin.  
  - Admin-only tables (`sales_staging`, `sales_sources`, `ingest_runs`, etc.) are server-accessed.
- Indexes for date queries & geo lookups; enable `pg_trgm` for fuzzy title checks.

---

## Testing

- **Unit (Vitest):** normalization, dedupe candidate selection, privacy masking, abuse scoring.
- **E2E (Playwright):**  
  - Anon → publish happy path (returns to manage page and publishes).  
  - Browse URL state persists; back/forward keeps filters.  
  - Admin import (when enabled): preview → commit → revert.
- **A11y:** Axe smoke tests on Sell, Browse, Admin.

> Tests run in CI. For preview unblockers, mark fragile tests as `flaky` temporarily and fix before merge.

---

## Performance & Accessibility

- **Perf SLO:** P95 LCP ≤ 2.5s on Browse/Map/Wizard.  
  Use lazy maps, marker clustering, and optimized images (WebP, fixed aspect ratio).
- **A11y:** keyboard focus, labels, alt text; modals must trap focus; ESC closes.

---

## Observability & Runbooks

- `/api/healthz` returns `{ ok: true, tables: {...}, version }` with masked env info.
- Admin health panel: DB up, error rate, geocode latency, cache hit rate, last run status.
- Optional alerts for spikes (error rate, geocode 429s, empty feed for N hours).

---

## Security & Privacy

- Minimal PII (email + optional display name).  
- No CL credential collection.  
- Takedown path for sale owners; **auto-expire** past sales; privacy mode "block until 24h" supported end-to-end.
- Sanitize HTML; validate uploads; rate-limit mutations.

---

## Deployment

- Vercel **Preview** deploys on pushes to the milestone branch.  
- Keep **Preview hardened** until stable; then turn shields off and merge to `main`.  
- Production deploys from `main` only.

---

## PR Template (paste into PR description)

**Title:** Milestone X — \<feature\>

### Summary
- Brief description of scope and approach.

### Acceptance Checklist
- [ ] Wizard: anon → publish returns to `/sell/[id]/manage` and publishes.
- [ ] Privacy: "block until 24h" shows block-level pin; exact after T-24h.
- [ ] Dedupe: warns for nearby/date overlap + title similarity; "Not a duplicate" suppresses future warnings for that pair.
- [ ] Browse/Map: URL state persists; markers cluster; no CSP/runtime errors.
- [ ] Import (admin-only, if in scope): preview → commit → revert; non-admin blocked.
- [ ] A11y/Perf: no CLS from images; P95 LCP ≤ 2.5s on Browse/List.
- [ ] Tests: updated/passing (unit/E2E where applicable).
- [ ] Flags: safe defaults; no public diagnostics/admin in production.

### Screenshots / Notes
- Preview URL(s) and screenshots for key flows.

---

## Owner QA Script (5 minutes)

1) `/api/healthz` → `ok:true`.  
2) Browse → change date/radius → URL updates; back/forward preserves.  
3) Wizard (signed out) → fill → Publish → sign in → auto-return to manage page; sale is **published**.  
4) Set privacy "block until 24h"; verify block-level pin now, exact later.  
5) Create a similar sale → dedupe warning shows; mark "Not a duplicate"; publish.  
6) If admin import in scope: `/admin` → small CSV preview → commit → revert.

---

## Code Style & Hygiene

- TypeScript strict where practical.  
- Avoid runtime `any`; keep server/client boundaries clear.  
- Keep CSP tight; do not add broad wildcards.  
- Prefer small, named components; avoid giant client bundles.  
- No console logs in production paths (guarded debug only in preview).

---

## Questions

Open an issue with label `question` and a one-liner: *"What are we trying to decide?"*  
For implementation, prefer small, well-named tasks over vague epics.
