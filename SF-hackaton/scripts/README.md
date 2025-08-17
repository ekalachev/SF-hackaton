# Scripts Directory Structure

This directory contains all executable scripts organized by language and purpose.

## Directory Organization

### 📁 `/applescript`
macOS automation scripts:
- `full-demo.applescript` - Full demonstration script
- `hubspot-demo.applescript` - HubSpot-specific demo
- `simple-demo.applescript` - Simple demo script

### 📁 `/bash`
Shell scripts for automation and setup:

#### `/bash/setup`
- `setup.sh` - Main setup script
- `setup_claude_mcp.sh` - Claude MCP integration setup
- `setup_cron.sh` - Cron job configuration
- `setup_mcp.sh` - MCP setup
- `setup_mcp_puppeteer.sh` - Puppeteer MCP setup
- `verify_setup.sh` - Setup verification
- `claude_with_mcp.sh` - Claude launcher with MCP
- `start_claude_with_mcp.sh` - Start Claude with MCP server

#### `/bash/demo`
- `demo.sh` - Main demo script
- `automated_demo.sh` - Automated demo runner
- `mock_demo.sh` - Mock demo for testing
- `visual_demo.sh` - Visual demo script
- `enable-safari-automation.sh` - Enable Safari automation
- `full-demo.sh` - Full demo execution
- `run-apple-demo.sh` - Run Apple demo script
- `start_claude_with_mcp.sh` - Start Claude with MCP

#### `/bash/test`
- `test_agents.sh` - Test AI agents
- `test_chrome_normal_profile.sh` - Chrome profile testing
- `test_hubspot_connection.sh` - HubSpot connection test
- `test_mcp_with_prompt.sh` - MCP prompt testing
- `test_private_app.sh` - Private app testing

### 📁 `/python`
Python scripts for analysis and reporting:

#### `/python/analysis`
- `analyze_repo.py` - Repository analysis
- `correct_analysis.py` - Analysis corrections
- `fix_analysis.py` - Fix analysis issues
- `quick_analysis.py` - Quick analysis tool
- `global_dev_rates_research.py` - Global developer rates research

#### `/python/reporting`
- `create_fomo_report.py` - FOMO report generator
- `create_simple_report.py` - Simple report generator
- `create_visualizations.py` - Visualization creator
- `final_corrected_cost.py` - Cost calculations
- `final_report.py` - Final report generator
- `generate_report.py` - Report generation
- `generate_visualizations.py` - Generate visualizations
- `update_report.py` - Report updater

### 📁 `/js`
JavaScript scripts for browser automation and demos:

#### `/js/browser`
- `hubspot_browser_demo.js` - HubSpot browser automation demo

#### `/js/demo`
- `apple-demo.js` - Apple demo implementation
- `demo.js` - Main demo script
- `hubspot-auto-login.js` - HubSpot auto-login functionality
- `hubspot-demo.jxa.js` - HubSpot JXA (JavaScript for Automation) demo
- `hubspot-puppeteer-helper.js` - HubSpot Puppeteer helper functions
- `visual_demo.js` - Visual demonstration script

## Usage Examples

### Running Setup Scripts
```bash
# Run main setup
./scripts/bash/setup/setup.sh

# Verify setup
./scripts/bash/setup/verify_setup.sh
```

### Running Analysis
```bash
# Quick repository analysis
python scripts/python/analysis/quick_analysis.py

# Generate report
python scripts/python/reporting/generate_report.py
```

### Running Demos
```bash
# Run automated demo
./scripts/bash/demo/automated_demo.sh

# Run visual demo
node scripts/js/demo/visual_demo.js
```

### Using npm scripts
The package.json has been updated with the new paths:
```bash
npm run setup    # Runs ./scripts/bash/setup/setup.sh
npm run demo     # Runs ./scripts/bash/demo/demo.sh
npm run verify   # Runs ./scripts/bash/setup/verify_setup.sh
```