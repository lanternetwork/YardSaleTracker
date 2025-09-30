# YardSaleTracker
Yard Sale Tracker

## Configuration

This project uses configurable Supabase schemas via environment variables. The schema is determined by the `NEXT_PUBLIC_SUPABASE_SCHEMA` environment variable, which defaults to `'public'` if not set.

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_SCHEMA` - The schema to use (defaults to 'public')

### Development

**Note:** Local development without `.env.local` is unsupported in this project. Use Vercel Preview for development and testing.

The application automatically uses the configured schema for all Supabase operations, removing the need for schema prefixes in queries.
