import { NextResponse } from 'next/server';

/**
 * Standard API error response
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json(
    { 
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Standard API validation error response
 */
export function apiValidationError(errors: Array<{ field: string; message: string }>) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors,
      timestamp: new Date().toISOString()
    },
    { status: 400 }
  );
}
