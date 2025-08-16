#!/bin/bash
# Script to create AI-Agents user in HubSpot

echo "👤 Setting up AI-Agents user in HubSpot..."

# Create AI-Agents user configuration
cat > config/ai_agents_user.json << 'EOF'
{
  "user": {
    "email": "ai-agents@salesswarm.ai",
    "firstName": "AI",
    "lastName": "Agents",
    "role": "Sales Automation",
    "permissions": {
      "contacts": ["read", "write", "delete"],
      "tasks": ["read", "write", "complete"],
      "emails": ["send", "read"],
      "workflows": ["trigger", "read"],
      "activities": ["create", "read"]
    }
  },
  "api_settings": {
    "rate_limit": 100,
    "concurrent_tasks": 5,
    "retry_attempts": 3,
    "timeout_seconds": 30
  },
  "task_assignment": {
    "default_queue": "AI Processing Queue",
    "auto_accept": true,
    "priority_handling": "FIFO",
    "max_tasks_per_minute": 20
  }
}
EOF

echo "✅ AI-Agents user configuration created"

# Create user in HubSpot (mock command)
echo "📝 Creating user in HubSpot..."
# Command that would be run:
# ~/claude-eng --mcp hubspot --print "create user 'AI-Agents' with email 'ai-agents@salesswarm.ai' and role 'Sales Automation'"

# Set up task assignment rules
cat > config/task_assignment_rules.json << 'EOF'
{
  "rules": [
    {
      "condition": "task_type == 'Qualify Lead'",
      "assignee": "AI-Agents",
      "auto_accept": true
    },
    {
      "condition": "task_type == 'Send Outreach'",
      "assignee": "AI-Agents",
      "auto_accept": true
    },
    {
      "condition": "task_type == 'Enrich Data'",
      "assignee": "AI-Agents",
      "auto_accept": true
    },
    {
      "condition": "lead_score > 85",
      "assignee": "Sales Team",
      "auto_accept": false,
      "escalation": "immediate"
    }
  ]
}
EOF

echo "✅ Task assignment rules configured"

# Create agent identification file for scripts
cat > config/agent_identity.sh << 'EOF'
#!/bin/bash
# Agent identity configuration for shell scripts

export AGENT_USER="AI-Agents"
export AGENT_EMAIL="ai-agents@salesswarm.ai"
export AGENT_QUEUE="AI Processing Queue"
export HUMAN_QUEUE="Human Review Queue"
export PRIORITY_QUEUE="Priority Queue"

# Helper function to identify as AI-Agent in commands
ai_agent_cmd() {
    ~/claude-eng --mcp hubspot --as-user "$AGENT_USER" --print "$1"
}

# Export the function
export -f ai_agent_cmd
EOF

chmod +x config/agent_identity.sh
echo "✅ Agent identity helper created"

echo ""
echo "📝 To create AI-Agents user in HubSpot, run:"
echo "   ~/claude-eng --mcp hubspot --print \"create user 'AI-Agents' with email 'ai-agents@salesswarm.ai'\""
echo ""
echo "🔧 Source the identity file in your scripts:"
echo "   source config/agent_identity.sh"