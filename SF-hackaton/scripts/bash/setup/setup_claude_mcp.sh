#!/bin/bash
source ~/.zshrc

echo "🔧 Setting up MCP Servers in Claude CLI"
echo "========================================"
echo ""

# Get the absolute path to the project
PROJECT_DIR="/Users/alexanderfedin/Projects/hackathons/SF-hackaton"

# Remove existing MCP servers if they exist
echo "Removing any existing MCP servers..."
~/claude-eng mcp remove puppeteer 2>/dev/null
~/claude-eng mcp remove hubspot 2>/dev/null

# Add Puppeteer MCP server
echo "Adding Puppeteer MCP server..."
~/claude-eng mcp add-json puppeteer '{
  "command": "node",
  "args": ["'$PROJECT_DIR'/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js"],
  "env": {
    "PUPPETEER_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  }
}'

# Add HubSpot MCP server
echo "Adding HubSpot MCP server..."
~/claude-eng mcp add-json hubspot '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-hubspot"],
  "env": {
    "HUBSPOT_ACCESS_TOKEN": "pat-na2-30f8b732-2167-4521-a829-01bb51c277a5"
  }
}'

echo ""
echo "✅ MCP servers configured!"
echo ""
echo "Listing configured servers:"
~/claude-eng mcp list

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo ""
echo "The project also has a .mcp.json file that will be loaded automatically"
echo "when you start Claude in this directory."
echo ""
echo "To test:"
echo "1. Start Claude: claude"
echo "2. Check MCP servers: /mcp"
echo "3. Or use with --print: claude --print 'test puppeteer'"
echo ""
echo "Note: You may need to approve the servers when prompted."