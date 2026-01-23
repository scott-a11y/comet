/**
 * Application Error Classes
 * Typed error handling for consistent error responses
 */

export class AppError extends Error {
    constructor(
        message: string,
        public code: ErrorCode,
        public statusCode: number = 500,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
    }

    toJSON() {
        return {
            error: this.message,
            code: this.code,
            statusCode: this.statusCode,
            details: this.details,
        };
    }
}

// Error codes for consistent error handling
export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'RATE_LIMITED'
    | 'CONFLICT'
    | 'INTERNAL_ERROR'
    | 'DATABASE_ERROR'
    | 'EXTERNAL_API_ERROR'
    | 'FILE_UPLOAD_ERROR'
    | 'CALCULATION_ERROR';

// Convenience factory functions
export const Errors = {
    validation: (message: string, details?: Record<string, unknown>) =>
        new AppError(message, 'VALIDATION_ERROR', 400, details),

    notFound: (resource: string) =>
        new AppError(`${resource} not found`, 'NOT_FOUND', 404),

    unauthorized: (message = 'Authentication required') =>
        new AppError(message, 'UNAUTHORIZED', 401),

    forbidden: (message = 'Access denied') =>
        new AppError(message, 'FORBIDDEN', 403),

    rateLimited: (retryAfter?: number) =>
        new AppError('Rate limit exceeded', 'RATE_LIMITED', 429, { retryAfter }),

    conflict: (message: string) =>
        new AppError(message, 'CONFLICT', 409),

    internal: (message = 'Internal server error') =>
        new AppError(message, 'INTERNAL_ERROR', 500),

    database: (message: string) =>
        new AppError(message, 'DATABASE_ERROR', 500),

    externalApi: (service: string, message: string) =>
        new AppError(`${service}: ${message}`, 'EXTERNAL_API_ERROR', 502),

    fileUpload: (message: string) =>
        new AppError(message, 'FILE_UPLOAD_ERROR', 400),

    calculation: (message: string, details?: Record<string, unknown>) =>
        new AppError(message, 'CALCULATION_ERROR', 400, details),
};

// Type guard to check if error is AppError
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

// Extract error message safely
export function getErrorMessage(error: unknown): string {
    if (isAppError(error)) return error.message;
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
}
