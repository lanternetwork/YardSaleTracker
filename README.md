# Yard Sale Tracker

A modern, mobile-first web application for discovering, posting, and managing yard sales, garage sales, and estate sales in your neighborhood.

## Features

- 🔍 **Search & Filter**: Find sales by location, date, price, and categories
- 🗺️ **Interactive Maps**: View sales on Google Maps with clustering
- 📱 **PWA Support**: Install as a mobile app with offline capabilities
- 🔐 **User Accounts**: Save favorites and manage your own sales
- 📊 **Admin Tools**: Craigslist ingestion and system diagnostics
- 🎨 **Modern UI**: Clean, responsive design with dark mode support

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT License - see LICENSE file for details
