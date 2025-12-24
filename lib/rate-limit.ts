// Simple in-memory rate limiter for development
// Can be upgraded to Redis-based limiter for production
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

export function simpleRateLimit(identifier: string, limit = 10, windowMs = 10000) {
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
