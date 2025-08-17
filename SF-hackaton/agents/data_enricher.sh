#!/bin/bash
source ~/.zshrc

# Data Enricher Agent - Enriches contact and company data using web scraping
# Called by task_monitor.sh with task ID and JSON data

TASK_ID=$1
TASK_DATA=$2
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/../logs/data_enricher.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "$(date): Starting data enrichment for task $TASK_ID" >> "$LOG_FILE"

# Extract contact IDs from task data
CONTACT_IDS=$(echo "$TASK_DATA" | jq -r '.contactIds[]' 2>/dev/null | head -1)

if [ -z "$CONTACT_IDS" ]; then
    echo "$(date): No contact ID found in task $TASK_ID" >> "$LOG_FILE"
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, update task with ID $TASK_ID:
    - Set status to 'WAITING'
    - Add note: 'Data Enricher: No contact associated with task'
    Return 'OK' when done.
    " > /dev/null 2>&1
    exit 1
fi

echo "$(date): Enriching data for contact $CONTACT_IDS" >> "$LOG_FILE"

# Fetch and enrich contact data
ENRICHMENT_RESULT=$(~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using HubSpot MCP and Puppeteer tools:

1. First, fetch contact with ID: $CONTACT_IDS from HubSpot
2. Get their email, name, and company information

3. If company website is available, use Puppeteer to:
   - Navigate to the company website
   - Extract key information:
     * Company description/about
     * Industry/sector
     * Employee count indicators
     * Technology stack (if visible)
     * Recent news or updates
   - Take a screenshot of the homepage

4. Search for the contact on LinkedIn (if email/name available):
   - Look for job title confirmation
   - Years at company
   - Previous experience
   - Skills and endorsements

5. Compile enriched data and return as JSON:
{
  \"contact_name\": \"<full name>\",
  \"email\": \"<email>\",
  \"company_name\": \"<company>\",
  \"company_website\": \"<website>\",
  \"enriched_data\": {
    \"verified_title\": \"<title from LinkedIn>\",
    \"company_size\": \"<estimated size>\",
    \"industry\": \"<industry>\",
    \"technologies\": [\"<tech1>\", \"<tech2>\"],
    \"recent_news\": \"<any recent updates>\",
    \"linkedin_profile\": \"<LinkedIn URL if found>\",
    \"decision_maker_score\": <1-10>,
    \"enrichment_quality\": \"HIGH|MEDIUM|LOW\"
  },
  \"data_gaps\": [\"<missing field1>\", \"<missing field2>\"],
  \"recommended_action\": \"<next step based on findings>\"
}

Only return the JSON, no other text.
" 2>/dev/null)

# Parse enrichment results
CONTACT_NAME=$(echo "$ENRICHMENT_RESULT" | jq -r '.contact_name' 2>/dev/null)
COMPANY_NAME=$(echo "$ENRICHMENT_RESULT" | jq -r '.company_name' 2>/dev/null)
ENRICHED_TITLE=$(echo "$ENRICHMENT_RESULT" | jq -r '.enriched_data.verified_title' 2>/dev/null)
COMPANY_SIZE=$(echo "$ENRICHMENT_RESULT" | jq -r '.enriched_data.company_size' 2>/dev/null)
INDUSTRY=$(echo "$ENRICHMENT_RESULT" | jq -r '.enriched_data.industry' 2>/dev/null)
LINKEDIN_URL=$(echo "$ENRICHMENT_RESULT" | jq -r '.enriched_data.linkedin_profile' 2>/dev/null)
DM_SCORE=$(echo "$ENRICHMENT_RESULT" | jq -r '.enriched_data.decision_maker_score' 2>/dev/null)
QUALITY=$(echo "$ENRICHMENT_RESULT" | jq -r '.enriched_data.enrichment_quality' 2>/dev/null)
NEXT_ACTION=$(echo "$ENRICHMENT_RESULT" | jq -r '.recommended_action' 2>/dev/null)
DATA_GAPS=$(echo "$ENRICHMENT_RESULT" | jq -r '.data_gaps | join(", ")' 2>/dev/null)

echo "$(date): Enrichment completed - Quality: $QUALITY, DM Score: $DM_SCORE" >> "$LOG_FILE"

# Update HubSpot contact with enriched data
~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
Using HubSpot MCP tools:

1. Update contact ID $CONTACT_IDS with enriched properties:
   - jobtitle: '$ENRICHED_TITLE'
   - company_size: '$COMPANY_SIZE'
   - industry: '$INDUSTRY'
   - linkedin_profile: '$LINKEDIN_URL'
   - decision_maker_score: $DM_SCORE
   - data_enrichment_date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
   - data_quality: '$QUALITY'
   - enrichment_notes: 'Automated enrichment completed. Gaps: $DATA_GAPS'

2. Create a NOTE engagement:
   - Subject: 'Data Enrichment Report'
   - Body: 'Contact enriched successfully.
     
     Verified Title: $ENRICHED_TITLE
     Company Size: $COMPANY_SIZE
     Industry: $INDUSTRY
     Decision Maker Score: $DM_SCORE/10
     Data Quality: $QUALITY
     LinkedIn: $LINKEDIN_URL
     
     Missing Data: $DATA_GAPS
     Recommended Action: $NEXT_ACTION'

3. Update task ID $TASK_ID:
   - Set status to 'COMPLETED'
   - Add note: 'Enrichment complete for $CONTACT_NAME. Quality: $QUALITY, DM Score: $DM_SCORE/10'

Return 'OK' when done.
" > /dev/null 2>&1

# Create follow-up task based on enrichment results
if [ "$DM_SCORE" -ge 7 ] && [ "$QUALITY" = "HIGH" ]; then
    echo "$(date): High-value contact identified, creating qualification task" >> "$LOG_FILE"
    
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Qualify Lead - High Value: $CONTACT_NAME'
    - Notes: 'Enrichment identified high-value contact. DM Score: $DM_SCORE/10. Title: $ENRICHED_TITLE at $COMPANY_NAME ($COMPANY_SIZE, $INDUSTRY)'
    - Due date: Today
    - Associated with contact ID: $CONTACT_IDS
    - Priority: HIGH
    
    Return 'OK' when done.
    " > /dev/null 2>&1
    
elif [ "$QUALITY" = "LOW" ] || [ -n "$DATA_GAPS" ]; then
    echo "$(date): Data gaps identified, may need manual review" >> "$LOG_FILE"
    
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Manual Review Needed: $CONTACT_NAME'
    - Notes: 'Automated enrichment incomplete. Missing: $DATA_GAPS. Quality: $QUALITY'
    - Due date: Next week
    - Associated with contact ID: $CONTACT_IDS
    - Priority: LOW
    
    Return 'OK' when done.
    " > /dev/null 2>&1
else
    echo "$(date): Standard contact, creating qualification task" >> "$LOG_FILE"
    
    ~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/.mcp.json --print "
    Using HubSpot MCP tools, create a new task:
    - Subject: 'Qualify Lead: $CONTACT_NAME'
    - Notes: 'Enrichment complete. DM Score: $DM_SCORE/10. Ready for qualification.'
    - Due date: Tomorrow
    - Associated with contact ID: $CONTACT_IDS
    - Priority: MEDIUM
    
    Return 'OK' when done.
    " > /dev/null 2>&1
fi

echo "$(date): Data enrichment completed for task $TASK_ID" >> "$LOG_FILE"
echo "$(date): SUCCESS - Contact: $CONTACT_NAME, Quality: $QUALITY, DM Score: $DM_SCORE, Gaps: $DATA_GAPS" >> "$LOG_FILE"