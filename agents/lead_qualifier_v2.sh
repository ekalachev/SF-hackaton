#!/bin/bash
# Lead Qualifier Agent - Using HubSpot Private App Bearer Token

# Source the API helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/hubspot_api_helper.sh"

# Check if running in task mode or queue mode
MODE="${1:-QUEUE}"
TASK_ID="$1"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Lead Qualifier Agent starting in $MODE mode"

# Function to score a lead based on data
score_lead() {
    local contact_json="$1"
    local score=0
    
    # Extract fields using jq (install with: brew install jq)
    local email=$(echo "$contact_json" | jq -r '.properties.email // ""')
    local company=$(echo "$contact_json" | jq -r '.properties.company // ""')
    local jobtitle=$(echo "$contact_json" | jq -r '.properties.jobtitle // ""')
    local website=$(echo "$contact_json" | jq -r '.properties.website // ""')
    
    # Scoring logic
    [[ -n "$email" ]] && score=$((score + 10))
    [[ "$email" == *"@gmail.com" || "$email" == *"@yahoo.com" ]] && score=$((score - 5))
    [[ -n "$company" ]] && score=$((score + 20))
    [[ -n "$jobtitle" ]] && score=$((score + 15))
    [[ "$jobtitle" == *"VP"* || "$jobtitle" == *"Director"* || "$jobtitle" == *"CTO"* || "$jobtitle" == *"CEO"* ]] && score=$((score + 25))
    [[ -n "$website" ]] && score=$((score + 10))
    
    # Use Claude for more sophisticated scoring (if available)
    if command -v ~/claude-eng &> /dev/null; then
        local claude_score=$(~/claude-eng --print "Score this lead 1-100 based on: Email: $email, Company: $company, Title: $jobtitle. Return only the number." 2>/dev/null)
        if [[ "$claude_score" =~ ^[0-9]+$ ]]; then
            score=$claude_score
        fi
    fi
    
    echo "$score"
}

# Function to process a single task
process_task() {
    local task_id="$1"
    
    echo "Processing task: $task_id"
    
    # Get task details
    local task_data=$(hubspot_api "GET" "/crm/v3/objects/tasks/$task_id")
    
    # Extract associated contact ID (would need proper parsing)
    local contact_id=$(echo "$task_data" | jq -r '.associations.contacts.results[0].id // ""')
    
    if [ -z "$contact_id" ]; then
        echo "No contact associated with task $task_id"
        return 1
    fi
    
    # Get contact details
    local contact_data=$(get_contact "$contact_id")
    
    # Score the lead
    local score=$(score_lead "$contact_data")
    echo "Lead scored: $score"
    
    # Update contact with score
    local update_data='{
        "properties": {
            "lead_score": "'$score'",
            "lead_status": "'$([ $score -gt 70 ] && echo "qualified" || echo "unqualified")'"
        }
    }'
    update_contact "$contact_id" "$update_data"
    
    # Update task as completed
    update_task "$task_id" "COMPLETED"
    
    # Create follow-up tasks based on score
    if [ $score -gt 70 ]; then
        echo "High-value lead detected, creating outreach task"
        create_task "Send Outreach to Contact $contact_id" "High-score lead requiring immediate outreach" "$contact_id"
    elif [ $score -gt 40 ]; then
        echo "Medium-value lead, scheduling for nurture"
        create_task "Nurture Contact $contact_id" "Medium-score lead for nurture campaign" "$contact_id"
    fi
    
    # Log activity
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Qualified lead $contact_id with score $score" >> ../logs/agent_activity.log
}

# Function to process queue
process_queue() {
    echo "Checking for qualification tasks..."
    
    # Get all open tasks
    local tasks=$(get_tasks)
    
    # Filter for qualification tasks (would need proper JSON parsing)
    local qualify_tasks=$(echo "$tasks" | jq -r '.results[] | select(.properties.hs_task_subject | startswith("Qualify Lead")) | .id')
    
    if [ -z "$qualify_tasks" ]; then
        echo "No qualification tasks found"
        return 0
    fi
    
    # Process each task
    while IFS= read -r task_id; do
        echo "Found qualification task: $task_id"
        process_task "$task_id"
        sleep 2  # Rate limiting
    done <<< "$qualify_tasks"
}

# Main execution
if [ "$MODE" == "QUEUE" ] || [ "$MODE" == "CHECK_QUEUE" ]; then
    process_queue
else
    # Assume it's a task ID
    process_task "$TASK_ID"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Lead Qualifier Agent completed"