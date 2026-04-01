import { describe, it, expect, beforeEach } from 'vitest'
import { CacheService } from '../services/cache/CacheService.js'

describe('CacheService', () => {
  let cache: CacheService

  beforeEach(() => {
    cache = new CacheService(100)
  })

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1', 60)
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('should expire entries after TTL', async () => {
    cache.set('key1', 'value1', 1)
    expect(cache.get('key1')).toBe('value1')

    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(cache.get('key1')).toBeNull()
  })

  it('should track cache hits and misses', () => {
    cache.set('key1', 'value1', 60)

    cache.get('key1')
    cache.get('key2')
    cache.get('key1')

    const stats = cache.getStats()
    expect(stats.hits).toBe(2)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBeCloseTo(0.667, 2)
  })

  it('should invalidate by pattern', () => {
    cache.set('tasks:123:workspace1', 'task1', 60)
    cache.set('tasks:456:workspace1', 'task2', 60)
    cache.set('projects:789:workspace1', 'project1', 60)

    const count = cache.invalidatePattern('tasks:.*:workspace1')
    expect(count).toBe(2)

    expect(cache.get('tasks:123:workspace1')).toBeNull()
    expect(cache.get('tasks:456:workspace1')).toBeNull()
    expect(cache.get('projects:789:workspace1')).toBe('project1')
  })

  it('should clear all entries', () => {
    cache.set('key1', 'value1', 60)
    cache.set('key2', 'value2', 60)

    cache.clear()

    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBeNull()
    expect(cache.getStats().size).toBe(0)
  })

  it('should evict oldest entry when max size reached', () => {
    const smallCache = new CacheService(3)

    smallCache.set('key1', 'value1', 60)
    smallCache.set('key2', 'value2', 60)
    smallCache.set('key3', 'value3', 60)
    smallCache.set('key4', 'value4', 60)

    expect(smallCache.getStats().size).toBe(3)
    expect(smallCache.get('key1')).toBeNull()
    expect(smallCache.get('key4')).toBe('value4')
  })

  it('should handle complex objects', () => {
    const obj = { id: '123', name: 'Test', nested: { value: 42 } }
    cache.set('obj1', obj, 60)

    const retrieved = cache.get('obj1')
    expect(retrieved).toEqual(obj)
  })
})
