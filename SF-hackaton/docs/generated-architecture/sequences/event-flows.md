# Event-Driven Interaction Flows

This document details the event-driven architecture of the SF-hackaton AI agent system, showing how events trigger actions and cascade through the system to create automated workflows.

## Event Architecture Overview

The system operates on an event-driven model where:
- **Event Sources**: HubSpot workflows, contact activities, task completions
- **Event Processors**: Task Monitor, individual agents
- **Event Sinks**: HubSpot CRM, external systems, human notifications

## Core Event Types and Flows

### 1. Contact Lifecycle Events

```mermaid
sequenceDiagram
    participant ES as Event Source
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant Queue as Task Queue
    participant TM as Task Monitor
    participant Agents as AI Agents

    Note over ES,Agents: Contact Lifecycle Event Processing

    %% Contact Creation Event
    ES->>HS: contact_created
    HS->>WF: Trigger workflow evaluation
    WF->>WF: Check trigger conditions
    
    WF->>Queue: Enqueue "Enrich Data" task
    Note right of Queue: Priority: LOW, Due: 5 minutes
    
    WF->>Queue: Enqueue "Initial Assessment" task
    Note right of Queue: Priority: MEDIUM, Due: 10 minutes
    
    %% Contact Update Event
    ES->>HS: contact_updated
    HS->>WF: Evaluate property changes
    
    alt Lead Score Changed
        WF->>WF: Check score thresholds
        
        alt Score > 70 (crossed threshold)
            WF->>Queue: Enqueue "Send Outreach" task
            Note right of Queue: Priority: HIGH, Due: 30 minutes
            
        else Score > 85 (high value)
            WF->>Queue: Enqueue "Human Review" task
            Note right of Queue: Priority: URGENT, Due: 1 hour
        end
        
    else Contact Data Enriched
        WF->>Queue: Enqueue "Re-qualify Lead" task
        Note right of Queue: Trigger new scoring
    end
    
    %% Task Processing Loop
    loop Every Minute
        TM->>Queue: Poll for pending tasks
        Queue-->>TM: Return prioritized task list
        
        TM->>Agents: Dispatch tasks to appropriate agents
        Agents->>HS: Process and update CRM
        Agents->>Queue: Mark tasks completed
        Agents->>Queue: Create follow-up tasks (if needed)
    end
```

### 2. Form Submission Event Cascade

```mermaid
sequenceDiagram
    participant Form as Web Form
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant Email as Email System
    participant Queue as Task Queue
    participant TM as Task Monitor
    participant LQ as Lead Qualifier
    participant OA as Outreach Agent
    participant Sales as Sales Team

    Note over Form,Sales: Form Submission Event Cascade

    %% Initial Event
    Form->>HS: form_submitted
    Note right of Form: Contact info + form context
    
    HS->>WF: Trigger: form_submitted
    WF->>WF: Evaluate form type and content
    
    %% Immediate Actions
    par Automatic Responses
        WF->>Email: Send thank you email
        Email->>Form: Deliver confirmation
        
    and Task Creation
        WF->>Queue: Create "Qualify Lead" task
        Note right of Queue: URGENT priority, due in 1 minute
        
        WF->>Queue: Create "Enrich Data" task  
        Note right of Queue: HIGH priority, due in 5 minutes
    end
    
    %% Fast-Track Processing
    TM->>Queue: Immediate poll (next cron cycle)
    Queue-->>TM: Return urgent tasks
    
    TM->>LQ: Dispatch urgent qualification
    LQ->>HS: Rapid lead scoring
    LQ->>HS: Update lead_score and status
    
    %% Conditional Event Cascade
    HS->>WF: Trigger: lead_score_updated
    
    alt High Score (>85)
        WF->>Sales: Send immediate alert
        WF->>Queue: Create "Hot Lead Review" task
        Note right of Sales: Phone/email notification
        
    else Qualified Score (70-85)
        WF->>Queue: Create "Send Outreach" task
        TM->>OA: Dispatch outreach generation
        
    else Medium Score (40-70)
        WF->>Queue: Create "Nurture Sequence" task
        
    else Low Score (<40)
        WF->>HS: Add to low-priority list
    end
    
    Note over Form,Sales: Form to action: <5 minutes for high-value leads
```

