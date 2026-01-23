/**
 * Enhanced Logging Utility
 * Structured logging with request ID tracking and performance timing
 */

import { randomUUID } from 'crypto';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  [key: string]: unknown;
}

interface TimerEntry {
  start: number;
  label: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private requestId: string | null = null;
  private timers: Map<string, TimerEntry> = new Map();

  /**
   * Set request ID for tracking across log entries
   */
  setRequestId(id?: string): string {
    this.requestId = id || randomUUID().slice(0, 8);
    return this.requestId;
  }

  /**
   * Clear request ID (call at end of request)
   */
  clearRequestId(): void {
    this.requestId = null;
  }

  /**
   * Start a performance timer
   */
  startTimer(label: string): void {
    this.timers.set(label, { start: performance.now(), label });
  }

  /**
   * End timer and log duration
   */
  endTimer(label: string, meta?: LogMeta): number {
    const timer = this.timers.get(label);
    if (!timer) {
      this.warn(`Timer "${label}" not found`);
      return 0;
    }

    const duration = performance.now() - timer.start;
    this.timers.delete(label);

    this.info(`${label} completed`, { ...meta, durationMs: Math.round(duration) });
    return duration;
  }

  info(message: string, meta?: LogMeta) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogMeta) {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | LogMeta, meta?: LogMeta) {
    if (error instanceof Error) {
      this.log('error', message, {
        ...meta,
        errorMessage: error.message,
        errorName: error.name,
        stack: this.isDevelopment ? error.stack : undefined
      });
    } else {
      this.log('error', message, { ...meta, ...error });
    }
  }

  debug(message: string, meta?: LogMeta) {
    if (this.isDevelopment) {
      this.log('debug', message, meta);
    }
  }

  private log(level: LogLevel, message: string, meta?: LogMeta) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(this.requestId && { requestId: this.requestId }),
      ...meta,
    };

    if (this.isDevelopment) {
      // Development: colorful console logs
      const prefix = `[${timestamp.slice(11, 23)}] [${level.toUpperCase().padEnd(5)}]`;
      const reqId = this.requestId ? ` [${this.requestId}]` : '';
      const logMessage = `${prefix}${reqId} ${message}`;

      switch (level) {
        case 'error':
          console.error(logMessage, meta || '');
          break;
        case 'warn':
          console.warn(logMessage, meta || '');
          break;
        case 'debug':
          console.debug(logMessage, meta || '');
          break;
        default:
          console.log(logMessage, meta || '');
      }
    } else {
      // Production: structured JSON logs
      console.log(JSON.stringify(logEntry));
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Helper for timing async operations
export async function withTiming<T>(
  label: string,
  operation: () => Promise<T>,
  meta?: LogMeta
): Promise<T> {
  logger.startTimer(label);
  try {
    const result = await operation();
    logger.endTimer(label, { ...meta, success: true });
    return result;
  } catch (error) {
    logger.endTimer(label, { ...meta, success: false });
    throw error;
  }
}
