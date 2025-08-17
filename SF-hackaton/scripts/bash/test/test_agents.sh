#!/bin/bash
source ~/.zshrc

# Test script to create sample tasks in HubSpot for agent processing
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== HubSpot Agent Swarm Test Suite ==="
echo "This will create test tasks in HubSpot to validate the agent swarm"
echo ""

# Function to create a test contact
create_test_contact() {
    local NAME=$1
    local EMAIL=$2
    local TITLE=$3
    local COMPANY=$4
    
    echo "Creating test contact: $NAME..."
    
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new contact with:
    - firstname: '${NAME%% *}'
    - lastname: '${NAME#* }'
    - email: '$EMAIL'
    - jobtitle: '$TITLE'
    - company: '$COMPANY'
    
    Return only the contact ID as a number.
    " 2>/dev/null
}

# Function to create a test task
create_test_task() {
    local SUBJECT=$1
    local CONTACT_ID=$2
    local NOTES=$3
    
    echo "Creating task: $SUBJECT for contact $CONTACT_ID..."
    
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: '$SUBJECT'
    - Notes: '$NOTES'
    - Status: 'NOT_STARTED'
    - Due date: Today
    - Associated with contact ID: $CONTACT_ID
    
    Return 'OK' when done.
    " > /dev/null 2>&1
}

echo "Step 1: Creating test contacts..."
echo "--------------------------------"

# Create test contacts
CONTACT1=$(create_test_contact "John Smith" "john.smith@techcorp.com" "VP of Sales" "TechCorp Inc")
echo "Created contact 1: ID $CONTACT1"

CONTACT2=$(create_test_contact "Sarah Johnson" "sarah@startupx.io" "CEO" "StartupX")
echo "Created contact 2: ID $CONTACT2"

CONTACT3=$(create_test_contact "Mike Wilson" "mwilson@enterprise.com" "IT Manager" "Enterprise Solutions")
echo "Created contact 3: ID $CONTACT3"

echo ""
echo "Step 2: Creating test tasks..."
echo "-----------------------------"

# Create qualification tasks
create_test_task "Qualify Lead - New prospect from website" "$CONTACT1" "Inbound lead from demo request form"
echo "✓ Created qualification task for John Smith"

create_test_task "Qualify Lead - Conference attendee" "$CONTACT2" "Met at AI Summit 2025"
echo "✓ Created qualification task for Sarah Johnson"

# Create enrichment task
create_test_task "Enrich Data - Missing company info" "$CONTACT3" "Need to gather more company details"
echo "✓ Created enrichment task for Mike Wilson"

echo ""
echo "Step 3: Manual trigger test (optional)..."
echo "-----------------------------------------"
echo "You can manually trigger the task monitor now:"
echo "  $SCRIPT_DIR/agents/task_monitor.sh"
echo ""
echo "Or wait for the cron job to pick them up (runs every minute)"
echo ""

echo "Step 4: Monitoring..."
echo "--------------------"
echo "Watch the logs with:"
echo "  tail -f $SCRIPT_DIR/logs/*.log"
echo ""
echo "Check HubSpot for:"
echo "- Tasks changing status (NOT_STARTED → IN_PROGRESS → COMPLETED)"
echo "- Contacts getting enriched with scores and qualification data"
echo "- New follow-up tasks being created"
echo "- Notes/engagements being added to contacts"
echo ""

echo "=== Test setup complete! ==="