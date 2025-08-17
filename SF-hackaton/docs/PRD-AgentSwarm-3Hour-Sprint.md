# Product Requirements Document: HubSpot Agent Swarm
## 3-Hour Hackathon Sprint - HubSpot-Native Coordination

### Executive Summary
**Product Name:** SalesSwarm AI  
**Mission:** Build autonomous agents that coordinate through HubSpot's native task system  
**Time Budget:** 3 hours (11:15 AM - 2:15 PM with demo prep by 3:30 PM)  
**Approach:** Shell scripts + Claude CLI + HubSpot Tasks as message queue

---

## 🎯 Core Problem Statement
Sales teams waste 70% of their time on repetitive lead tasks. We'll solve this using HubSpot itself as the coordination layer - no external orchestration needed.

**Our Solution:** Agents that read HubSpot tasks, execute actions, and create new tasks for other agents - turning HubSpot into a distributed task queue.

---

## 🏗️ Architecture: HubSpot as the Brain

### Coordination Through HubSpot
```bash
# HubSpot becomes our message queue and state machine:
- Tasks = Agent instructions
- Task assignee = Which agent should run
- Task status = Processing state
- Task comments = Agent communication
- Activities = Audit trail
```

### Agent Task Flow
```
1. Cron triggers agent every minute
2. Agent queries HubSpot for assigned tasks
3. Agent processes task
4. Agent updates task status
5. Agent creates follow-up tasks for other agents
6. Repeat
```

### No External State Needed
- **NO** local JSON files
- **NO** orchestrator script
- **NO** inter-process communication
- **JUST** HubSpot as single source of truth

---

## ⏱️ Time-Boxed Development Plan

### Phase 1: Setup (20 min) - 11:15-11:35 AM
```bash
- [ ] Configure HubSpot MCP server
- [ ] Create HubSpot task queues/lists
- [ ] Set up agent "users" in HubSpot
- [ ] Test claude-eng CLI with HubSpot
```

### Phase 2: Agent Scripts (100 min) - 11:35 AM-1:15 PM
```bash
- [ ] task_monitor.sh - Watches for new tasks (20 min)
- [ ] lead_qualifier.sh - Processes "Qualify Lead" tasks (30 min)
- [ ] outreach_agent.sh - Processes "Send Outreach" tasks (30 min)
- [ ] data_enricher.sh - Processes "Enrich Data" tasks (20 min)
```

### Phase 3: Demo & Polish (60 min) - 1:15-2:15 PM
```bash
- [ ] Create demo scenario with tasks
- [ ] Set up cron jobs
- [ ] Build HubSpot dashboard
- [ ] Test full pipeline
```

---

## 🤖 Agent Implementation

### Directory Structure
```bash
SF-hackaton/
├── agents/
│   ├── task_monitor.sh      # Monitors and dispatches tasks
│   ├── lead_qualifier.sh    # Handles qualification tasks
│   ├── outreach_agent.sh    # Handles outreach tasks
│   └── data_enricher.sh     # Handles enrichment tasks
├── logs/
│   └── agent_activity.log
└── setup.sh
```

---

## 📝 Agent Scripts

### Task Monitor (`task_monitor.sh`)
```bash
#!/bin/bash
# Runs every minute via cron
# Checks for new tasks and triggers appropriate agents

# Get all open tasks assigned to "AI-Agents"
TASKS=$(~/claude-eng --mcp hubspot --print "get all open tasks assigned to AI-Agents")

echo "$TASKS" | while read -r task; do
    TASK_TYPE=$(echo "$task" | grep -oP '"subject":".*?"' | cut -d'"' -f4)
    TASK_ID=$(echo "$task" | grep -oP '"id":".*?"' | cut -d'"' -f4)
    
    case "$TASK_TYPE" in
        "Qualify Lead"*)
            ./agents/lead_qualifier.sh "$TASK_ID"
            ;;
        "Send Outreach"*)
            ./agents/outreach_agent.sh "$TASK_ID"
            ;;
        "Enrich Data"*)
            ./agents/data_enricher.sh "$TASK_ID"
            ;;
    esac
    
    # Mark task as in-progress
    ~/claude-eng --mcp hubspot --print "update task $TASK_ID status to in-progress"
done
```

