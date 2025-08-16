#!/bin/bash
source ~/.zshrc

# Task Monitor Agent - Watches HubSpot for new tasks and dispatches to appropriate agents
# Runs every minute via cron

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/../logs/task_monitor.log"
LOCK_FILE="/tmp/task_monitor.lock"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Prevent multiple instances
if [ -f "$LOCK_FILE" ]; then
    pid=$(cat "$LOCK_FILE")
    if ps -p $pid > /dev/null 2>&1; then
        echo "$(date): Task monitor already running (PID: $pid)" >> "$LOG_FILE"
        exit 0
    fi
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

echo "$(date): Starting task monitor scan..." >> "$LOG_FILE"

# Query HubSpot for tasks assigned to AI-Agents using MCP
TASKS_JSON=$(~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using the HubSpot MCP tools, search for tasks that meet these criteria:
1. Status is 'NOT_STARTED' or 'WAITING' 
2. Subject contains one of: 'Qualify Lead', 'Send Outreach', 'Enrich Data'
3. Return the task IDs, subjects, and any associated contact/company IDs

Format the response as a JSON array with objects containing: id, subject, status, contactIds, companyIds
Only return the JSON, no other text.
" 2>/dev/null)

# Check if we got valid JSON
if [ -z "$TASKS_JSON" ] || [ "$TASKS_JSON" = "null" ]; then
    echo "$(date): No pending tasks found or error querying HubSpot" >> "$LOG_FILE"
    exit 0
fi

# Process each task
echo "$TASKS_JSON" | jq -c '.[]' 2>/dev/null | while read -r task; do
    TASK_ID=$(echo "$task" | jq -r '.id')
    SUBJECT=$(echo "$task" | jq -r '.subject')
    
    echo "$(date): Processing task $TASK_ID: $SUBJECT" >> "$LOG_FILE"
    
    # Mark task as in-progress
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, update task with ID $TASK_ID:
    - Set status to 'IN_PROGRESS'
    - Add a note: 'AI Agent processing started at $(date)'
    Confirm when done with 'OK'.
    " > /dev/null 2>&1
    
    # Dispatch to appropriate agent based on subject
    if echo "$SUBJECT" | grep -qi "qualify lead"; then
        echo "$(date): Dispatching to lead_qualifier.sh for task $TASK_ID" >> "$LOG_FILE"
        "$SCRIPT_DIR/lead_qualifier.sh" "$TASK_ID" "$task" &
        
    elif echo "$SUBJECT" | grep -qi "send outreach"; then
        echo "$(date): Dispatching to outreach_agent.sh for task $TASK_ID" >> "$LOG_FILE"
        "$SCRIPT_DIR/outreach_agent.sh" "$TASK_ID" "$task" &
        
    elif echo "$SUBJECT" | grep -qi "enrich data"; then
        echo "$(date): Dispatching to data_enricher.sh for task $TASK_ID" >> "$LOG_FILE"
        "$SCRIPT_DIR/data_enricher.sh" "$TASK_ID" "$task" &
        
    else
        echo "$(date): Unknown task type for $TASK_ID: $SUBJECT" >> "$LOG_FILE"
        # Mark as needing human review
        ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
        Using HubSpot MCP tools, update task with ID $TASK_ID:
        - Set status to 'WAITING'
        - Add a note: 'AI Agent: Unknown task type, needs human review'
        Confirm when done with 'OK'.
        " > /dev/null 2>&1
    fi
done

echo "$(date): Task monitor scan completed" >> "$LOG_FILE"