### 3. Task State Change Events

```mermaid
sequenceDiagram
    participant Agent as Agent Process
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant Queue as Task Queue
    participant Monitor as Status Monitor
    participant Alert as Alert System

    Note over Agent,Alert: Task State Change Event Propagation

    %% Task Status Updates
    Agent->>HS: Update task status to IN_PROGRESS
    HS->>Monitor: Event: task_status_changed
    Monitor->>Monitor: Start timer for task duration
    
    %% Successful Completion
    alt Task Completed Successfully
        Agent->>HS: Update task status to COMPLETED
        HS->>WF: Event: task_completed
        
        WF->>WF: Evaluate completion triggers
        
        opt Create Follow-up Tasks
            WF->>Queue: Enqueue next workflow step
            Note right of Queue: Chain dependent tasks
        end
        
        Monitor->>Monitor: Log completion metrics
        
    %% Task Failure
    else Task Failed
        Agent->>HS: Update task with error details
        HS->>WF: Event: task_failed
        
        WF->>WF: Check retry policy
        
        alt Retry Allowed
            WF->>Queue: Re-enqueue with retry count
            Note right of Queue: Exponential backoff delay
            
        else Max Retries Exceeded
            WF->>Queue: Create "Manual Review" task
            WF->>Alert: Send failure notification
        end
        
    %% Task Timeout
    else Task Timeout (30+ minutes)
        Monitor->>HS: Event: task_timeout
        HS->>WF: Evaluate timeout handling
        
        WF->>Queue: Reset task to NOT_STARTED
        WF->>Alert: Send timeout alert
        Note right of Alert: Admin notification
    end
```

### 4. Data Enrichment Event Chain

```mermaid
sequenceDiagram
    participant Trigger as Enrichment Trigger
    participant DE as Data Enricher
    participant Claude as Claude MCP
    participant Puppeteer as Puppeteer MCP
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant Queue as Task Queue

    Note over Trigger,Queue: Data Enrichment Event Chain

    %% Enrichment Initiated
    Trigger->>DE: Start enrichment process
    DE->>HS: Event: enrichment_started
    
    %% Multi-Source Data Gathering
    par Website Enrichment
        DE->>Claude: Request website analysis
        Claude->>Puppeteer: Navigate to company site
        Puppeteer->>Puppeteer: Event: page_loaded
        Puppeteer->>Puppeteer: Event: content_extracted
        Puppeteer-->>Claude: Return website data
        
    and LinkedIn Enrichment
        Claude->>Puppeteer: Search LinkedIn
        Puppeteer->>Puppeteer: Event: search_completed
        Puppeteer-->>Claude: Return profile data
    end
    
    %% Data Quality Assessment
    Claude->>Claude: Event: data_compiled
    Claude->>Claude: Calculate enrichment quality score
    Claude-->>DE: Return enriched data + quality metrics
    
    %% Update and Cascade Events
    DE->>HS: Update contact with enriched data
    HS->>WF: Event: contact_enriched
    
    WF->>WF: Evaluate enrichment quality
    
    alt High Quality Data (score ≥ 8)
        WF->>Queue: Create "Qualify Lead - High Value" task
        HS->>WF: Event: high_value_lead_detected
        
    else Medium Quality Data (score 5-7)
        WF->>Queue: Create "Qualify Lead" task
        
    else Low Quality Data (score < 5)
        WF->>Queue: Create "Manual Data Review" task
        HS->>WF: Event: data_quality_issue
    end
    
    %% Enrichment Completion
    DE->>HS: Event: enrichment_completed
    HS->>HS: Log enrichment metrics
```

### 5. Outreach Response Event Handling

