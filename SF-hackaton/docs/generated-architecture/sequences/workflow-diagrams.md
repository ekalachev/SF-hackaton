# Workflow Sequence Diagrams

This document details the main workflows and business processes in the SF-hackaton AI agent system, showing how data flows through the system from initial contact creation to final outreach.

## Core Business Workflows

### 1. New Contact Processing Workflow

```mermaid
sequenceDiagram
    participant User as Website Visitor
    participant Form as HubSpot Form
    participant HS as HubSpot CRM
    participant Workflow as HubSpot Workflow
    participant TM as Task Monitor
    participant DE as Data Enricher

    Note over User,DE: New Contact Acquisition & Initial Processing

    User->>Form: Submit contact form
    Form->>HS: Create new contact record
    HS->>Workflow: Trigger: contact_created
    
    Workflow->>HS: Create "Enrich Data" task
    Note right of Workflow: Due in 5 minutes, assigned to AI-Agents
    
    loop Every Minute
        TM->>HS: Query for pending tasks
        HS-->>TM: Return task list
        
        alt Enrich Data Task Found
            TM->>HS: Update task to IN_PROGRESS
            TM->>DE: Dispatch data_enricher.sh
            break Task Processed
        end
    end
    
    DE->>HS: Fetch contact basic info
    DE->>DE: Execute enrichment process
    DE->>HS: Update contact with enriched data
    DE->>HS: Mark task as COMPLETED
    DE->>HS: Create follow-up qualification task
```

### 2. Lead Scoring and Qualification Workflow

```mermaid
sequenceDiagram
    participant DE as Data Enricher
    participant HS as HubSpot CRM
    participant TM as Task Monitor
    participant LQ as Lead Qualifier
    participant Claude as Claude MCP

    Note over DE,Claude: Lead Assessment & Qualification Process

    DE->>HS: Contact enrichment completed
    DE->>HS: Create "Qualify Lead" task
    
    TM->>HS: Detect qualification task
    TM->>LQ: Dispatch lead_qualifier.sh
    
    LQ->>HS: Fetch contact data
    LQ->>LQ: Calculate basic lead score
    Note right of LQ: Email, company, title, website scoring
    
    opt Advanced Scoring Available
        LQ->>Claude: Request sophisticated lead scoring
        Claude-->>LQ: AI-generated score (1-100)
    end
    
    LQ->>HS: Update contact with lead_score
    
    alt High Value Lead (Score > 70)
        LQ->>HS: Set lead_status = "qualified"
        LQ->>HS: Create "Send Outreach" task
        Note right of LQ: High priority outreach
        
    else Medium Value Lead (Score 40-70)
        LQ->>HS: Set lead_status = "nurture"
        LQ->>HS: Create nurture campaign task
        
    else Low Value Lead (Score < 40)
        LQ->>HS: Set lead_status = "unqualified"
        Note right of LQ: No further automated action
    end
    
    LQ->>HS: Mark qualification task as COMPLETED
```

### 3. Automated Outreach Workflow

```mermaid
sequenceDiagram
    participant LQ as Lead Qualifier
    participant HS as HubSpot CRM
    participant TM as Task Monitor
    participant OA as Outreach Agent
    participant Claude as Claude MCP
    participant Email as Email System

    Note over LQ,Email: Personalized Outreach Generation & Delivery

    LQ->>HS: Create "Send Outreach" task
    Note right of LQ: Task includes priority level
    
    TM->>HS: Detect outreach task
    TM->>OA: Dispatch outreach_agent.sh
    
    OA->>HS: Fetch contact & company data
    OA->>Claude: Request personalized outreach
    
    Note over Claude: AI generates content based on:
    Note over Claude: - Contact name, title, company
    Note over Claude: - Industry and company size
    Note over Claude: - Lead score and priority
    
    Claude-->>OA: Return outreach JSON
    Note right of Claude: Email subject, body, follow-up timing
    
    OA->>HS: Create EMAIL engagement record
    OA->>HS: Update contact outreach status
    OA->>HS: Mark outreach task as COMPLETED
    
    opt Follow-up Required
        OA->>HS: Create follow-up task
        Note right of OA: Scheduled for N days later
    end
    
    Note over Email: Email content logged in HubSpot
    Note over Email: Actual sending depends on integration
```

### 4. Data Enrichment Deep-Dive Workflow

