[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [📊 Diagrams](./index.md)

---

# Component Diagrams (C4 Level 3)

**Author:** AI Architecture Assistant  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0

## 📑 Table of Contents
1. [Overview](#overview)
2. [Task Monitor Components](#task-monitor-components)
3. [Lead Qualifier Components](#lead-qualifier-components)
4. [Data Enricher Components](#data-enricher-components)
5. [Outreach Agent Components](#outreach-agent-components)
6. [MCP Server Components](#mcp-server-components)
7. [Component Interactions](#component-interactions)
8. [Related Documents](#related-documents)

---

## Overview

This document provides detailed component-level architecture for each major subsystem in the AI Sales Agent Swarm, showing internal structure and interactions.

## Task Monitor Components

```mermaid
graph TB
    subgraph "Task Monitor Agent"
        subgraph "Core Components"
            LockManager[Lock Manager<br/><<Component>><br/>Prevents duplicate runs]
            TaskPoller[Task Poller<br/><<Component>><br/>HubSpot query engine]
            TaskRouter[Task Router<br/><<Component>><br/>Pattern matching logic]
            AgentDispatcher[Agent Dispatcher<br/><<Component>><br/>Process spawner]
            StatusUpdater[Status Updater<br/><<Component>><br/>Task state manager]
        end
        
        subgraph "Support Components"
            Logger[Logger<br/><<Component>><br/>Activity logging]
            ConfigLoader[Config Loader<br/><<Component>><br/>Settings management]
            ErrorHandler[Error Handler<br/><<Component>><br/>Exception management]
        end
        
        subgraph "Data Structures"
            TaskQueue[Task Queue<br/><<Data>><br/>Pending tasks]
            AgentRegistry[Agent Registry<br/><<Data>><br/>Available agents]
            RouteRules[Route Rules<br/><<Data>><br/>Dispatch patterns]
        end
    end
    
    %% Internal flows
    LockManager --> TaskPoller
    TaskPoller --> TaskQueue
    TaskQueue --> TaskRouter
    TaskRouter --> RouteRules
    TaskRouter --> AgentDispatcher
    AgentDispatcher --> AgentRegistry
    AgentDispatcher --> StatusUpdater
    
    ConfigLoader --> RouteRules
    ConfigLoader --> AgentRegistry
    
    TaskPoller --> Logger
    AgentDispatcher --> Logger
    StatusUpdater --> Logger
    
    TaskPoller --> ErrorHandler
    AgentDispatcher --> ErrorHandler
```

### Task Monitor Component Details

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| Lock Manager | Ensures single instance | PID file at `/tmp/task_monitor.lock` |
| Task Poller | Queries HubSpot for tasks | MCP API calls every 60 seconds |
| Task Router | Matches tasks to agents | Pattern matching on task subject |
| Agent Dispatcher | Spawns agent processes | Shell subprocess execution |
| Status Updater | Updates task status | HubSpot API via MCP |
| Logger | Records all activities | Append to `logs/task_monitor.log` |
| Config Loader | Loads configuration | Reads JSON config files |
| Error Handler | Manages failures | Retry logic with backoff |

## Lead Qualifier Components

```mermaid
graph TB
    subgraph "Lead Qualifier Agent"
        subgraph "Processing Pipeline"
            ContactFetcher[Contact Fetcher<br/><<Component>><br/>Retrieves lead data]
            DataValidator[Data Validator<br/><<Component>><br/>Input validation]
            ScoringEngine[Scoring Engine<br/><<Component>><br/>Multi-factor scoring]
            TierCalculator[Tier Calculator<br/><<Component>><br/>HOT/WARM/COLD logic]
            AIAnalyzer[AI Analyzer<br/><<Component>><br/>Claude integration]
        end
        
        subgraph "Scoring Factors"
            CompanyScore[Company Score<br/><<Component>><br/>Size, industry, revenue]
            EngagementScore[Engagement Score<br/><<Component>><br/>Email, website activity]
            FitScore[Fit Score<br/><<Component>><br/>ICP matching]
            TimingScore[Timing Score<br/><<Component>><br/>Buying signals]
            BudgetScore[Budget Score<br/><<Component>><br/>Financial capacity]
        end
        
        subgraph "Output Components"
            ScoreAggregator[Score Aggregator<br/><<Component>><br/>Weighted average]
            ReasonGenerator[Reason Generator<br/><<Component>><br/>Explanation text]
            CRMUpdater[CRM Updater<br/><<Component>><br/>Field updates]
            TaskCompleter[Task Completer<br/><<Component>><br/>Status update]
        end
    end
    
    %% Processing flow
    ContactFetcher --> DataValidator
    DataValidator --> ScoringEngine
    
    ScoringEngine --> CompanyScore
    ScoringEngine --> EngagementScore
    ScoringEngine --> FitScore
    ScoringEngine --> TimingScore
    ScoringEngine --> BudgetScore
    
    CompanyScore --> ScoreAggregator
    EngagementScore --> ScoreAggregator
    FitScore --> ScoreAggregator
    TimingScore --> ScoreAggregator
    BudgetScore --> ScoreAggregator
    
    ScoreAggregator --> TierCalculator
    ScoringEngine --> AIAnalyzer
    AIAnalyzer --> ReasonGenerator
    
    TierCalculator --> CRMUpdater
    ReasonGenerator --> CRMUpdater
    CRMUpdater --> TaskCompleter
```

### Lead Qualifier Scoring Algorithm

```mermaid
graph LR
    subgraph "Scoring Weights"
        W1[Company: 25%]
        W2[Engagement: 20%]
        W3[Fit: 30%]
        W4[Timing: 15%]
        W5[Budget: 10%]
    end
    
    subgraph "Tier Thresholds"
        HOT[HOT: Score ≥ 80]
        WARM[WARM: 50 ≤ Score < 80]
        COLD[COLD: Score < 50]
    end
    
    W1 --> Score[Final Score]
    W2 --> Score
    W3 --> Score
    W4 --> Score
    W5 --> Score
    
    Score --> HOT
    Score --> WARM
    Score --> COLD
```

## Data Enricher Components

```mermaid
graph TB
    subgraph "Data Enricher Agent"
        subgraph "Data Sources"
            WebSearcher[Web Searcher<br/><<Component>><br/>Google/Bing API]
            LinkedInScraper[LinkedIn Scraper<br/><<Component>><br/>Profile extraction]
            CompanyAPI[Company API<br/><<Component>><br/>Clearbit/similar]
            NewsMonitor[News Monitor<br/><<Component>><br/>Recent mentions]
        end
        
        subgraph "Processing"
            DataExtractor[Data Extractor<br/><<Component>><br/>Parse responses]
            DataCleaner[Data Cleaner<br/><<Component>><br/>Normalize data]
            DupeDetector[Dupe Detector<br/><<Component>><br/>Prevent duplicates]
            Validator[Validator<br/><<Component>><br/>Quality checks]
        end
        
        subgraph "Enrichment Logic"
            FieldMapper[Field Mapper<br/><<Component>><br/>CRM field mapping]
            MergeStrategy[Merge Strategy<br/><<Component>><br/>Conflict resolution]
            ConfidenceScorer[Confidence Scorer<br/><<Component>><br/>Data quality score]
        end
        
        subgraph "Storage"
            Cache[Cache<br/><<Component>><br/>15-min TTL cache]
            BatchQueue[Batch Queue<br/><<Component>><br/>Bulk updates]
            AuditLog[Audit Log<br/><<Component>><br/>Change tracking]
        end
    end
    
    %% Data flow
    WebSearcher --> DataExtractor
    LinkedInScraper --> DataExtractor
    CompanyAPI --> DataExtractor
    NewsMonitor --> DataExtractor
    
    DataExtractor --> DataCleaner
    DataCleaner --> DupeDetector
    DupeDetector --> Validator
    
    Validator --> FieldMapper
    FieldMapper --> MergeStrategy
    MergeStrategy --> ConfidenceScorer
    
    ConfidenceScorer --> Cache
    Cache --> BatchQueue
    BatchQueue --> AuditLog
```

### Data Enrichment Pipeline

| Stage | Process | Output |
|-------|---------|--------|
| Discovery | Search multiple sources | Raw data collection |
| Extraction | Parse structured data | Normalized fields |
| Validation | Quality checks | Validated data |
| Merging | Combine with existing | Enriched record |
| Caching | Store for reuse | Performance optimization |

## Outreach Agent Components

```mermaid
graph TB
    subgraph "Outreach Agent"
        subgraph "Content Generation"
            TemplateSelector[Template Selector<br/><<Component>><br/>Best template match]
            Personalizer[Personalizer<br/><<Component>><br/>Dynamic variables]
            AIWriter[AI Writer<br/><<Component>><br/>Claude content gen]
            ToneAnalyzer[Tone Analyzer<br/><<Component>><br/>Voice consistency]
        end
        
        subgraph "Campaign Management"
            SequenceBuilder[Sequence Builder<br/><<Component>><br/>Multi-touch campaigns]
            TimingOptimizer[Timing Optimizer<br/><<Component>><br/>Best send times]
            ABTester[A/B Tester<br/><<Component>><br/>Version testing]
        end
        
        subgraph "Delivery"
            EmailBuilder[Email Builder<br/><<Component>><br/>HTML/text creation]
            SendScheduler[Send Scheduler<br/><<Component>><br/>Queue management]
            TrackingInjector[Tracking Injector<br/><<Component>><br/>Analytics pixels]
        end
        
        subgraph "Follow-up"
            ResponseMonitor[Response Monitor<br/><<Component>><br/>Reply detection]
            TaskCreator[Task Creator<br/><<Component>><br/>Next actions]
            EscalationEngine[Escalation Engine<br/><<Component>><br/>Human handoff]
        end
    end
    
    %% Flow
    TemplateSelector --> Personalizer
    Personalizer --> AIWriter
    AIWriter --> ToneAnalyzer
    
    ToneAnalyzer --> SequenceBuilder
    SequenceBuilder --> TimingOptimizer
    TimingOptimizer --> ABTester
    
    ABTester --> EmailBuilder
    EmailBuilder --> TrackingInjector
    TrackingInjector --> SendScheduler
    
    SendScheduler --> ResponseMonitor
    ResponseMonitor --> TaskCreator
    ResponseMonitor --> EscalationEngine
```

### Outreach Personalization Matrix

```mermaid
graph TD
    subgraph "Personalization Factors"
        Industry[Industry Context]
        Role[Role/Title]
        Company[Company Info]
        Behavior[Past Behavior]
        Timing[Current Events]
    end
    
    subgraph "Content Elements"
        Subject[Subject Line]
        Opening[Opening Line]
        ValueProp[Value Proposition]
        CTA[Call to Action]
        Signature[Signature]
    end
    
    Industry --> Subject
    Role --> Opening
    Company --> ValueProp
    Behavior --> CTA
    Timing --> Opening
    
    Industry --> ValueProp
    Role --> ValueProp
    Company --> CTA
```

## MCP Server Components

```mermaid
graph TB
    subgraph "MCP Server Architecture"
        subgraph "Protocol Layer"
            RequestParser[Request Parser<br/><<Component>><br/>Parse MCP commands]
            ResponseBuilder[Response Builder<br/><<Component>><br/>Format responses]
            ErrorFormatter[Error Formatter<br/><<Component>><br/>Standard errors]
        end
        
        subgraph "Service Adapters"
            HubSpotAdapter[HubSpot Adapter<br/><<Component>><br/>CRM operations]
            ClaudeAdapter[Claude Adapter<br/><<Component>><br/>AI operations]
            PuppeteerAdapter[Puppeteer Adapter<br/><<Component>><br/>Web automation]
        end
        
        subgraph "Middleware"
            AuthMiddleware[Auth Middleware<br/><<Component>><br/>Token validation]
            RateLimiter[Rate Limiter<br/><<Component>><br/>API throttling]
            CacheMiddleware[Cache Middleware<br/><<Component>><br/>Response caching]
            LogMiddleware[Log Middleware<br/><<Component>><br/>Request logging]
        end
        
        subgraph "Core Services"
            ConnectionPool[Connection Pool<br/><<Component>><br/>Reusable connections]
            SessionManager[Session Manager<br/><<Component>><br/>State management]
            QueueManager[Queue Manager<br/><<Component>><br/>Request queuing]
        end
    end
    
    %% Request flow
    RequestParser --> AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> CacheMiddleware
    CacheMiddleware --> LogMiddleware
    
    LogMiddleware --> HubSpotAdapter
    LogMiddleware --> ClaudeAdapter
    LogMiddleware --> PuppeteerAdapter
    
    HubSpotAdapter --> ConnectionPool
    ClaudeAdapter --> ConnectionPool
    PuppeteerAdapter --> SessionManager
    
    ConnectionPool --> QueueManager
    SessionManager --> QueueManager
    
    QueueManager --> ResponseBuilder
    ResponseBuilder --> ErrorFormatter
```

### MCP Protocol Flow

```mermaid
sequenceDiagram
    actor Agent
    participant MCP as MCP Server
    participant Auth as Auth Middleware
    participant Adapter as Service Adapter
    participant External as External API
    
    Agent->>MCP: MCP Request
    MCP->>Auth: Validate Token
    Auth-->>MCP: Token Valid
    MCP->>Adapter: Process Request
    Adapter->>External: API Call
    External-->>Adapter: API Response
    Adapter-->>MCP: Formatted Response
    MCP-->>Agent: MCP Response
```

## Component Interactions

### Cross-Agent Communication

```mermaid
graph TB
    subgraph "Agent Communication via HubSpot Tasks"
        Agent1[Lead Qualifier]
        Agent2[Data Enricher]
        Agent3[Outreach Agent]
        
        Task1[Qualification Task]
        Task2[Enrichment Task]
        Task3[Outreach Task]
        
        Agent1 -->|Creates| Task2
        Task2 -->|Triggers| Agent2
        
        Agent2 -->|Creates| Task3
        Task3 -->|Triggers| Agent3
        
        Agent3 -->|Creates| Task1
        Task1 -->|Triggers| Agent1
    end
    
    style Task1 fill:#FFE4B5
    style Task2 fill:#FFE4B5
    style Task3 fill:#FFE4B5
```

### State Management

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED: Task Created
    NOT_STARTED --> IN_PROGRESS: Agent Picks Up
    IN_PROGRESS --> PROCESSING: Active Work
    PROCESSING --> COMPLETED: Success
    PROCESSING --> FAILED: Error
    FAILED --> RETRY: Retry Logic
    RETRY --> IN_PROGRESS: Retry Attempt
    COMPLETED --> [*]: Done
    FAILED --> [*]: Max Retries
```

### Error Handling Strategy

```mermaid
graph TD
    Error[Error Occurs]
    
    Error --> Type{Error Type?}
    
    Type -->|Transient| Retry[Retry with Backoff]
    Type -->|Rate Limit| Wait[Wait and Retry]
    Type -->|Auth| RefreshAuth[Refresh Token]
    Type -->|Data| Validate[Validate and Clean]
    Type -->|Fatal| Escalate[Human Escalation]
    
    Retry --> Success{Success?}
    Wait --> Success
    RefreshAuth --> Success
    Validate --> Success
    
    Success -->|Yes| Continue[Continue Processing]
    Success -->|No| Escalate
    
    Escalate --> Alert[Alert Admin]
    Alert --> Log[Log Details]
```

---

## Related Documents

- [System Context](./system-context.md) - System boundaries
- [Container Architecture](./container-architecture.md) - Container view
- [Deployment Architecture](./deployment-architecture.md) - Infrastructure
- [Data Flow Diagrams](./data-flow.md) - Data movement

[⬆️ Back to top](#-table-of-contents)

---

[⬅️ Container Architecture](./container-architecture.md) | [⬆️ Diagrams](./index.md) | [➡️ Deployment Architecture](./deployment-architecture.md)