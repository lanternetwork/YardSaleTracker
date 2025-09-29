# LootAura

A modern, mobile-first web application for discovering, posting, and managing yard sales, garage sales, and estate sales in your neighborhood.

## Features

- 🔍 **Search & Filter**: Find sales by location, date, and categories
- 🗺️ **Smart Map Clustering**: Zoom-aware clustering with InfoWindow popups
- 📱 **PWA Support**: Install as a mobile app with offline capabilities
- 🔐 **User Accounts**: Save favorites and manage your own sales
- 📊 **Admin Tools**: Craigslist ingestion and system diagnostics
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 🛡️ **Stabilize Mode**: Preview safety switch to disable heavy features during development
- ⏰ **Time Presets**: Quick date/time selection for common yard sale schedules
- 💾 **Autosave Drafts**: Secure draft persistence for anonymous users without account creation
- 🗺️ **Smart ZIP Search**: Enhanced geocoding with PO Box support and map re-centering
- 📍 **Accurate IP Geolocation**: Multi-source location detection with fallback APIs

### Map Clustering Features
- **Zoom-aware clustering**: Blue circles that appear/disappear based on zoom level
- **Rich popups**: InfoWindow showing first 10 sales with "View All" button
- **Performance optimized**: Smooth transitions without blinking or flickering
- **Distance-based**: Accurate clustering using Haversine formula for real-world distances

### Stabilize Mode
- **Preview Safety**: Set `STABILIZE_MODE=1` in Vercel Preview to disable wizard pages
- **Lightweight Placeholders**: Shows simple notices instead of heavy components
- **Easy Toggle**: Remove the environment variable to re-enable full functionality
- **Development Friendly**: Prevents SSR/import failures during heavy development

### Time Presets & Autosave
- **Quick Scheduling**: Pre-configured time slots for "This Saturday 8–2", "This Sunday 9–1", "Sat + Sun 8–2", and "Custom"
- **Local Timezone**: Automatically calculates next Saturday/Sunday in your timezone
- **Autosave Drafts**: Anonymous users can create and save drafts without account creation
- **Secure Tokens**: Draft access controlled by secure HttpOnly cookies with hashed tokens
- **Real-time Feedback**: Live "Saving..." and "Saved" status indicators
- **Persistence**: Drafts survive page reloads and browser sessions
- **Publish Flow**: Sign-in required only when publishing; drafts are claimed to user account

### ZIP Code Search & Geocoding
- **PO Box Support**: Handles PO Box-only ZIP codes (e.g., 90078) with fallback locations
- **Multiple Search Strategies**: Tries post office, city, and state-based searches
- **Cache Bypass**: Repeated searches work reliably with cache invalidation
- **Map Re-centering**: Forces map updates even with identical coordinates
- **Rate Limiting**: 60 requests/minute with development bypass
- **Error Handling**: Graceful fallbacks for geocoding failures
- **Visual Feedback**: Console logging and success indicators

### IP Geolocation System
- **Primary Source**: Vercel IP headers for fast, server-side detection
- **Fallback API**: ipapi.co integration for improved accuracy
- **Multi-Header Support**: x-forwarded-for, x-real-ip, cf-connecting-ip
- **Debugging**: Comprehensive logging for geolocation troubleshooting
- **Error Handling**: Graceful fallback to center of US
- **Accuracy**: Better location detection for regional areas (e.g., Louisville vs Cincinnati)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Maps API key (optional)

### Environment Setup

1. **Copy environment template**:
   ```bash
   cp env.example .env.local
   ```

2. **Configure required variables** in `.env.local`:
   ```bash
   # Supabase (Required)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE=your-service-role-key
   
   # App URL (Required)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # Google Maps (Optional)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
   
   # Feature Flags (Optional)
   STABILIZE_MODE=0  # Set to 1 to disable wizard pages in preview
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run database migrations**:
   - Apply migrations in `supabase/migrations/` to your Supabase project
   - Or use Supabase CLI: `supabase db push`

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   - Visit `http://localhost:3000`
   - Check health status at `http://localhost:3000/api/healthz`

### Environment Variables

See `docs/ENVIRONMENT_BASELINE.md` for complete documentation of all environment variables and their purposes.

### Health Check

The application includes a health endpoint at `/api/healthz` that provides:
- System status and environment info
- Database connectivity checks
- Service availability status
- Feature flag states

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript checks
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

### Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── lib/                    # Utilities and configurations
├── supabase/              # Database migrations
├── docs/                  # Documentation
└── public/                # Static assets
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE`
- `NEXT_PUBLIC_SITE_URL`

Optional:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `CRAIGSLIST_INGEST_TOKEN`
- Feature flags (see `env.example`)

## Troubleshooting

### ZIP Code Search Issues
- **"Could not find location"**: Check console for geocoding debug logs
- **Repeated searches don't work**: Ensure cache bypass is enabled (`?bypass=true`)
- **Map doesn't re-center**: Coordinates may be identical; check for tiny offset in URL
- **Rate limiting**: Increase rate limit or use development bypass

### IP Geolocation Issues
- **Wrong default location**: Check console for IP geolocation debug logs
- **Cincinnati instead of Louisville**: External API fallback should provide better accuracy
- **No location detected**: Verify Vercel IP headers are available
- **Slow loading**: External API calls are cached and have rate limits

### Common Solutions
- **Clear browser cache**: For stale geocoding results
- **Check console logs**: Comprehensive debugging information available
- **Verify API keys**: Google Maps API key for map functionality
- **Test with different ZIP codes**: Verify geocoding works for various locations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT License - see LICENSE file for details