### Lead Qualifier Agent (`lead_qualifier.sh`)
```bash
#!/bin/bash
# Processes "Qualify Lead" tasks

TASK_ID=$1

# Get task details and associated lead
TASK_DATA=$(~/claude-eng --mcp hubspot --print "get task $TASK_ID with associated contact")
LEAD_ID=$(echo "$TASK_DATA" | grep -oP '"contactId":".*?"' | cut -d'"' -f4)
LEAD_INFO=$(~/claude-eng --mcp hubspot --print "get contact $LEAD_ID full details")

# Score the lead using Claude
SCORE=$(~/claude-eng --print "Score this lead 1-100 for sales potential. Return only the number: $LEAD_INFO")

# Update lead score in HubSpot
~/claude-eng --mcp hubspot --print "update contact $LEAD_ID property lead_score to $SCORE"

# Complete the qualification task
~/claude-eng --mcp hubspot --print "complete task $TASK_ID with note: Lead scored $SCORE"

# Create follow-up tasks based on score
if [ "$SCORE" -gt 70 ]; then
    # High score - create outreach task
    ~/claude-eng --mcp hubspot --print "create task 'Send Outreach to $LEAD_ID' assigned to AI-Agents due in 1 hour"
    
    # Also create enrichment task for better personalization
    ~/claude-eng --mcp hubspot --print "create task 'Enrich Data for $LEAD_ID' assigned to AI-Agents due now"
elif [ "$SCORE" -gt 40 ]; then
    # Medium score - just enrich data first
    ~/claude-eng --mcp hubspot --print "create task 'Enrich Data for $LEAD_ID' assigned to AI-Agents due in 2 hours"
else
    # Low score - create nurture task
    ~/claude-eng --mcp hubspot --print "create task 'Add to Nurture Campaign $LEAD_ID' assigned to Marketing due in 1 day"
fi

echo "$(date): Qualified lead $LEAD_ID with score $SCORE" >> logs/agent_activity.log
```

### Outreach Agent (`outreach_agent.sh`)
```bash
#!/bin/bash
# Processes "Send Outreach" tasks

TASK_ID=$1

# Get task and lead details
TASK_DATA=$(~/claude-eng --mcp hubspot --print "get task $TASK_ID with associated contact")
LEAD_ID=$(echo "$TASK_DATA" | grep -oP '"contactId":".*?"' | cut -d'"' -f4)
LEAD_INFO=$(~/claude-eng --mcp hubspot --print "get contact $LEAD_ID including company and recent activities")

# Generate personalized email
EMAIL_CONTENT=$(~/claude-eng --print "Write a short, personalized sales email based on this lead data. Make it feel human and reference specific details: $LEAD_INFO")

# Send email via HubSpot
~/claude-eng --mcp hubspot --print "send email from sales@company.com to contact $LEAD_ID with content: $EMAIL_CONTENT"

# Log email as activity
~/claude-eng --mcp hubspot --print "log email activity for contact $LEAD_ID"

# Complete the outreach task
~/claude-eng --mcp hubspot --print "complete task $TASK_ID with note: Personalized email sent"

# Create follow-up task
~/claude-eng --mcp hubspot --print "create task 'Follow up with $LEAD_ID if no response' assigned to AI-Agents due in 3 days"

# If high-value lead, create a call task for human
SCORE=$(~/claude-eng --mcp hubspot --print "get contact $LEAD_ID property lead_score")
if [ "$SCORE" -gt 85 ]; then
    ~/claude-eng --mcp hubspot --print "create task 'Schedule call with $LEAD_ID' assigned to Sales Team due tomorrow"
fi

echo "$(date): Sent outreach to lead $LEAD_ID" >> logs/agent_activity.log
```