```mermaid
sequenceDiagram
    participant Email as Email System
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant AI as AI Classifier
    participant Queue as Task Queue
    participant OA as Outreach Agent
    participant Sales as Sales Team

    Note over Email,Sales: Outreach Response Event Processing

    %% Email Response Received
    Email->>HS: Email replied/opened/clicked
    HS->>WF: Event: email_engagement
    
    WF->>AI: Classify engagement type
    
    alt Email Reply Received
        AI->>AI: Analyze reply sentiment/intent
        
        alt Positive Response
            AI->>HS: Event: positive_response
            HS->>WF: Trigger immediate follow-up
            WF->>Sales: Send hot lead alert
            WF->>Queue: Create "Schedule Meeting" task
            
        else Negative Response/Opt-out
            AI->>HS: Event: negative_response  
            HS->>HS: Update contact preferences
            WF->>Queue: Remove from outreach sequences
            
        else Neutral/Question
            AI->>HS: Event: needs_clarification
            WF->>Queue: Create "Handle Inquiry" task
        end
        
    else Email Opened (No Reply)
        HS->>WF: Event: email_opened
        WF->>WF: Update engagement score
        
        opt Continue Sequence
            WF->>Queue: Schedule next follow-up
            Note right of Queue: Delay reduced due to engagement
        end
        
    else Email Not Opened (72 hours)
        HS->>WF: Event: email_not_engaged
        WF->>Queue: Create "Alternative Channel" task
        Note right of Queue: Try LinkedIn/phone outreach
    end
    
    %% Follow-up Event Generation
    alt High Engagement Score
        WF->>HS: Event: hot_prospect
        HS->>Sales: Immediate notification
        
    else Standard Engagement
        WF->>Queue: Continue automated sequence
        
    else Low Engagement
        WF->>HS: Event: cold_prospect
        HS->>HS: Reduce outreach frequency
    end
```

### 6. System Health and Monitoring Events

```mermaid
sequenceDiagram
    participant System as System Components
    participant Monitor as Health Monitor
    participant Metrics as Metrics Collector
    participant Alert as Alert System
    participant Admin as System Admin
    participant Recovery as Recovery Agent

    Note over System,Recovery: System Health Event Monitoring

    %% Performance Monitoring Events
    loop Continuous Monitoring
        System->>Monitor: Event: component_health_check
        Monitor->>Metrics: Collect performance data
        
        Metrics->>Metrics: Event: metrics_calculated
        
        alt Performance Degradation
            Metrics->>Alert: Event: performance_alert
            Alert->>Admin: Send performance warning
            
        else High Error Rate
            Metrics->>Alert: Event: error_rate_alert
            Alert->>Admin: Send error summary
            
        else Resource Exhaustion
            Metrics->>Alert: Event: resource_alert
            Alert->>Recovery: Trigger cleanup process
        end
    end
    
    %% Agent Status Events
    System->>Monitor: Event: agent_started
    System->>Monitor: Event: agent_completed
    System->>Monitor: Event: agent_failed
    
    Monitor->>Metrics: Aggregate agent statistics
    
    alt Agent Failure Rate > 10%
        Monitor->>Alert: Event: agent_health_critical
        Alert->>Admin: Immediate escalation
        Alert->>Recovery: Initiate recovery procedures
        
    else Normal Operation
        Monitor->>Metrics: Event: system_healthy
    end
    
    %% Queue Management Events
    System->>Monitor: Event: queue_depth_changed
    
    alt Queue Backlog > 100 tasks
        Monitor->>Alert: Event: queue_overload
        Alert->>Recovery: Trigger additional processing
        
    else Queue Empty
        Monitor->>Metrics: Event: queue_cleared
    end
```

### 7. Integration Event Flows

