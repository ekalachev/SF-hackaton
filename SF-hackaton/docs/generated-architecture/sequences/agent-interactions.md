[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture Hub](../README.md) | [🔄 Sequences](../sequences/)

---

# Agent Interactions Sequence Diagrams

This document outlines how the AI agents in the SF-hackaton project communicate and interact with each other, HubSpot CRM, and external services.

## Overview

The system consists of several specialized agents that work together to automate lead processing:

- **Task Monitor Agent**: Central orchestrator that polls HubSpot for tasks
- **Data Enricher Agent**: Enriches contact and company data using web scraping
- **Lead Qualifier Agent**: Scores and qualifies leads based on enriched data
- **Outreach Agent**: Generates and sends personalized outreach messages
- **Web Enricher Agent**: Specialized web scraping and data gathering
- **HubSpot API Helper**: Shared utility for HubSpot API interactions

## Agent Communication Patterns

### 1. Central Task Orchestration

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant TM as Task Monitor
    participant HS as HubSpot CRM
    participant DE as Data Enricher
    participant LQ as Lead Qualifier  
    participant OA as Outreach Agent

    loop Every Minute
        Cron->>TM: Execute task_monitor.sh
        TM->>HS: Query for pending tasks
        HS-->>TM: Return task list JSON
        
        alt Task Type: "Enrich Data"
            TM->>DE: Dispatch data_enricher.sh
            TM->>HS: Update task status to IN_PROGRESS
        
        else Task Type: "Qualify Lead"
            TM->>LQ: Dispatch lead_qualifier.sh
            TM->>HS: Update task status to IN_PROGRESS
            
        else Task Type: "Send Outreach"
            TM->>OA: Dispatch outreach_agent.sh
            TM->>HS: Update task status to IN_PROGRESS
            
        else Unknown Task Type
            TM->>HS: Mark task as WAITING for human review
        end
    end
```

### 2. Agent-to-Agent Workflow Triggers

```mermaid
sequenceDiagram
    participant DE as Data Enricher
    participant HS as HubSpot CRM
    participant LQ as Lead Qualifier
    participant OA as Outreach Agent
    participant TM as Task Monitor

    Note over DE,OA: Data Enrichment → Qualification → Outreach Flow

    DE->>HS: Enrich contact data
    DE->>HS: Calculate decision_maker_score
    
    alt High Value Contact (DM Score ≥ 7)
        DE->>HS: Create "Qualify Lead - High Value" task
        Note right of DE: Task created with HIGH priority
        TM->>HS: Detect new qualification task
        TM->>LQ: Dispatch lead_qualifier.sh
        
        LQ->>HS: Score lead using enriched data
        LQ->>HS: Update lead_score and lead_status
        
        alt Lead Score > 70
            LQ->>HS: Create "Send Outreach" task
            TM->>HS: Detect new outreach task
            TM->>OA: Dispatch outreach_agent.sh
            
            OA->>HS: Generate personalized outreach
            OA->>HS: Create email engagement
            OA->>HS: Schedule follow-up task
        end
        
    else Standard Contact
        DE->>HS: Create "Qualify Lead" task
        Note right of DE: Task created with MEDIUM priority
        
    else Low Quality Data
        DE->>HS: Create "Manual Review Needed" task
        Note right of DE: Task for human intervention
    end
```

### 3. Inter-Agent Data Dependencies

```mermaid
sequenceDiagram
    participant WE as Web Enricher
    participant DE as Data Enricher
    participant Claude as Claude MCP
    participant Puppeteer as Puppeteer MCP
    participant HS as HubSpot CRM

    Note over WE,HS: Data enrichment dependency chain

    DE->>HS: Fetch contact basic info
    DE->>Claude: Request data enrichment
    Claude->>Puppeteer: Navigate to company website
    Puppeteer-->>Claude: Website content & screenshot
    Claude->>Puppeteer: Search LinkedIn for contact
    Puppeteer-->>Claude: LinkedIn profile data
    Claude-->>DE: Compiled enrichment JSON
    
    DE->>HS: Update contact with enriched data
    DE->>HS: Create engagement note
    DE->>HS: Trigger next workflow step
    
    opt Web Enricher Called Separately
        WE->>Puppeteer: Scrape company website
        WE->>Puppeteer: Capture screenshot
        WE->>Puppeteer: Analyze competitors
        Puppeteer-->>WE: Web data JSON
    end
