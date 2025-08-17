#!/bin/bash
source ~/.zshrc

echo "Starting Claude with MCP servers from hackathons directory..."
echo ""
echo "IMPORTANT: When Claude starts, it will ask to approve MCP servers."
echo "Type 'y' for each server (puppeteer and hubspot) to enable them."
echo ""
echo "This will work for ALL hackathon projects!"
echo ""
echo "Press Enter to continue..."
read

cd /Users/alexanderfedin/Projects/hackathons
~/claude-eng