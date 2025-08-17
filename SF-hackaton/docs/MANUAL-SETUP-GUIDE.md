# 📋 Manual Setup Guide for SalesSwarm AI Hackathon

**Author:** Alex Fedin | [O2.services](https://O2.services) | [LinkedIn](https://linkedin.com/in/alex-fedin)

## Overview
This guide contains all the manual steps YOU need to complete to set up the HubSpot integration and get the AI agent swarm running for the hackathon. Follow these steps in order.

**Time Required:** ~30-45 minutes  
**Prerequisites:** Mac/Linux system, HubSpot account, Node.js installed

---

## 📍 Pre-Hackathon Setup (Do This Before August 16)

### Step 1: HubSpot Account Setup

#### 1.1 Create a HubSpot Private App (Required - API Keys are Deprecated!)

> ⚠️ **Important:** HubSpot deprecated API keys on November 30, 2022. You MUST use Private Apps with Bearer token authentication.

1. **Log into HubSpot** at https://app.hubspot.com
2. Navigate to **Settings** (gear icon in top right)
3. Go to **Integrations** → **Private Apps**
4. Click **Create a private app**
5. **Basic Info Tab:**
   - Name: `SalesSwarm AI Agents`
   - Description: `Automated lead processing and outreach agents`
6. **Scopes Tab** - Enable these permissions:
   - **CRM:**
     - ✅ `crm.objects.contacts.read`
     - ✅ `crm.objects.contacts.write`
     - ✅ `crm.objects.companies.read`
     - ✅ `crm.objects.companies.write`
     - ✅ `crm.objects.deals.read`
     - ✅ `crm.objects.deals.write`
   - **Other Objects:**
     - ✅ `tasks` (all permissions)
     - ✅ `tickets` (read/write)
   - **Communication:**
     - ✅ `sales-email-read`
     - ✅ `transactional-email`
   - **Automation:**
     - ✅ `automation` (for workflows)
7. Click **Create app**
8. **IMPORTANT:** Copy your **Access Token** immediately
   - It starts with `pat-na-` (North America) or `pat-eu-` (Europe)
   - You'll only see it once! Save it securely.

#### 1.2 Set Environment Variables

Add to your `~/.zshrc` or `~/.bash_profile`:
```bash
# HubSpot Private App Access Token (NOT API Key!)
export HUBSPOT_ACCESS_TOKEN="pat-na-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Optional: If using region-specific endpoints
export HUBSPOT_REGION="na"  # or "eu" for Europe
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### Step 2: Install Required Software

#### 2.1 Install Node.js Dependencies
```bash
# Install HubSpot MCP server globally
npm install -g @modelcontextprotocol/server-hubspot

# Verify installation
npm list -g @modelcontextprotocol/server-hubspot
```

#### 2.2 Install Claude CLI (if not already installed)
```bash
# Check if claude-eng is available
which claude-eng

# If not found, install from: https://claude.ai/download
# Or use the appropriate installation method for your system
```

#### 2.3 Verify Git Flow
```bash
# Check if git flow is installed
git flow version

# If not installed on Mac:
brew install git-flow

# If not installed on Linux:
apt-get install git-flow  # Debian/Ubuntu
# or
yum install gitflow       # RHEL/CentOS
```

---

## 🏃 Hackathon Day Setup (August 16, 11:15 AM)

### Phase 1: Initial Configuration (11:15 - 11:35 AM)

#### Step 3: Configure MCP Server

```bash
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton

# Run the MCP setup script
./setup_mcp.sh

# If you get permission denied:
chmod +x setup_mcp.sh
./setup_mcp.sh
```

**Expected Output:**
- ✅ MCP configuration copied to Claude config directory
- ✅ Connection test instructions displayed

#### Step 4: Create HubSpot Entities

##### 4.1 Create Task Queues in HubSpot UI

1. Log into HubSpot
2. Go to **Sales** → **Tasks**
3. Click **Task queues** (or **Manage queues**)
4. Create these queues manually:
   - **Name:** `AI Processing Queue`  
     **Description:** Tasks for automated AI agent processing
   - **Name:** `Human Review Queue`  
     **Description:** Tasks requiring human intervention
   - **Name:** `Priority Queue`  
     **Description:** High-priority leads requiring immediate action

##### 4.2 Create AI-Agents User (Mock User)

Since HubSpot doesn't allow programmatic user creation, create a mock identity:

1. Go to **Settings** → **Users & Teams**
2. Use your own user account but create a naming convention
3. When creating tasks, prefix with `[AI]` to identify agent tasks

**Alternative:** Use HubSpot's **Teams** feature:
1. Create a team called `AI-Agents`
2. Assign tasks to this team

#### Step 5: Test HubSpot API Connection

You have two options for testing:

**Option A: Using curl with Bearer Token**
```bash
# Test 1: Basic connectivity
curl -X GET \
  https://api.hubapi.com/crm/v3/objects/contacts?limit=1 \
  -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN"

# Test 2: Get tasks
curl -X GET \
  https://api.hubapi.com/crm/v3/objects/tasks \
  -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN"

# Test 3: Create a test task
curl -X POST \
  https://api.hubapi.com/crm/v3/objects/tasks \
  -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "hs_task_subject": "Test Task - AI Agent",
      "hs_task_body": "This is a test task",
      "hs_task_status": "NOT_STARTED"
    }
  }'
