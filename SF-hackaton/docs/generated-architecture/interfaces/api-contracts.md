[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture Hub](../README.md) | [🔌 Interfaces](../interfaces/)

---

# API Contracts Documentation

**Author:** AI Analysis Engine  
**Generated:** 2025-08-18  
**Version:** 1.0.0  

## 📑 Table of Contents
1. [Executive Summary](#executive-summary)
2. [HubSpot CRM API Contract](#hubspot-crm-api-contract)
3. [Model Context Protocol (MCP) Contracts](#model-context-protocol-mcp-contracts)
4. [Claude Engineering CLI Contract](#claude-engineering-cli-contract)
5. [Puppeteer Browser Control Contract](#puppeteer-browser-control-contract)
6. [Shell Script Agent Contracts](#shell-script-agent-contracts)
7. [Configuration API Contracts](#configuration-api-contracts)
8. [Error Handling Contracts](#error-handling-contracts)
9. [Rate Limiting and Quotas](#rate-limiting-and-quotas)
10. [Contract Evolution](#contract-evolution)
11. [Related Documents](#related-documents)

---

## Executive Summary

The SF-hackaton system implements a distributed agent architecture with clearly defined API contracts. The primary contracts center around HubSpot CRM API v3, Model Context Protocol (MCP) servers, and shell-based agent communication. All contracts emphasize simplicity, reliability, and automated sales process orchestration.

### Key Contract Types
- **External APIs:** HubSpot CRM API v3 (REST)
- **Internal Services:** MCP Server Protocol (JSON-RPC style)
- **Agent Communication:** Shell script interfaces
- **Browser Control:** Puppeteer/Chrome DevTools Protocol
- **Configuration:** File-based JSON schemas

---

## HubSpot CRM API Contract

### Base Contract Definition

```yaml
api_contract:
  name: "HubSpot CRM API v3"
  base_url: "https://api.hubapi.com"
  version: "v3"
  transport: "HTTPS"
  authentication:
    type: "Bearer Token"
    header: "Authorization"
    format: "Bearer {HUBSPOT_ACCESS_TOKEN}"
  content_type: "application/json"
  rate_limit: "100 requests/10 seconds"
```

### Contact Management Contract

**Location:** `/agents/hubspot_api_helper.sh:34-97`

#### Get Contacts
```http
GET /crm/v3/objects/contacts?limit=10
Authorization: Bearer {token}
Accept: application/json

Response Schema:
{
  "results": [
    {
      "id": "string",
      "properties": {
        "email": "string",
        "firstname": "string", 
        "lastname": "string",
        "company": "string",
        "jobtitle": "string"
      },
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ],
  "paging": {
    "next": {
      "after": "string"
    }
  }
}
```

#### Get Specific Contact
```http
GET /crm/v3/objects/contacts/{contactId}?properties=email,firstname,lastname,company,jobtitle
Authorization: Bearer {token}

Response: Contact object (same schema as above)
```

#### Update Contact
```http
PATCH /crm/v3/objects/contacts/{contactId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "properties": {
    "lead_score": "number",
    "lead_tier": "HOT|WARM|COLD",
    "lead_qualification_date": "ISO8601",
    "lead_qualification_notes": "string",
    "company_size": "string",
    "industry": "string",
    "linkedin_profile": "string",
    "decision_maker_score": "number",
    "data_enrichment_date": "ISO8601",
    "data_quality": "HIGH|MEDIUM|LOW",
    "last_outreach_date": "ISO8601",
    "outreach_status": "CONTACTED|PENDING|RESPONDED"
  }
}
```

### Task Management Contract

**Location:** `/agents/hubspot_api_helper.sh:39-83`

#### Get Tasks
```http
GET /crm/v3/objects/tasks?limit=100
Authorization: Bearer {token}

Response Schema:
{
  "results": [
    {
      "id": "string",
      "properties": {
        "hs_task_subject": "string",
        "hs_task_body": "string", 
        "hs_task_status": "NOT_STARTED|IN_PROGRESS|COMPLETED|WAITING",
        "hs_task_priority": "HIGH|MEDIUM|LOW",
        "hs_task_type": "TODO|EMAIL|CALL|MEETING"
      },
      "associations": {
        "contacts": ["contactId1", "contactId2"]
      }
    }
  ]
}
```

#### Create Task
```http
POST /crm/v3/objects/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "properties": {
    "hs_task_subject": "string",
    "hs_task_body": "string",
    "hs_task_status": "NOT_STARTED",
    "hs_task_priority": "HIGH|MEDIUM|LOW"
  },
  "associations": [
    {
      "to": {"id": "contactId"},
      "types": [
        {
          "associationCategory": "HUBSPOT_DEFINED",
          "associationTypeId": 204
        }
      ]
    }
  ]
}
```

#### Update Task
```http
PATCH /crm/v3/objects/tasks/{taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "properties": {
    "hs_task_status": "COMPLETED|IN_PROGRESS|WAITING"
  }
}
```

### Engagement Contract

**Location:** `/agents/hubspot_api_helper.sh:99-128`

#### Create Email Engagement
```http
POST /engagements/v1/engagements
Authorization: Bearer {token}
Content-Type: application/json

{
  "engagement": {
    "active": true,
    "type": "EMAIL"
  },
  "associations": {
    "contactIds": ["contactId"]
  },
  "metadata": {
    "from": {
      "email": "ai-agents@salesswarm.ai",
      "firstName": "AI",
      "lastName": "Agent"
    },
    "to": [
      {
        "email": "recipient@company.com"
      }
    ],
    "subject": "string",
    "html": "string"
  }
}
```

---

## Model Context Protocol (MCP) Contracts

### MCP Server Configuration Contract

**Location:** `/config/mcp_hubspot_config.json`

```json
{
  "mcp_servers": {
    "hubspot": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-hubspot"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "${HUBSPOT_ACCESS_TOKEN}"
      },
      "capabilities": {
        "contacts": true,
        "tasks": true,
        "emails": true,
        "workflows": true
      }
    }
  },
  "puppeteer": {
    "command": "npx", 
    "args": ["@modelcontextprotocol/server-puppeteer"],
    "env": {
      "PUPPETEER_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    }
  }
}
```

### MCP HubSpot Tool Contracts

#### hubspot-list-objects
```javascript
// Input contract
{
  "objectType": "contacts|tasks|companies|deals",
  "limit": 100,
  "properties": ["email", "firstname", "lastname"],
  "archived": false
}

// Output contract
{
  "results": [/* HubSpot objects */],
  "paging": { "next": { "after": "cursor" } }
}
```

#### hubspot-search-objects
```javascript
// Input contract
{
  "objectType": "contacts|tasks|companies",
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "hs_task_status",
          "operator": "EQ",
          "value": "NOT_STARTED"
        }
      ]
    }
  ],
  "query": "search text",
  "sorts": [
    {
      "propertyName": "createdate",
      "direction": "DESCENDING"
    }
  ]
}
```

#### hubspot-batch-update-objects
```javascript
// Input contract
{
  "objectType": "contacts|tasks",
  "inputs": [
    {
      "id": "objectId",
      "properties": {
        "property_name": "value"
      }
    }
  ]
}
```

#### hubspot-create-engagement
```javascript
// Input contract
{
  "type": "NOTE|TASK",
  "ownerId": 12345,
  "associations": {
    "contactIds": [67890],
    "companyIds": [],
    "dealIds": []
  },
  "metadata": {
    "body": "Note content or task description",
    "subject": "Engagement subject"
  }
}
```

### MCP Puppeteer Tool Contracts

#### mcp__puppeteer__puppeteer_navigate
```javascript
// Input contract
{
  "url": "https://example.com",
  "launchOptions": {
    "headless": true,
    "args": ["--no-sandbox"]
  }
}
```

#### mcp__puppeteer__puppeteer_fill
```javascript
// Input contract
{
  "selector": "#email",
  "value": "user@example.com"
}
```

#### mcp__puppeteer__puppeteer_evaluate
```javascript
// Input contract
{
  "script": "document.querySelector('h1').textContent"
}

// Output contract
{
  "result": "Page title text"
}
```

---

## Claude Engineering CLI Contract

### Command Interface Contract

**Location:** Used throughout `/agents/` directory

```bash
# Contract definition
~/claude-eng --mcp-config <config_path> --print "<natural_language_prompt>"

# Parameters contract
--mcp-config: Path to MCP configuration JSON file
--print: Natural language instruction for AI processing
--mcp: Direct MCP server selection (alternative to config)

# Input contract
Prompt format: Natural language instructions referencing:
- "Using HubSpot MCP tools"
- "Using Puppeteer MCP tools" 
- Specific operations (create, update, search, list)
- Return format specifications (JSON, plain text)

# Output contract
- JSON responses when requested
- Plain text confirmations
- Error messages with context
- "OK" for simple confirmations
```

### Prompt Patterns Contract

#### Task Processing Pattern
```bash
~/claude-eng --mcp-config /path/to/.mcp.json --print "
Using HubSpot MCP tools:

1. Fetch contact with ID: $CONTACT_ID
2. Update contact with properties: {...}
3. Create task with subject: $SUBJECT

Return 'OK' when done.
"
```

#### Search and Filter Pattern
```bash
~/claude-eng --mcp-config /path/to/.mcp.json --print "
Using the HubSpot MCP tools, search for tasks that meet these criteria:
1. Status is 'NOT_STARTED' or 'WAITING' 
2. Subject contains one of: 'Qualify Lead', 'Send Outreach'
3. Return task IDs, subjects, and contact associations

Format as JSON array. Only return JSON, no other text.
"
```

---

## Puppeteer Browser Control Contract

### Browser Automation Contract

**Location:** `/agents/web_enricher.sh`, `/agents/data_enricher.sh`

#### Navigation Contract
```javascript
// Standard navigation
navigate(url: string, options?: NavigationOptions): Promise<Response>

// Options contract
interface NavigationOptions {
  timeout?: number,
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
}
```

#### Data Extraction Contract
```javascript
// Company website scraping contract
{
  input: {
    url: "https://company.com",
    extractors: [
      "company description",
      "industry/sector", 
      "key products/services",
      "contact information",
      "team size indicators"
    ]
  },
  output: {
    "company_description": "string",
    "industry": "string",
    "products": ["string"],
    "contact_info": {...},
    "team_size": "estimated number"
  }
}
```

#### Screenshot Contract
```javascript
// Screenshot capture contract
{
  input: {
    url: "string",
    options: {
      fullPage: true,
      path: "string"
    }
  },
  output: {
    path: "screenshots/filename.png",
    success: boolean
  }
}
```

---

## Shell Script Agent Contracts

### Agent Invocation Contract

**Pattern:** `./agent_script.sh $TASK_ID $TASK_DATA`

#### Input Parameters Contract
```bash
# Parameter 1: Task ID (string)
TASK_ID=$1  # HubSpot task object ID

# Parameter 2: Task Data (JSON string)
TASK_DATA=$2  # Complete task object from HubSpot
{
  "id": "taskId",
  "subject": "Task title",
  "status": "NOT_STARTED|IN_PROGRESS|COMPLETED",
  "contactIds": ["contactId1"],
  "companyIds": ["companyId1"]
}
```

#### Output Contract
```bash
# Exit codes
0: Success - task completed successfully
1: Error - task failed, requires manual intervention
2: Retry - temporary failure, safe to retry
3: Skip - task not applicable or already processed

# Logging contract
"$(date): [LEVEL] Agent: Message" >> $LOG_FILE

# Task status updates
- Mark task IN_PROGRESS at start
- Mark task COMPLETED on success  
- Mark task WAITING on failure
- Add notes with processing details
```

### Lead Qualifier Agent Contract

**Location:** `/agents/lead_qualifier.sh`

#### Qualification Scoring Contract
```json
{
  "input_criteria": {
    "job_title_scoring": {
      "C-level": 30,
      "VP": 25,
      "Director": 20,
      "Manager": 15
    },
    "company_size_scoring": {
      "Enterprise (1000+)": 25,
      "Mid-market (100-999)": 20,
      "SMB (<100)": 15
    },
    "industry_scoring": {
      "Tech/SaaS": 20,
      "Finance": 15,
      "Other B2B": 10
    },
    "data_completeness": {
      "Email": 10,
      "Phone": 5,
      "LinkedIn": 5
    }
  },
  "output_schema": {
    "score": "number (1-100)",
    "tier": "HOT|WARM|COLD",
    "reasoning": "string",
    "next_action": "string",
    "contact_name": "string",
    "company_name": "string",
    "title": "string"
  },
  "tier_thresholds": {
    "HOT": "80+",
    "WARM": "50-79", 
    "COLD": "<50"
  }
}
```

### Outreach Agent Contract

**Location:** `/agents/outreach_agent.sh`

#### Outreach Generation Contract
```json
{
  "input_data": {
    "contact_info": "HubSpot contact object",
    "priority": "HIGH|MEDIUM|LOW",
    "lead_score": "number",
    "industry": "string"
  },
  "output_schema": {
    "email_subject": "string",
    "email_body": "HTML string", 
    "follow_up_days": "number",
    "contact_name": "string",
    "company_name": "string",
    "personalization_notes": "string"
  },
  "priority_templates": {
    "HIGH": "Direct, value-focused, meeting this week",
    "MEDIUM": "Educational content, discovery call CTA",
    "LOW": "Nurture content, helpful resources"
  }
}
```

### Data Enricher Agent Contract

**Location:** `/agents/data_enricher.sh`

#### Enrichment Output Contract
```json
{
  "enrichment_schema": {
    "contact_name": "string",
    "email": "string", 
    "company_name": "string",
    "company_website": "string",
    "enriched_data": {
      "verified_title": "string",
      "company_size": "string",
      "industry": "string",
      "technologies": ["string"],
      "recent_news": "string",
      "linkedin_profile": "URL",
      "decision_maker_score": "number (1-10)",
      "enrichment_quality": "HIGH|MEDIUM|LOW"
    },
    "data_gaps": ["string"],
    "recommended_action": "string"
  },
  "quality_thresholds": {
    "HIGH": "All key fields populated, verified sources",
    "MEDIUM": "Most fields populated, some gaps",
    "LOW": "Limited data, many gaps"
  }
}
```

---

## Configuration API Contracts

### Task Templates Contract

**Location:** `/config/task_templates.json`

```json
{
  "schema": {
    "task_templates": [
      {
        "name": "string",
        "queue": "string", 
        "assignee": "string",
        "priority": "HIGH|NORMAL|LOW",
        "template": "string with {placeholders}"
      }
    ]
  },
  "placeholders": {
    "contact_id": "HubSpot contact ID",
    "score": "Lead qualification score"
  }
}
```

### Workflow Triggers Contract

**Location:** `/config/workflow_triggers.json`

```json
{
  "schema": {
    "workflows": [
      {
        "trigger": "contact_created|form_submitted|lead_score_above_X",
        "action": "create_task",
        "task_type": "string",
        "assignee": "string", 
        "due_in_minutes": "number"
      }
    ]
  },
  "supported_triggers": [
    "contact_created",
    "form_submitted",
    "lead_score_above_70",
    "lead_score_above_85"
  ]
}
```

### Agent Identity Contract

**Location:** `/config/ai_agents_user.json`

```json
{
  "user_contract": {
    "email": "ai-agents@salesswarm.ai",
    "firstName": "AI",
    "lastName": "Agents",
    "role": "Sales Automation",
    "permissions": {
      "contacts": ["read", "write", "delete"],
      "tasks": ["read", "write", "complete"],
      "emails": ["send", "read"],
      "workflows": ["trigger", "read"],
      "activities": ["create", "read"]
    }
  },
  "api_settings": {
    "rate_limit": 100,
    "concurrent_tasks": 5,
    "retry_attempts": 3,
    "timeout_seconds": 30
  }
}
```

---

## Error Handling Contracts

### HubSpot API Error Contract

```json
{
  "error_response_schema": {
    "status": "error",
    "message": "Human readable error description",
    "correlationId": "UUID for tracking",
    "category": "VALIDATION_ERROR|RATE_LIMIT|AUTH_ERROR|NOT_FOUND",
    "errors": [
      {
        "message": "Field-specific error",
        "property": "fieldName",
        "code": "PROPERTY_DOESNT_EXIST"
      }
    ]
  },
  "http_status_codes": {
    "400": "Bad Request - validation error",
    "401": "Unauthorized - invalid token",
    "403": "Forbidden - insufficient permissions", 
    "404": "Not Found - resource doesn't exist",
    "429": "Too Many Requests - rate limit exceeded",
    "500": "Internal Server Error"
  }
}
```

### Agent Error Handling Contract

```bash
# Error handling pattern
if [ condition_failed ]; then
    echo "$(date): ERROR: Descriptive error message" >> "$LOG_FILE"
    
    # Update task with error status
    ~/claude-eng --mcp-config $CONFIG --print "
    Using HubSpot MCP tools, update task $TASK_ID:
    - Set status to 'WAITING' 
    - Add note: 'Agent Error: Specific error description'
    Return 'OK' when done.
    "
    
    exit 1  # Signal failure to parent process
fi
```

---

## Rate Limiting and Quotas

### HubSpot API Rate Limits

```yaml
rate_limits:
  burst_limit: 100 requests per 10 seconds
  daily_limit: 250000 requests per day
  
  headers:
    - X-HubSpot-RateLimit-Daily
    - X-HubSpot-RateLimit-Daily-Remaining
    - X-HubSpot-RateLimit-Secondly
    - X-HubSpot-RateLimit-Secondly-Remaining
    
  handling:
    strategy: "No automatic retry implemented"
    recommendation: "Implement exponential backoff"
```

### MCP Server Quotas

```yaml
mcp_limits:
  concurrent_connections: 5
  request_timeout: 30 seconds
  max_message_size: 10MB
  
  resource_limits:
    memory: "No explicit limits"
    cpu: "Shared with host process"
    disk: "Screenshot storage only"
```

---

## Contract Evolution

### Current State (v1.x)
- **HubSpot API:** v3 REST endpoints
- **Authentication:** Static Bearer tokens
- **Error Handling:** Basic try-catch patterns
- **Rate Limiting:** No automatic handling

### Proposed Evolution (v2.x)

```yaml
improvements:
  authentication:
    - OAuth 2.0 refresh tokens
    - Automatic token rotation
    - Multi-tenant support
    
  error_handling:
    - Exponential backoff retry
    - Circuit breaker pattern
    - Dead letter queues
    
  monitoring:
    - Contract compliance validation
    - API usage metrics
    - Performance SLA tracking
    
  versioning:
    - Semantic API versioning
    - Backward compatibility
    - Graceful deprecation
```

### Breaking Changes Policy

1. **Major Version:** Breaking API contract changes
2. **Minor Version:** New optional fields, new endpoints
3. **Patch Version:** Bug fixes, documentation updates

---

## Related Documents

- [Data Schemas](./data-schemas.md) - Detailed data structure definitions
- [Integration Points](./integration-points.md) - External system integration contracts
- [Protocols](./protocols.md) - Communication protocol specifications
- [Communication Interfaces](./communication-interfaces.md) - Interface technical details

---

[🏗️ Architecture Hub](../README.md) | [🗺️ Navigation](../navigation.md) | [📋 Contents](../toc.md) | [🔌 Interfaces](../interfaces/) | [🏠 Home](../../../README.md)