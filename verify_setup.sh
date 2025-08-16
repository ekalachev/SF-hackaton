#!/bin/bash
source ~/.zshrc

echo "🔍 SalesSwarm AI Setup Verification"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check environment variables
echo "1️⃣ Environment Variables:"
if [ -n "$HUBSPOT_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅${NC} HUBSPOT_ACCESS_TOKEN: ${HUBSPOT_ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}❌${NC} HUBSPOT_ACCESS_TOKEN not set"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "${GREEN}✅${NC} ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:20}..."
else
    echo -e "${YELLOW}⚠️${NC} ANTHROPIC_API_KEY not set (optional)"
fi
echo ""

# Check MCP configurations
echo "2️⃣ MCP Configurations:"
if [ -f ~/.cursor/mcp.json ]; then
    echo -e "${GREEN}✅${NC} Cursor MCP config exists"
    if grep -q "pat-na2-30f8b732" ~/.cursor/mcp.json; then
        echo -e "${GREEN}✅${NC} HubSpot token configured in Cursor"
    fi
else
    echo -e "${YELLOW}⚠️${NC} Cursor MCP config not found"
fi

if [ -f ~/.config/claude/claude_desktop_config.json ]; then
    echo -e "${GREEN}✅${NC} Claude Desktop config exists"
else
    echo -e "${YELLOW}⚠️${NC} Claude Desktop config not found"
fi
echo ""

# Check Node modules
echo "3️⃣ Node Modules:"
if [ -d node_modules/@modelcontextprotocol/server-puppeteer ]; then
    echo -e "${GREEN}✅${NC} Puppeteer MCP installed"
else
    echo -e "${RED}❌${NC} Puppeteer MCP not installed"
fi

if [ -d node_modules/@modelcontextprotocol/server-hubspot ]; then
    echo -e "${GREEN}✅${NC} HubSpot MCP installed"
else
    echo -e "${YELLOW}⚠️${NC} HubSpot MCP not installed locally (will use npx)"
fi
echo ""

# Check scripts
echo "4️⃣ Shell Scripts:"
for script in setup.sh test_private_app.sh mock_demo.sh agents/lead_qualifier_v2.sh; do
    if [ -f "$script" ]; then
        if grep -q "source ~/.zshrc" "$script"; then
            echo -e "${GREEN}✅${NC} $script (sources .zshrc)"
        else
            echo -e "${YELLOW}⚠️${NC} $script (missing source .zshrc)"
        fi
    fi
done
echo ""

# Test HubSpot API
echo "5️⃣ HubSpot API Test:"
response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    "https://api.hubapi.com/crm/v3/objects/contacts?limit=1")

if [ "$response" == "200" ]; then
    echo -e "${GREEN}✅${NC} HubSpot API connection successful"
else
    echo -e "${RED}❌${NC} HubSpot API connection failed (HTTP $response)"
fi
echo ""

# Summary
echo "===================================="
echo "📊 Setup Summary"
echo "===================================="

all_good=true
if [ -z "$HUBSPOT_ACCESS_TOKEN" ] || [ "$response" != "200" ]; then
    all_good=false
fi

if $all_good; then
    echo -e "${GREEN}✅ Everything is configured correctly!${NC}"
    echo ""
    echo "You're ready for the hackathon! 🚀"
    echo ""
    echo "Quick commands:"
    echo "  ./test_private_app.sh     # Test HubSpot connection"
    echo "  ./mock_demo.sh           # Run demo"
    echo "  ./agents/lead_qualifier_v2.sh  # Run lead qualifier"
else
    echo -e "${YELLOW}⚠️ Some items need attention${NC}"
    echo ""
    echo "Fix any issues above, then run this script again."
fi

echo ""
echo "===================================="
echo "🔄 Restart Requirements"
echo "===================================="
echo "You need to RESTART Claude CLI for MCP servers to load:"
echo "  1. Exit current session: exit"
echo "  2. Start new session: claude"
echo "  3. Check MCP servers: /mcp"
echo ""
echo "No other restarts needed - all shell scripts will auto-load the token!"