```mermaid
sequenceDiagram
    participant External as External System
    participant API as API Gateway
    participant HS as HubSpot CRM
    participant WF as Workflow Engine
    participant Queue as Task Queue
    participant Agents as AI Agents

    Note over External,Agents: External Integration Event Flows

    %% Webhook Events from External Systems
    External->>API: Webhook: customer_purchased
    API->>HS: Event: purchase_completed
    HS->>WF: Trigger post-purchase workflow
    
    WF->>Queue: Create "Customer Onboarding" task
    WF->>Queue: Create "Upsell Analysis" task
    
    %% CRM Sync Events
    External->>API: Webhook: contact_updated_external
    API->>HS: Sync contact changes
    HS->>WF: Event: contact_sync_completed
    
    WF->>WF: Compare data changes
    
    alt Significant Changes Detected
        WF->>Queue: Create "Re-qualify Lead" task
        WF->>Queue: Create "Update Outreach" task
        
    else Minor Changes
        WF->>HS: Log sync event
    end
    
    %% MCP Tool Events
    Agents->>API: Event: mcp_tool_called
    API->>API: Log tool usage
    
    alt Tool Error
        API->>WF: Event: mcp_tool_failed
        WF->>Queue: Create "Manual Processing" task
        
    else Tool Success
        API->>Agents: Continue processing
    end
```

## Event Processing Patterns

### 8. Event Batching and Aggregation

```mermaid
sequenceDiagram
    participant Source as Event Sources
    participant Buffer as Event Buffer
    participant Processor as Batch Processor
    participant HS as HubSpot CRM
    participant WF as Workflow Engine

    Note over Source,WF: Event Batching for Performance Optimization

    %% Event Accumulation
    loop High-Frequency Events
        Source->>Buffer: Multiple contact_updated events
        Source->>Buffer: Multiple email_opened events
        Source->>Buffer: Multiple form_submitted events
    end
    
    %% Batch Processing Trigger
    alt Buffer Full (100 events)
        Buffer->>Processor: Trigger batch processing
        
    else Time Window Elapsed (5 minutes)
        Buffer->>Processor: Trigger time-based processing
    end
    
    %% Event Deduplication and Aggregation
    Processor->>Processor: Deduplicate similar events
    Processor->>Processor: Aggregate metrics
    Processor->>Processor: Prioritize urgent events
    
    %% Batch Update
    Processor->>HS: Bulk update contacts
    Processor->>WF: Trigger aggregated workflows
    
    Note over Source,WF: Batching reduces API calls and improves performance
```

## Event-Driven Architecture Benefits

### 9. Loose Coupling and Scalability

```mermaid
sequenceDiagram
    participant Producer as Event Producer
    participant Bus as Event Bus
    participant Consumer1 as Data Enricher
    participant Consumer2 as Lead Qualifier
    participant Consumer3 as Outreach Agent
    participant Consumer4 as Analytics Engine

    Note over Producer,Consumer4: Decoupled Event Processing

    Producer->>Bus: Publish: contact_scored
    
    %% Multiple Consumers React Independently
    par Parallel Processing
        Bus->>Consumer1: Notify: Update enrichment priority
        Consumer1->>Consumer1: Adjust enrichment schedule
        
    and
        Bus->>Consumer2: Notify: Score threshold crossed
        Consumer2->>Consumer2: Trigger qualification workflow
        
    and
        Bus->>Consumer3: Notify: Qualified lead available
        Consumer3->>Consumer3: Generate outreach content
        
    and
        Bus->>Consumer4: Notify: Score data for analytics
        Consumer4->>Consumer4: Update lead scoring models
    end
    
    Note over Producer,Consumer4: Loose coupling enables independent scaling
```

## Key Event Architecture Characteristics

1. **Asynchronous Processing**: Events enable non-blocking, parallel processing
2. **Event Sourcing**: Complete audit trail of all system events and state changes
3. **Reactive Workflows**: Automatic response to system state changes
4. **Scalable Architecture**: Easy to add new event consumers without changing producers
5. **Fault Tolerance**: Failed events can be replayed and reprocessed
6. **Real-time Responsiveness**: Immediate reaction to high-priority events
7. **Data Consistency**: Event-driven updates ensure synchronized state across components
8. **Monitoring and Observability**: Event logs provide comprehensive system visibility