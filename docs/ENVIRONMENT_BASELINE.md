# Environment Variables Baseline

This document describes all environment variables used by the Yard Sale Tracker application, their purpose, and which routes/pages require them.

## Required Variables

### Supabase (Always Required)
- **NEXT_PUBLIC_SUPABASE_URL**: Supabase project URL
  - Used by: All pages (client-side auth, data fetching)
  - Example: `https://your-project.supabase.co`

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase anonymous key
  - Used by: All pages (client-side auth, data fetching)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

- **SUPABASE_SERVICE_ROLE** or **SUPABASE_SERVICE_ROLE_KEY**: Service role key
  - Used by: Server-side operations (admin, ingestion, health checks)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### App Configuration
- **NEXT_PUBLIC_SITE_URL**: Your app's public URL
  - Used by: Auth redirects, PWA manifest, sitemap generation
  - Example: `https://lootaura.com`

## Optional Variables

### Google Maps
- **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY**: Google Maps API key
  - Used by: Map components, location features
  - Required for: `/explore` (map view), location-based features

### PWA & Push Notifications
- **VAPID_PRIVATE_KEY**: VAPID private key (server-only)
  - Used by: Push notification server operations
  - Required for: Push notification features

- **NEXT_PUBLIC_VAPID_PUBLIC_KEY**: VAPID public key
  - Used by: Client-side push notification registration
  - Required for: Push notification features

### Monitoring & Analytics
- **NEXT_PUBLIC_SENTRY_DSN**: Sentry DSN for error tracking
  - Used by: Error reporting across all pages
  - Example: `https://your-sentry-dsn@sentry.io/project-id`

### Rate Limiting & Caching
- **UPSTASH_REDIS_REST_URL**: Redis REST API URL
  - Used by: Rate limiting, caching
  - Required for: High-traffic scenarios, rate limiting

- **UPSTASH_REDIS_REST_TOKEN**: Redis REST API token
  - Used by: Rate limiting, caching
  - Required for: High-traffic scenarios, rate limiting

### Ingestion & Admin
- **CRAIGSLIST_INGEST_TOKEN**: Token for Craigslist ingestion
  - Used by: Ingestion endpoints, admin operations
  - Required for: Craigslist data ingestion

## Feature Flags

### Public Flags (Client-Side)
- **NEXT_PUBLIC_ENABLE_DEMO**: Enable demo data (default: false)
  - Used by: Browse page when no sales exist
  - When true: Shows demo sale cards

- **NEXT_PUBLIC_ENABLE_DIAGNOSTICS**: Show diagnostics (default: false)
  - Used by: Browse page, admin areas
  - When true: Shows diagnostic cards and admin links

### Server Flags (Server-Side)
- **ENABLE_ADMIN**: Enable admin features (default: true)
  - Used by: Admin routes, diagnostics
  - When false: Hides all admin functionality

- **ENABLE_EXTENSION**: Enable browser extension features (default: true)
  - Used by: Extension-specific functionality
  - When false: Disables extension features

- **ENABLE_EMAIL_INGEST**: Enable email ingestion (default: false)
  - Used by: Email processing features
  - When true: Enables email-based data ingestion

- **ENABLE_GATEWAY**: Enable gateway features (default: false)
  - Used by: Gateway-specific functionality
  - When true: Enables gateway features

## Route Dependencies

### Core Pages (Always Work)
- `/` - Home page (requires Supabase)
- `/explore` - Browse sales (requires Supabase, optional Maps)
- `/sell/new` - Create sale form (requires Supabase)
- `/auth` - Authentication (requires Supabase)

### Feature-Dependent Pages
- `/explore` (map view) - Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `/admin` - Requires `ENABLE_ADMIN=true`
- Push notifications - Requires VAPID keys
- Diagnostics - Requires `NEXT_PUBLIC_ENABLE_DIAGNOSTICS=true` or `ENABLE_ADMIN=true`

### API Endpoints
- `/api/healthz` - Always available (minimal dependencies)
- `/api/ingest/*` - Requires `CRAIGSLIST_INGEST_TOKEN`
- Admin endpoints - Require `ENABLE_ADMIN=true`

## Environment Validation

The application uses centralized environment validation in `lib/config/env.ts`:

- **Development/Preview**: Fails fast on missing required variables
- **Production**: Logs warnings for missing optional variables, continues with defaults
- **Feature flags**: Have sensible defaults, can be overridden via environment

## Security Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Server-only variables are kept secure and not sent to client
- Service role keys should never be exposed to client-side code
- All sensitive variables are validated server-side only

## Troubleshooting

### Common Issues
1. **"Supabase client not initialized"** - Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **"Maps not loading"** - Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. **"Admin features not working"** - Check `ENABLE_ADMIN=true`
4. **"Diagnostics not showing"** - Check `NEXT_PUBLIC_ENABLE_DIAGNOSTICS=true` or `ENABLE_ADMIN=true`

### Health Check
Visit `/api/healthz` to verify environment configuration and service availability.
