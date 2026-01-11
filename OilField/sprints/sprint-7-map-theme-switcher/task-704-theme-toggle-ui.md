# Task 704: Create Theme Toggle UI Component

## Status
- **Priority**: Medium
- **Time**: 1 hour
- **Depends On**: Task 702

## Objective
Create reusable theme toggle button component with smooth UX.

## Component Specification

### File: `frontend/src/components/map/MapThemeToggle.tsx`
```typescript
import { Sun, Moon } from 'lucide-react';
import { useMapTheme } from '@/stores/mapThemeStore';

export function MapThemeToggle() {
  const { theme, toggleTheme } = useMapTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Current: ${theme} mode. Click to switch.`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-blue-700" />
      )}
    </button>
  );
}
```

### MapView Integration
Add button in top-right corner:
```typescript
<div className="absolute top-4 right-4 z-10">
  <MapThemeToggle />
</div>
```

## Acceptance Criteria
- [ ] Button appears in top-right
- [ ] Icon changes based on theme
- [ ] Click toggles theme
- [ ] Smooth hover effects
- [ ] Accessible (ARIA labels)
- [ ] Mobile-friendly touch target

## Testing
- Unit tests for toggle interaction
- Accessibility testing
- Visual regression tests
