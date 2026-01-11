# Portfolio Management Enhancement

Implement portfolio management features for the OilField application:

## Features to Implement

### 1. Watchlist/Favorites
- Add/remove wells from watchlist
- Multiple watchlists with custom names
- Watchlist sharing
- Email alerts for watchlist changes

### 2. Well Tagging
- Custom tags/labels for wells
- Color-coded tags
- Filter by tags
- Bulk tag operations

### 3. Notes & Annotations
- Add notes to individual wells
- Rich text formatting
- Attach files/images
- Note history and timestamps

### 4. Bulk Operations
- Select multiple wells
- Bulk export data
- Bulk add to watchlist
- Bulk tag assignment
- Compare selected wells

### 5. Portfolio Analytics
- Custom portfolio creation
- Portfolio value tracking
- Performance metrics
- Diversification analysis
- Risk assessment

### 6. Alerts & Notifications
- Production threshold alerts
- Price change notifications
- New wells in area alerts
- Custom alert rules

## Technical Requirements
- User preferences storage
- Real-time notifications (WebSocket or polling)
- Efficient bulk operations
- Data persistence across sessions

## Files to Modify
- frontend/src/components/portfolio/ (create directory)
- frontend/src/context/PortfolioContext.tsx (create)
- backend/src/routes/portfolio.routes.ts (create)
- database schema for watchlists, tags, notes