```

**Option B: Using our helper script**
```bash
# Source the helper functions
source agents/hubspot_api_helper.sh

# Test functions
get_contacts
get_tasks
create_task "Test Task" "Test body" ""
```

**Troubleshooting:**
- If "401 Unauthorized": Check your access token is correct
- If "403 Forbidden": Check Private App has required scopes
- If "Token not found": Ensure HUBSPOT_ACCESS_TOKEN is exported
- If "Invalid token format": Token should start with `pat-na-` or `pat-eu-`
- If using EU account: Use `https://api.hubapi.eu` instead of `https://api.hubapi.com`

---

## 🤖 Phase 2: Agent Development (11:35 AM - 1:15 PM)

### Step 6: Create Sample Test Data

#### 6.1 Add Test Contacts in HubSpot

1. Go to **Contacts** in HubSpot
2. Click **Create contact**
3. Add 3-5 test contacts with varying data:

**Contact 1 - High Value Lead:**
```
Name: John Smith
Email: john@techcorp.com
Company: TechCorp
Title: CTO
Notes: Looking for sales automation
```

**Contact 2 - Medium Value Lead:**
```
Name: Sarah Johnson
Email: sarah@startup.io
Company: Startup.io
Title: Sales Manager
Notes: Interested in CRM integration
```

**Contact 3 - Low Value Lead:**
```
Name: Mike Wilson
Email: mike@gmail.com
Company: [blank]
Title: [blank]
Notes: Downloaded whitepaper
```

#### 6.2 Create Initial Tasks

For each contact, create a task in HubSpot:
1. Click on the contact
2. Click **Create task**
3. Use these templates:
   - `Qualify Lead [Contact Name]` → Assign to AI Processing Queue
   - `Enrich Data for [Contact Name]` → Assign to AI Processing Queue

### Step 7: Run Agent Scripts

```bash
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton

# Make all scripts executable
chmod +x agents/*.sh

# Test each agent manually first
./agents/lead_qualifier.sh "TASK-ID-HERE"
./agents/outreach_agent.sh "TASK-ID-HERE"
./agents/data_enricher.sh "TASK-ID-HERE"

# Once working, set up the monitor
./agents/task_monitor.sh
```

### Step 8: Set Up Cron Jobs

```bash
# Open crontab editor
crontab -e

# Add these lines (copy exactly):
* * * * * cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton && ./agents/task_monitor.sh >> logs/cron.log 2>&1
*/5 * * * * cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton && ./agents/lead_qualifier.sh CHECK_QUEUE >> logs/cron.log 2>&1

# Save and exit (in vim: press Esc, then :wq)

# Verify cron is set up
crontab -l
```

