# Report Features Enhancement

Enhance the AI investment report generation and display:

## Features to Implement

### 1. Report Templates
- Quick Report (executive summary only, ~500 words)
- Standard Report (current, ~2000 words)
- Comprehensive Report (detailed analysis, ~4000 words)
- Custom template builder

### 2. Export Options
- Export to PDF with formatting
- Export to Word document
- Export to PowerPoint slides
- Print-optimized view

### 3. Report History
- Save generated reports with timestamps
- Compare report versions
- Track changes over time
- Archive/delete old reports

### 4. Report Customization
- Select which sections to include
- Adjust risk tolerance assumptions
- Custom economic parameters
- Add company branding/logo

### 5. Collaborative Features
- Share report via email
- Generate shareable link
- Add annotations/comments
- Request review workflow

### 6. Report Viewer Improvements
- Table of contents navigation
- Collapsible sections
- Syntax highlighting for data
- Full-screen reading mode

## Technical Requirements
- PDF generation library (jsPDF or similar)
- Report caching and storage
- Version tracking in database
- Responsive report viewer

## Files to Modify
- frontend/src/components/reports/ (create directory)
- frontend/src/components/wells/InvestmentReportModal.tsx
- backend/src/routes/ai.routes.ts
- backend/src/services/claudeService.ts
- database schema for report storage
