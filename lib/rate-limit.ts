import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Simple in-memory rate limiter for development
// Can be upgraded to Redis-based limiter for production
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60000 // Clean up expired entries every 60 seconds

// Cleanup function to prevent memory leak
function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, record] of inMemoryStore) {
    if (now > record.resetTime) {
      inMemoryStore.delete(key)
    }
  }
}

export async function simpleRateLimit(identifier: string, limit = 10, windowMs = 10000) {
  // Clean up expired entries periodically
  cleanupExpiredEntries()
  // Use Upstash if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      const ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: true,
      })

      const { success, limit: l, remaining, reset } = await ratelimit.limit(identifier)

      return {
        success,
        limit: l,
        remaining,
        reset
      }
    } catch (error) {
      console.warn('Rate limiting failed, falling back to in-memory', error)
      // Fallback to in-memory
    }
  }

  const now = Date.now()
  const key = identifier

  const record = inMemoryStore.get(key)

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    inMemoryStore.set(key, { count: 1, resetTime })
    return { success: true, reset: resetTime, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return {
      success: false,
      reset: record.resetTime,
      remaining: 0
    }
  }

  record.count++
  return {
    success: true,
    reset: record.resetTime,
    remaining: limit - record.count
  }
}