```mermaid
sequenceDiagram
    participant DE as Data Enricher
    participant HS as HubSpot CRM
    participant Claude as Claude MCP
    participant Puppeteer as Puppeteer MCP
    participant Website as Company Website
    participant LinkedIn as LinkedIn

    Note over DE,LinkedIn: Comprehensive Contact & Company Data Enrichment

    DE->>HS: Fetch basic contact info
    DE->>Claude: Request data enrichment
    
    par Website Analysis
        Claude->>Puppeteer: Navigate to company website
        Puppeteer->>Website: Load homepage
        Website-->>Puppeteer: Page content
        Puppeteer->>Puppeteer: Extract company info
        Note right of Puppeteer: Description, industry, size, tech stack
        Puppeteer->>Puppeteer: Take screenshot
        
    and LinkedIn Research  
        Claude->>Puppeteer: Search LinkedIn for contact
        Puppeteer->>LinkedIn: Search by name/company
        LinkedIn-->>Puppeteer: Profile data
        Note right of Puppeteer: Title, experience, skills
    end
    
    Claude->>Claude: Compile enrichment data
    Claude->>Claude: Calculate decision maker score
    Claude->>Claude: Assess data quality
    Claude-->>DE: Return enrichment JSON
    
    DE->>HS: Update contact properties
    Note right of DE: Title, company_size, industry, LinkedIn URL
    DE->>HS: Create detailed engagement note
    
    alt High Value Contact (DM Score ≥ 7, Quality = HIGH)
        DE->>HS: Create high-priority qualification task
        
    else Low Quality Data
        DE->>HS: Create manual review task
        
    else Standard Contact
        DE->>HS: Create standard qualification task
    end
```

## Trigger-Based Workflows

### 5. Form Submission Trigger Workflow

```mermaid
sequenceDiagram
    participant Form as Website Form
    participant HS as HubSpot CRM
    participant Workflow as Workflow Engine
    participant TM as Task Monitor
    participant LQ as Lead Qualifier

    Note over Form,LQ: Immediate Lead Qualification for Form Submissions

    Form->>HS: Contact submits form
    HS->>Workflow: Trigger: form_submitted
    
    Workflow->>HS: Create "Qualify Lead" task
    Note right of Workflow: Due in 1 minute - urgent processing
    
    TM->>HS: Detect urgent task
    TM->>LQ: Immediate dispatch
    
    LQ->>HS: Fast-track qualification
    LQ->>HS: Update lead score
    
    alt High Score (>85)
        LQ->>HS: Create "Human Review" task
        Note right of LQ: Sales team notified immediately
        
    else Medium-High Score (70-85)
        LQ->>HS: Create "Send Outreach" task
        Note right of LQ: Automated follow-up
        
    else Lower Score (<70)
        LQ->>HS: Add to nurture campaign
    end
```

### 6. Lead Score Threshold Workflows

```mermaid
sequenceDiagram
    participant LQ as Lead Qualifier
    participant HS as HubSpot CRM
    participant Rules as Assignment Rules
    participant Sales as Sales Team
    participant OA as Outreach Agent

    Note over LQ,OA: Score-Based Workflow Routing

    LQ->>HS: Update contact lead_score
    HS->>Rules: Evaluate assignment rules
    
    alt Score > 85 (Exceptional Lead)
        Rules->>HS: Create "Human Review" task
        HS->>Sales: Assign to Sales Team
        Note right of Sales: Immediate escalation
        
    else Score > 70 (Qualified Lead)
        Rules->>HS: Create "Send Outreach" task
        HS->>OA: AI-generated outreach
        Note right of OA: Automated follow-up
        
    else Score 40-70 (Nurture Lead)
        Rules->>HS: Add to nurture sequence
        Note right of HS: Delayed follow-up campaign
        
    else Score < 40 (Unqualified)
        Rules->>HS: Mark as unqualified
        Note right of HS: No further action
    end
```

## Error Handling Workflows

### 7. Task Processing Error Recovery

```mermaid
sequenceDiagram
    participant TM as Task Monitor
    participant Agent as Any Agent
    participant HS as HubSpot CRM
    participant Human as Human Operator
    participant Log as Error Logs

    Note over TM,Log: Error Detection & Recovery Workflows

    TM->>Agent: Dispatch task
    
    alt Normal Processing
        Agent->>HS: Complete task successfully
        Agent->>Log: Log success metrics
        
    else Missing Data Error
        Agent->>HS: Update task to WAITING
        Agent->>HS: Add error note
        Agent->>Log: Log missing data details
        Note right of Agent: Task awaits human intervention
        
    else API Timeout Error
        Agent->>Agent: Retry with backoff
        alt Retry Successful
            Agent->>HS: Complete task
        else Retry Failed
            Agent->>Log: Log persistent error
            Agent->>HS: Keep task IN_PROGRESS
            Note right of HS: Will retry on next cycle
        end
        
    else Data Quality Error
        Agent->>HS: Create "Manual Review" task
        Agent->>Human: Escalate for review
        Agent->>Log: Log data quality issues
    end
```

