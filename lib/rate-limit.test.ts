import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { simpleRateLimit } from './rate-limit'

describe('simpleRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests within the limit', () => {
    const identifier = 'test-user'

    const result1 = simpleRateLimit(identifier, 2, 1000)
    expect(result1.success).toBe(true)
    expect(result1.remaining).toBe(1)

    const result2 = simpleRateLimit(identifier, 2, 1000)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(0)
  })

  it('should block requests over the limit', () => {
    const identifier = 'test-user'

    simpleRateLimit(identifier, 1, 1000)
    const result = simpleRateLimit(identifier, 1, 1000)

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBeDefined()
  })

  it('should reset after the time window', () => {
    const identifier = 'test-user-reset'

    simpleRateLimit(identifier, 1, 100)
    vi.advanceTimersByTime(150)

    const result = simpleRateLimit(identifier, 1, 100)
    expect(result.success).toBe(true)
  })
})