#!/bin/bash
# HubSpot API Helper Functions using Private Apps Bearer Token Authentication

# Check for access token
if [ -z "$HUBSPOT_ACCESS_TOKEN" ]; then
    echo "Error: HUBSPOT_ACCESS_TOKEN not set"
    echo "Export your Private App token: export HUBSPOT_ACCESS_TOKEN='pat-na-xxxxx'"
    exit 1
fi

# Base URL for HubSpot API
HUBSPOT_API_BASE="https://api.hubapi.com"

# Helper function for API calls with Bearer token
hubspot_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$HUBSPOT_API_BASE$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
            "$HUBSPOT_API_BASE$endpoint"
    fi
}

# Function to get contacts
get_contacts() {
    hubspot_api "GET" "/crm/v3/objects/contacts?limit=10"
}

# Function to get tasks
get_tasks() {
    hubspot_api "GET" "/crm/v3/objects/tasks?limit=100"
}

# Function to create a task
create_task() {
    local subject="$1"
    local body="$2"
    local contact_id="$3"
    
    local data='{
        "properties": {
            "hs_task_subject": "'"$subject"'",
            "hs_task_body": "'"$body"'",
            "hs_task_status": "NOT_STARTED",
            "hs_task_priority": "HIGH"
        }
    }'
    
    if [ -n "$contact_id" ]; then
        data=$(echo "$data" | jq '. + {
            "associations": [{
                "to": {"id": "'"$contact_id"'"},
                "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 204}]
            }]
        }')
    fi
    
    hubspot_api "POST" "/crm/v3/objects/tasks" "$data"
}

# Function to update a task
update_task() {
    local task_id="$1"
    local status="$2"
    
    local data='{
        "properties": {
            "hs_task_status": "'"$status"'"
        }
    }'
    
    hubspot_api "PATCH" "/crm/v3/objects/tasks/$task_id" "$data"
}

# Function to get a specific contact
get_contact() {
    local contact_id="$1"
    hubspot_api "GET" "/crm/v3/objects/contacts/$contact_id?properties=email,firstname,lastname,company,jobtitle"
}

# Function to update a contact
update_contact() {
    local contact_id="$1"
    local properties="$2"
    
    hubspot_api "PATCH" "/crm/v3/objects/contacts/$contact_id" "$properties"
}

# Function to send an email (using engagement API)
send_email() {
    local to_email="$1"
    local subject="$2"
    local body="$3"
    
    local data='{
        "engagement": {
            "active": true,
            "type": "EMAIL"
        },
        "associations": {
            "contactIds": []
        },
        "metadata": {
            "from": {
                "email": "ai-agents@salesswarm.ai",
                "firstName": "AI",
                "lastName": "Agent"
            },
            "to": [{
                "email": "'"$to_email"'"
            }],
            "subject": "'"$subject"'",
            "html": "'"$body"'"
        }
    }'
    
    hubspot_api "POST" "/engagements/v1/engagements" "$data"
}

# Export functions for use in other scripts
export -f hubspot_api
export -f get_contacts
export -f get_tasks
export -f create_task
export -f update_task
export -f get_contact
export -f update_contact
export -f send_email