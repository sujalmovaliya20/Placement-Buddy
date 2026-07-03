/**
 * Structured logger — replaces all console.log usage in the application.
 *
 * Outputs JSON in production for machine parsing and pretty-prints in development.
 * All backend code should import { logger } from this module instead of using console.
 */

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

class Logger {
  private readonly minLevel: number;
  private readonly isProd: boolean;

  constructor() {
    const configuredLevel = (process.env['LOG_LEVEL'] ?? 'info') as LogLevel;
    this.minLevel = LOG_LEVELS[configuredLevel] ?? LOG_LEVELS.info;
    this.isProd = process.env['NODE_ENV'] === 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    return (LOG_LEVELS[level] ?? 0) >= this.minLevel;
  }

  private formatEntry(level: LogLevel, context: Record<string, unknown>, message: string): string {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };

    if (this.isProd) {
      return JSON.stringify(entry);
    }

    const levelColors: Record<LogLevel, string> = {
      fatal: '\x1b[41m\x1b[37m',
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m',
      trace: '\x1b[90m',
    };

    const reset = '\x1b[0m';
    const color = levelColors[level] ?? '';
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';

    return `${color}[${level.toUpperCase()}]${reset} ${entry.timestamp} ${message}${contextStr}`;
  }

  private log(level: LogLevel, contextOrMessage: Record<string, unknown> | string, message?: string): void {
    if (!this.shouldLog(level)) return;

    let ctx: Record<string, unknown>;
    let msg: string;

    if (typeof contextOrMessage === 'string') {
      ctx = {};
      msg = contextOrMessage;
    } else {
      ctx = contextOrMessage;
      msg = message ?? '';
    }

    const formatted = this.formatEntry(level, ctx, msg);

    if (LOG_LEVELS[level]! >= LOG_LEVELS.error) {
      process.stderr.write(formatted + '\n');
    } else {
      process.stdout.write(formatted + '\n');
    }
  }

  fatal(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.log('fatal', contextOrMessage, message);
  }

  error(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.log('error', contextOrMessage, message);
  }

  warn(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.log('warn', contextOrMessage, message);
  }

  info(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.log('info', contextOrMessage, message);
  }

  debug(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.log('debug', contextOrMessage, message);
  }

  trace(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.log('trace', contextOrMessage, message);
  }
}

/** Singleton logger instance */
export const logger = new Logger();
