# Task 703: Implement Style Switching in MapView Component

## Status
- **Priority**: High
- **Time**: 1.5 hours
- **Depends On**: Tasks 701, 702

## Objective
Add theme switching logic to MapView.tsx with custom layer preservation.

## Key Changes

### MapView.tsx Updates
1. Import `useMapTheme` store
2. Subscribe to theme changes with `useEffect`
3. Add `style.load` event listener
4. Call `map.setStyle()` when theme changes
5. Ensure `addWellsLayer()` is called after style loads

## Critical Code Sections

### Theme Subscription
```typescript
const { theme } = useMapTheme();

useEffect(() => {
  if (!map.current) return;
  
  const newStyleURL = getMapStyleURL(theme);
  logger.info('ui', `Switching map style to ${theme}`);
  map.current.setStyle(newStyleURL);
}, [theme]);
```

### Style Load Handler
```typescript
// Add AFTER initial 'load' event (line 94)
map.current.on('style.load', () => {
  logger.info('ui', 'Map style changed, restoring custom layers');
  addWellsLayer();
});
```

## Acceptance Criteria
- [ ] Theme changes trigger style switch
- [ ] Custom layers preserved after switch
- [ ] Well markers reload correctly
- [ ] No console errors
- [ ] <500ms switch time

## Testing
- Integration tests for theme switching
- Verify layers persist after switch
- Test error handling
