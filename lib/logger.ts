/**
 * Centralized logging utility for production-ready logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, meta?: LogMeta) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogMeta) {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | LogMeta, meta?: LogMeta) {
    if (error instanceof Error) {
      this.log('error', message, { ...meta, error: error.message, stack: error.stack });
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
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (this.isDevelopment) {
      // Development: colorful console logs
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
      const logEntry = {
        timestamp,
        level,
        message,
        ...meta,
      };
      
      // In production, send to external logging service (Sentry, Datadog, etc.)
      // For now, just output to console as JSON
      console.log(JSON.stringify(logEntry));
      
      // TODO: Integrate with Sentry or other logging service
      // if (level === 'error') {
      //   Sentry.captureException(new Error(message), { extra: meta });
      // }
    }
  }
}

export const logger = new Logger();