### 8. System Recovery and Backup Workflows

```mermaid
sequenceDiagram
    participant Cron as System Cron
    participant TM as Task Monitor
    participant Lock as Lock Files
    participant HS as HubSpot CRM
    participant Backup as Backup Agent

    Note over Cron,Backup: System Health & Recovery

    loop Every Minute
        Cron->>TM: Attempt execution
        TM->>Lock: Check for existing process
        
        alt Process Running
            TM->>TM: Exit gracefully
            
        else Stale Lock Detected
            TM->>Lock: Remove stale lock
            TM->>TM: Continue with fresh start
            
        else Normal Operation
            TM->>HS: Query for tasks
            TM->>TM: Process task queue
        end
    end
    
    loop Hourly Health Check
        Backup->>HS: Check for stuck tasks
        
        alt Tasks Stuck IN_PROGRESS > 1 hour
            Backup->>HS: Reset to NOT_STARTED
            Backup->>HS: Add recovery note
            
        else System Healthy
            Backup->>Backup: Continue monitoring
        end
    end
```

## Integration Workflows

### 9. MCP Tool Integration Workflow

```mermaid
sequenceDiagram
    participant Agent as Shell Agent
    participant Config as MCP Config
    participant Claude as Claude CLI
    participant MCP_Hub as MCP HubSpot
    participant MCP_Pup as MCP Puppeteer
    participant External as External APIs

    Note over Agent,External: Multi-tool MCP Integration Pattern

    Agent->>Config: Load MCP configuration
    Agent->>Claude: Execute with --mcp-config
    
    Claude->>MCP_Hub: Initialize HubSpot connection
    Claude->>MCP_Pup: Initialize browser session
    
    par HubSpot Operations
        Claude->>MCP_Hub: Execute CRM operations
        MCP_Hub->>External: API calls to HubSpot
        External-->>MCP_Hub: CRM data
        
    and Web Operations
        Claude->>MCP_Pup: Execute browser automation
        MCP_Pup->>External: Control Chrome browser
        External-->>MCP_Pup: Web content
    end
    
    Claude->>Claude: Combine multi-source data
    Claude-->>Agent: Unified JSON response
    Agent->>Agent: Process integrated results
```

## Performance and Monitoring

### 10. System Performance Monitoring Workflow

```mermaid
sequenceDiagram
    participant Monitor as Performance Monitor
    participant Metrics as Metrics Collector
    participant Log as Log Aggregator
    participant Alert as Alert System
    participant Admin as System Admin

    Note over Monitor,Admin: System Health & Performance Tracking

    loop Continuous Monitoring
        Monitor->>Metrics: Collect agent performance data
        Monitor->>Log: Analyze log patterns
        
        Metrics->>Metrics: Calculate throughput rates
        Metrics->>Metrics: Track success/failure ratios
        
        alt Performance Degradation
            Metrics->>Alert: Trigger performance alert
            Alert->>Admin: Send notification
            
        else High Error Rate
            Log->>Alert: Trigger error rate alert
            Alert->>Admin: Send error summary
            
        else Normal Operation
            Monitor->>Monitor: Continue monitoring
        end
    end
    
    opt Daily Report
        Metrics->>Admin: Send daily performance report
        Note right of Admin: Task completion rates, error analysis
    end
```

## Key Workflow Patterns

1. **Event-Driven Processing**: HubSpot triggers → Task creation → Agent dispatch
2. **Pipeline Architecture**: Sequential processing stages with clear handoffs
3. **Conditional Routing**: Score-based and rule-based task assignment
4. **Error Recovery**: Graceful degradation with human escalation paths
5. **Rate-Limited Processing**: Built-in delays and throttling mechanisms
6. **State Persistence**: All workflow state maintained in HubSpot CRM
7. **Async Execution**: Non-blocking agent processing with background execution
8. **Idempotent Operations**: Safe retry mechanisms for failed operations