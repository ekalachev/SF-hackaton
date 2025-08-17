#!/bin/bash
source ~/.zshrc

# Outreach Agent - Generates and sends personalized outreach messages
# Called by task_monitor.sh with task ID and JSON data

TASK_ID=$1
TASK_DATA=$2
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/../logs/outreach_agent.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "$(date): Starting outreach for task $TASK_ID" >> "$LOG_FILE"

# Extract contact IDs and task subject
CONTACT_IDS=$(echo "$TASK_DATA" | jq -r '.contactIds[]' 2>/dev/null | head -1)
SUBJECT=$(echo "$TASK_DATA" | jq -r '.subject' 2>/dev/null)

# Determine outreach priority from subject
PRIORITY="MEDIUM"
if echo "$SUBJECT" | grep -qi "HOT"; then
    PRIORITY="HIGH"
elif echo "$SUBJECT" | grep -qi "COLD"; then
    PRIORITY="LOW"
fi

if [ -z "$CONTACT_IDS" ]; then
    echo "$(date): No contact ID found in task $TASK_ID" >> "$LOG_FILE"
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, update task with ID $TASK_ID:
    - Set status to 'WAITING'
    - Add note: 'Outreach Agent: No contact associated with task'
    Return 'OK' when done.
    " > /dev/null 2>&1
    exit 1
fi

echo "$(date): Generating personalized outreach for contact $CONTACT_IDS (Priority: $PRIORITY)" >> "$LOG_FILE"

# Generate personalized outreach message
OUTREACH_CONTENT=$(~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using HubSpot MCP tools:

1. Fetch contact with ID: $CONTACT_IDS and any associated company
2. Based on the contact information, generate a personalized outreach strategy

Consider:
- Contact's name, title, and company
- Industry and company size
- Lead score and tier (if available)
- Priority level: $PRIORITY

Create outreach content based on priority:
- HIGH priority: Direct, value-focused message requesting a meeting this week
- MEDIUM priority: Educational content with soft CTA for discovery call
- LOW priority: Nurture content with helpful resources

Return a JSON object with:
{
  \"email_subject\": \"<compelling subject line>\",
  \"email_body\": \"<personalized HTML email body>\",
  \"follow_up_days\": <number>,
  \"contact_name\": \"<full name>\",
  \"company_name\": \"<company>\",
  \"personalization_notes\": \"<what made this personalized>\"
}

The email should be professional, concise, and include:
- Personal greeting using their name
- Reference to their company/role
- Clear value proposition
- Specific call to action
- Professional signature

Only return the JSON, no other text.
" 2>/dev/null)

# Parse the outreach content
EMAIL_SUBJECT=$(echo "$OUTREACH_CONTENT" | jq -r '.email_subject' 2>/dev/null)
EMAIL_BODY=$(echo "$OUTREACH_CONTENT" | jq -r '.email_body' 2>/dev/null)
FOLLOW_UP_DAYS=$(echo "$OUTREACH_CONTENT" | jq -r '.follow_up_days' 2>/dev/null)
CONTACT_NAME=$(echo "$OUTREACH_CONTENT" | jq -r '.contact_name' 2>/dev/null)
COMPANY_NAME=$(echo "$OUTREACH_CONTENT" | jq -r '.company_name' 2>/dev/null)
PERSONALIZATION=$(echo "$OUTREACH_CONTENT" | jq -r '.personalization_notes' 2>/dev/null)

echo "$(date): Generated outreach for $CONTACT_NAME at $COMPANY_NAME" >> "$LOG_FILE"

# Create engagement (email activity) in HubSpot
~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using HubSpot MCP tools:

1. Create a NOTE engagement for contact ID $CONTACT_IDS with:
   - Subject: 'Outreach Email Sent: $EMAIL_SUBJECT'
   - Body: Include the full email content that was generated:
     Subject: $EMAIL_SUBJECT
     
     $EMAIL_BODY
     
     ---
     Personalization: $PERSONALIZATION
     Follow-up scheduled: $FOLLOW_UP_DAYS days

2. Update contact ID $CONTACT_IDS:
   - last_outreach_date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
   - outreach_status: 'CONTACTED'
   - next_follow_up: $(date -u -v+${FOLLOW_UP_DAYS}d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+${FOLLOW_UP_DAYS} days" +%Y-%m-%dT%H:%M:%SZ)

3. Update task ID $TASK_ID:
   - Set status to 'COMPLETED'
   - Add note: 'Outreach sent to $CONTACT_NAME. Subject: $EMAIL_SUBJECT. Follow-up in $FOLLOW_UP_DAYS days.'

Return 'OK' when done.
" > /dev/null 2>&1

# Create follow-up task
if [ "$FOLLOW_UP_DAYS" -gt 0 ]; then
    echo "$(date): Creating follow-up task for $FOLLOW_UP_DAYS days from now" >> "$LOG_FILE"
    
    # Calculate follow-up date
    if [[ "$OSTYPE" == "darwin"* ]]; then
        FOLLOW_UP_DATE=$(date -v+${FOLLOW_UP_DAYS}d +%Y-%m-%d)
    else
        FOLLOW_UP_DATE=$(date -d "+${FOLLOW_UP_DAYS} days" +%Y-%m-%d)
    fi
    
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Follow-up Outreach: $CONTACT_NAME at $COMPANY_NAME'
    - Notes: 'Follow up on email sent $(date +%Y-%m-%d). Original subject: $EMAIL_SUBJECT'
    - Due date: $FOLLOW_UP_DATE
    - Associated with contact ID: $CONTACT_IDS
    - Priority: $([ "$PRIORITY" = "HIGH" ] && echo "HIGH" || echo "MEDIUM")
    
    Return 'OK' when done.
    " > /dev/null 2>&1
fi

echo "$(date): Outreach completed for task $TASK_ID" >> "$LOG_FILE"

# Log success metrics
echo "$(date): SUCCESS - Contact: $CONTACT_NAME, Company: $COMPANY_NAME, Priority: $PRIORITY, Follow-up: ${FOLLOW_UP_DAYS} days" >> "$LOG_FILE"