#!/bin/bash
# Script to create HubSpot task queues and lists

echo "📋 Creating HubSpot Task Queues..."

# Create AI Processing Queue
echo "Creating 'AI Processing Queue'..."
# Command that would be run:
# ~/claude-eng --mcp hubspot --print "create task queue 'AI Processing Queue' with description 'Tasks for automated AI agent processing'"

# Create Human Review Queue  
echo "Creating 'Human Review Queue'..."
# ~/claude-eng --mcp hubspot --print "create task queue 'Human Review Queue' with description 'Tasks requiring human intervention'"

# Create Priority Queue
echo "Creating 'Priority Queue'..."
# ~/claude-eng --mcp hubspot --print "create task queue 'Priority Queue' with description 'High-priority leads requiring immediate action'"

# Create task templates
cat > config/task_templates.json << 'EOF'
{
  "task_templates": [
    {
      "name": "Qualify Lead",
      "queue": "AI Processing Queue",
      "assignee": "AI-Agents",
      "priority": "NORMAL",
      "template": "Qualify Lead {contact_id} - Score and categorize"
    },
    {
      "name": "Send Outreach",
      "queue": "AI Processing Queue", 
      "assignee": "AI-Agents",
      "priority": "NORMAL",
      "template": "Send Outreach to {contact_id} - Personalized email"
    },
    {
      "name": "Enrich Data",
      "queue": "AI Processing Queue",
      "assignee": "AI-Agents", 
      "priority": "LOW",
      "template": "Enrich Data for {contact_id} - Fill missing fields"
    },
    {
      "name": "Human Review",
      "queue": "Human Review Queue",
      "assignee": "Sales Team",
      "priority": "HIGH",
      "template": "Review high-value lead {contact_id} - Score: {score}"
    }
  ]
}
EOF

echo "✅ Task templates created in config/task_templates.json"

# Create workflow triggers configuration
cat > config/workflow_triggers.json << 'EOF'
{
  "workflows": [
    {
      "trigger": "contact_created",
      "action": "create_task",
      "task_type": "Enrich Data",
      "assignee": "AI-Agents",
      "due_in_minutes": 5
    },
    {
      "trigger": "form_submitted", 
      "action": "create_task",
      "task_type": "Qualify Lead",
      "assignee": "AI-Agents",
      "due_in_minutes": 1
    },
    {
      "trigger": "lead_score_above_70",
      "action": "create_task",
      "task_type": "Send Outreach",
      "assignee": "AI-Agents",
      "due_in_minutes": 30
    },
    {
      "trigger": "lead_score_above_85",
      "action": "create_task",
      "task_type": "Human Review",
      "assignee": "Sales Team",
      "due_in_minutes": 60
    }
  ]
}
EOF

echo "✅ Workflow triggers configured in config/workflow_triggers.json"

echo ""
echo "📝 To actually create these in HubSpot, run:"
echo "   ~/claude-eng --mcp hubspot --print \"create task queue 'AI Processing Queue'\""
echo "   ~/claude-eng --mcp hubspot --print \"create task queue 'Human Review Queue'\""
echo "   ~/claude-eng --mcp hubspot --print \"create task queue 'Priority Queue'\""