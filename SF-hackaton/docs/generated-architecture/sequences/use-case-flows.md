# Use Case Flow Diagrams

This document provides detailed step-by-step sequence diagrams for the primary use cases in the SF-hackaton AI agent system, showing complete user journeys from start to finish.

## Primary Use Cases

### Use Case 1: Cold Lead Acquisition and Qualification

**Scenario**: A new prospect visits the website, fills out a contact form, and gets automatically processed through the AI agent pipeline.

```mermaid
sequenceDiagram
    participant Prospect as Website Prospect
    participant LP as Landing Page
    participant HS as HubSpot CRM
    participant WF as HubSpot Workflow
    participant TM as Task Monitor
    participant DE as Data Enricher
    participant Claude as Claude MCP
    participant Puppeteer as Puppeteer MCP
    participant LQ as Lead Qualifier
    participant OA as Outreach Agent

    Note over Prospect,OA: Complete Cold Lead Processing Journey

    %% Initial Contact Creation
    Prospect->>LP: Fill out "Get Demo" form
    LP->>HS: Submit form data
    Note right of LP: Name, email, company, phone
    
    HS->>HS: Create new contact record
    HS->>WF: Trigger workflow: form_submitted
    
    %% Immediate Task Creation
    WF->>HS: Create "Qualify Lead" task (due in 1 min)
    WF->>HS: Create "Enrich Data" task (due in 5 min)
    
    %% Data Enrichment Phase
    TM->>HS: Poll for tasks (next cron cycle)
    HS-->>TM: Return pending tasks
    TM->>DE: Dispatch data_enricher.sh
    TM->>HS: Mark enrichment task IN_PROGRESS
    
    DE->>HS: Fetch contact details
    DE->>Claude: Request comprehensive enrichment
    
    par Website Analysis
        Claude->>Puppeteer: Navigate to company website
        Puppeteer-->>Claude: Company info, screenshot
    and LinkedIn Research
        Claude->>Puppeteer: Search LinkedIn profile
        Puppeteer-->>Claude: Professional details
    end
    
    Claude-->>DE: Enriched data JSON
    DE->>HS: Update contact with enriched fields
    DE->>HS: Create engagement note
    DE->>HS: Mark enrichment task COMPLETED
    
    %% Lead Qualification Phase
    TM->>LQ: Dispatch lead_qualifier.sh
    TM->>HS: Mark qualification task IN_PROGRESS
    
    LQ->>HS: Fetch enriched contact data
    LQ->>LQ: Calculate lead score
    LQ->>Claude: Get AI scoring (if available)
    Claude-->>LQ: Advanced score assessment
    
    LQ->>HS: Update lead_score and lead_status
    LQ->>HS: Mark qualification task COMPLETED
    
    %% Outreach Phase (if qualified)
    alt High Score Lead (>70)
        LQ->>HS: Create "Send Outreach" task
        TM->>OA: Dispatch outreach_agent.sh
        
        OA->>HS: Fetch contact and enrichment data
        OA->>Claude: Generate personalized outreach
        Claude-->>OA: Email subject, body, timing
        
        OA->>HS: Create email engagement
        OA->>HS: Update contact outreach status
        OA->>HS: Schedule follow-up task
        OA->>HS: Mark outreach task COMPLETED
        
    else Medium Score Lead (40-70)
        LQ->>HS: Add to nurture campaign
        
    else Low Score Lead (<40)
        LQ->>HS: Mark as unqualified
    end
    
    Note over Prospect,OA: End-to-End Processing: ~5-10 minutes
```

### Use Case 2: High-Value Lead Escalation

**Scenario**: An enterprise contact with excellent qualification metrics gets fast-tracked for immediate human attention.

