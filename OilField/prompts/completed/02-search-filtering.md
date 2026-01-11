# Search & Filtering Enhancement

Implement comprehensive search and filtering capabilities for the OilField application:

## Features to Implement

### 1. Advanced Search
- Full-text search across well names, IDs, operators, and locations
- Autocomplete/typeahead suggestions
- Search history and saved searches
- Keyboard shortcut (Cmd/Ctrl+K) to focus search

### 2. Multi-Criteria Filters
- Production rate range slider (min/max bbl/day)
- Well age filter (years since first production)
- Operator/company filter (multi-select)
- Well type filter (horizontal, vertical, directional)
- Status filter (active, inactive, P&A)

### 3. Saved Filter Presets
- Save current filter configuration with custom name
- Quick-apply saved presets
- Share presets via URL parameters
- Default presets for common scenarios

### 4. Sort Options
- Sort by production rate, age, value, distance
- Ascending/descending toggle
- Secondary sort criteria

## Technical Requirements
- Debounced search input for performance
- URL state synchronization for shareable filters
- Filter state management with React context or Zustand
- Clear visual feedback for active filters

## Files to Modify
- frontend/src/components/filters/ (create directory)
- frontend/src/hooks/useFilters.ts (create)
- frontend/src/context/FilterContext.tsx (create)
- frontend/src/components/layout/Header.tsx or Sidebar
