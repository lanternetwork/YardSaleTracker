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
- **Location**: `/_diag/ingest`
- **Purpose**: Comprehensive monitoring and data management
- **Features**:
  - Recent ingestion runs (last 20)
  - Paginated scraped sales table
  - Search and filtering capabilities
  - Real-time data from database

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
- `source`: Set to 'craigslist' for scraped data
- `title`: Sale title from Craigslist
- `url`: Original Craigslist URL
- `location_text`: Location information
- `posted_at`: When the sale was originally posted
- `first_seen_at`: When we first scraped it
- `last_seen_at`: When we last saw it
- `status`: Current status (published/draft/archived)

## Security

### Server-Side Authentication
- All database operations use server-side Supabase client with service role
- No secrets are exposed to the client
- Authentication tokens are validated server-side only

### Data Access
- Full diagnostics page uses service role for unrestricted data access
- RLS policies are bypassed for diagnostic purposes
- No client-side database credentials

## Usage

### Development
1. Navigate to Browse page (`/explore`)
2. Use inline diagnostic card for quick tests
3. Click "Full Diagnostics →" for comprehensive view
4. Use "Dry Run" to test without database writes
5. Use "Run Now" to execute full ingestion

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