```mermaid
sequenceDiagram
    participant Contact as Enterprise Contact
    participant HS as HubSpot CRM
    participant DE as Data Enricher
    participant LQ as Lead Qualifier
    participant Alert as Alert System
    participant Sales as Sales Rep
    participant Manager as Sales Manager

    Note over Contact,Manager: High-Value Lead Fast-Track Process

    %% High-Value Contact Detection
    Contact->>HS: Form submission or contact creation
    HS->>DE: Automatic enrichment process
    
    DE->>HS: Enrich with company data
    Note right of DE: Large company, senior title detected
    DE->>HS: Set decision_maker_score = 9/10
    DE->>HS: Create HIGH priority qualification task
    
    %% Immediate Qualification
    LQ->>HS: Process high-priority task
    LQ->>LQ: Calculate lead score
    Note right of LQ: Score = 87 (above 85 threshold)
    
    LQ->>HS: Update lead_score = 87
    LQ->>HS: Set lead_status = "qualified"
    
    %% Automatic Escalation
    HS->>HS: Trigger rule: lead_score > 85
    HS->>HS: Create "Human Review" task
    HS->>Sales: Assign to sales team
    HS->>Alert: Send immediate notification
    
    %% Human Intervention
    Alert->>Sales: Email/Slack notification
    Note right of Alert: "High-value lead requires immediate attention"
    
    Sales->>HS: Review contact details
    Sales->>HS: Review enrichment data
    Sales->>HS: Review qualification notes
    
    alt Contact Immediately
        Sales->>Contact: Phone call within 1 hour
        Sales->>HS: Log call outcome
        
    else Schedule Meeting
        Sales->>HS: Create calendar event
        Sales->>Contact: Send meeting invite
        
    else Requires Manager Review
        Sales->>Manager: Escalate to sales manager
        Manager->>HS: Review and provide guidance
    end
    
    Note over Contact,Manager: High-value leads get human attention within 1 hour
```

### Use Case 3: Data Quality Issue Resolution

**Scenario**: The enrichment process encounters incomplete or poor-quality data and requires human intervention.

```mermaid
sequenceDiagram
    participant TM as Task Monitor
    participant DE as Data Enricher
    participant HS as HubSpot CRM
    participant Claude as Claude MCP
    participant Puppeteer as Puppeteer MCP
    participant Human as Data Analyst
    participant Contact as Contact Record

    Note over TM,Contact: Data Quality Issue Detection & Resolution

    %% Failed Enrichment Attempt
    TM->>DE: Dispatch enrichment task
    DE->>HS: Fetch contact data
    Note right of DE: Minimal data: only email provided
    
    DE->>Claude: Request enrichment
    Claude->>Puppeteer: Attempt website lookup
    
    alt Website Not Found
        Puppeteer-->>Claude: No valid website
        Claude->>Puppeteer: Try LinkedIn search
        Puppeteer-->>Claude: No LinkedIn profile found
        
    else Incomplete Data
        Puppeteer-->>Claude: Partial information only
        Claude-->>DE: Low quality enrichment
    end
    
    DE->>DE: Assess data quality = "LOW"
    DE->>DE: Identify data gaps
    Note right of DE: Missing: company size, industry, title
    
    %% Create Manual Review Task
    DE->>HS: Update contact with partial data
    DE->>HS: Create "Manual Review Needed" task
    Note right of DE: LOW priority, assigned to Data Analyst
    DE->>HS: Add detailed notes about data gaps
    DE->>HS: Mark original task COMPLETED
    
    %% Human Review Process
    Human->>HS: Review manual review queue
    Human->>HS: Examine contact record
    Human->>HS: Review enrichment notes
    
    alt Research Contact Manually
        Human->>Human: LinkedIn manual search
        Human->>Human: Company website research
        Human->>Human: Google search for additional info
        Human->>HS: Update contact with manual findings
        Human->>HS: Create "Qualify Lead" task
        
    else Contact Directly
        Human->>Contact: Send data completion email
        Contact-->>Human: Provide missing information
        Human->>HS: Update contact record
        Human->>HS: Create "Qualify Lead" task
        
    else Mark as Low Priority
        Human->>HS: Add to low-priority nurture list
        Human->>HS: Set follow-up for next quarter
    end
    
    Human->>HS: Mark manual review task COMPLETED
    
    Note over TM,Contact: Manual review ensures no lead is lost due to data issues
```

### Use Case 4: Multi-Touch Outreach Sequence

**Scenario**: A qualified lead goes through multiple automated follow-ups with AI-generated content.

