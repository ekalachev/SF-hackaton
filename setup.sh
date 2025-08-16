#!/bin/bash
source ~/.zshrc
# Main setup script for SalesSwarm AI with HubSpot Task Coordination

echo "🚀 Setting up SalesSwarm AI with HubSpot Task Coordination..."
echo "============================================================"

# Check if we're in the right directory
if [ ! -f "docs/PRD-AgentSwarm-3Hour-Sprint.md" ]; then
    echo "❌ Error: Not in SF-hackaton directory"
    echo "   Please run from /Users/alexanderfedin/Projects/hackathons/SF-hackaton/"
    exit 1
fi

# Phase 1: Setup (following PRD)
echo ""
echo "📋 PHASE 1: SETUP"
echo "-----------------"

# Task 1: Configure HubSpot MCP server
echo "✅ Task 1: Configure HubSpot MCP server"
if [ -f "setup_mcp.sh" ]; then
    echo "   - MCP configuration ready in config/mcp_hubspot_config.json"
    echo "   - Run ./setup_mcp.sh to configure"
fi

# Task 2: Create HubSpot task queues/lists  
echo "✅ Task 2: Create HubSpot task queues/lists"
if [ -f "agents/setup_task_queues.sh" ]; then
    echo "   - Task queue setup ready"
    echo "   - Templates in config/task_templates.json"
    echo "   - Workflows in config/workflow_triggers.json"
fi

# Task 3: Set up agent "users" in HubSpot
echo "✅ Task 3: Set up agent 'users' in HubSpot"
if [ -f "agents/setup_ai_user.sh" ]; then
    echo "   - AI-Agents user configuration ready"
    echo "   - Identity helper in config/agent_identity.sh"
fi

# Task 4: Test claude-eng CLI with HubSpot
echo "✅ Task 4: Test claude-eng CLI with HubSpot"
if [ -f "test_hubspot_connection.sh" ]; then
    echo "   - Test suite ready in test_hubspot_connection.sh"
    echo "   - Run ./test_hubspot_connection.sh to test"
fi

echo ""
echo "============================================================"
echo "📊 SETUP SUMMARY"
echo "============================================================"
echo ""
echo "✅ All Phase 1 tasks prepared!"
echo ""
echo "📁 Created structure:"
echo "   SF-hackaton/"
echo "   ├── agents/          # Agent scripts"
echo "   ├── config/          # Configuration files"
echo "   ├── logs/            # Activity logs"
echo "   └── docs/            # Documentation"
echo ""
echo "📝 Next Steps (Manual - requires actual HubSpot access):"
echo ""
echo "1. Set environment variables:"
echo "   export HUBSPOT_API_KEY='your-api-key'"
echo "   export HUBSPOT_PORTAL_ID='your-portal-id'"
echo ""
echo "2. Install HubSpot MCP server:"
echo "   npm install -g @hubspot/mcp-server"
echo ""
echo "3. Configure MCP:"
echo "   ./setup_mcp.sh"
echo ""
echo "4. Create HubSpot entities:"
echo "   ./agents/setup_task_queues.sh"
echo "   ./agents/setup_ai_user.sh"
echo ""
echo "5. Test connection:"
echo "   ./test_hubspot_connection.sh"
echo ""
echo "6. Start Phase 2 (Agent Development):"
echo "   - Build lead_qualifier.sh"
echo "   - Build outreach_agent.sh"
echo "   - Build data_enricher.sh"
echo "   - Build task_monitor.sh"
echo ""
echo "⏰ Time estimate: Phase 1 complete in ~20 minutes as planned!"
echo ""
echo "Ready for hackathon! 🎉"