# Task 601: Implement Comprehensive Logging Infrastructure

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Backend architecture lines 401-738
- `backend/src/server.ts` - Express server setup
- `frontend/src/lib/api.ts` - API client

## Objective
Implement structured logging in both frontend and backend to facilitate debugging and monitoring of the application.

## Acceptance Criteria

### Backend Logging
- [ ] Install Winston logger: `cd backend && npm install winston winston-daily-rotate-file`
- [ ] Create `src/utils/logger.ts` with Winston configuration
- [ ] Log levels: error, warn, info, http, debug
- [ ] Request/response middleware logging
- [ ] API endpoint logging (entry/exit with timing)
- [ ] Database query logging
- [ ] Error logging with stack traces
- [ ] Log files in `backend/logs/` directory
- [ ] Daily log rotation
- [ ] Console logs in development, file logs in production

### Frontend Logging
- [ ] Create `frontend/src/utils/logger.ts` with console logger
- [ ] Log levels: error, warn, info, debug
- [ ] API request/response logging
- [ ] Component lifecycle logging (mount/unmount/render)
- [ ] User action logging (clicks, navigation)
- [ ] Error boundary logging
- [ ] State changes logging
- [ ] Performance timing logs
- [ ] Structured log format with timestamps and context

### Log Format
Both frontend and backend should use consistent format:
```typescript
{
  timestamp: ISO8601,
  level: 'info' | 'warn' | 'error' | 'debug',
  category: 'api' | 'db' | 'ui' | 'auth' | 'system',
  message: string,
  context: object,
  duration?: number,
  userId?: string,
  requestId?: string
}
```

## Implementation

### Backend Winston Logger

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    }),
    // File transport for all logs
    new DailyRotateFile({
      dirname: path.join(__dirname, '../../logs'),
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Separate file for errors
    new DailyRotateFile({
      dirname: path.join(__dirname, '../../logs'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: Record<string, unknown>
) => {
  logger.http('API Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...context,
  });
};

export const logError = (
  message: string,
  error: Error,
  context?: Record<string, unknown>
) => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logInfo = (
  category: string,
  message: string,
  context?: Record<string, unknown>
) => {
  logger.info(message, { category, ...context });
};

export const logDebug = (
  category: string,
  message: string,
  context?: Record<string, unknown>
) => {
  logger.debug(message, { category, ...context });
};

export default logger;
```

### Backend Request Logging Middleware

```typescript
// backend/src/middleware/logging.ts
import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req.method, req.url, res.statusCode, duration, {
      query: req.query,
      params: req.params,
      ip: req.ip,
    });
  });

  next();
};
```

### Frontend Logger

```typescript
// frontend/src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'api' | 'ui' | 'state' | 'performance' | 'system';

interface LogEntry {
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

  private log(level: LogLevel, category: LogCategory, message: string, context?: Record<string, unknown>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners (for debug console)
    this.listeners.forEach(listener => listener(logEntry));

    // Console output
    const consoleMethod = level === 'debug' ? 'log' : level;
    const prefix = `[${logEntry.timestamp}] [${category.toUpperCase()}]`;
    console[consoleMethod](
      `${prefix} ${message}`,
      context ? context : ''
    );
  }

  debug(category: LogCategory, message: string, context?: Record<string, unknown>) {
    this.log('debug', category, message, context);
  }

  info(category: LogCategory, message: string, context?: Record<string, unknown>) {
    this.log('info', category, message, context);
  }

  warn(category: LogCategory, message: string, context?: Record<string, unknown>) {
    this.log('warn', category, message, context);
  }

  error(category: LogCategory, message: string, context?: Record<string, unknown>) {
    this.log('error', category, message, context);
  }

  // API request logging
  logApiRequest(method: string, url: string) {
    this.info('api', `API Request: ${method} ${url}`);
  }

  logApiResponse(method: string, url: string, status: number, duration: number) {
    this.info('api', `API Response: ${method} ${url}`, { status, duration: `${duration}ms` });
  }

  logApiError(method: string, url: string, error: Error) {
    this.error('api', `API Error: ${method} ${url}`, { error: error.message });
  }

  // Performance logging
  logPerformance(metric: string, value: number, unit: string) {
    this.debug('performance', `${metric}: ${value}${unit}`);
  }

