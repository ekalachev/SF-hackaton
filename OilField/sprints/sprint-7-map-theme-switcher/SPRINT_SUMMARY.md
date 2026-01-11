# Sprint 7: Map Theme Switcher - Quick Summary

## Overview
Implement dark/light mode switching for the Mapbox map with persistent browser storage.

## Total Estimated Time: ~9.5 hours

## Task Breakdown

| # | Task | Time | Status |
|---|------|------|--------|
| 701 | Map Style Constants & Types | 30 min | Not Started |
| 702 | Zustand Theme Store | 1 hour | Not Started |
| 703 | Style Switching in MapView | 1.5 hours | Not Started |
| 704 | Theme Toggle UI Component | 1 hour | Not Started |
| 705 | System Theme Detection | 45 min | Not Started |
| 706 | Keyboard Shortcuts | 30 min | Not Started |
| 707 | Unit Tests | 1 hour | Not Started |
| 708 | Integration Tests | 1.5 hours | Not Started |
| 709 | E2E Tests | 1 hour | Not Started |
| 710 | Documentation | 30 min | Not Started |

## Key Files to Create

```
frontend/src/
├── types/
│   ├── mapTheme.ts (NEW)
│   ├── mapTheme.test.ts (NEW)
│   ├── map.ts (UPDATE - add getMapConfig())
│   └── index.ts (UPDATE - export theme types)
├── stores/
│   ├── mapThemeStore.ts (NEW)
│   └── mapThemeStore.test.ts (NEW)
├── components/
│   ├── map/
│   │   ├── MapView.tsx (UPDATE - add theme switching)
│   │   ├── MapView.test.tsx (UPDATE - test theme switching)
│   │   └── MapThemeToggle.tsx (NEW)
│   └── MapThemeToggle.test.tsx (NEW)
└── hooks/
    ├── useSystemTheme.ts (NEW)
    └── useSystemTheme.test.ts (NEW)
```

## Critical Implementation Points

### 1. Style Switching Flow
```
User clicks toggle → Update Zustand store → Call map.setStyle()
→ 'style.load' event fires → Re-add custom layers
```

### 2. Custom Layer Preservation
**Problem**: `map.setStyle()` removes all custom layers
**Solution**: Listen to `style.load` event, call existing `addWellsLayer()`

### 3. localStorage Structure
```json
{
  "state": {
    "theme": "dark"
  },
  "version": 0
}
```

## Success Criteria

- ✅ Dark/light theme switching works instantly (<500ms)
- ✅ Theme persists across browser sessions
- ✅ All 25 well markers preserved on theme change
- ✅ Custom pins reload correctly
- ✅ No console errors
- ✅ All tests passing (>80% coverage)

## Dependencies

### Already Installed
- `zustand` v4.4
- `mapbox-gl` v3.0
- `lucide-react` (for toggle icons)
- `zod` v3.25.76

### No New Dependencies Needed ✅

## Phase 1: Core (Tasks 701-703)
**Goal**: Basic theme switching works
**Time**: ~3 hours

## Phase 2: UI (Tasks 704-706)
**Goal**: Professional UX
**Time**: ~2.25 hours

## Phase 3: Testing (Tasks 707-709)
**Goal**: Production ready
**Time**: ~3.5 hours

## Phase 4: Docs (Task 710)
**Goal**: Maintainable
**Time**: ~30 min

## Mapbox Styles

```typescript
const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
};
```

## Key Code Locations

- **Current style**: `frontend/src/types/map.ts:107`
- **Map initialization**: `frontend/src/components/map/MapView.tsx:86`
- **Layer adding**: `frontend/src/components/map/MapView.tsx:122-312`
- **localStorage usage**: `frontend/src/components/debug/DebugConsole.tsx:6`

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Layers lost on style change | `style.load` event listener |
| Theme flash on load | Synchronous localStorage read |
| Performance issues | Optimize layer re-add |
| Memory leaks | Proper cleanup in useEffect |

## Testing Strategy

- **Unit**: Theme store, validation, helpers
- **Integration**: MapView with theme switching
- **E2E**: Full user flow with Playwright

## Future Enhancements (Not in Sprint)

- Multiple map styles (streets, satellite, outdoors)
- Custom theme builder
- IndexedDB migration for large data
- App-wide dark mode
- Time-based auto-switching

---

**Ready to start?** Begin with Task 701 (Constants & Types)