### Data Enrichment Agent (`data_enricher.sh`)
```bash
#!/bin/bash
# Processes "Enrich Data" tasks

TASK_ID=$1

# Get task and lead details
TASK_DATA=$(~/claude-eng --mcp hubspot --print "get task $TASK_ID with associated contact")
LEAD_ID=$(echo "$TASK_DATA" | grep -oP '"contactId":".*?"' | cut -d'"' -f4)
LEAD_INFO=$(~/claude-eng --mcp hubspot --print "get contact $LEAD_ID")

# Extract what we have
EMAIL=$(echo "$LEAD_INFO" | grep -oP '"email":".*?"' | cut -d'"' -f4)
COMPANY=$(echo "$LEAD_INFO" | grep -oP '"company":".*?"' | cut -d'"' -f4)

# Enrich missing data using Claude's knowledge
if [ -z "$COMPANY" ]; then
    COMPANY_INFO=$(~/claude-eng --print "Based on email domain $EMAIL, identify the company name and industry. Return as JSON.")
    ~/claude-eng --mcp hubspot --print "update contact $LEAD_ID properties: $COMPANY_INFO"
fi

# Get role and seniority
ENRICHED=$(~/claude-eng --print "Based on this info, determine likely job role, seniority level, and pain points. Return as JSON: $LEAD_INFO")

# Update HubSpot with enriched data
~/claude-eng --mcp hubspot --print "update contact $LEAD_ID with enriched data: $ENRICHED"

# Complete enrichment task
~/claude-eng --mcp hubspot --print "complete task $TASK_ID with note: Data enriched successfully"

# Create qualification task if this was a new lead
if [[ "$TASK_DATA" == *"New Lead"* ]]; then
    ~/claude-eng --mcp hubspot --print "create task 'Qualify Lead $LEAD_ID' assigned to AI-Agents due now"
fi

echo "$(date): Enriched data for lead $LEAD_ID" >> logs/agent_activity.log
```

---

## ⚙️ Cron Configuration

### Simple Cron Setup
```bash
# Each agent polls for its tasks every minute
* * * * * cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton && ./agents/task_monitor.sh

# Backup: Direct agent runs every 5 minutes
*/5 * * * * cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton && ./agents/lead_qualifier.sh CHECK_QUEUE
*/5 * * * * cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton && ./agents/outreach_agent.sh CHECK_QUEUE
*/5 * * * * cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton && ./agents/data_enricher.sh CHECK_QUEUE
```

---

## 📊 HubSpot Task Workflows

### Initial Task Creation (Trigger Points)
1. **New Contact Created** → Creates task: "Enrich Data for [Contact]"
2. **Form Submission** → Creates task: "Qualify Lead [Contact]"
3. **Email Opened** → Creates task: "Send Follow-up to [Contact]"
4. **Score Changes** → Creates task: "Review Lead Priority [Contact]"

### Task Types and Owners
```
Task Subject Format: "[Action] [Entity ID] [Priority]"
Examples:
- "Qualify Lead C-12345 HIGH"
- "Send Outreach C-12345 MEDIUM"
- "Enrich Data C-12345 LOW"

Task Assignment:
- "AI-Agents" = Processed by our shell scripts
- "Sales Team" = Human intervention needed
- "Marketing" = Nurture campaigns
```

### Task Status Flow
```
Open → In Progress → Completed
         ↓
      Failed → Retry → Escalate to Human
```

---

## 🖥️ Monitoring Dashboard

### HubSpot Native Dashboard
Instead of building a custom dashboard, use HubSpot's built-in reporting:

1. **Task Queue Dashboard**
   - Open tasks by type
   - Completed tasks (last 24h)
   - Average completion time
   - Failed tasks needing attention

2. **Lead Processing Metrics**
   - Leads qualified today
   - Emails sent by agents
   - Average lead score
   - Conversion funnel

3. **Activity Feed**
   - Real-time task completions
   - Agent actions log
   - Error notifications

### Quick View Script (`status.sh`)
```bash
#!/bin/bash
# Quick status check

echo "=== SalesSwarm AI Status ==="
echo "Active Tasks:"
~/claude-eng --mcp hubspot --print "count open tasks assigned to AI-Agents"

echo "Completed Today:"
~/claude-eng --mcp hubspot --print "count tasks completed today by AI-Agents"

echo "Leads Processed:"
~/claude-eng --mcp hubspot --print "count contacts modified today"

echo "Recent Activity:"
tail -5 logs/agent_activity.log
```

---

## 🚀 Setup Script

