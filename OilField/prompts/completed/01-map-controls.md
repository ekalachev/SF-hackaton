# Map Controls Enhancement

Implement the following map control features for the OilField application:

## Features to Implement

### 1. Production Heatmap Layer
- Toggle to show production intensity overlay on the map
- Color gradient from low (blue) to high (red) production
- Use Mapbox heatmap layer with production data

### 2. Basin/Formation Filters
- Dropdown or multi-select to filter wells by geological formation
- Quick-select buttons for major basins (Permian, Eagle Ford, Bakken, etc.)
- Visual indication of active filters

### 3. Custom Map Styles
- Toggle between satellite, terrain, and street views
- Dark mode map option
- Optional: well density clustering visualization

### 4. Distance/Radius Tool
- Click to set center point, drag to define radius
- Show wells within selected radius
- Display count and aggregate statistics for selected area

## Technical Requirements
- Use Mapbox GL JS APIs
- Integrate with existing MapComponent
- Maintain performance with large well datasets
- Persist user preferences in localStorage

## Files to Modify
- frontend/src/components/map/MapComponent.tsx
- frontend/src/components/map/MapControls.tsx (create if needed)
- frontend/src/types/ (add new types as needed)
