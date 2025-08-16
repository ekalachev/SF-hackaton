#!/bin/bash
# HubSpot MCP Server Setup Script

echo "🔧 Setting up HubSpot MCP Server..."

# Check for required environment variables
if [ -z "$HUBSPOT_API_KEY" ]; then
    echo "⚠️  HUBSPOT_API_KEY not set. Please export HUBSPOT_API_KEY=your-key"
    echo "   You can get your API key from: https://app.hubspot.com/settings/integrations/api-keys"
    exit 1
fi

if [ -z "$HUBSPOT_PORTAL_ID" ]; then
    echo "⚠️  HUBSPOT_PORTAL_ID not set. Please export HUBSPOT_PORTAL_ID=your-portal-id"
    echo "   Find your Portal ID in HubSpot Settings > Account & Billing"
    exit 1
fi

# Copy MCP config to Claude config directory (if it exists)
CLAUDE_CONFIG_DIR="$HOME/.claude"
if [ -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "📋 Copying MCP configuration to Claude config directory..."
    cp config/mcp_hubspot_config.json "$CLAUDE_CONFIG_DIR/mcp_config.json"
    echo "✅ MCP configuration copied"
else
    echo "⚠️  Claude config directory not found at $CLAUDE_CONFIG_DIR"
    echo "   MCP config saved locally in config/mcp_hubspot_config.json"
fi

# Test connection using a mock command (actual claude-eng would be used)
echo "🔗 Testing HubSpot MCP connection..."
# In reality would run: ~/claude-eng --mcp hubspot --print "ping"
echo "   Note: Actual connection test requires claude-eng CLI"
echo "   Run: ~/claude-eng --mcp hubspot --print \"ping\""

echo "✅ HubSpot MCP server configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Install HubSpot MCP server: npm install -g @hubspot/mcp-server"
echo "2. Test with: ~/claude-eng --mcp hubspot --print \"list first 5 contacts\""