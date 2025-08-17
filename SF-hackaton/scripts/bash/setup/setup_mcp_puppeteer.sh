#!/bin/bash
source ~/.zshrc
# Setup MCP Servers for Claude CLI

echo "🔧 Setting up MCP Servers (HubSpot + Puppeteer)"
echo "=============================================="
echo ""

# Check if access token is set
if [ -z "$HUBSPOT_ACCESS_TOKEN" ]; then
    echo "⚠️  Warning: HUBSPOT_ACCESS_TOKEN not set"
    echo "   Set it with: export HUBSPOT_ACCESS_TOKEN='pat-na-...'"
    HUBSPOT_TOKEN="YOUR_TOKEN_HERE"
else
    HUBSPOT_TOKEN="$HUBSPOT_ACCESS_TOKEN"
    echo "✅ Using HUBSPOT_ACCESS_TOKEN from environment"
fi

# Create MCP config for Cursor
echo "📝 Configuring Cursor MCP..."
cat > ~/.cursor/mcp.json << EOF
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": [
        "$PWD/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js"
      ],
      "env": {
        "PUPPETEER_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    },
    "hubspot": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-hubspot"
      ],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "$HUBSPOT_TOKEN"
      }
    }
  }
}
EOF
echo "✅ Cursor MCP configured at ~/.cursor/mcp.json"

# Create MCP config for Claude Desktop (if directory exists)
if [ -d ~/.config/claude ]; then
    echo "📝 Configuring Claude Desktop MCP..."
    cat > ~/.config/claude/claude_desktop_config.json << EOF
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": [
        "$PWD/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js"
      ],
      "env": {
        "PUPPETEER_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    },
    "hubspot": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-hubspot"
      ],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "$HUBSPOT_TOKEN"
      }
    }
  }
}
EOF
    echo "✅ Claude Desktop MCP configured"
fi

# Test Puppeteer installation
echo ""
echo "🧪 Testing Puppeteer MCP..."
if [ -f "$PWD/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js" ]; then
    echo "✅ Puppeteer MCP server found at:"
    echo "   $PWD/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js"
else
    echo "❌ Puppeteer MCP server not found. Installing..."
    PUPPETEER_SKIP_DOWNLOAD=true npm install @modelcontextprotocol/server-puppeteer
fi

echo ""
echo "=============================================="
echo "✅ MCP Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude CLI or Cursor"
echo "2. Run: claude mcp list"
echo "3. Test Puppeteer: claude mcp puppeteer navigate https://google.com"
echo "4. Test HubSpot: claude mcp hubspot list contacts"
echo ""
echo "If using environment variable for HubSpot:"
echo "   export HUBSPOT_ACCESS_TOKEN='pat-na-xxxxx'"
echo ""