  // Get all logs (for debug console)
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Subscribe to log updates
  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Clear logs
  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
export default logger;
```

### Enhanced API Client with Logging

```typescript
// frontend/src/lib/api.ts (add logging)
import logger from '../utils/logger';

// Wrap fetch calls with logging
async function fetchWithLogging(url: string, options?: RequestInit) {
  const startTime = performance.now();
  const method = options?.method || 'GET';

  logger.logApiRequest(method, url);

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    logger.logApiResponse(method, url, response.status, duration);
    logger.logPerformance('API call', duration, 'ms');

    return response;
  } catch (error) {
    logger.logApiError(method, url, error as Error);
    throw error;
  }
}
```

## Verification

### Backend Logging Tests

```typescript
// backend/src/utils/logger.test.ts
import logger, { logInfo, logError, logRequest } from './logger';

describe('Logger', () => {
  it('should log info messages', () => {
    logInfo('system', 'Test info message', { detail: 'test' });
    // Manual verification: check logs/application-*.log
  });

  it('should log errors with stack traces', () => {
    const error = new Error('Test error');
    logError('Test error message', error, { context: 'test' });
    // Manual verification: check logs/error-*.log
  });

  it('should log API requests', () => {
    logRequest('GET', '/api/wells', 200, 150, { query: { limit: 10 } });
    // Manual verification: check console output
  });
});
```

### Frontend Logging Tests

```typescript
// frontend/src/utils/logger.test.ts
import { logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clear();
  });

  it('should log messages and store them', () => {
    logger.info('ui', 'Test message', { detail: 'test' });
    const logs = logger.getLogs();

    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].category).toBe('ui');
    expect(logs[0].message).toBe('Test message');
  });

  it('should notify subscribers when logging', () => {
    const mockListener = vi.fn();
    logger.subscribe(mockListener);

    logger.info('system', 'Test notification');

    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Test notification',
      })
    );
  });

  it('should limit log history', () => {
    for (let i = 0; i < 1100; i++) {
      logger.debug('system', `Message ${i}`);
    }

    expect(logger.getLogs()).toHaveLength(1000);
  });
});
```

### Manual Verification

```bash
# Backend logging verification
cd backend
npm test -- logger.test.ts

# Start server and check logs
npm run dev

# Make API request
curl http://localhost:3001/api/wells

# Check log files
cat logs/application-$(date +%Y-%m-%d).log | tail -20

# Frontend logging verification
cd frontend
npm test -- logger.test.ts

# Start dev server and open browser console
npm run dev
# Navigate to http://localhost:5173
# Open DevTools Console - should see structured logs
```

## Integration

### Update Backend Server

```typescript
// backend/src/server.ts
import { requestLoggingMiddleware } from './middleware/logging';
import logger, { logInfo } from './utils/logger';

// Add logging middleware
app.use(requestLoggingMiddleware);

// Log server startup
app.listen(PORT, () => {
  logInfo('system', `Server started`, { port: PORT, env: process.env.NODE_ENV });
});
```

### Update Frontend App

```typescript
// frontend/src/App.tsx
import { useEffect } from 'react';
import logger from './utils/logger';

function App() {
  useEffect(() => {
    logger.info('system', 'Application mounted');

    return () => {
      logger.info('system', 'Application unmounted');
    };
  }, []);

  // ... rest of app
}
```

## Success Criteria
- [ ] Backend Winston logger configured and working
- [ ] Backend logs appear in `backend/logs/` directory
- [ ] API requests/responses logged with timing
- [ ] Frontend logger captures all log levels
- [ ] Frontend logs visible in browser console
- [ ] API client automatically logs requests/responses
- [ ] Error boundaries log errors
- [ ] All tests passing
- [ ] Log files rotate daily
- [ ] Performance timing captured

## Commit Message
```bash
git add backend/src/utils/logger.ts backend/src/middleware/logging.ts frontend/src/utils/logger.ts
git commit -m "feat(logging): Implement comprehensive logging infrastructure

- Add Winston logger to backend with daily rotation
- Add request/response logging middleware
- Create frontend logger with log history
- Add API request/response logging
- Add performance timing logs
- Include structured log format
- Add unit tests for logging utilities

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
30 minutes

## Dependencies
- `winston` - Backend logging library
- `winston-daily-rotate-file` - Log rotation
- Frontend logger is custom (no dependencies)
