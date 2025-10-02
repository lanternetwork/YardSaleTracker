# LootAura V2 Schema Configuration

This document explains the new `lootaura_v2` schema configuration and how to use schema-qualified table names in the application.

## Overview

The `lootaura_v2` schema provides a clean separation from the legacy `public` schema, allowing for:
- Better organization of new features
- Easier migration from legacy code
- Improved security with dedicated RLS policies
- Schema-specific optimizations

## Environment Configuration

### Environment Variable
```bash
NEXT_PUBLIC_SUPABASE_SCHEMA=lootaura_v2
```

### Default Behavior
- If `NEXT_PUBLIC_SUPABASE_SCHEMA` is not set, defaults to `public` schema
- All existing code continues to work without changes

## Schema Structure

### Tables in `lootaura_v2` Schema

#### `profiles`
- User profile information
- Links to `auth.users` via `user_id`
- Includes preferences and home location

#### `sales`
- Yard sale listings
- Location data with lat/lng coordinates
- Date/time information
- Privacy and status controls

#### `items`
- Individual items within sales
- Links to sales via `sale_id`
- Price, condition, and category information

#### `favorites`
- User favorites/bookmarks
- Links users to sales they've favorited

## Using Schema-Qualified Table Names

### In Server Actions

```typescript
import { createSupabaseServer, getTableName } from '@/lib/supabase/server'

export async function getSales() {
  const supabase = createSupabaseServer()
  const salesTable = getTableName('sales') // Returns 'lootaura_v2.sales' or 'sales'
  
  const { data, error } = await supabase
    .from(salesTable)
    .select('*')
    .eq('status', 'published')
}
```

### In API Routes

```typescript
import { getTableName } from '@/lib/supabase/server'

export async function GET() {
  const profilesTable = getTableName('profiles')
  // Use profilesTable in your queries
}
```

### In Client Components

```typescript
import { createSupabaseBrowser, getTableName } from '@/lib/supabase/client'

export function useSales() {
  const supabase = createSupabaseBrowser()
  const salesTable = getTableName('sales')
  
  return useQuery({
    queryKey: ['sales'],
    queryFn: () => supabase.from(salesTable).select('*')
  })
}
```

## Migration Strategy

### Phase 1: Parallel Operation
- New features use `lootaura_v2` schema
- Legacy features continue using `public` schema
- No breaking changes to existing functionality

### Phase 2: Gradual Migration
- Migrate existing tables to new schema
- Update server actions to use schema-qualified names
- Maintain backward compatibility

### Phase 3: Cleanup
- Remove legacy schema references
- Optimize for new schema structure

## RLS Policies

All tables in `lootaura_v2` schema have comprehensive RLS policies:

- **Profiles**: Users can only access their own profile
- **Sales**: Users can view published sales or their own sales
- **Items**: Users can view items from published sales or their own sales
- **Favorites**: Users can only access their own favorites

## Performance Optimizations

### Indexes Created
- `idx_profiles_user_id` - Fast user profile lookups
- `idx_sales_owner_id` - Fast owner-based queries
- `idx_sales_status` - Fast status filtering
- `idx_sales_location` - Geographic queries
- `idx_sales_dates` - Date range queries
- `idx_items_sale_id` - Fast item lookups by sale
- `idx_items_category` - Category filtering
- `idx_favorites_user_id` - User favorites
- `idx_favorites_sale_id` - Sale favorites

### Triggers
- `updated_at` triggers on all tables for automatic timestamp updates

## Testing the Schema

### Local Development
1. Set `NEXT_PUBLIC_SUPABASE_SCHEMA=lootaura_v2` in your `.env.local`
2. Run the migration: `supabase db reset`
3. Test API endpoints with schema-qualified table names

### Production Deployment
1. Apply migration to production database
2. Set environment variable in deployment platform
3. Deploy application with new schema configuration

## Troubleshooting

### Common Issues

#### Table Not Found
- Ensure `NEXT_PUBLIC_SUPABASE_SCHEMA` is set correctly
- Verify migration has been applied
- Check table name spelling

#### RLS Policy Errors
- Ensure user is authenticated
- Check RLS policies are correctly applied
- Verify user has appropriate permissions

#### Performance Issues
- Check indexes are created
- Monitor query performance
- Consider additional indexes for specific use cases

## Examples

### Complete API Route Example

```typescript
// app/api/v2/sales/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, getTableName } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServer()
  const salesTable = getTableName('sales')
  
  const { data, error } = await supabase
    .from(salesTable)
    .select('*')
    .eq('status', 'published')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ sales: data })
}
```

This configuration provides a robust foundation for the new LootAura V2 schema while maintaining compatibility with existing code.
