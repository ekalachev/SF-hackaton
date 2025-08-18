[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [⬆️ Components](./index.md)

---

# Component Interaction Sequence Diagrams

**Author:** Alex Fedin | [O2.services](https://O2.services) | [LinkedIn](https://linkedin.com/in/alex-fedin)  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0

## 📑 Table of Contents
1. [Lead Qualification Workflow](#lead-qualification-workflow)
2. [Data Enrichment Process](#data-enrichment-process)
3. [Outreach Campaign Execution](#outreach-campaign-execution)
4. [Task Orchestration Flow](#task-orchestration-flow)
5. [Error Handling and Retry Mechanisms](#error-handling-and-retry-mechanisms)
6. [Agent Coordination Patterns](#agent-coordination-patterns)
7. [Related Documents](#related-documents)

---

## Lead Qualification Workflow

### Overview
The lead qualification workflow demonstrates how the system processes new leads through multiple scoring criteria to determine their sales readiness.

```mermaid
sequenceDiagram
    actor User as Sales User
    actor HS as HubSpot System
    participant TM as Task Monitor
    participant LQ as Lead Qualifier Agent
    participant MCP as MCP Server
    participant Claude as Claude AI
    participant HSDb as HubSpot Database
    
    User->>HS: Creates new contact
    HS->>HS: Triggers workflow
    HS->>HSDb: Creates "Qualify Lead" task
    Note over HSDb: Task Status: NOT_STARTED
    
    rect rgb(240, 248, 255)
        Note over TM: Cron triggers every minute
        TM->>MCP: Query pending tasks
        MCP->>HSDb: GET tasks (NOT_STARTED, subject="Qualify Lead")
        HSDb-->>MCP: Return task list
        MCP-->>TM: Tasks JSON array
    end
    
    TM->>HSDb: Update task status to IN_PROGRESS
    TM->>LQ: Dispatch task (ID, contact data)
    
    rect rgb(255, 248, 240)
        Note over LQ: Lead Scoring Process
        LQ->>MCP: Fetch contact details
        MCP->>HSDb: GET contact by ID
        HSDb-->>MCP: Contact data
        MCP-->>LQ: Contact JSON
        
        LQ->>MCP: Fetch company details
        MCP->>HSDb: GET associated company
        HSDb-->>MCP: Company data
        MCP-->>LQ: Company JSON
        
        LQ->>Claude: Analyze lead quality
        Note over Claude: Scoring Criteria:<br/>- Job title (C-level +30)<br/>- Company size (+25)<br/>- Industry fit (+20)<br/>- Data completeness (+10)<br/>- Engagement signals (+15)
        Claude-->>LQ: Score: 85, Tier: HOT
    end
    
    LQ->>MCP: Update contact properties
    MCP->>HSDb: UPDATE contact (lead_score=85, tier=HOT)
    
    LQ->>MCP: Update task status
    MCP->>HSDb: UPDATE task (status=COMPLETED)
    
    alt Score >= 80 (HOT Lead)
        LQ->>MCP: Create high-priority outreach task
        MCP->>HSDb: CREATE task "Send Outreach - HOT Lead"
        LQ->>MCP: Create human review task
        MCP->>HSDb: CREATE task "Human Review Required"
    else Score 50-79 (WARM Lead)
        LQ->>MCP: Create nurture task
        MCP->>HSDb: CREATE task "Send Outreach - WARM Lead"
    else Score < 50 (COLD Lead)
        LQ->>MCP: Create enrichment task
        MCP->>HSDb: CREATE task "Enrich Data"
    end
    
    HSDb-->>HS: Task updates
    HS-->>User: Notification: Lead qualified
```

[⬆️ Back to top](#-table-of-contents)

---

## Data Enrichment Process

### Overview
The data enrichment process demonstrates how the system automatically gathers additional information about contacts and companies from external sources.

```mermaid
sequenceDiagram
    actor HS as HubSpot System
    participant TM as Task Monitor
    participant DE as Data Enricher Agent
    participant MCP as MCP Server
    participant Puppet as Puppeteer Browser
    participant Web as External Websites
    participant Claude as Claude AI
    participant HSDb as HubSpot Database
    
    HS->>HSDb: Creates "Enrich Data" task
    Note over HSDb: Triggered by:<br/>- New contact<br/>- Low data quality<br/>- Missing fields
    
    TM->>MCP: Query enrichment tasks
    MCP->>HSDb: GET tasks (subject="Enrich Data")
    HSDb-->>MCP: Task with contact ID
    MCP-->>TM: Task data
    
    TM->>DE: Dispatch enrichment task
    
    rect rgb(240, 255, 240)
        Note over DE: Enrichment Process
        
        DE->>MCP: Fetch contact details
        MCP->>HSDb: GET contact
        HSDb-->>MCP: Contact (name, email, company)
        MCP-->>DE: Contact data
        
        alt Company website available
            DE->>Puppet: Navigate to company website
            Puppet->>Web: GET company homepage
            Web-->>Puppet: HTML content
            Puppet->>Puppet: Extract information
            Note over Puppet: Extracts:<br/>- About/description<br/>- Industry indicators<br/>- Employee count<br/>- Tech stack<br/>- Recent news
            Puppet->>Puppet: Take screenshot
            Puppet-->>DE: Company insights + screenshot
        end
        
        alt LinkedIn search enabled
            DE->>Puppet: Search LinkedIn for contact
            Puppet->>Web: LinkedIn search query
            Web-->>Puppet: Search results
            Puppet->>Puppet: Extract profile data
            Note over Puppet: Extracts:<br/>- Verified title<br/>- Years at company<br/>- Previous experience<br/>- Skills/endorsements
            Puppet-->>DE: LinkedIn profile data
        end
        
        DE->>Claude: Compile enrichment analysis
        Claude->>Claude: Analyze data quality
        Claude->>Claude: Calculate decision-maker score
        Claude-->>DE: Enriched data JSON
    end
    
    DE->>MCP: Update contact properties
    Note over MCP: Updates:<br/>- verified_title<br/>- company_size<br/>- industry<br/>- technologies<br/>- linkedin_url<br/>- decision_maker_score
    MCP->>HSDb: UPDATE contact with enriched data
    
    DE->>MCP: Add engagement note
    MCP->>HSDb: CREATE note with enrichment summary
    
    alt High-value contact discovered
        DE->>MCP: Create qualification task
        MCP->>HSDb: CREATE task "Qualify Lead - Priority"
    end
    
    DE->>MCP: Update task status
    MCP->>HSDb: UPDATE task (status=COMPLETED)
    
    HSDb-->>HS: Enrichment complete
```

[⬆️ Back to top](#-table-of-contents)

---

## Outreach Campaign Execution

### Overview
The outreach campaign execution shows how personalized messages are generated and sent to qualified leads.

```mermaid
sequenceDiagram
    actor Sales as Sales Team
    participant HS as HubSpot System
    participant TM as Task Monitor
    participant OA as Outreach Agent
    participant MCP as MCP Server
    participant Claude as Claude AI
    participant HSDb as HubSpot Database
    participant Email as Email Service
    
    alt Manual trigger
        Sales->>HS: Create outreach task
    else Automatic trigger
        HS->>HS: Lead score > 70 trigger
    end
    
    HS->>HSDb: CREATE task "Send Outreach"
    Note over HSDb: Priority based on lead tier:<br/>- HOT: HIGH priority<br/>- WARM: MEDIUM priority<br/>- COLD: LOW priority
    
    TM->>MCP: Query outreach tasks
    MCP->>HSDb: GET tasks (subject contains "Outreach")
    HSDb-->>MCP: Task list with priorities
    MCP-->>TM: Sorted task array
    
    TM->>OA: Dispatch outreach task
    
    rect rgb(255, 240, 245)
        Note over OA: Personalization Process
        
        OA->>OA: Extract priority from subject
        
        OA->>MCP: Fetch full contact details
        MCP->>HSDb: GET contact + company
        HSDb-->>MCP: Complete profile
        MCP-->>OA: Contact & company data
        
        OA->>Claude: Generate personalized content
        Note over Claude: Content Strategy:<br/>HIGH: Direct meeting request<br/>MEDIUM: Educational + soft CTA<br/>LOW: Nurture content
        
        Claude->>Claude: Personalize message
        Note over Claude: Personalization:<br/>- Use contact name<br/>- Reference company<br/>- Industry-specific value prop<br/>- Role-relevant benefits<br/>- Recent company news
        
        Claude-->>OA: Email content JSON
    end
    
    OA->>MCP: Create email activity
    MCP->>HSDb: CREATE email record
    
    OA->>Email: Send personalized email
    Email-->>OA: Delivery confirmation
    
    OA->>MCP: Log email sent
    MCP->>HSDb: UPDATE contact (last_contacted=now)
    
    alt HIGH priority lead
        OA->>MCP: Create follow-up task (2 days)
        MCP->>HSDb: CREATE task "Follow-up Call"
        OA->>MCP: Alert sales team
        MCP->>HS: CREATE notification
    else MEDIUM priority lead
        OA->>MCP: Create follow-up task (5 days)
        MCP->>HSDb: CREATE task "Follow-up Email"
    else LOW priority lead
        OA->>MCP: Create nurture sequence
        MCP->>HSDb: ADD to nurture workflow
    end
    
    OA->>MCP: Update task status
    MCP->>HSDb: UPDATE task (status=COMPLETED)
    
    HSDb-->>HS: Outreach complete
    HS-->>Sales: Activity logged
```

[⬆️ Back to top](#-table-of-contents)

---

## Task Orchestration Flow

### Overview
The task orchestration flow shows how the Task Monitor coordinates multiple agents and manages the overall workflow.

```mermaid
sequenceDiagram
    actor Cron as Cron Scheduler
    participant TM as Task Monitor
    participant Lock as Lock Manager
    participant MCP as MCP Server
    participant HSDb as HubSpot Database
    participant LQ as Lead Qualifier
    participant DE as Data Enricher
    participant OA as Outreach Agent
    participant Log as Log System
    
    Cron->>TM: Trigger (every minute)
    
    TM->>Lock: Check lock file
    alt Lock exists
        Lock-->>TM: Already running (PID)
        TM->>Log: Log: Already running
        TM->>TM: Exit
    else No lock
        TM->>Lock: Create lock (PID)
        Lock-->>TM: Lock acquired
    end
    
    TM->>Log: Starting task scan
    
    TM->>MCP: Query all pending tasks
    Note over MCP: Filters:<br/>- Status: NOT_STARTED or WAITING<br/>- Subject patterns:<br/>  • "Qualify Lead"<br/>  • "Send Outreach"<br/>  • "Enrich Data"
    
    MCP->>HSDb: GET filtered tasks
    HSDb-->>MCP: Task array
    MCP-->>TM: JSON task list
    
    loop For each task
        TM->>TM: Parse task data
        Note over TM: Extract:<br/>- Task ID<br/>- Subject<br/>- Contact IDs<br/>- Company IDs
        
        TM->>MCP: Update task status
        MCP->>HSDb: UPDATE (status=IN_PROGRESS)
        
        TM->>Log: Processing task {ID}
        
        alt Subject contains "Qualify Lead"
            TM->>LQ: Spawn process (async)
            LQ-->>TM: Process started
        else Subject contains "Send Outreach"
            TM->>OA: Spawn process (async)
            OA-->>TM: Process started
        else Subject contains "Enrich Data"
            TM->>DE: Spawn process (async)
            DE-->>TM: Process started
        else Unknown task type
            TM->>MCP: Update task
            MCP->>HSDb: UPDATE (status=WAITING, note="Needs human review")
            TM->>Log: Unknown task type
        end
    end
    
    TM->>Log: Scan complete
    TM->>Lock: Release lock
    Lock-->>TM: Lock released
    
    Note over TM: Agents run independently<br/>in background processes
```

[⬆️ Back to top](#-table-of-contents)

---

## Error Handling and Retry Mechanisms

### Overview
The error handling flow demonstrates how the system handles failures, retries operations, and escalates issues when necessary.

```mermaid
sequenceDiagram
    participant Agent as Any Agent
    participant MCP as MCP Server
    participant HSDb as HubSpot Database
    participant Log as Log System
    participant TM as Task Monitor
    participant Alert as Alert System
    actor Human as Human Operator
    
    Agent->>MCP: Execute operation
    
    alt Success path
        MCP->>HSDb: Perform action
        HSDb-->>MCP: Success
        MCP-->>Agent: OK
        Agent->>Log: Log success
    else Network error
        MCP->>HSDb: Perform action
        HSDb--xMCP: Network timeout
        MCP-->>Agent: Error: timeout
        
        Agent->>Log: Log network error
        
        loop Retry up to 3 times
            Agent->>Agent: Wait (exponential backoff)
            Note over Agent: Wait: 2^retry seconds
            Agent->>MCP: Retry operation
            alt Retry succeeds
                MCP->>HSDb: Perform action
                HSDb-->>MCP: Success
                MCP-->>Agent: OK
                Agent->>Log: Log recovery
                Agent->>Agent: Continue
            else Retry fails
                MCP--xAgent: Error
                Agent->>Log: Log retry failure
            end
        end
        
        Agent->>MCP: Update task status
        MCP->>HSDb: UPDATE (status=WAITING, error_count++)
        Agent->>Alert: Send alert (3 failures)
        
    else Data validation error
        Agent->>Agent: Validate input
        Agent--xAgent: Invalid data
        Agent->>Log: Log validation error
        
        alt Missing required field
            Agent->>MCP: Create enrichment task
            MCP->>HSDb: CREATE task "Enrich Data - Missing {field}"
            Agent->>MCP: Update current task
            MCP->>HSDb: UPDATE (status=WAITING, note="Awaiting data")
        else Invalid format
            Agent->>MCP: Update task
            MCP->>HSDb: UPDATE (status=WAITING, note="Data format error")
            Agent->>Alert: Alert data team
        end
        
    else AI processing error
        Agent->>MCP: AI request
        MCP--xAgent: Claude unavailable
        Agent->>Log: Log AI error
        
        Agent->>MCP: Update task
        MCP->>HSDb: UPDATE (status=WAITING, note="AI service unavailable")
        
        Note over TM: Next scan will retry
        TM->>MCP: Query WAITING tasks
        MCP->>HSDb: GET tasks (status=WAITING)
        HSDb-->>MCP: Tasks with errors
        MCP-->>TM: Task list
        
        TM->>TM: Check error_count
        alt error_count < 5
            TM->>Agent: Retry task
        else error_count >= 5
            TM->>MCP: Escalate to human
            MCP->>HSDb: UPDATE (assignee="Human", priority=HIGH)
            MCP->>Alert: Create urgent alert
            Alert-->>Human: Review required
        end
    end
    
    Note over Agent: Error Recovery Strategies:<br/>1. Exponential backoff<br/>2. Circuit breaker pattern<br/>3. Graceful degradation<br/>4. Human escalation
```

[⬆️ Back to top](#-table-of-contents)

---

## Agent Coordination Patterns

### Overview
This diagram shows how multiple agents coordinate to process complex workflows that require sequential and parallel operations.

```mermaid
sequenceDiagram
    actor User as Sales User
    participant HS as HubSpot
    participant TM as Task Monitor
    participant LQ as Lead Qualifier
    participant DE as Data Enricher
    participant OA as Outreach Agent
    participant WE as Web Enricher
    participant MCP as MCP Server
    participant HSDb as HubSpot Database
    
    User->>HS: Import lead list (CSV)
    HS->>HSDb: CREATE multiple contacts
    
    Note over HS: Workflow triggers for each contact
    
    par Parallel Processing
        HS->>HSDb: CREATE "Enrich Data" tasks
    and
        HS->>HSDb: CREATE "Qualify Lead" tasks
    end
    
    TM->>MCP: Query all pending tasks
    MCP->>HSDb: GET tasks (batch)
    HSDb-->>MCP: Task array
    MCP-->>TM: Tasks grouped by type
    
    par Agent Spawning
        TM->>DE: Spawn for enrichment tasks
        Note over DE: Process queue
    and
        TM->>LQ: Spawn for qualification tasks
        Note over LQ: Process queue
    end
    
    rect rgb(240, 248, 255)
        Note over DE,WE: Data Enrichment Pipeline
        
        DE->>MCP: Get contact batch
        MCP->>HSDb: GET contacts
        HSDb-->>MCP: Contact data
        MCP-->>DE: Contact array
        
        loop For each contact
            alt Needs web enrichment
                DE->>WE: Delegate web scraping
                WE->>WE: Scrape websites
                WE-->>DE: Web data
            end
            
            DE->>MCP: Update contact
            MCP->>HSDb: UPDATE with enriched data
        end
        
        DE->>MCP: Create qualification tasks
        MCP->>HSDb: CREATE "Qualify Lead" for enriched contacts
    end
    
    rect rgb(255, 248, 240)
        Note over LQ: Qualification Pipeline
        
        LQ->>MCP: Wait for enrichment
        Note over LQ: Check data completeness
        
        alt Data complete
            LQ->>LQ: Score lead
            LQ->>MCP: Update scores
            MCP->>HSDb: UPDATE contacts
            
            LQ->>MCP: Create outreach tasks
            MCP->>HSDb: CREATE "Send Outreach" for qualified leads
        else Data incomplete
            LQ->>MCP: Re-queue for enrichment
            MCP->>HSDb: UPDATE task (status=WAITING)
        end
    end
    
    rect rgb(255, 240, 245)
        Note over OA: Outreach Pipeline
        
        OA->>MCP: Get qualified leads
        MCP->>HSDb: GET high-score contacts
        HSDb-->>MCP: Contact list
        MCP-->>OA: Qualified leads
        
        OA->>OA: Generate campaigns
        
        par Parallel Outreach
            OA->>MCP: Send HOT lead emails
        and
            OA->>MCP: Queue WARM lead nurture
        and
            OA->>MCP: Schedule COLD lead content
        end
        
        MCP->>HSDb: CREATE activities
    end
    
    Note over TM: Coordination Patterns:<br/>1. Task dependencies<br/>2. Parallel processing<br/>3. Pipeline stages<br/>4. Feedback loops<br/>5. Priority queues
    
    HS-->>User: Pipeline complete notification
```

[⬆️ Back to top](#-table-of-contents)

---

## Related Documents

- [Workflow Orchestration](./workflow-orchestration.md) - Detailed task flow patterns
- [Error Handling](./error-handling.md) - Comprehensive failure scenarios
- [System Architecture](../../architecture/SYSTEM_ARCHITECTURE.md) - Overall system design
- [Component Interactions](../../architecture/COMPONENT_INTERACTIONS.md) - Component communication details
- [API Documentation](../../api/index.md) - Interface specifications

---

[⬅️ Components](./index.md) | [⬆️ Architecture](../../architecture/index.md) | [➡️ Workflow Orchestration](./workflow-orchestration.md)