---

## 📊 Phase 3: Demo Preparation (1:15 - 2:15 PM)

### Step 9: Create Demo Scenario

#### 9.1 Prepare Demo Data

1. **Clear existing test data** in HubSpot
2. **Create fresh contacts** with realistic data
3. **Set up a sequence** of tasks that will process during demo

#### 9.2 Create Live Demo Script

```bash
# Create a demo runner script
cat > demo.sh << 'EOF'
#!/bin/bash
echo "🚀 SalesSwarm AI Demo Starting..."
echo "================================"
echo ""
echo "1. Creating new lead in HubSpot..."
~/claude-eng --mcp hubspot --print "create contact 'Demo User' email 'demo@company.com'"
echo ""
echo "2. Watching AI agents process..."
tail -f logs/agent_activity.log
EOF

chmod +x demo.sh
```

### Step 10: Monitor and Debug

#### 10.1 Watch Logs
```bash
# Terminal 1: Watch agent activity
tail -f logs/agent_activity.log

# Terminal 2: Watch cron execution
tail -f logs/cron.log

# Terminal 3: Monitor HubSpot tasks
watch -n 5 '~/claude-eng --mcp hubspot --print "count open tasks"'
```

#### 10.2 Common Issues and Fixes

| Issue | Solution |
|-------|----------|
| No tasks processing | Check cron is running: `ps aux \| grep cron` |
| API rate limit | Add sleep delays in scripts |
| Tasks not found | Verify task naming matches patterns |
| Claude CLI errors | Check MCP server is running |
| No logs | Create logs directory: `mkdir -p logs` |

---

## 🎯 Demo Day Checklist

### Before Demo (3:00 PM)
- [ ] Stop cron jobs temporarily: `crontab -e` (comment out lines)
- [ ] Clear logs: `echo "" > logs/agent_activity.log`
- [ ] Prepare 2-3 fresh test contacts
- [ ] Have HubSpot dashboard open in browser
- [ ] Test all commands work

### During Demo (3:30 PM)
1. Show empty HubSpot task queue
2. Create new contact live
3. Show task automatically created
4. Run `./agents/task_monitor.sh` manually
5. Show task being processed
6. Display enriched contact data
7. Show personalized email sent
8. Display metrics

### Backup Plan
If live demo fails, have screenshots ready:
- [ ] Screenshot of HubSpot task queue
- [ ] Screenshot of processed tasks
- [ ] Screenshot of enriched contacts
- [ ] Screenshot of sent emails
- [ ] Terminal output showing agent activity

---

## 🚀 Quick Command Reference

```bash
# Start everything
./setup.sh

# Test HubSpot connection
./test_hubspot_connection.sh

# Run agents manually
./agents/task_monitor.sh

# Check logs
tail -f logs/agent_activity.log

# Check cron
crontab -l

# Stop cron
crontab -r

# Create test task via CLI
~/claude-eng --mcp hubspot --print "create task 'Test' assigned to AI-Agents"

# Count processed tasks
~/claude-eng --mcp hubspot --print "count completed tasks today"
```

---

## 📞 Emergency Contacts

- **HubSpot API Docs:** https://developers.hubspot.com/docs/api/overview
- **MCP Documentation:** https://modelcontextprotocol.io/docs
- **Claude CLI Help:** `~/claude-eng --help`
- **Git Flow Help:** `git flow help`

---

## ✅ Success Criteria

You'll know everything is working when:
1. Cron jobs are running every minute
2. Tasks in HubSpot move from Open → In Progress → Completed
3. Logs show agent activity
4. Contacts get enriched with data
5. Emails are sent automatically

---

## 🎉 Final Tips

1. **Keep it simple** - Don't add complexity during the hackathon
2. **Test incrementally** - Verify each component works before moving on
3. **Have backups** - Screenshots and recorded demos as fallback
4. **Focus on the story** - Judges care more about problem/solution than perfect code
5. **Show business value** - Emphasize time saved and automation benefits

Good luck with the hackathon! 🚀