```

## Agent Lifecycle Management

### 4. Task State Management

```mermaid
sequenceDiagram
    participant Agent as Any Agent
    participant HS as HubSpot CRM
    participant TM as Task Monitor
    participant Lock as Lock File

    TM->>Lock: Check for existing process
    alt Process Already Running
        TM->>TM: Exit (prevent duplicate)
    else No Running Process
        TM->>Lock: Create lock file
        TM->>HS: Query for tasks
        
        loop For Each Task
            TM->>HS: Update task to IN_PROGRESS
            TM->>Agent: Dispatch with task_id & data
            
            Agent->>HS: Process task (enrich/qualify/outreach)
            Agent->>HS: Update task to COMPLETED
            Agent->>HS: Create follow-up tasks (if needed)
            Agent->>HS: Log engagement notes
        end
        
        TM->>Lock: Remove lock file
    end
```

### 5. Error Handling and Recovery

```mermaid
sequenceDiagram
    participant Agent as Agent Process
    participant HS as HubSpot CRM
    participant Log as Log File

    Agent->>HS: Attempt task processing
    
    alt Processing Successful
        Agent->>HS: Update task to COMPLETED
        Agent->>Log: Log success metrics
        
    else Missing Contact ID
        Agent->>HS: Update task to WAITING
        Agent->>HS: Add note: "No contact associated"
        Agent->>Log: Log error condition
        
    else API Error
        Agent->>HS: Keep task as IN_PROGRESS
        Agent->>Log: Log error details
        Note right of Agent: Task will retry on next monitor cycle
        
    else Data Enrichment Failed
        Agent->>HS: Create "Manual Review" task
        Agent->>HS: Update original task status
        Agent->>Log: Log data gaps
    end
```

## MCP Integration Patterns

### 6. Claude MCP Tool Usage

```mermaid
sequenceDiagram
    participant Agent as Shell Agent
    participant Claude as Claude CLI
    participant MCP_HS as HubSpot MCP
    participant MCP_PP as Puppeteer MCP
    participant HS as HubSpot API
    participant Browser as Chrome Browser

    Agent->>Claude: Execute with --mcp-config
    Claude->>MCP_HS: Initialize HubSpot connection
    Claude->>MCP_PP: Initialize Puppeteer session
    
    Note over Agent,Browser: Dual-channel processing
    
    par HubSpot Operations
        Claude->>MCP_HS: Fetch contact data
        MCP_HS->>HS: API call with bearer token
        HS-->>MCP_HS: Contact JSON
        MCP_HS-->>Claude: Structured data
    and Web Operations
        Claude->>MCP_PP: Navigate to website
        MCP_PP->>Browser: Control Chrome instance
        Browser-->>MCP_PP: Page content
        MCP_PP-->>Claude: Scraped data
    end
    
    Claude->>Claude: Process & analyze data
    Claude-->>Agent: JSON response
    Agent->>Agent: Parse and use results
```

## Communication Interfaces

### 7. Data Flow Between Components

```mermaid
sequenceDiagram
    participant Config as Configuration Files
    participant TM as Task Monitor
    participant Agent as Specialist Agent
    participant Helper as API Helper
    participant External as External APIs

    Config->>TM: Load task assignment rules
    Config->>TM: Load workflow triggers
    Config->>Agent: Load task templates
    
    TM->>Helper: Use shared API functions
    Helper->>External: HubSpot API calls
    
    Agent->>Helper: Reuse common operations
    Helper->>External: Standardized API requests
    
    Note over Config,External: Shared configuration ensures consistency
    Note over Helper,External: Single point of API integration
```

## Key Architectural Patterns

1. **Event-Driven Architecture**: Cron triggers task monitoring, which creates events for agent dispatch
2. **Microservice Communication**: Agents communicate via shared HubSpot state and task creation
3. **Shared State Management**: HubSpot CRM acts as the central state store
4. **Async Processing**: Agents run in background processes with fire-and-forget pattern
5. **Circuit Breaker**: Lock files prevent duplicate processing
6. **Data Pipeline**: Clear data flow from enrichment → qualification → outreach
7. **MCP Abstraction**: Claude MCP tools provide unified interface to external services

## Performance Considerations

- **Rate Limiting**: 2-second delays between API calls to prevent throttling
- **Parallel Processing**: Agents run concurrently using background execution (`&`)
- **Lock Files**: Prevent duplicate task monitor instances
- **Stateless Design**: Each agent execution is independent
- **Caching**: Web data and screenshots cached for efficiency
- **Batch Processing**: Multiple tasks processed in single monitor cycle

---

**Navigation**: [🏗️ Architecture Hub](../README.md) | [🗺️ Navigation](../navigation.md) | [📋 Contents](../toc.md) | [🔄 Sequences](../sequences/) | [🏠 Home](../../../README.md)