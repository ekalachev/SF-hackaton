# Dashboard Analytics Enhancement

Implement analytics dashboard features for the OilField application:

## Features to Implement

### 1. Portfolio Summary Cards
- Total portfolio value (sum of all well NPVs)
- Average production rate across wells
- Total cumulative production
- Number of wells by status
- Cards with trend indicators (up/down arrows)

### 2. Production Charts
- Time series chart of aggregate production
- Stacked area chart by formation/basin
- Decline curve visualization
- Toggle between daily/monthly/yearly views

### 3. Top Performers Widget
- Ranked list of top 10 wells by production
- Top 10 by value/NPV
- Sortable columns
- Quick navigation to well details

### 4. Risk Distribution
- Pie/donut chart of wells by risk category
- Risk score histogram
- Color-coded risk indicators

### 5. Geographic Distribution
- Mini-map showing well concentration
- State/county breakdown table
- Production by region chart

## Technical Requirements
- Use Recharts or Chart.js for visualizations
- Responsive design for different screen sizes
- Data refresh capability
- Loading skeletons for async data

## Files to Modify
- frontend/src/components/dashboard/ (create directory)
- frontend/src/pages/Dashboard.tsx (create or enhance)
- frontend/src/hooks/useAnalytics.ts (create)
- backend/src/routes/ (add analytics endpoints if needed)
