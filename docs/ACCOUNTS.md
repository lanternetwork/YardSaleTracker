# Accounts & Authentication System

This document describes the accounts and authentication system implemented for the Yard Sale Tracker application.

## Overview

The system provides secure, enterprise-grade account management using Supabase Auth with the following key features:

- **Deferred Authentication**: Guests can create sales but must sign in to publish
- **Favorites Management**: Requires authentication, with local-to-server migration on first sign-in
- **Account Management**: Dedicated account page with session management and data export
- **Privacy-First**: No PII stored in app tables, email remains in Supabase Auth only

## Architecture

### Authentication Flow

1. **Guest Experience**: Users can browse sales and create sale drafts without authentication
2. **Deferred Publish**: When ready to publish, guests are redirected to sign-in
3. **Post-Auth**: After authentication, users land on review page with draft intact
4. **Favorites Migration**: Local favorites are automatically merged to server on first sign-in

### Database Schema

#### Sales Table
- `id` (uuid, primary key)
- `owner_id` (uuid, references auth.users(id))
- `status` ('draft'|'published'|'archived')
- `created_at`, `updated_at` (timestamps)
- Plus existing sale fields (title, description, address, etc.)

#### Favorites Table
- `user_id` (uuid, references auth.users(id))
- `sale_id` (uuid, references sales(id))
- `created_at` (timestamp)
- Primary key: (user_id, sale_id)

### Row Level Security (RLS)

#### Sales Policies
- **SELECT**: Anyone can read published sales; owners can read their own sales (any status)
- **INSERT**: Only authenticated users, must set owner_id = auth.uid()
- **UPDATE/DELETE**: Only owners can modify their own sales

#### Favorites Policies
- **SELECT/INSERT/DELETE**: Users can only access their own favorites (user_id = auth.uid())

## Environment Variables

| Variable | Scope | Description | Set By |
|----------|-------|-------------|---------|
| `SUPABASE_URL` | Server & Client | Supabase project URL | Vercel Project Settings |
| `SUPABASE_ANON_KEY` | Client | Supabase anonymous key | Vercel Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Supabase service role key | Vercel Project Settings |
| `FEATURE_DEFERRED_AUTH_PUBLISH` | Server | Enable deferred auth for publishing | Vercel Project Settings |
| `FEATURE_REQUIRE_LOGIN_FOR_FAVORITES` | Server | Require login for favorites | Vercel Project Settings |
| `FEATURE_ACCOUNT_PAGE` | Server | Enable account management page | Vercel Project Settings |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Google Maps API key | Vercel Project Settings |

## API Routes

### Sales Management
- `POST /api/sales` - Create sale (auth required)
- `PATCH /api/sales/:id` - Update sale (owner only)
- `DELETE /api/sales/:id` - Archive sale (owner only)

### Favorites Management
- `GET /api/favorites` - List user's favorites (auth required)
- `POST /api/favorites/:sale_id` - Add favorite (auth required)
- `DELETE /api/favorites/:sale_id` - Remove favorite (auth required)

## Protected Routes

The following routes require authentication:
- `/sell/review` - Review sale before publishing
- `/sell/publish` - Publish sale
- `/favorites` - Manage favorites
- `/account` - Account management

## Middleware

The auth middleware:
- Checks for valid Supabase session on protected routes
- Redirects unauthenticated users to `/auth?returnTo=<original>`
- Excludes static assets from auth checks
- Adds no-cache headers for auth-required pages

## Privacy & Security

### Data Minimization
- No PII stored in app tables
- Email remains in Supabase Auth only
- User ID (uuid) is the only identifier in app tables
- Logs are redacted by default

### Email Verification
- Required for publishing sales
- Enforced in both UI and API
- Checked via `user.email_confirmed_at`

### Session Management
- Users can view active sessions
- Ability to revoke individual sessions
- Account deletion with data export

## Data Export & Deletion

### Export Data
- Export user's sales and favorites
- JSON format with all user-generated content
- No PII included (email stays in Supabase Auth)

### Delete Account
- Permanently delete account and all associated data
- Irreversible action
- Confirmation required

## Post-Deploy Checklist

1. **Set Environment Variables in Vercel**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FEATURE_DEFERRED_AUTH_PUBLISH=true`
   - `FEATURE_REQUIRE_LOGIN_FOR_FAVORITES=true`
   - `FEATURE_ACCOUNT_PAGE=true`

2. **Apply Database Migrations**:
   - Run `supabase/migrations/005_accounts_auth_schema.sql`
   - Verify RLS policies are active
   - Test with sample data

3. **Verify Email Verification**:
   - Test sign-up flow
   - Confirm email verification is required for publishing
   - Test magic link authentication

4. **Test Deferred Auth Flow**:
   - Create sale as guest
   - Attempt to publish → should redirect to auth
   - Sign in → should land on review page with draft
   - Complete publishing

5. **Test Favorites Migration**:
   - Add favorites as guest (local storage)
   - Sign in → should merge to server
   - Verify favorites persist across sessions

6. **Review Logs**:
   - Confirm no PII in application logs
   - Verify email addresses are not logged
   - Check that user IDs are properly redacted

## Testing

### Smoke Test Script

1. **Guest Flow**:
   - Visit `/sell/new`
   - Fill out sale form completely
   - Click "Continue to Review" → should redirect to `/auth?returnTo=/sell/review`
   - Sign in with email or OAuth
   - Should land on `/sell/review` with form data intact
   - Publish sale → should succeed

2. **Favorites Flow**:
   - As guest, try to visit `/favorites` → should redirect to auth
   - Sign in → should land on favorites page
   - Add some favorites
   - Sign out and back in → favorites should persist

3. **Account Management**:
   - Visit `/account` → should show account info
   - Test session management
   - Test sign out functionality

## Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**: Check Supabase environment variables
2. **RLS policy errors**: Verify policies are correctly applied
3. **Auth redirect loops**: Check middleware configuration
4. **Draft not persisting**: Verify localStorage is working

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection in network tab
3. Check authentication state in Supabase dashboard
4. Review middleware logs for redirect issues
