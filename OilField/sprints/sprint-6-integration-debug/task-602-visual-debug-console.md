# Task 602: Add Visual Debug Console to Frontend

## References
- `sprints/sprint-6-integration-debug/task-601-logging-infrastructure.md` - Logger implementation
- `frontend/src/utils/logger.ts` - Frontend logger (from Task 601)
- `docs/MVP_SCOPE.md` - UI design guidelines

## Objective
Create an on-screen debug console component that displays real-time logs, API calls, and state information for debugging without needing browser DevTools.

## Acceptance Criteria
- [ ] Create collapsible debug panel component
- [ ] Display real-time logs from logger
- [ ] Filter logs by level (debug/info/warn/error) and category
- [ ] Show API request/response details
- [ ] Display component render counts
- [ ] Show current React Query cache state
- [ ] Draggable and resizable panel
- [ ] Toggle visibility with keyboard shortcut (Ctrl+` or Cmd+`)
- [ ] Clear logs button
- [ ] Export logs to file
- [ ] Persist visibility preference in localStorage
- [ ] Only available in development mode

## Implementation

### Debug Console Component

```typescript
// frontend/src/components/debug/DebugConsole.tsx
import { useState, useEffect, useRef } from 'react';
import { logger } from '../../utils/logger';
import type { LogEntry } from '../../utils/logger';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'api' | 'ui' | 'state' | 'performance' | 'system';

export function DebugConsole() {
  const [isVisible, setIsVisible] = useState(
    () => localStorage.getItem('debugConsoleVisible') === 'true'
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to logger updates
  useEffect(() => {
    const unsubscribe = logger.subscribe((log: LogEntry) => {
      setLogs(prev => [...prev, log]);
    });

    // Load existing logs
    setLogs(logger.getLogs());

    return unsubscribe;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isCollapsed) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  // Keyboard shortcut to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsVisible(prev => {
          const newValue = !prev;
          localStorage.setItem('debugConsoleVisible', String(newValue));
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    return true;
  });

  const handleClear = () => {
    logger.clear();
    setLogs([]);
  };

  const handleExport = () => {
    const logsText = JSON.stringify(logs, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible || process.env.NODE_ENV === 'production') {
    return null;
  }

  const levelColors: Record<LogLevel, string> = {
    debug: 'text-gray-400',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
  };

  const categoryIcons: Record<LogCategory, string> = {
    api: '🌐',
    ui: '🎨',
    state: '📦',
    performance: '⚡',
    system: '⚙️',
  };

  return (
    <div
      className="fixed bottom-0 right-0 w-full md:w-3/4 lg:w-1/2 bg-gray-900 text-white shadow-2xl z-50 border-t-2 border-emerald-500"
      style={{ maxHeight: isCollapsed ? '40px' : '400px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 cursor-pointer"
           onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-mono font-bold">DEBUG CONSOLE</span>
          <span className="text-gray-400 text-xs">
            ({filteredLogs.length} logs)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Ctrl/Cmd + `</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="text-gray-400 hover:text-white"
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 border-t border-gray-700">
            {/* Level filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Level:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
              >
                <option value="all">All</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as LogCategory | 'all')}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
              >
                <option value="all">All</option>
                <option value="api">API</option>
                <option value="ui">UI</option>
                <option value="state">State</option>
                <option value="performance">Performance</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleClear}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded border border-gray-600"
              >
                Clear
              </button>
              <button
                onClick={handleExport}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 px-3 py-1 rounded"
              >
                Export
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="overflow-y-auto bg-gray-900 px-4 py-2 font-mono text-xs"
               style={{ maxHeight: '300px' }}>
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No logs to display
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`py-1 border-b border-gray-800 ${levelColors[log.level]}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span>{categoryIcons[log.category]}</span>
                    <span className="font-bold uppercase">{log.level}</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                  {log.context && (
                    <div className="ml-24 mt-1 text-gray-400">
                      {JSON.stringify(log.context, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </>
      )}
    </div>
  );
}
```

### Update Logger Types

```typescript
// frontend/src/utils/logger.ts (add export for LogEntry type)
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'api' | 'ui' | 'state' | 'performance' | 'system';
```

### Integration into App

```typescript
// frontend/src/App.tsx
import { DebugConsole } from './components/debug/DebugConsole';

function App() {
  return (
    <>
      {/* Existing app components */}
      <MapView />
      {/* ... other components ... */}

      {/* Debug Console - only in development */}
      {import.meta.env.DEV && <DebugConsole />}
    </>
  );
}
```

### Enhanced Logging in Components

```typescript
// Example: Add logging to MapView component
// frontend/src/components/map/MapView.tsx
import logger from '../../utils/logger';

export function MapView() {
  useEffect(() => {
    logger.info('ui', 'MapView mounted');
    return () => {
      logger.info('ui', 'MapView unmounted');
    };
  }, []);

  // Log when wells are loaded
  useEffect(() => {
    if (wells) {
      logger.info('state', `Wells loaded: ${wells.length} wells`);
    }
  }, [wells]);

  // Log marker clicks
  const handleMarkerClick = (wellId: string) => {
    logger.debug('ui', `Well marker clicked: ${wellId}`);
    // ... existing click logic
  };

  // ...
}
```

### React Query DevTools Integration

```typescript
// frontend/src/components/debug/ReactQueryInfo.tsx
import { useQueryClient } from '@tanstack/react-query';
import logger from '../../utils/logger';

