# Category Management

This document describes how categories are managed in LootAura and the tools available for maintaining them.

## Overview

Categories in LootAura are stored as `tags` arrays in the `yard_sales` table. Each sale can have multiple categories, and the filtering system uses array overlap matching for precise results.

## Category Data Structure

```typescript
interface Sale {
  id: string
  title: string
  tags: string[]  // Categories array
  // ... other fields
}
```

## Available Categories

The system uses a predefined set of categories defined in `lib/data/categories.ts`:

- `books` - Books, magazines, literature
- `clothing` - Clothing, shoes, accessories
- `decor` - Home decor, artwork, collectibles
- `electronics` - Electronics, gadgets, computers
- `furniture` - Furniture, home furnishings
- `games` - Board games, video games, toys
- `garden` - Garden tools, plants, outdoor items
- `home` - General home items, housewares
- `kids` - Children's items, baby gear
- `kitchen` - Kitchen items, cookware, appliances
- `music` - Musical instruments, records, CDs
- `small-appliances` - Small kitchen appliances
- `sports` - Sports equipment, fitness gear
- `tools` - Tools, hardware, workshop items
- `toys` - Toys, games, children's entertainment
- `vintage` - Vintage items, antiques, collectibles

## Category Management Tools

### 1. Check Categories Status
**Endpoint**: `/check-categories`

A diagnostic page that shows:
- Total sales count
- Sales with/without categories
- Unique categories found
- Sample sales with their categories

### 2. Fix Categories (Robust)
**Endpoint**: `/api/fix-categories`

A reliable category restoration tool that:
- Maps sale titles to categories from seed data
- Only updates sales that need category fixes
- Provides detailed logging of changes
- More efficient than full re-seeding

### 3. Re-seed Categories
**Endpoint**: `/api/seed-public`

Full category restoration that:
- Updates all existing sales with categories
- Re-inserts any missing sales
- Includes item data
- Safe to run multiple times (idempotent)

## Category Assignment Logic

Categories are assigned based on sale titles using a mapping from seed data:

```typescript
// Example mapping
"Downtown Lexington Garage Sale" → ["books", "sports", "kitchen", "home"]
"Crescent Hill Multi-Family" → ["tools", "electronics"]
```

## Troubleshooting Categories

### Issue: Categories Not Showing
1. Go to `/check-categories`
2. Click "Check Categories" to see current status
3. If categories are missing, click "Fix Categories (Robust)"
4. Verify categories appear in the results

### Issue: Category Filters Not Working
1. Ensure categories are properly assigned (use check page)
2. Verify the sales API is returning category data
3. Check browser console for any JavaScript errors
4. Try refreshing the page

### Issue: Categories Keep Disappearing
1. Use the robust fix mechanism (`/api/fix-categories`)
2. Check if database resets are occurring
3. Verify the seed data mapping is correct
4. Consider implementing automatic category restoration

## API Endpoints

### GET /api/sales
Returns sales with category filtering:
```typescript
// Query parameters
{
  lat: number          // Required: latitude
  lng: number          // Required: longitude  
  distanceKm: number   // Search radius in km
  categories: string   // Comma-separated category list
  dateRange: string    // Date filter
  q: string           // Text search
}
```

### POST /api/fix-categories
Restores missing categories:
```typescript
// Response
{
  ok: boolean
  updated: number      // Number of sales updated
  totalSales: number   // Total sales checked
  message: string
}
```

## Best Practices

1. **Regular Monitoring**: Use `/check-categories` to monitor category health
2. **Robust Fixes**: Prefer the robust fix over full re-seeding
3. **Category Consistency**: Ensure seed data mapping covers all sales
4. **Performance**: Categories are indexed for fast filtering
5. **User Experience**: Categories should be intuitive and comprehensive

## Technical Implementation

- **Database**: Categories stored as `text[]` arrays in PostgreSQL
- **Indexing**: GIN indexes on tags columns for fast overlap queries
- **Filtering**: Uses PostgreSQL array overlap operator (`&&`)
- **UI**: Multi-select category filters with real-time updates
- **API**: Efficient category filtering with PostGIS distance calculations
