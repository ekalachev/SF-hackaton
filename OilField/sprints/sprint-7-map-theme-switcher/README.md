# Sprint 7: Map Theme Switcher with Persistent Storage

## Overview

Implement dark/light mode theme switching for the Mapbox map with persistent user preferences stored in browser storage.

## Goals

1. **Runtime Theme Switching**: Enable users to switch between dark and light map styles
2. **State Persistence**: Store theme preference in browser storage (localStorage initially, IndexedDB-ready)
3. **Custom Layer Preservation**: Maintain well markers, clusters, and custom pins when switching themes
4. **Professional UI**: Add intuitive theme toggle button with smooth transitions
5. **Type Safety**: Full TypeScript support with runtime validation
6. **Comprehensive Testing**: Unit tests, integration tests, and E2E tests

## Sprint Scope

### In Scope
- ✅ Dark/light theme switching for Mapbox map
- ✅ Zustand store with localStorage persistence middleware
- ✅ Theme toggle UI component with keyboard shortcuts
- ✅ Preservation of custom layers/sources on theme change
- ✅ System theme detection (prefers-color-scheme)
- ✅ Smooth transitions and loading states
- ✅ Full test coverage (unit + integration + E2E)
- ✅ Documentation and code examples

### Out of Scope
- ❌ App-wide dark mode (only map theming)
- ❌ Custom theme creation in UI
- ❌ Multiple map style options (streets, satellite) - future enhancement
- ❌ IndexedDB implementation (prepared for, but localStorage first)

## Architecture Decisions

### Storage Strategy
**Selected**: Zustand with localStorage middleware

**Rationale**:
- Already using Zustand (v4.4) in project
- localStorage perfect for single preference value
- Synchronous access prevents theme flash on load
- Easy to migrate to IndexedDB later via storage engine swap
- Built-in TypeScript support

### Theme Switching Approach
**Method**: Mapbox `setStyle()` with `style.load` event handling

**Why**:
- Native Mapbox API support
- Clean separation of concerns
- Existing `addWellsLayer()` function is already reusable
- Minimal changes to current codebase

## Technical Approach

### Map Style Switching Flow
```
User clicks toggle
  ↓
Update Zustand store (persists to localStorage)
  ↓
Call map.setStyle(newStyleURL)
  ↓
Mapbox fires 'style.load' event
  ↓
Re-add custom layers via existing addWellsLayer()
  ↓
Wells markers restored with correct pin images
```

### Critical Implementation Details

1. **Custom Layer Preservation**
   - Problem: `setStyle()` removes all custom sources/layers
   - Solution: Listen to `style.load` event, re-run `addWellsLayer()`
   - Benefit: Our existing code already handles this perfectly!

2. **Image Reloading**
   - Custom pin images (`well-pin`, `well-pin-selected`) must be reloaded
   - Already handled in `addWellsLayer()` Promise.all() pattern

3. **Data Persistence**
   - Well data stored in `wellsData.current` ref (line 25, 43 in MapView.tsx)
   - Survives style changes automatically

## Tasks

| Task | Description | Priority | Estimated Time |
|------|-------------|----------|----------------|
| [701](./task-701-map-style-constants.md) | Define map style constants and types | High | 30 min |
| [702](./task-702-zustand-theme-store.md) | Create Zustand theme store with localStorage | High | 1 hour |
| [703](./task-703-style-switching-logic.md) | Implement style switching in MapView | High | 1.5 hours |
| [704](./task-704-theme-toggle-ui.md) | Create theme toggle UI component | Medium | 1 hour |
| [705](./task-705-system-theme-detection.md) | Add system theme detection | Medium | 45 min |
| [706](./task-706-keyboard-shortcuts.md) | Implement keyboard shortcuts | Low | 30 min |
| [707](./task-707-unit-tests.md) | Write unit tests for theme store | High | 1 hour |
| [708](./task-708-integration-tests.md) | Write integration tests for MapView | High | 1.5 hours |
| [709](./task-709-e2e-tests.md) | Write E2E tests for theme switching | Medium | 1 hour |
| [710](./task-710-documentation.md) | Update documentation | Medium | 30 min |

