#!/bin/bash
source ~/.zshrc

echo "Starting Claude with MCP servers..."
echo ""
echo "IMPORTANT: When Claude starts, it will ask to approve MCP servers."
echo "Type 'y' for each server (puppeteer and hubspot) to enable them."
echo ""
echo "Press Enter to continue..."
read

cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton
~/claude-eng