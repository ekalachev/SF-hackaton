/**
 * Frontend Logger with log history and categories
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'api' | 'ui' | 'state' | 'performance' | 'system';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: Array<(log: LogEntry) => void> = [];

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
    };

    // Add to log history
    this.logs.push(logEntry);

    // Maintain max log limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify subscribers (for debug console)
    this.listeners.forEach((listener) => listener(logEntry));

    // Console output
    const consoleMethod = level === 'debug' ? 'log' : level;
    const prefix = `[${logEntry.timestamp}] [${category.toUpperCase()}]`;
    console[consoleMethod](
      `${prefix} ${message}`,
      context ? context : ''
    );
  }

  /**
   * Log debug message
   */
  debug(
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log('debug', category, message, context);
  }

  /**
   * Log info message
   */
  info(
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log('info', category, message, context);
  }

  /**
   * Log warning message
   */
  warn(
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log('warn', category, message, context);
  }

  /**
   * Log error message
   */
  error(
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log('error', category, message, context);
  }

  /**
   * Log API request
   */
  logApiRequest(method: string, url: string): void {
    this.info('api', `API Request: ${method} ${url}`);
  }

  /**
   * Log API response with timing
   */
  logApiResponse(
    method: string,
    url: string,
    status: number,
    duration: number
  ): void {
    this.info('api', `API Response: ${method} ${url}`, {
      status,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log API error
   */
  logApiError(method: string, url: string, error: Error): void {
    this.error('api', `API Error: ${method} ${url}`, {
      error: error.message,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, value: number, unit: string): void {
    this.debug('performance', `${metric}: ${value}${unit}`);
  }

  /**
   * Get all logs (returns a copy)
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Subscribe to log updates
   * Returns unsubscribe function
   */
  subscribe(listener: (log: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