**Total Estimated Time**: ~9.5 hours

## Success Criteria

### Functional Requirements
- ✅ User can toggle between dark and light map themes
- ✅ Theme preference persists across browser sessions
- ✅ All well markers, clusters, and custom pins preserved on theme change
- ✅ Theme switch completes in <500ms
- ✅ No visual glitches or flickering during transition
- ✅ System theme preference detected on first load

### Technical Requirements
- ✅ TypeScript compilation with no errors
- ✅ All tests passing (unit, integration, E2E)
- ✅ No console errors or warnings
- ✅ Code coverage >80% for new code
- ✅ ESLint passing with no warnings
- ✅ Lighthouse accessibility score maintained

### Performance Requirements
- ✅ Theme switch <500ms
- ✅ No memory leaks on repeated switches
- ✅ localStorage operations <10ms
- ✅ No impact on initial map load time

## Dependencies

### Required
- `zustand` v4.4 (already installed)
- `mapbox-gl` v3.0 (already installed)
- `lucide-react` (already installed - for icons)

### Optional (Future)
- `idb-keyval` for IndexedDB migration

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Custom layers lost on style change | High | Use `style.load` event to restore |
| Theme flash on page load | Medium | Use synchronous localStorage |
| Performance degradation | Low | Optimize layer re-add logic |
| Memory leaks from event listeners | Medium | Proper cleanup in useEffect |
| Browser storage quota | Low | localStorage is tiny (~5KB) |

## Testing Strategy

### Unit Tests
- Theme store state transitions
- localStorage read/write operations
- Theme validation logic
- Keyboard shortcut handlers

### Integration Tests
- MapView with theme switching
- Custom layer preservation
- Well data persistence
- Error handling

### E2E Tests
- User clicks toggle button
- Theme persists after refresh
- Markers visible after theme change
- Keyboard shortcut works
- System theme detection

## Rollout Plan

### Phase 1: Core Implementation (Tasks 701-703)
- Map style constants
- Zustand store
- Style switching logic
- **Goal**: Basic theme switching works

### Phase 2: UI Polish (Tasks 704-706)
- Toggle button component
- System theme detection
- Keyboard shortcuts
- **Goal**: Professional user experience

### Phase 3: Quality Assurance (Tasks 707-709)
- Unit tests
- Integration tests
- E2E tests
- **Goal**: Production-ready code

### Phase 4: Documentation (Task 710)
- Code documentation
- User guide
- Architecture docs
- **Goal**: Maintainable codebase

## Future Enhancements

1. **Multiple Map Styles** (Sprint 8?)
   - Streets, Satellite, Outdoors options
   - Style picker dropdown component
   - Preview thumbnails

2. **Advanced Theming**
   - Custom color schemes
   - Time-based auto-switching
   - Per-layer theme customization

3. **IndexedDB Migration**
   - Move from localStorage to IndexedDB
   - Offline map tile caching
   - Large dataset persistence

4. **App-Wide Dark Mode**
   - Extend to entire application
   - Consistent theming across components
   - CSS variable management

## References

### Mapbox Documentation
- [Change map style](https://docs.mapbox.com/mapbox-gl-js/example/setstyle/)
- [Persist layers on style switch](https://docs.mapbox.com/mapbox-gl-js/example/style-switch/)
- [Mapbox style URLs](https://docs.mapbox.com/api/maps/styles/)

### Zustand Documentation
- [Zustand persist middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [TypeScript guide](https://docs.pmnd.rs/zustand/guides/typescript)

### Browser Storage
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Sprint Start Date**: TBD
**Sprint Duration**: 2-3 days
**Team**: Solo development
**Status**: Planning
