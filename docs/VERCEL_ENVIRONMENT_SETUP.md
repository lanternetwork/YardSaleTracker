# Vercel Environment Variables Setup

This guide explains how to configure environment variables in Vercel to fix the "Failed to fetch" error.

## Required Environment Variables

### 1. Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Google Maps API (Optional but recommended)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 3. Additional Optional Variables
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-key
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable with its value
5. Make sure to set them for "Production", "Preview", and "Development" environments

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Deploy with new environment variables
vercel --prod
```

## Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Maps JavaScript API"
4. Create credentials → API Key
5. Restrict the API key to your domain for security

## Troubleshooting

### "Failed to fetch" Error
- Check that all environment variables are set correctly
- Verify Supabase URL and key are valid
- Check browser console for specific error messages

### Database Connection Issues
- Ensure your Supabase project is active
- Check that the `search_sales` RPC function exists in your database
- Verify database migrations have been applied

### Maps Not Loading
- Verify Google Maps API key is set
- Check that the API key has the correct permissions
- Ensure the domain is added to the API key restrictions

## Testing Environment Variables

The app now includes an environment check component that will show warnings if variables are missing or invalid. Look for yellow warning boxes on the main page.

## Database Setup

Make sure to run the database migrations in your Supabase project:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration files from `supabase/migrations/`
3. Or use the Supabase CLI: `supabase db push`
