# Database Tuning Guide

This document provides instructions for monitoring and optimizing database performance in YardSaleFinder.

## Query Profiling

### Enable Query Logging

1. **Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Enable "Log slow queries" (recommended threshold: 1000ms)

2. **PostgreSQL Logs:**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_statement = 'all';
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   ```

### Analyze Query Performance

1. **EXPLAIN ANALYZE for specific queries:**
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
   SELECT * FROM yard_sales 
   WHERE status = 'active' 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

2. **Check index usage:**
   ```sql
   SELECT 
     schemaname,
     tablename,
     indexname,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public'
   ORDER BY idx_scan DESC;
   ```

3. **Identify slow queries:**
   ```sql
   SELECT 
     query,
     calls,
     total_time,
     mean_time,
     rows
   FROM pg_stat_statements 
   WHERE mean_time > 1000
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

## Index Optimization

### Current Indexes

The following indexes are created by the migration:

```sql
-- Primary performance indexes
CREATE INDEX idx_sales_geo ON yard_sales (lat, lng);
CREATE INDEX idx_sales_time ON yard_sales (start_at, end_at);
CREATE INDEX idx_sales_source ON yard_sales (source);
CREATE INDEX idx_sales_tags_gin ON yard_sales USING GIN (tags);
CREATE INDEX idx_sales_search_tsv ON yard_sales USING GIN (search_tsv);

-- Composite indexes for common patterns
CREATE INDEX idx_sales_status_created ON yard_sales (status, created_at DESC);
CREATE INDEX idx_sales_owner ON yard_sales (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_sales_source_created ON yard_sales (source, created_at DESC);
CREATE INDEX idx_sales_price_range ON yard_sales (price_min, price_max) 
  WHERE price_min IS NOT NULL AND price_max IS NOT NULL;
CREATE INDEX idx_sales_date_range ON yard_sales (start_at, end_at) 
  WHERE start_at IS NOT NULL;
CREATE INDEX idx_sales_location ON yard_sales (city, state) 
  WHERE city IS NOT NULL AND state IS NOT NULL;
```

### Monitoring Index Usage

```sql
-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Adding New Indexes

When adding new indexes, consider:

1. **Query patterns:** Analyze your most common queries
2. **Selectivity:** Indexes work best on columns with high selectivity
3. **Composite indexes:** Order columns by selectivity (most selective first)
4. **Partial indexes:** Use WHERE clauses for conditional indexes

Example:
```sql
-- Partial index for active sales only
CREATE INDEX idx_sales_active_geo ON yard_sales (lat, lng) 
WHERE status = 'active' AND lat IS NOT NULL AND lng IS NOT NULL;
```

## Query Optimization

### Use the Optimized Search Function

Always use the `search_sales` function instead of direct queries:

```sql
-- Good: Use the optimized function
SELECT * FROM search_sales(
  search_query := 'garage sale',
  max_distance_km := 25,
  user_lat := 37.7749,
  user_lng := -122.4194,
  limit_count := 50
);

-- Avoid: Direct table queries for complex filtering
SELECT * FROM yard_sales 
WHERE title ILIKE '%garage sale%' 
  AND status = 'active'
  -- ... complex filtering
```

### Optimize Common Queries

1. **Sales listing with filters:**
   ```sql
   -- Use the search function with appropriate parameters
   SELECT * FROM search_sales(
     search_query := $1,
     max_distance_km := $2,
     user_lat := $3,
     user_lng := $4,
     date_from := $5,
     date_to := $6,
     price_min := $7,
     price_max := $8,
     tags_filter := $9,
     limit_count := 50
   );
   ```

2. **User's sales:**
   ```sql
   -- Use the owner index
   SELECT * FROM yard_sales 
   WHERE owner_id = $1 
   ORDER BY created_at DESC;
   ```

3. **Favorites with sales data:**
   ```sql
   -- Use the favorites index with join
   SELECT s.* FROM yard_sales s
   JOIN favorites f ON s.id = f.sale_id
   WHERE f.user_id = $1
   ORDER BY f.created_at DESC;
   ```

## Connection Pooling

### Supabase Connection Limits

- **Free tier:** 60 connections
- **Pro tier:** 200 connections
- **Team tier:** 500 connections

### Optimize Connection Usage

1. **Use connection pooling:**
   ```javascript
   // In your Supabase client configuration
   const supabase = createClient(url, key, {
     db: {
       schema: 'public',
     },
     auth: {
       persistSession: true,
     },
     global: {
       headers: {
         'Connection': 'keep-alive',
       },
     },
   })
   ```

2. **Close unused connections:**
   ```javascript
   // Close connections when done
   await supabase.auth.signOut()
   ```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Query Performance:**
   - Average query time
   - Slow query count
   - Index hit ratio

2. **Connection Usage:**
   - Active connections
   - Connection pool utilization
   - Connection errors

3. **Database Size:**
   - Table sizes
   - Index sizes
   - Growth rate

### Setting Up Alerts

1. **Supabase Dashboard:**
   - Go to Settings > Alerts
   - Set up alerts for:
     - High CPU usage (>80%)
     - High memory usage (>80%)
     - Slow queries (>5 seconds)
     - Connection limit approaching

2. **Custom Monitoring:**
   ```sql
   -- Create a monitoring view
   CREATE VIEW db_performance_summary AS
   SELECT 
     'yard_sales' as table_name,
     COUNT(*) as row_count,
     pg_size_pretty(pg_total_relation_size('yard_sales')) as total_size,
     pg_size_pretty(pg_relation_size('yard_sales')) as table_size,
     pg_size_pretty(pg_total_relation_size('yard_sales') - pg_relation_size('yard_sales')) as index_size
   FROM yard_sales;
   ```

## Maintenance Tasks

### Regular Maintenance

1. **Update statistics:**
   ```sql
   ANALYZE yard_sales;
   ANALYZE reviews;
   ANALYZE favorites;
   ```

2. **Vacuum tables:**
   ```sql
   VACUUM ANALYZE yard_sales;
   VACUUM ANALYZE reviews;
   VACUUM ANALYZE favorites;
   ```

3. **Check for unused indexes:**
   ```sql
   -- Find unused indexes
   SELECT 
     schemaname,
     tablename,
     indexname,
     idx_scan
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public' 
     AND idx_scan = 0
   ORDER BY pg_relation_size(indexrelid) DESC;
   ```

### Performance Tuning Checklist

- [ ] Enable query logging
- [ ] Monitor slow queries
- [ ] Check index usage statistics
- [ ] Optimize frequently used queries
- [ ] Update table statistics regularly
- [ ] Monitor connection usage
- [ ] Set up performance alerts
- [ ] Review and remove unused indexes
- [ ] Consider partitioning for large tables
- [ ] Monitor database growth

## Troubleshooting

### Common Issues

1. **Slow queries:**
   - Check if indexes are being used
   - Analyze query execution plans
   - Consider query rewriting

2. **High connection usage:**
   - Check for connection leaks
   - Implement connection pooling
   - Review connection timeouts

3. **Large table sizes:**
   - Consider archiving old data
   - Implement table partitioning
   - Review data retention policies

### Performance Testing

```sql
-- Test query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM search_sales(
  search_query := 'test',
  max_distance_km := 25,
  user_lat := 37.7749,
  user_lng := -122.4194,
  limit_count := 50
);
```

This guide should help you maintain optimal database performance as your YardSaleFinder application scales.