```mermaid
sequenceDiagram
    participant OA as Outreach Agent
    participant HS as HubSpot CRM
    participant Claude as Claude MCP
    participant TM as Task Monitor
    participant Contact as Lead Contact
    participant Email as Email System

    Note over OA,Email: Multi-Touch Outreach Campaign Sequence

    %% Initial Outreach
    OA->>HS: Process "Send Outreach" task
    OA->>Claude: Generate initial outreach
    Note right of Claude: Value-focused, meeting request
    Claude-->>OA: Email content + 3-day follow-up
    
    OA->>HS: Create email engagement
    OA->>Email: Send initial email
    OA->>HS: Schedule follow-up task (3 days)
    OA->>HS: Update contact: last_outreach_date
    
    %% First Follow-up (Day 3)
    loop Day 3
        TM->>HS: Detect follow-up task
        TM->>OA: Dispatch follow-up outreach
        
        OA->>HS: Check if contact responded
        alt No Response Detected
            OA->>Claude: Generate follow-up #1
            Note right of Claude: Educational content, soft CTA
            Claude-->>OA: Content + 5-day follow-up
            
            OA->>HS: Create follow-up engagement
            OA->>Email: Send follow-up email
            OA->>HS: Schedule next follow-up (5 days)
            
        else Response Detected
            OA->>HS: Create "Human Review" task
            Note right of OA: Response requires human attention
        end
    end
    
    %% Second Follow-up (Day 8)
    loop Day 8
        TM->>OA: Dispatch second follow-up
        
        OA->>HS: Check response status
        alt Still No Response
            OA->>Claude: Generate follow-up #2
            Note right of Claude: Case study, social proof
            Claude-->>OA: Content + 7-day follow-up
            
            OA->>HS: Create engagement
            OA->>Email: Send case study email
            OA->>HS: Schedule final follow-up (7 days)
            
        else Response Received
            OA->>HS: Create "Hot Lead" task
            OA->>HS: Assign to sales team
        end
    end
    
    %% Final Follow-up (Day 15)
    loop Day 15
        TM->>OA: Dispatch final follow-up
        
        OA->>Claude: Generate final outreach
        Note right of Claude: Last attempt, breakup email
        Claude-->>OA: Final email content
        
        OA->>HS: Create final engagement
        OA->>Email: Send breakup email
        OA->>HS: Set contact status to "unresponsive"
        OA->>HS: Add to long-term nurture list
    end
    
    Note over OA,Email: 15-day sequence with 4 touchpoints maximizes response rates
```

### Use Case 5: System Recovery After Downtime

**Scenario**: The system recovers from a maintenance window or outage and processes accumulated tasks.

```mermaid
sequenceDiagram
    participant Cron as System Cron
    participant TM as Task Monitor
    participant HS as HubSpot CRM
    participant Recovery as Recovery Agent
    participant DE as Data Enricher
    participant LQ as Lead Qualifier
    participant OA as Outreach Agent

    Note over Cron,OA: System Recovery and Backlog Processing

    %% System Restart
    Cron->>TM: Resume scheduled execution
    TM->>TM: Check for stale lock files
    TM->>TM: Remove stale locks
    
    %% Backlog Assessment
    TM->>HS: Query all pending tasks
    HS-->>TM: Return large task backlog
    Note right of HS: 50+ accumulated tasks during downtime
    
    TM->>Recovery: Assess task priorities
    Recovery->>HS: Identify stuck IN_PROGRESS tasks
    Recovery->>HS: Reset stuck tasks to NOT_STARTED
    Recovery->>HS: Add recovery notes
    
    %% Priority Processing
    TM->>TM: Sort tasks by priority and age
    
    loop Process High Priority First
        alt "Human Review" Tasks
            TM->>HS: Keep for immediate human attention
            
        else Form Submission Tasks (age < 1 hour)
            TM->>LQ: Rush process qualification
            LQ->>HS: Fast-track scoring
            
        else Outreach Tasks (age < 4 hours)
            TM->>OA: Process outreach immediately
            OA->>HS: Generate and send content
            
        else Data Enrichment Tasks
            TM->>DE: Process with throttling
            Note right of DE: 2-second delays to prevent API overload
        end
    end
    
    %% Gradual Backlog Clearing
    loop Process Remaining Tasks
        TM->>TM: Rate-limited processing
        TM->>TM: Monitor system performance
        
        alt System Overloaded
            TM->>TM: Increase delays between tasks
            
        else Normal Performance
            TM->>TM: Continue standard processing
        end
    end
    
    %% Recovery Complete
    TM->>HS: All tasks processed
    TM->>Recovery: Generate recovery report
    Recovery->>Recovery: Log recovery metrics
    Note right of Recovery: Time to clear backlog, error rates
    
    Note over Cron,OA: System designed for graceful recovery with priority handling
```