export function useQueryLogger() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cache = queryClient.getQueryCache();

    const unsubscribe = cache.subscribe(() => {
      const queries = cache.getAll();
      logger.debug('state', 'React Query cache updated', {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.state.status === 'loading').length,
        stalQueries: queries.filter(q => q.isStale()).length,
      });
    });

    return unsubscribe;
  }, [queryClient]);
}
```

## Verification

### Unit Tests

```typescript
// frontend/src/components/debug/DebugConsole.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DebugConsole } from './DebugConsole';
import logger from '../../utils/logger';

describe('DebugConsole', () => {
  beforeEach(() => {
    logger.clear();
    localStorage.clear();
  });

  it('should not render in production mode', () => {
    process.env.NODE_ENV = 'production';
    const { container } = render(<DebugConsole />);
    expect(container.firstChild).toBeNull();
  });

  it('should render logs from logger', () => {
    logger.info('system', 'Test log message');
    render(<DebugConsole />);

    expect(screen.getByText('Test log message')).toBeInTheDocument();
  });

  it('should filter logs by level', () => {
    logger.info('system', 'Info message');
    logger.error('system', 'Error message');

    render(<DebugConsole />);

    const levelSelect = screen.getByLabelText(/level/i);
    fireEvent.change(levelSelect, { target: { value: 'error' } });

    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should clear logs when clear button clicked', () => {
    logger.info('system', 'Test message');
    render(<DebugConsole />);

    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);

    expect(screen.getByText(/no logs to display/i)).toBeInTheDocument();
  });

  it('should toggle collapse on header click', () => {
    logger.info('system', 'Test message');
    const { container } = render(<DebugConsole />);

    const header = container.querySelector('.cursor-pointer');
    fireEvent.click(header!);

    // Panel should be collapsed
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });
});
```

### Manual Testing

1. **Start Development Server**
```bash
cd frontend
npm run dev
```

2. **Open Application**
   - Navigate to http://localhost:5173
   - Debug console should appear at bottom of screen

3. **Test Visibility Toggle**
   - Press Ctrl+` (Windows/Linux) or Cmd+` (Mac)
   - Console should toggle visibility
   - Preference should persist in localStorage

4. **Test Log Filtering**
   - Generate various log entries by interacting with the app
   - Use level filter dropdown to filter by error/warn/info/debug
   - Use category filter to filter by api/ui/state/performance/system

5. **Test Log Export**
   - Click "Export" button
   - Should download JSON file with all logs
   - Verify file content is valid JSON

6. **Test Real-time Updates**
   - Keep console open
   - Click on well markers
   - Should see API logs appear in real-time
   - Should see UI interaction logs

7. **Test Auto-scroll**
   - Generate many logs (click around repeatedly)
   - Console should auto-scroll to show latest logs

## Visual Example

The debug console will look like this:

```
┌─────────────────────────────────────────────────────────────┐
│ DEBUG CONSOLE (42 logs)                      Ctrl/Cmd + ` ▼ │
├─────────────────────────────────────────────────────────────┤
│ Level: [All ▼]  Category: [All ▼]        [Clear] [Export]  │
├─────────────────────────────────────────────────────────────┤
│ 14:23:45 ⚙️  INFO     Application mounted                   │
│ 14:23:46 🌐 INFO     API Request: GET /api/wells           │
│ 14:23:46 🌐 INFO     API Response: GET /api/wells          │
│                      { status: 200, duration: "234ms" }     │
│ 14:23:48 🎨 DEBUG    Well marker clicked: well-123         │
│ 14:23:48 🌐 INFO     API Request: GET /api/wells/well-123  │
│ 14:23:49 📦 INFO     Wells loaded: 25 wells                │
│ 14:23:49 ⚡ DEBUG    API call: 187ms                        │
└─────────────────────────────────────────────────────────────┘
```

## Success Criteria
- [ ] Debug console visible in development mode
- [ ] Keyboard shortcut (Ctrl/Cmd + `) toggles visibility
- [ ] Real-time log updates display correctly
- [ ] Level and category filters work
- [ ] Clear button clears all logs
- [ ] Export button downloads JSON file
- [ ] Auto-scroll to latest logs
- [ ] Collapse/expand functionality works
- [ ] localStorage persists visibility preference
- [ ] Not rendered in production build
- [ ] All unit tests passing

## Commit Message
```bash
git add frontend/src/components/debug/DebugConsole.tsx frontend/src/App.tsx
git commit -m "feat(debug): Add visual debug console to frontend

- Create collapsible debug panel component
- Display real-time logs with filtering
- Add keyboard shortcut (Ctrl/Cmd + `)
- Implement log export functionality
- Add level and category filters
- Include auto-scroll and collapse features
- Only visible in development mode
- Add comprehensive unit tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
25 minutes

## Dependencies
- Task 601 must be completed first (logger infrastructure)
- React (already installed)
- TailwindCSS (already configured)