### One-Command Setup (`setup.sh`)
```bash
#!/bin/bash
echo "🚀 Setting up SalesSwarm AI with HubSpot Task Coordination..."

# Create directories
mkdir -p agents logs

# Create AI-Agents user in HubSpot
~/claude-eng --mcp hubspot --print "create user 'AI-Agents' with email ai@company.com"

# Create task lists/queues
~/claude-eng --mcp hubspot --print "create task queue 'AI Processing Queue'"
~/claude-eng --mcp hubspot --print "create task queue 'Human Review Queue'"

# Set up workflows for auto-task creation
~/claude-eng --mcp hubspot --print "create workflow: when contact created, create task 'Enrich Data for [contact]' assigned to AI-Agents"
~/claude-eng --mcp hubspot --print "create workflow: when form submitted, create task 'Qualify Lead [contact]' assigned to AI-Agents"

# Make scripts executable
chmod +x agents/*.sh

# Test HubSpot connection
~/claude-eng --mcp hubspot --print "test connection and list first 5 contacts"

# Set up cron
(crontab -l 2>/dev/null; echo "* * * * * cd $(pwd) && ./agents/task_monitor.sh") | crontab -

# Create initial test task
~/claude-eng --mcp hubspot --print "create task 'Test Task - Qualify Lead TEST-001' assigned to AI-Agents due now"

echo "✅ Setup complete! Agents will process HubSpot tasks every minute."
echo "📊 View progress in HubSpot's task dashboard"
```

---

## 📊 Demo Strategy

### Live Demo Flow (3-5 minutes)

1. **Show HubSpot Task Queue** (30 sec)
   - Multiple pending tasks assigned to AI-Agents
   - Different task types visible

2. **Create New Lead Live** (30 sec)
   - Add contact in HubSpot
   - Show automatic task creation

3. **Watch Agent Process Tasks** (2 min)
   - Run `tail -f logs/agent_activity.log`
   - Show tasks moving from Open → In Progress → Complete
   - Show new follow-up tasks being created

4. **Show Results in HubSpot** (1 min)
   - Lead scores updated
   - Emails sent
   - Tasks completed with notes

5. **Explain Scale** (30 sec)
   - "This runs 24/7 without human intervention"
   - "Processes hundreds of leads per hour"

### Key Selling Points
- **HubSpot Native:** Uses HubSpot's own task system for coordination
- **Self-Organizing:** Agents create tasks for each other
- **Audit Trail:** Every action logged as HubSpot activity
- **Human Handoff:** High-value leads escalated automatically
- **Zero Infrastructure:** Just cron + shell + Claude

---

## 🎯 Why This Architecture Wins

### Technical Elegance
- HubSpot as distributed message queue
- Tasks as state machine
- No external dependencies
- Self-healing through task retries

### Business Value
- Works with existing HubSpot workflows
- Sales teams already understand tasks
- Built-in reporting and analytics
- Easy to modify task rules

### Judge Appeal
- **Clever use of existing tools**
- **Distributed systems thinking**
- **Production-ready approach**
- **Clear business impact**

---

## 🚨 Quick Debug Commands

```bash
# Check if agents are running
ps aux | grep agent

# See all AI-Agent tasks
~/claude-eng --mcp hubspot --print "list all tasks assigned to AI-Agents"

# Manually trigger task processing
./agents/task_monitor.sh

# Clear stuck tasks
~/claude-eng --mcp hubspot --print "close all tasks older than 1 day assigned to AI-Agents"

# View agent logs
tail -f logs/agent_activity.log

# Test individual agent
./agents/lead_qualifier.sh "TASK-ID-123"
```

---

## 💡 Advanced Features (If Time Permits)

### Task Priority Queue
```bash
# Process high-priority tasks first
TASKS=$(~/claude-eng --mcp hubspot --print "get tasks ordered by priority")
```

### Task Dependencies
```bash
# Create linked tasks
~/claude-eng --mcp hubspot --print "create task 'Step 2' depends on task 'Step 1'"
```

### Batch Processing
```bash
# Process multiple similar tasks at once
~/claude-eng --mcp hubspot --print "get all 'Qualify Lead' tasks" | xargs -P 5 ./agents/lead_qualifier.sh
```

---

## 🏆 Final Notes

**Remember:**
- HubSpot tasks = Perfect message queue
- Shell scripts = Maximum simplicity
- Claude CLI = AI power
- Working demo > Complex architecture

**Mantra:** "Use what's already there - HubSpot IS our infrastructure!"