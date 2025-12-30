import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { apiError } from './api-response';

/**
 * Middleware to require authentication for API routes
 * @returns User ID if authenticated, throws error response otherwise
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized - Authentication required',
        timestamp: new Date().toISOString()
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return userId;
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function withAuth<T extends any[]>(
  handler: (userId: string, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const userId = await requireAuth();
      return await handler(userId, ...args);
    } catch (error) {
      if (error instanceof Response) {
        return NextResponse.json(
          JSON.parse(await error.text()),
          { status: error.status }
        );
      }
      return apiError('Internal server error', 500);
    }
  };
}
