import { NextRequest, NextResponse } from 'next/server'
import { simpleRateLimit } from './rate-limit'

export function withRateLimit<T extends any[]>(handler: (...args: T) => Promise<NextResponse>) {
  return async (...args: T) => {
    const req = args[0] as NextRequest

    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'anonymous'

    // Apply rate limiting
    const rateLimitResult = await simpleRateLimit(`api:${ip}`, 20, 60000) // 20 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = await handler(...args)

    if (rateLimitResult.remaining !== undefined) {
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())
    }

    return response
  }
}
