#!/bin/bash
source ~/.zshrc

# Test script to open Chrome with normal profile using MCP Puppeteer
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton

# The launchOptions will be passed to the puppeteer_navigate command
# This tells Puppeteer to use your normal Chrome profile instead of incognito
echo "Testing Chrome with normal profile..."
echo "When Claude starts, approve the MCP servers and it will navigate to a test page"
echo ""

~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/SF-hackaton/.mcp.json --print "Navigate to https://www.google.com using puppeteer_navigate with launchOptions: { \"headless\": false, \"args\": [\"--user-data-dir=/Users/alexanderfedin/Library/Application Support/Google/Chrome\"] }"