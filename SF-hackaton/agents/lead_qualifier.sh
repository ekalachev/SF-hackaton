#!/bin/bash
source ~/.zshrc

# Lead Qualifier Agent - Analyzes and scores leads based on multiple criteria
# Called by task_monitor.sh with task ID and JSON data

TASK_ID=$1
TASK_DATA=$2
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/../logs/lead_qualifier.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "$(date): Qualifying lead for task $TASK_ID" >> "$LOG_FILE"

# Extract contact IDs from task data
CONTACT_IDS=$(echo "$TASK_DATA" | jq -r '.contactIds[]' 2>/dev/null | head -1)

if [ -z "$CONTACT_IDS" ]; then
    echo "$(date): No contact ID found in task $TASK_ID" >> "$LOG_FILE"
    # Mark task as failed
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, update task with ID $TASK_ID:
    - Set status to 'WAITING'
    - Add note: 'Lead Qualifier: No contact associated with task'
    Return 'OK' when done.
    " > /dev/null 2>&1
    exit 1
fi

# Fetch contact details and qualify
QUALIFICATION_RESULT=$(~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using HubSpot MCP tools:

1. Fetch the contact with ID: $CONTACT_IDS
2. Also fetch any associated company information

Based on the contact and company data, create a lead qualification score (1-100) considering:
- Job title/seniority (C-level=+30, VP=+25, Director=+20, Manager=+15)
- Company size (Enterprise 1000+=+25, Mid-market 100-999=+20, SMB <100=+15)
- Industry fit (Tech/SaaS=+20, Finance=+15, Other B2B=+10)
- Contact completeness (Email=+10, Phone=+5, LinkedIn=+5)
- Engagement signals (Recent website visit=+10, Email opens=+5)

Return a JSON object with:
{
  \"score\": <number>,
  \"tier\": \"HOT\" | \"WARM\" | \"COLD\",
  \"reasoning\": \"<brief explanation>\",
  \"next_action\": \"<recommended action>\",
  \"contact_name\": \"<full name>\",
  \"company_name\": \"<company if available>\",
  \"title\": \"<job title if available>\"
}

Score thresholds: HOT (80+), WARM (50-79), COLD (<50)
Only return the JSON, no other text.
" 2>/dev/null)

# Parse the qualification result
SCORE=$(echo "$QUALIFICATION_RESULT" | jq -r '.score' 2>/dev/null)
TIER=$(echo "$QUALIFICATION_RESULT" | jq -r '.tier' 2>/dev/null)
REASONING=$(echo "$QUALIFICATION_RESULT" | jq -r '.reasoning' 2>/dev/null)
NEXT_ACTION=$(echo "$QUALIFICATION_RESULT" | jq -r '.next_action' 2>/dev/null)
CONTACT_NAME=$(echo "$QUALIFICATION_RESULT" | jq -r '.contact_name' 2>/dev/null)

echo "$(date): Lead qualified - Score: $SCORE, Tier: $TIER" >> "$LOG_FILE"

# Update contact with qualification data
~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using HubSpot MCP tools:

1. Update contact ID $CONTACT_IDS with these properties:
   - lead_score: $SCORE
   - lead_tier: $TIER
   - lead_qualification_date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
   - lead_qualification_notes: '$REASONING'

2. Update task ID $TASK_ID:
   - Set status to 'COMPLETED'
   - Add completion note: 'Lead Qualified: $CONTACT_NAME scored $SCORE ($TIER). $REASONING $NEXT_ACTION'

Return 'OK' when done.
" > /dev/null 2>&1

# Create follow-up task based on tier
if [ "$TIER" = "HOT" ]; then
    echo "$(date): Creating high-priority outreach task for HOT lead" >> "$LOG_FILE"
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Send Outreach - HOT Lead: $CONTACT_NAME'
    - Notes: 'High-priority prospect. Score: $SCORE. $REASONING'
    - Due date: Today
    - Associated with contact ID: $CONTACT_IDS
    - Priority: HIGH
    
    Return 'OK' when done.
    " > /dev/null 2>&1
    
elif [ "$TIER" = "WARM" ]; then
    echo "$(date): Creating standard outreach task for WARM lead" >> "$LOG_FILE"
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Send Outreach - WARM Lead: $CONTACT_NAME'
    - Notes: 'Promising prospect. Score: $SCORE. $REASONING'
    - Due date: Tomorrow
    - Associated with contact ID: $CONTACT_IDS
    - Priority: MEDIUM
    
    Return 'OK' when done.
    " > /dev/null 2>&1
    
else
    echo "$(date): Creating nurture task for COLD lead" >> "$LOG_FILE"
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Enrich Data - COLD Lead: $CONTACT_NAME'
    - Notes: 'Needs more information. Score: $SCORE. $REASONING'
    - Due date: Next week
    - Associated with contact ID: $CONTACT_IDS
    - Priority: LOW
    
    Return 'OK' when done.
    " > /dev/null 2>&1
fi

echo "$(date): Lead qualification completed for task $TASK_ID" >> "$LOG_FILE"