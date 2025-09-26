# Craigslist Ingestion System

This document describes the Craigslist ingestion system for the Yard Sale Tracker application.

## Overview

The ingestion system scrapes yard sale listings from Craigslist and stores them in the database for display in the application.

## Components

### Inline Diagnostics
- **Location**: Browse page (`/explore`)
- **Purpose**: Quick overview of ingestion status
- **Features**: 
  - Last run summary with counts
  - Dry Run and Run Now buttons
  - Sample items from recent runs
  - Link to full diagnostics

### Full Diagnostics
- **Location**: `/diagnostics/ingest`
- **Purpose**: Comprehensive monitoring and data management
- **Features**:
  - Recent ingestion runs (last 20) from `ingest_runs` table
  - Paginated scraped sales table from `sales` table where `source='craigslist'`
  - Search and filtering capabilities
  - Real-time data from database using service-role client
  - External links to original Craigslist posts

## API Endpoints

### `/api/ingest/status`
- **Method**: GET
- **Purpose**: Retrieve last ingestion run status
- **Authentication**: `X-INGEST-TOKEN` header (dev-token for development)
- **Response**: Run metadata with counts and timestamps

### `/api/ingest/trigger`
- **Method**: POST
- **Purpose**: Trigger new ingestion run
- **Authentication**: `X-INGEST-TOKEN` header (dev-token for development)
- **Parameters**:
  - `dryRun`: boolean (default: false)
  - `site`: string (default: 'sfbay')
  - `limit`: number (default: 10)
- **Response**: Run results with counts and sample data

## Database Schema

### Sales Table
The scraped sales are stored in the `sales` table with the following key fields:
- `id`: UUID primary key
- `source`: Set to 'craigslist' for scraped data
- `source_id`: Stable identifier from RSS item (guid or hash)
- `title`: Sale title from Craigslist
- `url`: Normalized absolute Craigslist URL
- `location_text`: Location information
- `lat`/`lng`: Geocoded coordinates (optional)
- `posted_at`: When the sale was originally posted
- `first_seen_at`: When we first scraped it
- `last_seen_at`: When we last saw it
- `status`: Current status (active/published/archived)
- `source_host`: Hostname of the source URL
- `url_prev`: Previous URL (for tracking changes)

### Ingest Runs Table
Ingestion execution history stored in `ingest_runs` table:
- `id`: UUID primary key
- `started_at`/`finished_at`: Execution timestamps
- `source`: Data source (e.g., 'craigslist')
- `dry_run`: Boolean flag for test runs
- `fetched_count`: Number of items processed
- `new_count`: Number of new sales inserted
- `updated_count`: Number of existing sales updated
- `status`: Execution status (running/ok/error)
- `last_error`: Error message if failed

### Geocode Cache Table
Optional caching for location geocoding:
- `query`: Location text used for geocoding
- `lat`/`lng`: Cached coordinates
- `provider`: Geocoding service used
- `created_at`/`last_used_at`: Cache timestamps

## Security

### Server-Side Authentication
- All database operations use server-side Supabase client with service role
- No secrets are exposed to the client
- Authentication tokens are validated server-side only

### Data Access
- Full diagnostics page uses service role for unrestricted data access
- RLS policies are bypassed for diagnostic purposes
- No client-side database credentials

## URL Normalization

### Rules
- **Absolute URLs**: Accepted if they match `*.craigslist.org` or `craigslist.org`
- **Relative URLs**: Resolved against the RSS feed origin using `new URL(link, feedUrl).toString()`
- **Rejection**: Non-craigslist URLs are rejected and counted as invalid
- **Protocol**: Only HTTPS URLs are accepted (HTTP URLs are rejected)
- **Preservation**: Query parameters and fragments are preserved
- **No Mock Data**: Full Diagnostics page reads real data from database only

### Examples
- ✅ `https://sfbay.craigslist.org/garage-sale/123.html` → Accepted
- ✅ `/garage-sale/123.html` → Resolved to `https://sfbay.craigslist.org/garage-sale/123.html`
- ❌ `https://example.com/garage-sale/123` → Rejected
- ❌ `http://sfbay.craigslist.org/garage-sale/123.html` → Rejected (HTTP)

## Usage

### Development
1. Navigate to Browse page (`/explore`)
2. Use inline diagnostic card for quick tests
3. Click "Full Diagnostics →" for comprehensive view
4. Use "Dry Run" to test without database writes
5. Use "Run Now" to execute full ingestion

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE`: Service role key for database access (server-only)
- `CRAIGSLIST_INGEST_TOKEN`: Authentication token for ingestion endpoints (server-only)
- `CRAIGSLIST_SITES`: Comma-separated RSS URLs (e.g., `https://louisville.craigslist.org/search/gms?format=rss`)

### Single-City Setup (Louisville)
For testing with a single city, set:
```bash
CRAIGSLIST_SITES="https://louisville.craigslist.org/search/gms?format=rss"
```

This will:
- Fetch RSS from Louisville Craigslist garage sales
- Log per-site probe information in Preview deployments
- Show detailed fetch status, content type, and response preview

### Real Database Persistence
- **Non-dry run**: Persists real sales data to `public.sales` table using service-role client
- **Upsert Logic**: Updates existing sales or inserts new ones based on `source_id`
- **Run Tracking**: Records execution details in `public.ingest_runs` table
- **URL Validation**: Only valid Craigslist URLs are stored
- **Service Role**: Uses `adminSupabase` client with service role for unrestricted database access
- **Migrations Required**: Database migrations must be applied in Supabase before ingestion will work
- **No Mock Data**: All diagnostics show real database data; empty states when no data exists
- **Environment RSS**: Uses `CRAIGSLIST_SITES` environment variable for RSS feed URLs

### Database Check (Preview Only)
- **Location**: `/diagnostics/db-check`
- **Purpose**: Quick verification of database connectivity and service role
- **Returns**: `{ hasServiceRoleKey, projectRef, salesCount, lastRun, timestamp }`
- **Access**: Preview/Development environments only

### Production
- Set `INGEST_TOKEN` environment variable
- Configure Supabase service role key
- Monitor ingestion runs via diagnostics page
- Review scraped data quality and coverage

## Monitoring

### Key Metrics
- **Fetched Count**: Number of items scraped from Craigslist
- **New Count**: Number of new sales added to database
- **Updated Count**: Number of existing sales updated
- **Run Duration**: Time taken for ingestion process
- **Error Rate**: Failed runs and error messages

### Data Quality
- Monitor duplicate detection
- Check location accuracy
- Verify URL validity
- Review status transitions

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Verify `X-INGEST-TOKEN` header
2. **Database Errors**: Check Supabase service role configuration
3. **Scraping Failures**: Review Craigslist rate limiting
4. **Data Quality**: Use full diagnostics to inspect results

### Debug Steps
1. Check inline diagnostic for last run status
2. Use full diagnostics page for detailed analysis
3. Review server logs for error messages
4. Verify environment variables are set correctly