### Use Case 6: Real-Time Lead Scoring Update

**Scenario**: A contact's score changes due to new activity, triggering workflow adjustments.

```mermaid
sequenceDiagram
    participant Contact as Existing Contact
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant LQ as Lead Qualifier
    participant TM as Task Monitor
    participant OA as Outreach Agent
    participant Sales as Sales Team

    Note over Contact,Sales: Dynamic Lead Score Adjustment Workflow

    %% Trigger Event
    Contact->>HS: Downloads whitepaper
    HS->>HS: Update contact activity
    HS->>WF: Trigger: engagement_activity
    
    %% Re-qualification
    WF->>HS: Create "Re-qualify Lead" task
    TM->>LQ: Dispatch qualification update
    
    LQ->>HS: Fetch current lead data
    LQ->>HS: Fetch recent activity history
    LQ->>LQ: Recalculate lead score
    Note right of LQ: Previous score: 65 → New score: 78
    
    LQ->>HS: Update lead_score = 78
    LQ->>HS: Update lead_status = "qualified"
    
    %% Workflow Routing Based on New Score
    HS->>WF: Trigger: lead_score_above_70
    
    alt Score Crossed 70 Threshold
        WF->>HS: Create "Send Outreach" task
        TM->>OA: Dispatch immediate outreach
        
        OA->>HS: Check previous outreach history
        alt No Previous Outreach
            OA->>OA: Generate initial outreach
            
        else Previous Outreach Sent
            OA->>OA: Generate follow-up sequence
            Note right of OA: Reference previous communication
        end
        
        OA->>HS: Create engagement
        OA->>HS: Update outreach status
        
    else Score Approaching 85 (>80)
        WF->>Sales: Send alert notification
        Note right of Sales: "Lead warming up - consider personal outreach"
        
    else Standard Qualified Lead
        WF->>HS: Add to automated nurture sequence
    end
    
    Note over Contact,Sales: Real-time scoring enables dynamic workflow adjustments
```

## Cross-Cutting Concerns

### Error Handling Patterns Across Use Cases

```mermaid
sequenceDiagram
    participant Agent as Any Agent
    participant HS as HubSpot CRM
    participant Log as Error Log
    participant Alert as Alert System
    participant Human as Human Operator

    Note over Agent,Human: Consistent Error Handling Across All Use Cases

    Agent->>HS: Attempt operation
    
    alt Temporary API Error (Rate Limit)
        HS-->>Agent: 429 Rate Limited
        Agent->>Agent: Wait with exponential backoff
        Agent->>HS: Retry operation
        
    else Authentication Error
        HS-->>Agent: 401 Unauthorized
        Agent->>Log: Log auth error
        Agent->>Alert: Send admin notification
        
    else Data Validation Error
        HS-->>Agent: 400 Bad Request
        Agent->>HS: Mark task for manual review
        Agent->>Log: Log validation details
        
    else Network Timeout
        Agent->>Agent: Retry with timeout increase
        alt Retry Successful
            Agent->>HS: Complete operation
        else Retry Failed
            Agent->>Log: Log persistent network issue
            Agent->>Human: Escalate for investigation
        end
    end
```

## Key Use Case Characteristics

1. **End-to-End Automation**: Complete workflows with minimal human intervention
2. **Graceful Degradation**: System continues operating even with partial failures
3. **Priority-Based Processing**: High-value leads get faster attention
4. **Human Escalation Points**: Clear handoff points for human intervention
5. **Recovery Mechanisms**: Robust handling of system outages and backlogs
6. **Real-Time Adaptation**: Dynamic workflow adjustments based on new data
7. **Multi-Channel Integration**: Seamless operation across HubSpot, web, and email
8. **Audit Trail**: Complete logging of all decisions and actions