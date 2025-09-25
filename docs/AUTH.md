# Authentication Setup Guide

This document outlines the authentication configuration for the Yard Sale Tracker application.

## Supabase Configuration

### Provider Setup (Required by Maintainers)

The following OAuth providers must be enabled in the Supabase dashboard:

1. **Google OAuth**
   - Navigate to Authentication > Providers in Supabase dashboard
   - Enable Google provider
   - Configure OAuth credentials (Client ID, Client Secret)

2. **GitHub OAuth**
   - Enable GitHub provider in Supabase dashboard
   - Configure OAuth credentials (Client ID, Client Secret)

### Site URL Configuration

In Supabase Authentication settings:

- **Site URL**: `https://lootaura.com`
- **Additional Redirect URLs**:
  - `https://*.vercel.app`
  - `https://lootaura.com/auth/callback`
  - `https://*.vercel.app/auth/callback`

### Email Configuration

- **Email Templates**: Configure magic link templates in Supabase
- **Redirect URL**: All magic links redirect to `/auth/callback`
- **Email Redirect To**: `${origin}/auth/callback?returnTo=${encodedReturnTo}`

## Authentication Flow

### OAuth Flow
1. User clicks "Continue with Google/GitHub"
2. Redirected to provider for authentication
3. Provider redirects to `/auth/callback?returnTo=<encoded-path>`
4. Callback handler exchanges code for session
5. User redirected to `returnTo` or `/account`

### Magic Link Flow
1. User enters email and clicks "Send magic link"
2. Email sent with link to `/auth/callback?code=<token>`
3. User clicks link in email
4. Callback handler processes the code
5. User redirected to `returnTo` or `/account`

## Code Implementation

### Auth Callback Route
- **Path**: `/auth/callback`
- **Method**: GET
- **Behavior**: 
  - Extracts `code` from query params
  - Calls `supabase.auth.exchangeCodeForSession({ code })`
  - Redirects to `returnTo` or `/account` on success
  - Shows error page on failure

### Redirect URL Construction
```typescript
// OAuth redirect
redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`

// Magic link redirect
emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
```

## Environment Variables

### Required (Set in Vercel)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Optional
- `NEXT_PUBLIC_SITE_URL` - Override for origin detection (defaults to `window.location.origin`)

## Security Considerations

### CSRF Protection
- All auth flows use Supabase's built-in CSRF protection
- State parameters are handled automatically by Supabase

### Session Management
- Sessions are managed by Supabase Auth
- Automatic token refresh handled by Supabase client
- Session persistence across browser tabs

### Redirect Security
- `returnTo` parameter is URL-encoded to prevent injection
- Callback route validates and sanitizes redirect URLs
- Default fallback to `/account` for security

## Troubleshooting

### Common Issues

1. **"Provider not enabled" error**
   - Ensure Google/GitHub providers are enabled in Supabase dashboard
   - Verify OAuth credentials are configured correctly

2. **Magic link redirects to localhost**
   - Check Site URL configuration in Supabase
   - Ensure production URLs are in Additional Redirect URLs

3. **Callback not working**
   - Verify `/auth/callback` route exists and is accessible
   - Check that middleware doesn't block the callback route
   - Ensure Supabase project URL and keys are correct

### Testing Authentication

1. **OAuth Testing**
   - Click "Continue with Google/GitHub"
   - Should redirect to provider login
   - After auth, should land on `/auth/callback`
   - Should redirect to intended destination

2. **Magic Link Testing**
   - Enter email and click "Send magic link"
   - Check email for link
   - Click link should redirect to `/auth/callback`
   - Should redirect to intended destination

## Maintenance

### Regular Tasks
- Monitor authentication logs in Supabase dashboard
- Review and rotate OAuth credentials periodically
- Update redirect URLs when deploying to new domains

### Monitoring
- Track authentication success/failure rates
- Monitor for suspicious login patterns
- Review session management and token refresh
