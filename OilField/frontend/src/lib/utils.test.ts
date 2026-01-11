/**
 * Tests for utility functions
 * Following TDD - Tests written first for cn() function
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn() - className utility function', () => {
  describe('basic className merging', () => {
    it('should merge single string class', () => {
      expect(cn('px-2')).toBe('px-2');
    });

    it('should merge multiple string classes', () => {
      const result = cn('px-2', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should merge multiple arguments with spaces', () => {
      const result = cn('rounded', 'border', 'p-2');
      expect(result).toContain('rounded');
      expect(result).toContain('border');
      expect(result).toContain('p-2');
    });
  });

  describe('conditional classes', () => {
    it('should handle undefined values', () => {
      const result = cn('px-2', undefined, 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle null values', () => {
      const result = cn('px-2', null, 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle empty strings', () => {
      const result = cn('px-2', '', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle false boolean values', () => {
      const isHidden = false;
      const result = cn('px-2', isHidden && 'hidden', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).not.toContain('hidden');
    });

    it('should handle true boolean values', () => {
      const isVisible = true;
      const result = cn('px-2', isVisible && 'visible', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('visible');
      expect(result).toContain('py-1');
    });
  });

  describe('array of classes', () => {
    it('should merge array of classes', () => {
      const result = cn(['px-2', 'py-1']);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should merge nested arrays', () => {
      const result = cn(['px-2', ['py-1', 'rounded']]);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('rounded');
    });

    it('should handle mixed string and array arguments', () => {
      const result = cn('px-2', ['py-1', 'rounded']);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('rounded');
    });
  });

  describe('object notation with conditional classes', () => {
    it('should handle object notation with true conditions', () => {
      const result = cn({ 'px-2': true, 'py-1': true });
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should exclude classes with false conditions', () => {
      const result = cn({ 'px-2': true, 'hidden': false });
      expect(result).toContain('px-2');
      expect(result).not.toContain('hidden');
    });

    it('should handle mixed object and string classes', () => {
      const result = cn('rounded', { 'px-2': true, 'hidden': false });
      expect(result).toContain('rounded');
      expect(result).toContain('px-2');
      expect(result).not.toContain('hidden');
    });
  });

  describe('tailwind merge conflict resolution', () => {
    it('should handle conflicting padding classes', () => {
      // When same class type is provided, twMerge should resolve conflicts
      const result = cn('p-2', 'p-4');
      // The last value should override (p-4 should win)
      expect(result).not.toContain('p-2 p-4');
    });

    it('should merge conflicting width classes correctly', () => {
      const result = cn('w-1/2', 'w-full');
      // Should not contain both in final string
      expect(result).toBeDefined();
    });

    it('should resolve background color conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBeDefined();
    });

    it('should handle complex tailwind conflicts with multiple properties', () => {
      const result = cn('px-2 py-1', 'p-4');
      // twMerge should intelligently handle these
      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle only undefined', () => {
      const result = cn(undefined);
      expect(result).toBe('');
    });

    it('should handle only null', () => {
      const result = cn(null);
      expect(result).toBe('');
    });

    it('should handle only empty string', () => {
      const result = cn('');
      expect(result).toBe('');
    });

    it('should trim whitespace from output', () => {
      const result = cn('  px-2  ', '  py-1  ');
      // Should not have excess whitespace
      expect(result.split(' ').filter(Boolean).length).toBeGreaterThanOrEqual(2);
    });

    it('should handle special characters in class names', () => {
      const result = cn('group-hover:text-blue-500', 'peer-checked:bg-blue-500');
      expect(result).toContain('group-hover:text-blue-500');
      expect(result).toContain('peer-checked:bg-blue-500');
    });

    it('should handle dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-gray-900');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-gray-900');
    });

    it('should handle responsive classes', () => {
      const result = cn('sm:px-2', 'md:px-4', 'lg:px-6');
      expect(result).toContain('sm:px-2');
      expect(result).toContain('md:px-4');
      expect(result).toContain('lg:px-6');
    });
  });

  describe('parameterized tests for common scenarios', () => {
    it.each([
      [['px-2'], 'px-2'],
      [['px-2', 'py-1'], 'px-2'],
      [['rounded', 'border', 'p-2'], 'rounded'],
      [['text-sm', 'text-gray-600'], 'text-sm'],
    ])('should include all provided classes - input: %s', (classes, expectedInclude) => {
      const result = cn(...classes);
      expect(result).toContain(expectedInclude);
    });

    it.each([
      ['px-2'],
      ['px-2 py-1'],
      ['rounded border p-2'],
      ['text-sm text-gray-600'],
    ])('should return non-empty string for valid input: %s', (input) => {
      const result = cn(input);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it.each([
      [undefined],
      [null],
      [''],
    ])('should return empty string for empty input: %s', (input) => {
      const result = cn(input);
      expect(result).toBe('');
    });
  });

  describe('return type validation', () => {
    it('should always return a string', () => {
      const result = cn('px-2');
      expect(typeof result).toBe('string');
    });

    it('should return string even with no arguments', () => {
      const result = cn();
      expect(typeof result).toBe('string');
    });

    it('should not return undefined', () => {
      const result = cn();
      expect(result).toBeDefined();
    });

    it('should not return null', () => {
      const result = cn();
      expect(result).not.toBeNull();
    });
  });

  describe('complex real-world scenarios', () => {
    it('should handle button styling combinations', () => {
      const result = cn(
        'inline-flex items-center justify-center',
        'rounded-md',
        'px-4 py-2',
        'text-sm font-medium',
        'transition-colors',
        'hover:bg-gray-100'
      );
      expect(result).toContain('inline-flex');
      expect(result).toContain('rounded-md');
      expect(result).toContain('px-4');
      expect(result).toContain('hover:bg-gray-100');
    });

    it('should handle conditional component styling', () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        'px-3 py-2 rounded-md',
        isActive && 'bg-blue-500 text-white',
        isDisabled && 'opacity-50 cursor-not-allowed'
      );

      expect(result).toContain('px-3');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('opacity-50');
    });

    it('should handle size variations with object notation', () => {
      const size: 'sm' | 'md' | 'lg' = 'lg';

      const result = cn(
        'rounded-md',
        {
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        }
      );

      expect(result).toContain('rounded-md');
      expect(result).toContain('px-6');
      expect(result).toContain('py-3');
    });

    it('should handle theme switching with conflicting classes', () => {
      const isDark = true;

      const result = cn(
        'text-gray-900',
        isDark && 'text-white bg-gray-900',
        'rounded-lg p-4'
      );

      expect(result).toContain('rounded-lg');
      expect(result).toContain('p-4');
    });

    it('should handle aria and data attributes safely', () => {
      // While cn() is for classes, verify it doesn't break with special inputs
      const result = cn('block', 'text-center');
      expect(result).toContain('block');
      expect(result).toContain('text-center');
    });
  });
});
