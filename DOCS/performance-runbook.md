# Performance Troubleshooting Runbook

## High Latency Issues

### Symptoms

- API response times >500ms
- User reports of slow page loads
- Timeout errors

### Diagnosis Steps

1. **Check current performance**:

```bash
AUTH_TOKEN=<token> node benchmarks/api-load-test.js
```

2. **Identify slow endpoints**:

```bash
# Check server logs for slow requests
grep "took.*ms" logs/server.log | sort -t: -k2 -n | tail -20
```

3. **Check database performance**:

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

4. **Check database connections**:

```sql
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

### Common Causes & Solutions

#### 1. Missing Database Indexes

**Symptom**: Slow SELECT queries, high database CPU

**Check**:

```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('tasks', 'projects', 'goals', 'labels');
```

**Fix**: Add missing indexes per `migrations/08_add_performance_indexes.sql`

#### 2. N+1 Query Problem

**Symptom**: Multiple sequential queries for related data

**Check**: Review service layer for loops with database calls

**Fix**: Use JOIN queries or batch loading

#### 3. Large Result Sets

**Symptom**: Slow list endpoints, high memory usage

**Check**: Query result row counts

**Fix**: Implement pagination, add LIMIT clauses

#### 4. Connection Pool Exhaustion

**Symptom**: "too many clients" errors, connection timeouts

**Check**:

```sql
SELECT count(*) FROM pg_stat_activity;
```

**Fix**: Increase pool size in `src/db/pool.ts` or fix connection leaks

## Cache Miss Issues

### Symptoms

- Repeated identical queries
- High database load for read-heavy endpoints

### Diagnosis

1. **Check cache hit rate** (when caching implemented):

```bash
# Monitor cache metrics
curl http://localhost:3000/api/metrics | grep cache
```

2. **Identify cacheable endpoints**:

- GET /api/tasks (list with filters)
- GET /api/projects
- GET /api/goals
- GET /api/labels

### Solutions

1. **Implement response caching** (see OMN-655)
2. **Set appropriate TTLs**:
   - Task lists: 30s
   - Projects: 5m
   - Goals: 5m
   - Labels: 10m

## High Database CPU

### Diagnosis

1. **Check active queries**:

```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

2. **Check table statistics**:

```sql
SELECT schemaname, tablename, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

### Solutions

1. **Kill long-running queries**:

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';
```

2. **Run VACUUM**:

```sql
VACUUM ANALYZE tasks;
VACUUM ANALYZE projects;
```

3. **Update table statistics**:

```sql
ANALYZE tasks;
```

## Memory Issues

### Symptoms

- Server crashes with OOM errors
- High memory usage in monitoring

### Diagnosis

1. **Check Node.js heap usage**:

```bash
curl http://localhost:3000/api/health
```

2. **Profile memory**:

```bash
node --inspect src/server.ts
# Connect Chrome DevTools and take heap snapshot
```

### Solutions

1. **Limit result set sizes**: Add pagination
2. **Stream large responses**: Use streaming for exports
3. **Increase heap size** (temporary):

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run server
```

## Escalation

If issues persist after following this runbook:

1. **Collect diagnostics**:
   - Benchmark results
   - Database slow query log
   - Server logs (last 1000 lines)
   - `pg_stat_statements` output

2. **Create issue** with:
   - Symptom description
   - Diagnosis steps taken
   - Collected diagnostics
   - Impact assessment

3. **Assign to**: Backend Engineer or Founding Engineer
