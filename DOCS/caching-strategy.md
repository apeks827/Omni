# Caching Strategy

## Overview

This document defines the caching strategy for the Omni task manager API to optimize performance and reduce database load.

## Current State

**Status**: No caching implemented (as of 2026-03-30)

**Next Steps**: Implementation tracked in [OMN-655](/OMN/issues/OMN-655)

## Caching Layers

### 1. Response Caching (Planned)

Cache full HTTP responses for read-heavy endpoints.

**Implementation**: In-memory cache with LRU eviction

**Candidates**:

- GET /api/tasks (with query params as cache key)
- GET /api/projects
- GET /api/goals
- GET /api/labels

### 2. Database Query Caching (Future)

Cache database query results at the service layer.

**Implementation**: Redis or in-memory cache

### 3. Static Asset Caching (Implemented)

Browser caching for client assets via Vite build.

## TTL Configuration

| Endpoint           | TTL | Invalidation Trigger            |
| ------------------ | --- | ------------------------------- |
| GET /api/tasks     | 30s | POST/PATCH/DELETE /api/tasks    |
| GET /api/tasks/:id | 60s | PATCH/DELETE /api/tasks/:id     |
| GET /api/projects  | 5m  | POST/PATCH/DELETE /api/projects |
| GET /api/goals     | 5m  | POST/PATCH/DELETE /api/goals    |
| GET /api/labels    | 10m | POST/PATCH/DELETE /api/labels   |

## Cache Key Strategy

### Format

```
{method}:{path}:{queryHash}:{workspaceId}
```

### Examples

```
GET:/api/tasks:sha256(status=todo&priority=high):workspace-123
GET:/api/projects::workspace-123
GET:/api/tasks/task-456::workspace-123
```

## Invalidation Strategy

### 1. Time-Based (TTL)

All cache entries expire after their TTL.

### 2. Event-Based

Invalidate cache on mutations:

```typescript
// After task creation/update/deletion
cache.invalidate(`GET:/api/tasks:*:${workspaceId}`)
cache.invalidate(`GET:/api/tasks/${taskId}:*:${workspaceId}`)

// After project update
cache.invalidate(`GET:/api/projects:*:${workspaceId}`)
cache.invalidate(`GET:/api/tasks:*:${workspaceId}`) // Tasks filtered by project
```

### 3. Manual Invalidation

Admin endpoint for cache clearing:

```bash
POST /api/admin/cache/clear
```

## Cache Headers

### Response Headers

```http
Cache-Control: private, max-age=30
X-Cache: HIT|MISS
X-Cache-Key: {cacheKey}
```

### Request Headers

```http
Cache-Control: no-cache  # Bypass cache
```

## Monitoring

### Metrics to Track

- Cache hit rate (target: >80%)
- Cache miss rate
- Cache size (memory usage)
- Eviction rate
- Average response time (cached vs uncached)

### Alerts

- Cache hit rate <60%
- Cache memory usage >500MB
- High eviction rate (>100/min)

## Implementation Notes

### Phase 1: In-Memory Cache (OMN-655)

- Use `node-cache` or custom LRU implementation
- Single-instance only (no distributed cache)
- Suitable for development and small deployments

### Phase 2: Distributed Cache (Future)

- Migrate to Redis for multi-instance deployments
- Implement cache warming on startup
- Add cache replication for HA

## Testing

### Cache Behavior Tests

```typescript
describe('Response caching', () => {
  it('should cache GET /api/tasks', async () => {
    const res1 = await request.get('/api/tasks')
    expect(res1.headers['x-cache']).toBe('MISS')

    const res2 = await request.get('/api/tasks')
    expect(res2.headers['x-cache']).toBe('HIT')
  })

  it('should invalidate on task creation', async () => {
    await request.get('/api/tasks') // Prime cache
    await request.post('/api/tasks').send({...})

    const res = await request.get('/api/tasks')
    expect(res.headers['x-cache']).toBe('MISS')
  })
})
```

### Load Testing with Cache

```bash
# Test cache effectiveness
AUTH_TOKEN=<token> node benchmarks/api-load-test.js

# Expected improvement:
# - GET /api/tasks: 50ms → 5ms (10x faster)
# - Cache hit rate: >80%
```

## Security Considerations

1. **Workspace Isolation**: Always include workspaceId in cache key
2. **User Permissions**: Cache only public/shared data, not user-specific
3. **Sensitive Data**: Never cache authentication tokens or passwords
4. **Cache Poisoning**: Validate all cache keys, sanitize query params

## References

- [OMN-655: API Performance: Response Caching Layer](/OMN/issues/OMN-655)
- [OMN-636: Performance: API response time optimization](/OMN/issues/OMN-636)
- [performance-benchmarks.md](./performance-benchmarks.md)
