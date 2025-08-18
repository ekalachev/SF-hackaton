[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [⬆️ Robustness](./index.md)

---

# Control Objects Analysis (ICONIX Process)

**Author:** Alex Fedin | [O2.services](https://O2.services) | [LinkedIn](https://linkedin.com/in/alex-fedin)  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0  
**Methodology:** ICONIX Process

## 📑 Table of Contents

1. [Overview](#overview)
2. [Control Objects Definition](#control-objects-definition)
3. [Business Logic Controllers](#business-logic-controllers)
4. [Workflow Orchestration](#workflow-orchestration)
5. [Agent Coordination](#agent-coordination)
6. [Process Management](#process-management)
7. [Decision Making Controllers](#decision-making-controllers)
8. [Control Objects Catalog](#control-objects-catalog)
9. [Related Components](#related-components)

---

## Overview

In the ICONIX methodology, **Control Objects** represent the business logic and workflow coordination of the system. They orchestrate interactions between boundary objects and entity objects, implementing use case scenarios and business rules.

### ICONIX Notation in Mermaid
- **Control Objects**: Represented with `<<control>>` stereotype
- **Orchestration**: Workflow and process management
- **Business Logic**: Rules and decision-making processes

---

## Control Objects Definition

### Classification Criteria
1. **Orchestration Controllers**: Coordinate multiple operations
2. **Business Logic Controllers**: Implement domain rules
3. **Process Controllers**: Manage system workflows
4. **Decision Controllers**: Handle conditional logic and routing

---

## Business Logic Controllers

### Lead Management Controllers

```mermaid
classDiagram
    class LeadQualificationController {
        <<control>>
        +processQualificationTask()
        +calculateLeadScore()
        +determineLeadTier()
        +applyBusinessRules()
        +validateQualificationCriteria()
        +triggerFollowUpActions()
    }
    
    class LeadScoringController {
        <<control>>
        +analyzeContactData()
        +evaluateJobTitle()
        +assessCompanyValue()
        +calculateEmailScore()
        +determineEngagementLevel()
        +generateCompositeScore()
    }
    
    class LeadEnrichmentController {
        <<control>>
        +orchestrateEnrichmentProcess()
        +validateDataQuality()
        +prioritizeEnrichmentSources()
        +manageEnrichmentPipeline()
        +handleEnrichmentFailures()
        +updateEnrichmentMetrics()
    }
    
    LeadQualificationController --> LeadScoringController
    LeadQualificationController --> LeadEnrichmentController
```

### Campaign Management Controllers

```mermaid
classDiagram
    class OutreachController {
        <<control>>
        +processOutreachTask()
        +determineOutreachStrategy()
        +personalizeMessageContent()
        +scheduleFollowUps()
        +trackOutreachMetrics()
        +handleOutreachFailures()
    }
    
    class ContentGenerationController {
        <<control>>
        +generateEmailContent()
        +personalizeMessages()
        +validateContentQuality()
        +applyContentTemplate()
        +optimizeForEngagement()
        +handleContentErrors()
    }
    
    class CampaignSequenceController {
        <<control>>
        +manageCampaignFlow()
        +scheduleSequenceSteps()
        +trackSequenceProgress()
        +handleSequenceFailures()
        +optimizeSequenceTiming()
        +reportSequenceMetrics()
    }
    
    OutreachController --> ContentGenerationController
    OutreachController --> CampaignSequenceController
```

---

## Workflow Orchestration

### Task Orchestration Controller

```mermaid
classDiagram
    class TaskOrchestrationController {
        <<control>>
        +scanForPendingTasks()
        +classifyTaskTypes()
        +routeToAgents()
        +manageTaskQueue()
        +handleTaskFailures()
        +trackTaskMetrics()
        -validateTaskData()
        -updateTaskStatus()
        -createFollowUpTasks()
    }
    
    class AgentDispatchController {
        <<control>>
        +dispatchToLeadQualifier()
        +dispatchToDataEnricher()
        +dispatchToOutreachAgent()
        +manageAgentLoad()
        +handleAgentFailures()
        +trackAgentPerformance()
    }
    
    class ProcessCoordinationController {
        <<control>>
        +coordinateAgentProcesses()
        +manageConcurrency()
        +handleProcessLocks()
        +orchestrateSequentialSteps()
        +manageParallelExecution()
        +synchronizeProcessResults()
    }
    
    TaskOrchestrationController --> AgentDispatchController
    TaskOrchestrationController --> ProcessCoordinationController
```

### Workflow Sequence Control

```mermaid
sequenceDiagram
    participant TOC as TaskOrchestrationController
    participant ADC as AgentDispatchController
    participant LQC as LeadQualificationController
    participant DEC as DataEnrichmentController
    participant OC as OutreachController
    
    TOC->>TOC: scanForPendingTasks()
    TOC->>TOC: classifyTaskTypes()
    
    alt Lead Qualification Task
        TOC->>ADC: dispatchToLeadQualifier()
        ADC->>LQC: processQualificationTask()
        LQC->>LQC: calculateLeadScore()
        LQC->>LQC: determineLeadTier()
        LQC-->>ADC: qualificationComplete()
        ADC-->>TOC: taskCompleted()
        
        alt High Score Lead
            TOC->>ADC: dispatchToOutreachAgent()
            ADC->>OC: processOutreachTask()
        end
    
    else Data Enrichment Task
        TOC->>ADC: dispatchToDataEnricher()
        ADC->>DEC: orchestrateEnrichmentProcess()
        DEC->>DEC: validateDataQuality()
        DEC-->>ADC: enrichmentComplete()
        ADC-->>TOC: taskCompleted()
        
        TOC->>ADC: dispatchToLeadQualifier()
        Note over TOC: Create follow-up task
    end
```

---

## Agent Coordination

### Multi-Agent Coordination Controller

```mermaid
classDiagram
    class AgentCoordinationController {
        <<control>>
        +orchestrateMultiAgentWorkflow()
        +manageAgentDependencies()
        +handleAgentCommunication()
        +synchronizeAgentStates()
        +resolveAgentConflicts()
        +optimizeAgentUtilization()
    }
    
    class DependencyController {
        <<control>>
        +mapTaskDependencies()
        +validatePrerequisites()
        +manageExecutionOrder()
        +handleDependencyFailures()
        +optimizeDependencyGraph()
        +trackDependencyMetrics()
    }
    
    class StateManagementController {
        <<control>>
        +trackAgentStates()
        +manageStateTransitions()
        +synchronizeStateChanges()
        +handleStateConflicts()
        +persistStatuses()
        +recoverFromFailures()
    }
    
    AgentCoordinationController --> DependencyController
    AgentCoordinationController --> StateManagementController
```

### Concurrent Process Management

```mermaid
flowchart TD
    subgraph "Process Coordination Controller"
        PCC[<<control>><br/>ProcessCoordinationController]
        LM[<<control>><br/>LockManager]
        CM[<<control>><br/>ConcurrencyManager]
        PM[<<control>><br/>PIDManager]
    end
    
    subgraph "Agent Processes"
        TM[Task Monitor Process]
        LQ[Lead Qualifier Process]
        DE[Data Enricher Process]
        OA[Outreach Agent Process]
    end
    
    PCC --> LM
    PCC --> CM
    PCC --> PM
    
    LM -.-> TM
    LM -.-> LQ
    LM -.-> DE
    LM -.-> OA
    
    CM --> TM
    CM --> LQ
    CM --> DE
    CM --> OA
    
    PM --> TM
    PM --> LQ
    PM --> DE
    PM --> OA
    
    style PCC fill:#fff3e0,stroke:#ff8f00
    style LM fill:#fff3e0,stroke:#ff8f00
    style CM fill:#fff3e0,stroke:#ff8f00
    style PM fill:#fff3e0,stroke:#ff8f00
```

---

## Process Management

### System Process Controllers

```mermaid
classDiagram
    class CronJobController {
        <<control>>
        +schedulePeriodTasks()
        +manageCronExecution()
        +handleCronFailures()
        +validateCronSchedule()
        +trackCronMetrics()
        +optimizeCronTiming()
    }
    
    class LockManagementController {
        <<control>>
        +acquireProcessLock()
        +releaseProcessLock()
        +checkLockStatus()
        +handleStaleLocks()
        +manageLockTimeout()
        +cleanupLocks()
    }
    
    class HealthMonitorController {
        <<control>>
        +monitorAgentHealth()
        +detectHealthIssues()
        +triggerHealthChecks()
        +handleHealthFailures()
        +reportHealthMetrics()
        +initiateRecovery()
    }
    
    CronJobController --> LockManagementController
    LockManagementController --> HealthMonitorController
```

### Error and Recovery Controllers

```mermaid
classDiagram
    class ErrorHandlingController {
        <<control>>
        +handleTaskErrors()
        +categorizeErrors()
        +implementRetryLogic()
        +escalateFailures()
        +logErrorDetails()
        +triggerRecoveryActions()
    }
    
    class RetryController {
        <<control>>
        +implementExponentialBackoff()
        +manageRetryAttempts()
        +trackRetryMetrics()
        +determineRetryEligibility()
        +handleMaxRetryReached()
        +optimizeRetryStrategy()
    }
    
    class EscalationController {
        <<control>>
        +determineEscalationCriteria()
        +routeToHumanReview()
        +createEscalationTasks()
        +notifyStakeholders()
        +trackEscalationMetrics()
        +handleEscalationResponses()
    }
    
    ErrorHandlingController --> RetryController
    ErrorHandlingController --> EscalationController
```

---

## Decision Making Controllers

### Business Rule Controllers

```mermaid
classDiagram
    class BusinessRuleController {
        <<control>>
        +evaluateLeadQualification()
        +determineOutreachStrategy()
        +validateBusinessConstraints()
        +applyPolicyRules()
        +handleRuleExceptions()
        +updateRuleMetrics()
    }
    
    class ScoringRuleController {
        <<control>>
        +applyEmailScoringRules()
        +evaluateJobTitleRules()
        +assessCompanySizeRules()
        +calculateIndustryScore()
        +determineEngagementRules()
        +compositeScoreCalculation()
    }
    
    class PrioritizationController {
        <<control>>
        +prioritizeTaskQueue()
        +rankLeadsByScore()
        +determineUrgencyLevel()
        +balanceWorkloadDistribution()
        +optimizePriorityAlgorithms()
        +handlePriorityConflicts()
    }
    
    BusinessRuleController --> ScoringRuleController
    BusinessRuleController --> PrioritizationController
```

### Conditional Logic Controllers

```mermaid
flowchart TD
    subgraph "Decision Tree Controller"
        DTC[<<control>><br/>DecisionTreeController]
        
        subgraph "Lead Scoring Decisions"
            LS[Lead Score >= 70?]
            LT[Lead Tier Assignment]
            FU[Follow-up Strategy]
        end
        
        subgraph "Outreach Decisions"
            OT[Outreach Type]
            CT[Content Template]
            ST[Send Timing]
        end
        
        subgraph "Enrichment Decisions"
            DQ[Data Quality Check]
            ES[Enrichment Source]
            EP[Enrichment Priority]
        end
    end
    
    DTC --> LS
    DTC --> LT
    DTC --> FU
    
    DTC --> OT
    DTC --> CT
    DTC --> ST
    
    DTC --> DQ
    DTC --> ES
    DTC --> EP
    
    LS -->|YES| LT
    LS -->|NO| EP
    
    LT --> FU
    FU --> OT
    OT --> CT
    CT --> ST
    
    DQ -->|GOOD| LS
    DQ -->|POOR| ES
    ES --> EP
    
    style DTC fill:#fff3e0,stroke:#ff8f00
    style LS fill:#e8f5e8,stroke:#2e7d32
    style DQ fill:#e8f5e8,stroke:#2e7d32
```

---

## Control Objects Catalog

### Complete Control Objects List

| Control Object | Primary Responsibility | Business Logic | Related Agents |
|---------------|----------------------|----------------|----------------|
| **TaskOrchestrationController** | Task routing and management | Task classification, queue management | All Agents |
| **LeadQualificationController** | Lead scoring and qualification | Scoring algorithms, tier assignment | Lead Qualifier |
| **LeadEnrichmentController** | Data enrichment orchestration | Data quality validation, source prioritization | Data Enricher |
| **OutreachController** | Campaign execution | Message personalization, timing optimization | Outreach Agent |
| **AgentDispatchController** | Agent load balancing | Agent selection, workload distribution | Task Monitor |
| **ProcessCoordinationController** | Process synchronization | Concurrency management, dependency resolution | All Agents |
| **ErrorHandlingController** | Failure management | Retry logic, escalation rules | All Agents |
| **BusinessRuleController** | Rule enforcement | Policy validation, constraint checking | All Agents |
| **CronJobController** | Scheduled execution | Timing validation, schedule optimization | Task Monitor |
| **HealthMonitorController** | System health | Health checks, recovery initiation | All Agents |

### Control Flow Diagram

```mermaid
graph TD
    subgraph "Entry Point"
        CRON[Cron Trigger]
    end
    
    subgraph "Orchestration Layer"
        CJC[<<control>><br/>CronJobController]
        TOC[<<control>><br/>TaskOrchestrationController]
        ADC[<<control>><br/>AgentDispatchController]
    end
    
    subgraph "Business Logic Layer"
        LQC[<<control>><br/>LeadQualificationController]
        LEC[<<control>><br/>LeadEnrichmentController]
        OC[<<control>><br/>OutreachController]
    end
    
    subgraph "Support Controllers"
        EHC[<<control>><br/>ErrorHandlingController]
        BRC[<<control>><br/>BusinessRuleController]
        HMC[<<control>><br/>HealthMonitorController]
    end
    
    CRON --> CJC
    CJC --> TOC
    TOC --> ADC
    
    ADC --> LQC
    ADC --> LEC
    ADC --> OC
    
    LQC --> BRC
    LEC --> BRC
    OC --> BRC
    
    LQC --> EHC
    LEC --> EHC
    OC --> EHC
    
    EHC --> HMC
    BRC --> HMC
    
    style CJC fill:#fff3e0,stroke:#ff8f00
    style TOC fill:#fff3e0,stroke:#ff8f00
    style ADC fill:#fff3e0,stroke:#ff8f00
    style LQC fill:#fff3e0,stroke:#ff8f00
    style LEC fill:#fff3e0,stroke:#ff8f00
    style OC fill:#fff3e0,stroke:#ff8f00
    style EHC fill:#fff3e0,stroke:#ff8f00
    style BRC fill:#fff3e0,stroke:#ff8f00
    style HMC fill:#fff3e0,stroke:#ff8f00
```

---

## Related Components

### Mapping to Code Components

| Control Object | Implementation Files | Key Functions |
|---------------|---------------------|---------------|
| **TaskOrchestrationController** | `agents/task_monitor.sh` | Task scanning, routing, status management |
| **LeadQualificationController** | `agents/lead_qualifier_v2.sh` | `score_lead()`, `process_task()` |
| **LeadEnrichmentController** | `agents/data_enricher.sh` | Enrichment orchestration, quality validation |
| **OutreachController** | `agents/outreach_agent.sh` | Message generation, campaign execution |
| **AgentDispatchController** | `agents/task_monitor.sh` | Agent spawning, process management |
| **CronJobController** | System cron + script triggers | Scheduled execution, timing management |
| **ErrorHandlingController** | Error handling in all agents | Retry logic, escalation procedures |
| **BusinessRuleController** | Business logic in agents | Scoring rules, validation logic |

### Controller Interaction Patterns

```mermaid
sequenceDiagram
    participant CRON as CronJobController
    participant TOC as TaskOrchestrationController
    participant ADC as AgentDispatchController
    participant LQC as LeadQualificationController
    participant BRC as BusinessRuleController
    participant EHC as ErrorHandlingController
    
    CRON->>TOC: Trigger periodic scan
    TOC->>TOC: Scan for pending tasks
    TOC->>ADC: Dispatch task
    ADC->>LQC: Process qualification
    LQC->>BRC: Apply scoring rules
    BRC-->>LQC: Score calculated
    
    alt Processing Success
        LQC-->>ADC: Task completed
        ADC-->>TOC: Success
    else Processing Error
        LQC->>EHC: Handle error
        EHC->>EHC: Apply retry logic
        alt Retry Success
            EHC-->>LQC: Retry task
        else Max Retries Reached
            EHC-->>TOC: Escalate to human
        end
    end
```

---

[⬆️ Back to top](#-table-of-contents) | [⬅️ Boundary Objects](./boundary-objects.md) | [➡️ Entity Objects](./entity-objects.md)