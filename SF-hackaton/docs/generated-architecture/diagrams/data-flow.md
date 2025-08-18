[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [📊 Diagrams](./index.md)

---

# Data Flow Diagrams

**Author:** AI Architecture Assistant  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0

## 📑 Table of Contents
1. [Overview](#overview)
2. [Lead Processing Flow](#lead-processing-flow)
3. [Task Orchestration Flow](#task-orchestration-flow)
4. [Data Enrichment Flow](#data-enrichment-flow)
5. [Outreach Campaign Flow](#outreach-campaign-flow)
6. [State Management Flow](#state-management-flow)
7. [Error Recovery Flow](#error-recovery-flow)
8. [Analytics Data Flow](#analytics-data-flow)
9. [Related Documents](#related-documents)

---

## Overview

This document illustrates how data flows through the AI Sales Agent Swarm system, from initial lead capture through enrichment, qualification, and outreach.

## Lead Processing Flow

### End-to-End Lead Journey

```mermaid
graph TB
    %% Styling
    classDef process fill:#4ECDC4,stroke:#45b7b5,color:#fff
    classDef data fill:#FFA07A,stroke:#FF8C69,color:#fff
    classDef decision fill:#95E1D3,stroke:#85d1c3,color:#000
    classDef external fill:#999999,stroke:#8a8a8a,color:#fff
    
    %% Lead Creation
    Start([Lead Created]) --> LeadData[(Lead Data)]:::data
    LeadData --> CreateTask[Create Qualification Task]:::process
    
    %% Qualification Flow
    CreateTask --> TaskQueue[(Task Queue)]:::data
    TaskQueue --> TaskMonitor[Task Monitor]:::process
    TaskMonitor --> QualifierAgent[Lead Qualifier Agent]:::process
    
    QualifierAgent --> FetchLead[Fetch Lead Details]:::process
    FetchLead --> LeadInfo[(Lead Information)]:::data
    
    LeadInfo --> AIScoring[AI Scoring Engine]:::process
    AIScoring --> ScoreData[(Score Data)]:::data
    
    ScoreData --> TierDecision{Tier Assignment}:::decision
    
    TierDecision -->|HOT| HotLead[Hot Lead Process]:::process
    TierDecision -->|WARM| WarmLead[Warm Lead Process]:::process
    TierDecision -->|COLD| ColdLead[Cold Lead Process]:::process
    
    %% Enrichment Branch
    HotLead --> EnrichTask[Create Enrichment Task]:::process
    WarmLead --> EnrichTask
    
    EnrichTask --> EnrichQueue[(Enrichment Queue)]:::data
    EnrichQueue --> DataEnricher[Data Enricher Agent]:::process
    
    DataEnricher --> WebSearch[Web Search]:::external
    WebSearch --> EnrichedData[(Enriched Data)]:::data
    
    %% Outreach Branch
    EnrichedData --> OutreachDecision{Outreach Needed?}:::decision
    
    OutreachDecision -->|Yes| CreateOutreach[Create Outreach Task]:::process
    OutreachDecision -->|No| UpdateCRM[Update CRM Only]:::process
    
    CreateOutreach --> OutreachQueue[(Outreach Queue)]:::data
    OutreachQueue --> OutreachAgent[Outreach Agent]:::process
    
    OutreachAgent --> GenerateEmail[Generate Email]:::process
    GenerateEmail --> EmailData[(Email Content)]:::data
    
    EmailData --> SendEmail[Send Email]:::external
    SendEmail --> TrackEngagement[Track Engagement]:::process
    
    %% Final Updates
    TrackEngagement --> UpdateCRM
    ColdLead --> UpdateCRM
    UpdateCRM --> End([Process Complete])
```

### Lead Data Transformation

```mermaid
graph LR
    subgraph "Raw Lead"
        R1[Name: John Doe]
        R2[Email: john@company.com]
        R3[Company: Company Inc]
    end
    
    subgraph "After Qualification"
        Q1[Score: 85/100]
        Q2[Tier: HOT]
        Q3[ICP Match: High]
        Q4[Buying Intent: Strong]
    end
    
    subgraph "After Enrichment"
        E1[Title: VP Sales]
        E2[LinkedIn: /in/johndoe]
        E3[Company Size: 500-1000]
        E4[Revenue: $50M-100M]
        E5[Industry: SaaS]
    end
    
    subgraph "After Outreach"
        O1[Emails Sent: 3]
        O2[Opens: 2]
        O3[Clicks: 1]
        O4[Reply: Interested]
        O5[Next Step: Demo]
    end
    
    R1 --> Q1
    R2 --> Q2
    R3 --> Q3
    
    Q1 --> E1
    Q2 --> E2
    Q3 --> E3
    Q4 --> E4
    
    E1 --> O1
    E2 --> O2
    E3 --> O3
    E4 --> O4
    E5 --> O5
```

## Task Orchestration Flow

### Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: New Task
    Created --> Queued: Added to Queue
    Queued --> Assigned: Agent Picks Up
    Assigned --> Processing: Active Work
    
    Processing --> Validating: Validate Results
    Validating --> Completing: Update Records
    
    Completing --> Completed: Success
    Processing --> Failed: Error
    
    Failed --> Retrying: Retry Logic
    Retrying --> Processing: Retry Attempt
    
    Completed --> Archived: After 30 days
    Failed --> Archived: Max Retries
    
    Archived --> [*]
    
    note right of Processing
        Agent actively working
        on the task
    end note
    
    note right of Failed
        Error logged and
        escalation triggered
    end note
```

### Task Routing Logic

```mermaid
graph TD
    Task[New Task]
    
    Task --> Subject{Check Subject}
    
    Subject -->|Contains 'Qualify'| QualifyRoute[Route to Lead Qualifier]
    Subject -->|Contains 'Enrich'| EnrichRoute[Route to Data Enricher]
    Subject -->|Contains 'Outreach'| OutreachRoute[Route to Outreach Agent]
    Subject -->|Contains 'Web'| WebRoute[Route to Web Enricher]
    Subject -->|Unknown| DefaultRoute[Route to Default Handler]
    
    QualifyRoute --> QualifyAgent[Lead Qualifier Agent]
    EnrichRoute --> EnrichAgent[Data Enricher Agent]
    OutreachRoute --> OutreachAgent[Outreach Agent]
    WebRoute --> WebAgent[Web Enricher Agent]
    DefaultRoute --> ErrorHandler[Error Handler]
    
    QualifyAgent --> ProcessTask[Process Task]
    EnrichAgent --> ProcessTask
    OutreachAgent --> ProcessTask
    WebAgent --> ProcessTask
    ErrorHandler --> LogError[Log Unknown Task]
```

## Data Enrichment Flow

### Multi-Source Enrichment

```mermaid
graph TB
    subgraph "Input"
        Contact[Contact Record]
        Company[Company Name]
        Email[Email Address]
    end
    
    subgraph "Enrichment Sources"
        subgraph "Web Search"
            Google[Google Search]
            Bing[Bing Search]
        end
        
        subgraph "Social Media"
            LinkedIn[LinkedIn API]
            Twitter[Twitter API]
        end
        
        subgraph "Data Providers"
            Clearbit[Clearbit API]
            Hunter[Hunter.io API]
        end
        
        subgraph "Company Data"
            Website[Company Website]
            News[News Articles]
        end
    end
    
    subgraph "Processing"
        Aggregator[Data Aggregator]
        Validator[Data Validator]
        Deduper[Deduplication]
        Scorer[Confidence Scorer]
    end
    
    subgraph "Output"
        EnrichedRecord[Enriched Contact]
        Metadata[Enrichment Metadata]
        QualityScore[Data Quality Score]
    end
    
    Contact --> Google
    Company --> LinkedIn
    Email --> Hunter
    
    Google --> Aggregator
    Bing --> Aggregator
    LinkedIn --> Aggregator
    Twitter --> Aggregator
    Clearbit --> Aggregator
    Hunter --> Aggregator
    Website --> Aggregator
    News --> Aggregator
    
    Aggregator --> Validator
    Validator --> Deduper
    Deduper --> Scorer
    
    Scorer --> EnrichedRecord
    Scorer --> Metadata
    Scorer --> QualityScore
```

### Data Validation Pipeline

```mermaid
graph LR
    subgraph "Validation Steps"
        Input[Raw Data]
        
        Format[Format Check]
        Type[Type Validation]
        Range[Range Validation]
        Business[Business Rules]
        Duplicate[Duplicate Check]
        
        Output[Validated Data]
    end
    
    subgraph "Validation Results"
        Valid[Valid Data]
        Invalid[Invalid Data]
        Warning[Data with Warnings]
    end
    
    Input --> Format
    Format --> Type
    Type --> Range
    Range --> Business
    Business --> Duplicate
    Duplicate --> Output
    
    Output --> Valid
    Output --> Invalid
    Output --> Warning
    
    Invalid --> ErrorLog[Error Log]
    Warning --> ReviewQueue[Review Queue]
    Valid --> CRMUpdate[Update CRM]
```

## Outreach Campaign Flow

### Email Generation and Personalization

```mermaid
sequenceDiagram
    actor Lead
    participant OutreachAgent
    participant Claude
    participant TemplateEngine
    participant EmailService
    participant HubSpot
    participant Analytics
    
    OutreachAgent->>HubSpot: Fetch Lead Data
    HubSpot-->>OutreachAgent: Lead Profile
    
    OutreachAgent->>TemplateEngine: Select Template
    TemplateEngine-->>OutreachAgent: Base Template
    
    OutreachAgent->>Claude: Generate Personalized Content
    Note over Claude: Analyze lead profile<br/>Generate custom sections<br/>Maintain brand voice
    Claude-->>OutreachAgent: Personalized Content
    
    OutreachAgent->>TemplateEngine: Merge Content
    TemplateEngine-->>OutreachAgent: Final Email
    
    OutreachAgent->>EmailService: Send Email
    EmailService->>Lead: Deliver Email
    
    Lead->>EmailService: Open/Click
    EmailService-->>Analytics: Track Engagement
    
    Analytics->>HubSpot: Update Activity
    HubSpot->>OutreachAgent: Trigger Follow-up
```

### Campaign State Machine

```mermaid
stateDiagram-v2
    [*] --> Planning: Campaign Created
    
    Planning --> SegmentAudience: Define Audience
    SegmentAudience --> CreateContent: Generate Content
    CreateContent --> ScheduleSend: Schedule Delivery
    
    ScheduleSend --> Sending: Execute Campaign
    Sending --> Delivered: Emails Sent
    
    Delivered --> Tracking: Monitor Engagement
    
    Tracking --> Opened: Email Opened
    Tracking --> Clicked: Link Clicked
    Tracking --> Replied: Lead Replied
    Tracking --> Bounced: Email Bounced
    
    Opened --> FollowUp1: Send Follow-up
    Clicked --> Qualified: Mark Qualified
    Replied --> HandOff: Human Takeover
    Bounced --> UpdateRecord: Clean Database
    
    FollowUp1 --> Tracking: Continue Monitoring
    
    Qualified --> [*]: Success
    HandOff --> [*]: Success
    UpdateRecord --> [*]: Complete
```

## State Management Flow

### System State Synchronization

```mermaid
graph TB
    subgraph "State Sources"
        HubSpotState[HubSpot State<br/>Source of Truth]
        AgentState[Agent State<br/>Temporary]
        CacheState[Cache State<br/>Performance]
    end
    
    subgraph "State Operations"
        Read[Read Operation]
        Write[Write Operation]
        Sync[Sync Operation]
    end
    
    subgraph "Consistency Management"
        Validator[State Validator]
        Resolver[Conflict Resolver]
        Updater[State Updater]
    end
    
    Read --> CacheState
    CacheState -->|Miss| HubSpotState
    CacheState -->|Hit| Return[Return Data]
    
    Write --> AgentState
    AgentState --> Validator
    Validator --> HubSpotState
    HubSpotState --> CacheState
    
    Sync --> Resolver
    Resolver --> Updater
    Updater --> HubSpotState
    Updater --> CacheState
    Updater --> AgentState
```

### Transaction Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Lock as Lock Manager
    participant State as State Store
    participant HubSpot
    participant Audit as Audit Log
    
    Agent->>Lock: Acquire Lock
    Lock-->>Agent: Lock Acquired
    
    Agent->>State: Begin Transaction
    
    Agent->>State: Read Current State
    State-->>Agent: Current Values
    
    Agent->>Agent: Process Changes
    
    Agent->>State: Write New State
    State->>HubSpot: Persist Changes
    HubSpot-->>State: Confirmation
    
    State-->>Agent: Success
    
    Agent->>Audit: Log Transaction
    
    Agent->>State: Commit Transaction
    
    Agent->>Lock: Release Lock
    
    Note over Agent: Transaction Complete
```

## Error Recovery Flow

### Error Handling Strategy

```mermaid
graph TD
    Error[Error Detected]
    
    Error --> Classify{Classify Error}
    
    Classify -->|Transient| TransientHandler[Transient Handler]
    Classify -->|Permanent| PermanentHandler[Permanent Handler]
    Classify -->|Unknown| UnknownHandler[Unknown Handler]
    
    TransientHandler --> Retry{Retry Count}
    Retry -->|< Max| Wait[Exponential Backoff]
    Wait --> RetryOperation[Retry Operation]
    RetryOperation --> Success{Success?}
    
    Success -->|Yes| Complete[Mark Complete]
    Success -->|No| Retry
    
    Retry -->|>= Max| Escalate[Escalate to Human]
    
    PermanentHandler --> LogError[Log Error]
    LogError --> SkipRecord[Skip Record]
    SkipRecord --> Continue[Continue Processing]
    
    UnknownHandler --> CaptureContext[Capture Context]
    CaptureContext --> AlertAdmin[Alert Administrator]
    AlertAdmin --> ManualReview[Manual Review]
    
    Escalate --> CreateTicket[Create Support Ticket]
    CreateTicket --> NotifyTeam[Notify Team]
```

### Retry Logic

```mermaid
graph LR
    subgraph "Retry Configuration"
        Attempt1[Attempt 1<br/>Wait: 1s]
        Attempt2[Attempt 2<br/>Wait: 2s]
        Attempt3[Attempt 3<br/>Wait: 4s]
        Attempt4[Attempt 4<br/>Wait: 8s]
        Attempt5[Attempt 5<br/>Wait: 16s]
        
        Attempt1 -->|Fail| Attempt2
        Attempt2 -->|Fail| Attempt3
        Attempt3 -->|Fail| Attempt4
        Attempt4 -->|Fail| Attempt5
        Attempt5 -->|Fail| GiveUp[Give Up]
        
        Attempt1 -->|Success| Done[Complete]
        Attempt2 -->|Success| Done
        Attempt3 -->|Success| Done
        Attempt4 -->|Success| Done
        Attempt5 -->|Success| Done
    end
```

## Analytics Data Flow

### Metrics Collection and Aggregation

```mermaid
graph TB
    subgraph "Data Sources"
        AgentMetrics[Agent Metrics]
        TaskMetrics[Task Metrics]
        APIMetrics[API Metrics]
        SystemMetrics[System Metrics]
    end
    
    subgraph "Collection Layer"
        Collector[Metrics Collector]
        Parser[Data Parser]
        Enricher[Context Enricher]
    end
    
    subgraph "Processing Layer"
        Aggregator[Aggregator]
        Calculator[KPI Calculator]
        Analyzer[Trend Analyzer]
    end
    
    subgraph "Storage Layer"
        TimeSeries[(Time Series DB)]
        Snapshot[(Daily Snapshots)]
        Archive[(Historical Archive)]
    end
    
    subgraph "Presentation Layer"
        Dashboard[Real-time Dashboard]
        Reports[Daily Reports]
        Alerts[Alert System]
    end
    
    AgentMetrics --> Collector
    TaskMetrics --> Collector
    APIMetrics --> Collector
    SystemMetrics --> Collector
    
    Collector --> Parser
    Parser --> Enricher
    Enricher --> Aggregator
    
    Aggregator --> Calculator
    Calculator --> Analyzer
    
    Analyzer --> TimeSeries
    TimeSeries --> Snapshot
    Snapshot --> Archive
    
    TimeSeries --> Dashboard
    Snapshot --> Reports
    Analyzer --> Alerts
```

### Performance Metrics Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Monitor as Performance Monitor
    participant Metrics as Metrics Store
    participant Analyzer
    participant Dashboard
    participant Alert as Alert Manager
    
    loop Every Operation
        Agent->>Monitor: Start Timer
        Agent->>Agent: Execute Operation
        Agent->>Monitor: End Timer
        
        Monitor->>Metrics: Record Duration
        Monitor->>Metrics: Record Success/Failure
        Monitor->>Metrics: Record Resource Usage
    end
    
    loop Every Minute
        Analyzer->>Metrics: Fetch Recent Data
        Metrics-->>Analyzer: Raw Metrics
        
        Analyzer->>Analyzer: Calculate Averages
        Analyzer->>Analyzer: Detect Anomalies
        
        Analyzer->>Dashboard: Update Visualizations
        
        alt Performance Degradation
            Analyzer->>Alert: Trigger Alert
            Alert->>Alert: Send Notification
        end
    end
```

### Data Retention Policy

```mermaid
graph TD
    subgraph "Data Categories"
        RealTime[Real-time Data<br/>1 hour]
        Recent[Recent Data<br/>24 hours]
        Weekly[Weekly Data<br/>7 days]
        Monthly[Monthly Data<br/>30 days]
        Yearly[Yearly Data<br/>365 days]
    end
    
    subgraph "Aggregation Levels"
        Raw[Raw Metrics<br/>Every second]
        Minute[1-Minute Aggregates]
        Hour[Hourly Aggregates]
        Day[Daily Aggregates]
        Month[Monthly Aggregates]
    end
    
    subgraph "Storage Tiers"
        Hot[Hot Storage<br/>SSD, Immediate]
        Warm[Warm Storage<br/>HDD, Minutes]
        Cold[Cold Storage<br/>S3, Hours]
    end
    
    RealTime --> Raw
    Recent --> Minute
    Weekly --> Hour
    Monthly --> Day
    Yearly --> Month
    
    Raw --> Hot
    Minute --> Hot
    Hour --> Warm
    Day --> Warm
    Month --> Cold
```

---

## Related Documents

- [System Context](./system-context.md) - System overview
- [Container Architecture](./container-architecture.md) - Container structure
- [Component Diagrams](./component-diagrams.md) - Component details
- [Deployment Architecture](./deployment-architecture.md) - Infrastructure setup

[⬆️ Back to top](#-table-of-contents)

---

[⬅️ Deployment Architecture](./deployment-architecture.md) | [⬆️ Diagrams](./index.md) | [➡️ System Context](./system-context.md)