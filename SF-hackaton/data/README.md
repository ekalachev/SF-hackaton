# Data Directory Structure

This directory contains all data files, configurations, and analysis results.

## Directory Organization

### 📁 `/analysis`
Analysis results and comparison data:
- `analysis_core_only.json` - Core files analysis
- `analysis_final.json` - Final analysis results
- `analysis_results.json` - Raw analysis results
- `analysis_results_corrected.json` - Corrected analysis results
- `competitive_analysis.json` - Competitive analysis data
- `global_developer_rates.json` - Global developer rates by region
- `regional_comparison_summary.json` - Regional comparison summary
- `visualization_data.json` - Data for visualizations

### 📁 `/config`
Configuration files:
- `mcp_config.json` - MCP (Model Context Protocol) configuration

## Data Usage

These JSON files are used by:
- Python analysis scripts in `/scripts/python/analysis`
- Report generation scripts in `/scripts/python/reporting`
- The main AI Development Report

## Key Data Files

### Global Developer Rates
Contains comprehensive developer rates by region with sources:
- USA, Europe, Australia rates
- Eastern Europe, India, South America rates
- Hidden costs and multipliers
- Source links for verification

### Competitive Analysis
Comparison of AI-powered development vs traditional:
- Cost comparisons
- Time-to-market analysis
- ROI calculations
- Speed multipliers

### Analysis Results
Project metrics from the hackathon:
- Lines of code: 4,394
- Files created: 40
- Development time: 2 hours actual work
- Cost analysis: $75 AI vs $30,000+ traditional