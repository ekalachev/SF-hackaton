[🏠 Home](../../README.md) | [📚 Documentation](../index.md) | [🏗️ Architecture](index.md) | [← Technical Decisions](TECHNICAL_DECISIONS.md)

---

# Component Interaction Architecture

## Detailed Component Communication Patterns

**Version:** 1.0  
**Date:** December 2024  
**Author:** Alex Fedin, O2.services

---

## 📑 Table of Contents

1. [System Component Map](#system-component-map)
2. [Detailed Interaction Flows](#detailed-interaction-flows)
   - [Task Discovery and Routing](#1-task-discovery-and-routing)
   - [Lead Qualification Flow](#2-lead-qualification-flow)
   - [Data Enrichment Flow](#3-data-enrichment-flow)
   - [Outreach Generation Flow](#4-outreach-generation-flow)
   - [Web Enrichment Flow](#5-web-enrichment-flow)
3. [Inter-Agent Communication Patterns](#inter-agent-communication-patterns)
4. [Error Handling and Recovery](#error-handling-and-recovery)
5. [Performance Optimization Patterns](#performance-optimization-patterns)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Conclusion](#conclusion)

---

## System Component Map

```mermaid
graph TB
    subgraph "Entry Points"
        Cron[Cron Scheduler<br/>* * * * *]
        Manual[Manual Trigger<br/>./demo.sh]
        API[API Webhook<br/>Future]
    end
    
    subgraph "Orchestration Layer"
        TM[Task Monitor<br/>task_monitor.sh]
        Router[Task Router<br/>Pattern Matching]
    end
    
    subgraph "Agent Layer"
        LQ[Lead Qualifier<br/>lead_qualifier.sh]
        DE[Data Enricher<br/>data_enricher.sh]
        OA[Outreach Agent<br/>outreach_agent.sh]
        WE[Web Enricher<br/>web_enricher.sh]
    end
    
    subgraph "AI Layer"
        Claude[Claude AI<br/>via MCP]
        Prompts[Prompt Templates]
    end
    
    subgraph "Data Layer"
        HS[HubSpot CRM]
        Web[Web APIs]
        Cache[Local Cache]
    end
    
    subgraph "Infrastructure"
        Logs[Log System]
        Config[Configuration]
        Env[Environment]
    end
    
    Cron --> TM
    Manual --> TM
    API -.-> TM
    
    TM --> Router
    Router --> LQ
    Router --> DE
    Router --> OA
    Router --> WE
    
    LQ --> Claude
    DE --> Claude
    OA --> Claude
    WE --> Claude
    
    Claude --> Prompts
    
    LQ --> HS
    DE --> HS
    OA --> HS
    WE --> Web
    
    TM --> Cache
    LQ --> Cache
    DE --> Cache
    
    TM --> Logs
    LQ --> Logs
    DE --> Logs
    OA --> Logs
    WE --> Logs
    
    Config --> TM
    Env --> TM
    
    style TM fill:#4ECDC4,color:#fff
    style Claude fill:#95E1D3,color:#000
    style HS fill:#FF6B6B,color:#fff
```

---

## Detailed Interaction Flows

### 1. Task Discovery and Routing

```mermaid
sequenceDiagram
    participant Cron
    participant TaskMonitor
    participant HubSpot
    participant Router
    participant Agent
    
    Cron->>TaskMonitor: Execute (every 60s)
    TaskMonitor->>TaskMonitor: Load Configuration
    
    TaskMonitor->>HubSpot: GET /tasks?status=NOT_STARTED
    HubSpot-->>TaskMonitor: Array of Tasks
    
    loop For each task
        TaskMonitor->>TaskMonitor: Extract task subject
        TaskMonitor->>Router: Route(subject, task)
        
        alt Subject contains "Qualify"
            Router->>Agent: lead_qualifier.sh
        else Subject contains "Enrich"
            Router->>Agent: data_enricher.sh
        else Subject contains "Outreach"
            Router->>Agent: outreach_agent.sh
        else Default
            Router->>TaskMonitor: Skip task
        end
        
        Agent-->>TaskMonitor: Process complete
        TaskMonitor->>HubSpot: Update task status
    end
    
    TaskMonitor->>TaskMonitor: Log summary
    TaskMonitor->>Cron: Exit 0
```

**Key Design Points**:
- **Idempotent Operations**: Safe to run multiple times
- **Atomic Task Processing**: One task fully completes before next
- **Graceful Degradation**: Failed tasks don't block others

---

### 2. Lead Qualification Flow

```mermaid
sequenceDiagram
    participant TaskMonitor
    participant LeadQualifier
    participant HubSpot
    participant Claude
    participant Cache
    
    TaskMonitor->>LeadQualifier: Process(taskId, taskData)
    
    LeadQualifier->>LeadQualifier: Parse contact ID
    
    LeadQualifier->>Cache: Check cache
    alt Cache hit
        Cache-->>LeadQualifier: Cached score
    else Cache miss
        LeadQualifier->>HubSpot: GET /contacts/{id}
        HubSpot-->>LeadQualifier: Contact data
        
        LeadQualifier->>HubSpot: GET /companies/{id}
        HubSpot-->>LeadQualifier: Company data
        
        LeadQualifier->>Claude: Qualify lead with context
        Note over Claude: Score based on:<br/>- Title (C-level +30)<br/>- Company size<br/>- Industry<br/>- Completeness
        Claude-->>LeadQualifier: Score + Reasoning
        
        LeadQualifier->>Cache: Store result
    end
    
    LeadQualifier->>LeadQualifier: Determine tier (HOT/WARM/COLD)
    
    LeadQualifier->>HubSpot: Update contact properties
    LeadQualifier->>HubSpot: Update task with results
    
    opt Score > 80
        LeadQualifier->>HubSpot: Create urgent follow-up task
    end
    
    LeadQualifier-->>TaskMonitor: Success
```

**Intelligence Points**:
- **Smart Caching**: 15-minute TTL for scores
- **Parallel Fetching**: Contact + Company data
- **Conditional Actions**: Auto-escalation for hot leads

---

### 3. Data Enrichment Flow

```mermaid
sequenceDiagram
    participant TaskMonitor
    participant DataEnricher
    participant HubSpot
    participant WebAPIs
    participant Claude
    
    TaskMonitor->>DataEnricher: Process(taskId, contactId)
    
    DataEnricher->>HubSpot: GET /contacts/{id}
    HubSpot-->>DataEnricher: Basic contact info
    
    par LinkedIn Enrichment
        DataEnricher->>WebAPIs: Search LinkedIn
        WebAPIs-->>DataEnricher: Profile data
    and Company Research
        DataEnricher->>WebAPIs: Search company info
        WebAPIs-->>DataEnricher: Company details
    and Social Presence
        DataEnricher->>WebAPIs: Search social media
        WebAPIs-->>DataEnricher: Social profiles
    end
    
    DataEnricher->>Claude: Merge and validate data
    Note over Claude: - Deduplicate<br/>- Validate emails<br/>- Standardize formats<br/>- Confidence scoring
    Claude-->>DataEnricher: Cleaned data + confidence
    
    DataEnricher->>DataEnricher: Prepare update payload
    
    DataEnricher->>HubSpot: PATCH /contacts/{id}
    Note over HubSpot: Only update if confidence > 70%
    HubSpot-->>DataEnricher: Update confirmed
    
    DataEnricher->>HubSpot: Add note with sources
    DataEnricher->>HubSpot: Update task complete
    
    DataEnricher-->>TaskMonitor: Success
```

**Smart Features**:
- **Parallel Enrichment**: 3x faster data gathering
- **Confidence Scoring**: Only high-quality updates
- **Source Attribution**: Full audit trail

---

### 4. Outreach Generation Flow

```mermaid
sequenceDiagram
    participant TaskMonitor
    participant OutreachAgent
    participant HubSpot
    participant Claude
    participant Templates
    
    TaskMonitor->>OutreachAgent: Process(taskId, contactId)
    
    OutreachAgent->>HubSpot: GET /contacts/{id}
    HubSpot-->>OutreachAgent: Contact details
    
    OutreachAgent->>HubSpot: GET /engagements?contact={id}
    HubSpot-->>OutreachAgent: Interaction history
    
    OutreachAgent->>Templates: Select template
    Note over Templates: Based on:<br/>- Lead score<br/>- Industry<br/>- Stage
    Templates-->>OutreachAgent: Base template
    
    OutreachAgent->>Claude: Personalize outreach
    Note over Claude: Context includes:<br/>- Name, role, company<br/>- Recent interactions<br/>- Pain points<br/>- Value props
    Claude-->>OutreachAgent: Personalized email
    
    OutreachAgent->>OutreachAgent: Schedule send time
    Note over OutreachAgent: Optimal time based on:<br/>- Time zone<br/>- Industry norms<br/>- Past engagement
    
    OutreachAgent->>HubSpot: Create email engagement
    HubSpot-->>OutreachAgent: Email created
    
    OutreachAgent->>HubSpot: Create follow-up task
    Note over HubSpot: +3 days if no response
    
    OutreachAgent->>HubSpot: Update original task
    OutreachAgent-->>TaskMonitor: Success
```

**Personalization Engine**:
- **Dynamic Templates**: Industry-specific messaging
- **Smart Scheduling**: Time zone aware
- **Follow-up Automation**: Self-creating task chains

---

### 5. Web Enrichment Flow

```mermaid
sequenceDiagram
    participant TaskMonitor
    participant WebEnricher
    participant SearchAPIs
    participant Claude
    participant Cache
    participant HubSpot
    
    TaskMonitor->>WebEnricher: Process(domain)
    
    WebEnricher->>Cache: Check domain cache
    alt Cache hit
        Cache-->>WebEnricher: Cached data
    else Cache miss
        par Tech Stack Discovery
            WebEnricher->>SearchAPIs: Detect technologies
            SearchAPIs-->>WebEnricher: Tech stack
        and Company News
            WebEnricher->>SearchAPIs: Recent news
            SearchAPIs-->>WebEnricher: News items
        and Funding Info
            WebEnricher->>SearchAPIs: Funding data
            SearchAPIs-->>WebEnricher: Investment info
        and Competitor Analysis
            WebEnricher->>SearchAPIs: Similar companies
            SearchAPIs-->>WebEnricher: Competitor list
        end
        
        WebEnricher->>Claude: Synthesize insights
        Claude-->>WebEnricher: Key insights + opportunities
        
        WebEnricher->>Cache: Store results
    end
    
    WebEnricher->>HubSpot: Update company record
    WebEnricher->>HubSpot: Add research note
    
    WebEnricher-->>TaskMonitor: Success
```

---

## Inter-Agent Communication Patterns

### Message Passing via Tasks

```mermaid
graph LR
    subgraph "Agent A Creates Task"
        A1[Process Data]
        A2[Need Agent B]
        A3[Create Task]
        A4[Set Subject: 'For Agent B']
        A5[Add Context in Body]
    end
    
    subgraph "Task Monitor Routes"
        T1[Poll Tasks]
        T2[Read Subject]
        T3[Route to Agent B]
    end
    
    subgraph "Agent B Processes"
        B1[Receive Task]
        B2[Process]
        B3[Update Task]
        B4[Create Follow-up if Needed]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    
    A5 --> T1
    T1 --> T2
    T2 --> T3
    
    T3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    
    style A3 fill:#4ECDC4,color:#fff
    style T2 fill:#95E1D3,color:#000
    style B3 fill:#4ECDC4,color:#fff
```

### Task Chaining Pattern

```mermaid
stateDiagram-v2
    [*] --> NewLead: Contact Created
    NewLead --> QualifyTask: Auto-create Task
    QualifyTask --> LeadQualifier: Task Monitor
    LeadQualifier --> EnrichTask: If Score > 60
    EnrichTask --> DataEnricher: Task Monitor
    DataEnricher --> OutreachTask: If Enriched
    OutreachTask --> OutreachAgent: Task Monitor
    OutreachAgent --> FollowUpTask: Schedule +3 days
    FollowUpTask --> [*]: Complete
```

---

## Error Handling and Recovery

### Circuit Breaker Pattern

```mermaid
graph TD
    subgraph "Circuit States"
        Closed[Closed<br/>Normal Operation]
        Open[Open<br/>Failing Fast]
        HalfOpen[Half Open<br/>Testing Recovery]
    end
    
    Closed -->|Failures > Threshold| Open
    Open -->|After Timeout| HalfOpen
    HalfOpen -->|Success| Closed
    HalfOpen -->|Failure| Open
    
    style Closed fill:#4ECDC4,color:#fff
    style Open fill:#FF6B6B,color:#fff
    style HalfOpen fill:#FFA07A,color:#fff
```

### Retry Strategy

```mermaid
graph LR
    subgraph "Exponential Backoff"
        Try1[Try 1<br/>Wait 1s]
        Try2[Try 2<br/>Wait 2s]
        Try3[Try 3<br/>Wait 4s]
        Try4[Try 4<br/>Wait 8s]
        Fail[Mark Failed]
    end
    
    Try1 -->|Fail| Try2
    Try2 -->|Fail| Try3
    Try3 -->|Fail| Try4
    Try4 -->|Fail| Fail
    
    Try1 -->|Success| Done1[Complete]
    Try2 -->|Success| Done2[Complete]
    Try3 -->|Success| Done3[Complete]
    Try4 -->|Success| Done4[Complete]
```

---

## Performance Optimization Patterns

### Caching Strategy

```mermaid
graph TD
    subgraph "Cache Layers"
        L1[L1: Process Memory<br/>10 seconds]
        L2[L2: File Cache<br/>15 minutes]
        L3[L3: HubSpot Properties<br/>Permanent]
    end
    
    Request --> L1
    L1 -->|Miss| L2
    L2 -->|Miss| L3
    L3 -->|Miss| Fetch[Fetch from Source]
    
    Fetch --> L3
    L3 --> L2
    L2 --> L1
    L1 --> Response
    
    style L1 fill:#95E1D3,color:#000
    style L2 fill:#4ECDC4,color:#fff
    style L3 fill:#FF6B6B,color:#fff
```

### Batch Processing

```mermaid
graph LR
    subgraph "Individual Processing"
        I1[Task 1] --> P1[Process] --> U1[Update]
        I2[Task 2] --> P2[Process] --> U2[Update]
        I3[Task 3] --> P3[Process] --> U3[Update]
    end
    
    subgraph "Batch Processing"
        B1[Tasks 1-3] --> BP[Batch Process] --> BU[Batch Update]
    end
    
    style U3 fill:#FF6B6B,color:#fff
    style BU fill:#4ECDC4,color:#fff
```

---

## Monitoring and Observability

### Distributed Tracing

```mermaid
graph TD
    subgraph "Trace Flow"
        Start[Request Start<br/>TraceID: abc123]
        TM[Task Monitor<br/>SpanID: 001]
        Agent[Lead Qualifier<br/>SpanID: 002]
        AI[Claude Call<br/>SpanID: 003]
        HS[HubSpot Update<br/>SpanID: 004]
        End[Request End<br/>Duration: 2.3s]
    end
    
    Start --> TM
    TM --> Agent
    Agent --> AI
    Agent --> HS
    HS --> End
    
    style Start fill:#4ECDC4,color:#fff
    style End fill:#95E1D3,color:#000
```

### Health Check Pattern

```mermaid
graph LR
    subgraph "Health Indicators"
        API[API Available]
        Queue[Queue Depth]
        Errors[Error Rate]
        Latency[Response Time]
    end
    
    subgraph "Status"
        Green[Healthy]
        Yellow[Degraded]
        Red[Unhealthy]
    end
    
    API --> Green
    Queue --> Yellow
    Errors --> Yellow
    Latency --> Red
    
    Green --> Overall[Overall: Degraded]
    Yellow --> Overall
    Red --> Overall
    
    style Green fill:#4ECDC4,color:#fff
    style Yellow fill:#FFA07A,color:#fff
    style Red fill:#FF6B6B,color:#fff
```

---

## Conclusion

The component interaction architecture demonstrates:

1. **Loose Coupling**: Agents don't know about each other
2. **High Cohesion**: Each agent has single responsibility  
3. **Resilience**: Multiple failure recovery patterns
4. **Observability**: Full system transparency
5. **Performance**: Optimized for minimal latency

This design enables:
- Adding new agents without changing existing ones
- Scaling individual components independently
- Debugging issues through comprehensive logging
- Maintaining high availability despite failures

The elegance lies not in complexity, but in the sophisticated simplicity of well-orchestrated components.

---

**Document Version**: 1.0  
**Last Updated**: December 2024

---

[⬆️ Top](#component-interaction-architecture) | [🏗️ Architecture Home](index.md) | [← Technical Decisions](TECHNICAL_DECISIONS.md)