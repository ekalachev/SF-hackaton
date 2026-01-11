import { useState, useEffect, useRef } from 'react';
import logger, { type LogEntry, type LogLevel, type LogCategory } from '../../lib/logger';

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
      setLogs((prev) => [...prev, log]);
    });

    // Load existing logs
    setLogs(logger.getLogs());

    return unsubscribe;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isCollapsed && logsEndRef.current?.scrollIntoView) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  // Keyboard shortcut to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsVisible((prev) => {
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
  const filteredLogs = logs.filter((log) => {
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

  // Don't render when explicitly hidden
  if (!isVisible) {
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
      <div
        className="flex items-center justify-between bg-gray-800 px-4 py-2 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-mono font-bold">DEBUG CONSOLE</span>
          <span className="text-gray-400 text-xs">
            ({filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'})
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
              <label htmlFor="level-filter" className="text-xs text-gray-400">
                Level:
              </label>
              <select
                id="level-filter"
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
              <label htmlFor="category-filter" className="text-xs text-gray-400">
                Category:
              </label>
              <select
                id="category-filter"
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
          <div
            className="overflow-y-auto bg-gray-900 px-4 py-2 font-mono text-xs"
            style={{ maxHeight: '300px' }}
          >
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No logs to display</div>
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
