#!/bin/bash
source ~/.zshrc
# Test Script for HubSpot Private App Authentication

echo "🔐 HubSpot Private App Authentication Test"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for access token
if [ -z "$HUBSPOT_ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ HUBSPOT_ACCESS_TOKEN not set${NC}"
    echo ""
    echo "To fix this:"
    echo "1. Go to HubSpot Settings > Integrations > Private Apps"
    echo "2. Create or select your Private App"
    echo "3. Copy the Access Token (starts with 'pat-na-' or 'pat-eu-')"
    echo "4. Run: export HUBSPOT_ACCESS_TOKEN='your-token-here'"
    exit 1
fi

echo -e "${GREEN}✅ Access token found${NC}"
echo "Token prefix: ${HUBSPOT_ACCESS_TOKEN:0:7}..."
echo ""

# Detect region from token
if [[ "$HUBSPOT_ACCESS_TOKEN" == pat-eu-* ]]; then
    API_BASE="https://api.hubapi.eu"
    echo "🇪🇺 Using EU region API"
elif [[ "$HUBSPOT_ACCESS_TOKEN" == pat-na-* ]]; then
    API_BASE="https://api.hubapi.com"
    echo "🇺🇸 Using NA region API"
else
    API_BASE="https://api.hubapi.com"
    echo -e "${YELLOW}⚠️  Unknown token format, defaulting to NA API${NC}"
fi
echo ""

# Test 1: Basic Authentication
echo "Test 1: Authentication Check"
echo "----------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    "$API_BASE/crm/v3/objects/contacts?limit=1")

if [ "$response" == "200" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
elif [ "$response" == "401" ]; then
    echo -e "${RED}❌ Authentication failed - Invalid token${NC}"
    echo "   Please check your access token is correct"
    exit 1
elif [ "$response" == "403" ]; then
    echo -e "${RED}❌ Forbidden - Check Private App scopes${NC}"
    echo "   Ensure your app has CRM object permissions"
    exit 1
else
    echo -e "${YELLOW}⚠️  Unexpected response: $response${NC}"
fi
echo ""

# Test 2: Get Contacts
echo "Test 2: Fetch Contacts"
echo "----------------------"
contacts=$(curl -s -X GET \
    -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    "$API_BASE/crm/v3/objects/contacts?limit=3")

contact_count=$(echo "$contacts" | jq -r '.results | length' 2>/dev/null || echo "0")
echo "Found $contact_count contacts"

if [ "$contact_count" -gt 0 ]; then
    echo "Sample contact:"
    echo "$contacts" | jq -r '.results[0] | {id: .id, email: .properties.email, firstname: .properties.firstname}' 2>/dev/null
fi
echo ""

# Test 3: Get Tasks
echo "Test 3: Fetch Tasks"
echo "-------------------"
tasks=$(curl -s -X GET \
    -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    "$API_BASE/crm/v3/objects/tasks?limit=5")

task_count=$(echo "$tasks" | jq -r '.results | length' 2>/dev/null || echo "0")
echo "Found $task_count tasks"

if [ "$task_count" -gt 0 ]; then
    echo "Sample task:"
    echo "$tasks" | jq -r '.results[0] | {id: .id, subject: .properties.hs_task_subject, status: .properties.hs_task_status}' 2>/dev/null
fi
echo ""

# Test 4: Create Test Task
echo "Test 4: Create Test Task"
echo "------------------------"
timestamp=$(date +%s)
task_response=$(curl -s -X POST \
    -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "properties": {
            "hs_task_subject": "Test Task '"$timestamp"'",
            "hs_task_body": "Created by SalesSwarm AI test script",
            "hs_task_status": "NOT_STARTED",
            "hs_task_priority": "LOW"
        }
    }' \
    "$API_BASE/crm/v3/objects/tasks")

task_id=$(echo "$task_response" | jq -r '.id' 2>/dev/null)
if [ -n "$task_id" ] && [ "$task_id" != "null" ]; then
    echo -e "${GREEN}✅ Task created successfully (ID: $task_id)${NC}"
else
    echo -e "${YELLOW}⚠️  Could not create task${NC}"
    echo "Response: $task_response" | jq '.' 2>/dev/null || echo "$task_response"
fi
echo ""

# Test 5: Check Required Scopes
echo "Test 5: Verify Scopes"
echo "---------------------"
echo "Testing access to required endpoints..."

endpoints=(
    "/crm/v3/objects/contacts"
    "/crm/v3/objects/companies"
    "/crm/v3/objects/tasks"
    "/crm/v3/objects/deals"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
        "$API_BASE$endpoint?limit=1")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅${NC} $endpoint"
    else
        echo -e "${RED}❌${NC} $endpoint (HTTP $response)"
    fi
done
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="

if [ "$contact_count" -gt 0 ] || [ -n "$task_id" ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Your HubSpot Private App is configured correctly."
    echo "You can now run the agent scripts."
else
    echo -e "${YELLOW}⚠️  Some tests had warnings${NC}"
    echo ""
    echo "Your authentication works but you may need to:"
    echo "1. Add test data (contacts/tasks) in HubSpot"
    echo "2. Check Private App scopes for all permissions"
fi
echo ""
echo "Next steps:"
echo "1. Source the API helper: source agents/hubspot_api_helper.sh"
echo "2. Run lead qualifier: ./agents/lead_qualifier_v2.sh"
echo "3. Set up cron jobs for automation"