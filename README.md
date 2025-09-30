# YardSaleTracker
Yard Sale Tracker

A modern web application for discovering and managing yard sales, garage sales, and estate sales in your area.

## Features

- **Interactive Map View**: Find sales near you with an interactive map
- **List View**: Browse sales in a clean, organized list
- **User Authentication**: Sign up and manage your account
- **Favorites**: Save sales you're interested in
- **CSV Import/Export**: Import and export sales data
- **Responsive Design**: Works on desktop and mobile devices

## Data Sources

**No third-party scraping**: LootAura uses native listings and mock seed data for demos. We do not scrape external websites like Craigslist.

## Configuration

This project uses configurable Supabase schemas via environment variables. The schema is determined by the `NEXT_PUBLIC_SUPABASE_SCHEMA` environment variable, which defaults to `'public'` if not set.

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_SCHEMA` - The schema to use (defaults to 'public')
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key for geocoding
- `SUPABASE_SERVICE_ROLE` - Supabase service role key

### Optional Environment Variables

- `NEXT_PUBLIC_SITE_URL` - Your site URL (defaults to https://yardsalefinder.com)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - VAPID public key for push notifications
- `VAPID_PRIVATE_KEY` - VAPID private key for push notifications
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `NOMINATIM_APP_EMAIL` - Email for Nominatim geocoding service

### Development

**Note:** Local development without `.env.local` is unsupported in this project. Use Vercel Preview for development and testing.

The application automatically uses the configured schema for all Supabase operations, removing the need for schema prefixes in queries.

## Getting Started

1. Clone the repository
2. Set up your environment variables
3. Deploy to Vercel
4. Configure your Supabase project
5. Run the application

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Maps**: Google Maps API, Mapbox
- **Deployment**: Vercel
