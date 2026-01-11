/**
 * MapThemeToggle Component Tests
 * Following TDD methodology - these tests should FAIL initially
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapThemeToggle } from './MapThemeToggle';
import { useMapTheme } from '@/stores/mapThemeStore';

// Mock the mapThemeStore
vi.mock('@/stores/mapThemeStore', () => ({
  useMapTheme: vi.fn(),
}));

describe('MapThemeToggle', () => {
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDefined();
    });

    it('should show Sun icon when theme is dark', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDefined();
      // Sun icon should be present (aria-label should mention switching to light)
      expect(button.getAttribute('aria-label')).toContain('light');
    });

    it('should show Moon icon when theme is light', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDefined();
      // Moon icon should be present (aria-label should mention switching to dark)
      expect(button.getAttribute('aria-label')).toContain('dark');
    });
  });

  describe('Interaction', () => {
    it('should call toggleTheme when clicked', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      render(<MapThemeToggle />);

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Assert
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      render(<MapThemeToggle />);

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      expect(mockToggleTheme).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA label for dark theme', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
    });

    it('should have correct ARIA label for light theme', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    });

    it('should have title attribute for tooltip (dark theme)', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      const title = button.getAttribute('title');
      expect(title).toBeDefined();
      expect(title).toContain('dark');
      expect(title).toContain('switch');
    });

    it('should have title attribute for tooltip (light theme)', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act
      render(<MapThemeToggle />);

      // Assert
      const button = screen.getByRole('button');
      const title = button.getAttribute('title');
      expect(title).toBeDefined();
      expect(title).toContain('light');
      expect(title).toContain('switch');
    });

    it('should be keyboard accessible', () => {
      // Arrange
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      render(<MapThemeToggle />);

      // Act
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      // Assert - button should be focusable and activatable via keyboard
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Theme State Integration', () => {
    it('should respond to theme changes from store', () => {
      // Arrange - start with dark theme
      const { rerender } = render(
        <MapThemeToggle />
      );

      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act - simulate theme change in store
      rerender(<MapThemeToggle />);
      let button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('light');

      // Change to light theme
      vi.mocked(useMapTheme).mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
        resetTheme: vi.fn(),
      });

      // Act - rerender with new theme
      rerender(<MapThemeToggle />);

      // Assert - should now show dark mode switch
      button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('dark');
    });
  });
});
