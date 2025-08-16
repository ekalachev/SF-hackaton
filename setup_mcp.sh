#!/bin/bash
source ~/.zshrc
# HubSpot MCP Server Setup Script

echo "🔧 Setting up HubSpot MCP Server..."

# Check for required environment variables
if [ -z "$HUBSPOT_ACCESS_TOKEN" ]; then
    echo "⚠️  HUBSPOT_ACCESS_TOKEN not set. Please export HUBSPOT_ACCESS_TOKEN=your-private-app-token"
    echo "   To get your access token:"
    echo "   1. Go to HubSpot Settings > Integrations > Private Apps"
    echo "   2. Create a new Private App or use existing one"
    echo "   3. Copy the Access Token (starts with 'pat-na-' or 'pat-eu-')"
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