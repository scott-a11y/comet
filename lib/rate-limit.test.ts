import { describe, it, expect, beforeEach } from 'vitest'
import { simpleRateLimit } from './rate-limit'

describe('simpleRateLimit', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    const store = new Map()
    // We can't directly access the store, so we'll rely on time-based resets
  })

  it('should allow requests within the limit', () => {
    const identifier = 'test-user'

    // First request should succeed
    const result1 = simpleRateLimit(identifier, 2, 1000)
    expect(result1.success).toBe(true)
    expect(result1.remaining).toBe(1)

    // Second request should succeed
    const result2 = simpleRateLimit(identifier, 2, 1000)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(0)
  })

  it('should block requests over the limit', () => {
    const identifier = 'test-user'

    // Use up the limit
    simpleRateLimit(identifier, 1, 1000)
    const result = simpleRateLimit(identifier, 1, 1000)

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBeDefined()
  })

  it('should reset after the time window', async () => {
    const identifier = 'test-user'

    // Use up the limit
    simpleRateLimit(identifier, 1, 100)

    // Wait for reset
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should allow again
    const result = simpleRateLimit(identifier, 1, 100)
    expect(result.success).toBe(true)
  })
})
