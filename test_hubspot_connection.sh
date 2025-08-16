#!/bin/bash
# Test script for HubSpot MCP connection via claude-eng CLI

echo "🧪 Testing HubSpot MCP Connection..."
echo "================================="

# Source the agent identity
if [ -f "config/agent_identity.sh" ]; then
    source config/agent_identity.sh
    echo "✅ Agent identity loaded: $AGENT_USER"
else
    echo "⚠️  Agent identity file not found"
fi

# Test suite
echo ""
echo "📋 Running connection tests..."
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic Connection"
echo "------------------------"
echo "Command: ~/claude-eng --mcp hubspot --print \"ping\""
echo "Expected: Connection successful"
# ~/claude-eng --mcp hubspot --print "ping"
echo "Status: [Would run actual command]"
echo ""

# Test 2: List contacts
echo "Test 2: List Contacts"
echo "---------------------"
echo "Command: ~/claude-eng --mcp hubspot --print \"list first 5 contacts\""
echo "Expected: Returns contact list or empty array"
# ~/claude-eng --mcp hubspot --print "list first 5 contacts"
echo "Status: [Would run actual command]"
echo ""

# Test 3: Check task queues
echo "Test 3: Check Task Queues"
echo "-------------------------"
echo "Command: ~/claude-eng --mcp hubspot --print \"list all task queues\""
echo "Expected: Shows AI Processing Queue, Human Review Queue"
# ~/claude-eng --mcp hubspot --print "list all task queues"
echo "Status: [Would run actual command]"
echo ""

# Test 4: Create test task
echo "Test 4: Create Test Task"
echo "------------------------"
TEST_TASK="Test Task - $(date +%Y%m%d-%H%M%S)"
echo "Command: ~/claude-eng --mcp hubspot --print \"create task '$TEST_TASK' assigned to AI-Agents\""
echo "Expected: Task created successfully"
# ~/claude-eng --mcp hubspot --print "create task '$TEST_TASK' assigned to AI-Agents"
echo "Status: [Would run actual command]"
echo ""

# Test 5: Query AI-Agent tasks
echo "Test 5: Query AI-Agent Tasks"
echo "----------------------------"
echo "Command: ~/claude-eng --mcp hubspot --print \"count open tasks assigned to AI-Agents\""
echo "Expected: Returns count (0 or more)"
# ~/claude-eng --mcp hubspot --print "count open tasks assigned to AI-Agents"
echo "Status: [Would run actual command]"
echo ""

# Create mock test results for demo
cat > logs/test_results.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tests": [
    {"name": "Basic Connection", "status": "pending", "command": "ping"},
    {"name": "List Contacts", "status": "pending", "command": "list first 5 contacts"},
    {"name": "Check Task Queues", "status": "pending", "command": "list all task queues"},
    {"name": "Create Test Task", "status": "pending", "command": "create task"},
    {"name": "Query AI-Agent Tasks", "status": "pending", "command": "count tasks"}
  ],
  "notes": "Run with actual claude-eng CLI to execute tests"
}
EOF

echo "================================="
echo "📊 Test Results Summary"
echo "================================="
echo "✅ Test configuration created"
echo "📝 Test results template saved to logs/test_results.json"
echo ""
echo "⚠️  Note: Actual tests require claude-eng CLI with HubSpot MCP"
echo ""
echo "To run actual tests:"
echo "1. Ensure HUBSPOT_API_KEY is set"
echo "2. Ensure HUBSPOT_PORTAL_ID is set"
echo "3. Run each command above manually"
echo "4. Verify responses match expectations"
echo ""
echo "Quick test command:"
echo "  ~/claude-eng --mcp hubspot --print \"test connection and list first contact\""