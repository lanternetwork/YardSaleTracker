# Environment Configuration Strategy

This document explains the environment configuration strategy for LootAura, including legacy and V2 schema support.

## Overview

The application supports two schema configurations:
- **Legacy**: Uses `public` schema (default for existing production builds)
- **V2**: Uses `lootaura_v2` schema (default for pivot/property-pulse branch)

## Environment Files

### `env.example` (Default - V2 Schema)
- **Purpose**: Default configuration for new deployments
- **Schema**: `lootaura_v2` (set by default)
- **Usage**: Copy to `.env.local` for development
- **Target**: New features and pivot/property-pulse branch

### `env.legacy.example` (Legacy Schema)
- **Purpose**: Legacy configuration for existing production builds
- **Schema**: `public` (default when not set)
- **Usage**: Copy to `.env.local` for legacy deployments
- **Target**: Existing production deployments

## Schema Configuration

### Environment Variable
```bash
NEXT_PUBLIC_SUPABASE_SCHEMA=lootaura_v2  # V2 schema
# or
NEXT_PUBLIC_SUPABASE_SCHEMA=public      # Legacy schema
# or
# (not set)                              # Defaults to 'public' for backward compatibility
```

### Fallback Behavior
- **If not set**: Defaults to `public` schema
- **If set to `public`**: Uses legacy schema
- **If set to `lootaura_v2`**: Uses V2 schema

## Deployment Strategies

### Production (Legacy)
```bash
# Use env.legacy.example
# Don't set NEXT_PUBLIC_SUPABASE_SCHEMA
# Maintains existing functionality
# No breaking changes
```

### Production (V2)
```bash
# Use env.example
# Set NEXT_PUBLIC_SUPABASE_SCHEMA=lootaura_v2
# Apply database migration
# Deploy with new schema configuration
```

### Development
```bash
# Use env.example (V2 schema)
# Set NEXT_PUBLIC_SUPABASE_SCHEMA=lootaura_v2
# Test new features with V2 schema
# Maintain backward compatibility
```

## Schema Differences

### Legacy Schema (`public`)
- **Tables**: `yard_sales`, `profiles` (old), `account_deletion_requests`
- **Features**: Original table structure
- **Used by**: Existing production deployments
- **Migration**: Gradual migration to V2 schema

### V2 Schema (`lootaura_v2`)
- **Tables**: `profiles`, `sales`, `items`, `favorites`
- **Features**: Enhanced RLS, performance indexes, updated_at triggers
- **Used by**: New deployments and pivot/property-pulse branch
- **Benefits**: Better organization, improved security, optimized performance

## Code Implementation

### Schema Helper Functions
```typescript
// Get schema name from environment
export const getSchemaName = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public'
}

// Get schema-qualified table name
export const getTableName = (tableName: string) => {
  const schema = getSchemaName()
  return schema === 'public' ? tableName : `${schema}.${tableName}`
}
```

### Usage in Server Actions
```typescript
import { createSupabaseServer, getTableName } from '@/lib/supabase/server'

export async function getSales() {
  const supabase = createSupabaseServer()
  const salesTable = getTableName('sales') // Returns 'lootaura_v2.sales' or 'sales'
  
  const { data, error } = await supabase
    .from(salesTable)
    .select('*')
}
```

## Migration Path

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

## Testing Strategy

### Local Development
1. **V2 Schema Testing**:
   ```bash
   cp env.example .env.local
   # NEXT_PUBLIC_SUPABASE_SCHEMA=lootaura_v2 is already set
   npm run dev
   ```

2. **Legacy Schema Testing**:
   ```bash
   cp env.legacy.example .env.local
   # NEXT_PUBLIC_SUPABASE_SCHEMA is not set (defaults to 'public')
   npm run dev
   ```

### Production Testing
1. **Legacy Production**: No changes required
2. **V2 Production**: Set environment variable and apply migration

## Troubleshooting

### Common Issues

#### Schema Not Found
- **Problem**: `NEXT_PUBLIC_SUPABASE_SCHEMA` not set correctly
- **Solution**: Check environment variable is set correctly
- **Fallback**: Defaults to `public` schema

#### Table Not Found
- **Problem**: Table doesn't exist in specified schema
- **Solution**: Apply database migration
- **Check**: Verify schema exists in database

#### RLS Policy Errors
- **Problem**: Row Level Security policies not applied
- **Solution**: Run migration to create RLS policies
- **Check**: Verify policies exist in database

### Migration Issues

#### Database Migration Failed
- **Problem**: Migration script failed to apply
- **Solution**: Check database permissions and connection
- **Rollback**: Use Supabase dashboard to rollback if needed

#### Schema Conflict
- **Problem**: Schema already exists
- **Solution**: Check if migration was already applied
- **Verify**: Query database to confirm schema exists

## Best Practices

### Environment Management
1. **Never commit `.env.local`** to version control
2. **Use appropriate example file** for your deployment type
3. **Test both schemas** in development
4. **Document environment changes** in deployment notes

### Schema Management
1. **Use schema helper functions** consistently
2. **Test schema-qualified table names** in development
3. **Verify RLS policies** are working correctly
4. **Monitor performance** with new indexes

### Deployment
1. **Backup database** before applying migrations
2. **Test in staging** environment first
3. **Monitor application** after deployment
4. **Have rollback plan** ready

## Support

For questions about environment configuration:
1. Check this documentation
2. Review environment example files
3. Test in development environment
4. Contact development team for assistance
