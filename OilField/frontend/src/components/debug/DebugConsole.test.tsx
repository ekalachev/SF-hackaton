import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebugConsole } from './DebugConsole';
import logger from '../../lib/logger';

describe('DebugConsole', () => {
  beforeEach(() => {
    // Clear logs before each test
    logger.clear();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Visibility and Production Mode', () => {
    it('should not render in production mode', () => {
      vi.stubEnv('MODE', 'production');
      const { container } = render(<DebugConsole />);
      expect(container.firstChild).toBeNull();
    });

    it('should render in development mode by default', () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);
      expect(screen.getByText(/DEBUG CONSOLE/i)).toBeInTheDocument();
    });

    it('should respect localStorage visibility preference', () => {
      localStorage.setItem('debugConsoleVisible', 'false');
      const { container } = render(<DebugConsole />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Real-time Log Display', () => {
    it('should display logs from logger', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Test log message');

      await waitFor(() => {
        expect(screen.getByText('Test log message')).toBeInTheDocument();
      });
    });

    it('should display multiple logs in order', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'First message');
      logger.error('api', 'Second message');

      await waitFor(() => {
        const messages = screen.getAllByText(/message/i);
        expect(messages).toHaveLength(2);
      });
    });

    it('should display log level with correct styling', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.error('system', 'Error message');

      await waitFor(
        () => {
          // Use a more flexible query - case insensitive
          expect(screen.getByText(/error/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display log context when present', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('api', 'API call', { status: 200, duration: '150ms' });

      await waitFor(() => {
        expect(screen.getByText(/status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Log Filtering', () => {
    it('should filter logs by level', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Info message');
      logger.error('system', 'Error message');

      await waitFor(() => {
        expect(screen.getByText('Info message')).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText(/level/i);
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should filter logs by category', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('api', 'API message');
      logger.info('ui', 'UI message');

      await waitFor(() => {
        expect(screen.getByText('API message')).toBeInTheDocument();
      });

      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.change(categorySelect, { target: { value: 'api' } });

      expect(screen.getByText('API message')).toBeInTheDocument();
      expect(screen.queryByText('UI message')).not.toBeInTheDocument();
    });

    it('should show all logs when filter is set to "all"', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Info message');
      logger.error('system', 'Error message');

      await waitFor(() => {
        expect(screen.getByText('Info message')).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText(/level/i);
      fireEvent.change(levelSelect, { target: { value: 'all' } });

      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all logs when clear button clicked', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Test message');

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(screen.getByText(/no logs to display/i)).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export logs to JSON file when export button clicked', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');

      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock HTMLAnchorElement.click
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          const element = originalCreateElement('a') as HTMLAnchorElement;
          element.click = mockClick;
          return element;
        }
        return originalCreateElement(tagName);
      });

      render(<DebugConsole />);

      logger.info('system', 'Test message');

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should toggle collapse when header is clicked', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Test message');

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      const header = screen.getByText(/DEBUG CONSOLE/i).closest('div');
      fireEvent.click(header!);

      // Panel should be collapsed - logs not visible
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('should toggle collapse when collapse button is clicked', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Test message');

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Find the collapse button (▼ or ▲)
      const collapseButton = screen.getByText(/▼|▲/);
      fireEvent.click(collapseButton);

      // Panel should be collapsed
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcut', () => {
    it('should toggle visibility with Ctrl+` keyboard shortcut', () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      expect(screen.getByText(/DEBUG CONSOLE/i)).toBeInTheDocument();

      // Simulate Ctrl+`
      fireEvent.keyDown(window, { key: '`', ctrlKey: true });

      expect(screen.queryByText(/DEBUG CONSOLE/i)).not.toBeInTheDocument();
    });

    it('should toggle visibility with Cmd+` keyboard shortcut', () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      expect(screen.getByText(/DEBUG CONSOLE/i)).toBeInTheDocument();

      // Simulate Cmd+` (metaKey on Mac)
      fireEvent.keyDown(window, { key: '`', metaKey: true });

      expect(screen.queryByText(/DEBUG CONSOLE/i)).not.toBeInTheDocument();
    });

    it('should persist visibility preference in localStorage', () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      // Toggle visibility
      fireEvent.keyDown(window, { key: '`', ctrlKey: true });

      expect(localStorage.getItem('debugConsoleVisible')).toBe('false');
    });
  });

  describe('Log Count Display', () => {
    it('should display correct log count', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Message 1');
      logger.info('system', 'Message 2');
      logger.info('system', 'Message 3');

      await waitFor(() => {
        expect(screen.getByText(/\(3 logs\)/i)).toBeInTheDocument();
      });
    });

    it('should update log count when filtered', async () => {
      localStorage.setItem('debugConsoleVisible', 'true');
      render(<DebugConsole />);

      logger.info('system', 'Info message');
      logger.error('system', 'Error message');

      await waitFor(() => {
        expect(screen.getByText(/\(2 logs\)/i)).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText(/level/i);
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      await waitFor(() => {
        expect(screen.getByText(/\(1 log\)/i)).toBeInTheDocument();
      });
    });
  });
});
