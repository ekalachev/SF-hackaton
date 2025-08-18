[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [⬆️ Robustness](./index.md)

---

# Complete Robustness Diagrams (ICONIX Process)

**Author:** Alex Fedin | [O2.services](https://O2.services) | [LinkedIn](https://linkedin.com/in/alex-fedin)  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0  
**Methodology:** ICONIX Process

## 📑 Table of Contents

1. [Overview](#overview)
2. [ICONIX Robustness Analysis](#iconix-robustness-analysis)
3. [Lead Qualification Use Case](#lead-qualification-use-case)
4. [Data Enrichment Use Case](#data-enrichment-use-case)
5. [Outreach Campaign Use Case](#outreach-campaign-use-case)
6. [Task Orchestration Use Case](#task-orchestration-use-case)
7. [Error Handling Use Case](#error-handling-use-case)
8. [System Integration Overview](#system-integration-overview)
9. [Object Interaction Patterns](#object-interaction-patterns)

---

## Overview

This document presents complete **Robustness Diagrams** following the ICONIX methodology, showing the interaction between Boundary Objects (interfaces), Control Objects (business logic), and Entity Objects (domain data) for the main use cases of the SF-hackaton AI agent system.

### ICONIX Methodology Elements
- **🟦 Boundary Objects**: External interfaces and system boundaries
- **🟨 Control Objects**: Business logic and workflow controllers  
- **🟩 Entity Objects**: Domain data and business entities

---

## ICONIX Robustness Analysis

### System Object Classification

```mermaid
graph TD
    subgraph "🟦 Boundary Objects"
        CLI[Command Line Interface]
        HSB[HubSpot API Boundary]
        MCB[MCP Server Boundary]
        PUB[Puppeteer Browser]
        LOG[Log Interface]
        CFG[Config Interface]
        EMAIL[Email Interface]
    end
    
    subgraph "🟨 Control Objects"
        TMC[Task Monitor Controller]
        LQC[Lead Qualifier Controller]
        DEC[Data Enricher Controller]
        OAC[Outreach Agent Controller]
        EHC[Error Handler Controller]
        BRC[Business Rules Controller]
    end
    
    subgraph "🟩 Entity Objects"
        CON[Contact]
        LEAD[Lead]
        COMP[Company]
        TASK[Task]
        ENG[Engagement]
        ENR[Enrichment Data]
        CAM[Campaign]
        MET[Metrics]
    end
    
    CLI --> TMC
    HSB --> TMC
    MCB --> LQC
    PUB --> DEC
    
    TMC --> CON
    LQC --> LEAD
    DEC --> ENR
    OAC --> ENG
    
    style CLI fill:#e3f2fd,stroke:#1565c0
    style HSB fill:#e3f2fd,stroke:#1565c0
    style MCB fill:#e3f2fd,stroke:#1565c0
    style PUB fill:#e3f2fd,stroke:#1565c0
    
    style TMC fill:#fff3e0,stroke:#ff8f00
    style LQC fill:#fff3e0,stroke:#ff8f00
    style DEC fill:#fff3e0,stroke:#ff8f00
    style OAC fill:#fff3e0,stroke:#ff8f00
    
    style CON fill:#e8f5e8,stroke:#2e7d32
    style LEAD fill:#e8f5e8,stroke:#2e7d32
    style COMP fill:#e8f5e8,stroke:#2e7d32
    style TASK fill:#e8f5e8,stroke:#2e7d32
```

---

## Lead Qualification Use Case

### Robustness Diagram: Qualify Lead

```mermaid
graph TD
    subgraph "🟦 Boundary Objects"
        CRON[Cron Scheduler Interface]
        HSA[HubSpot API Boundary]
        MCP[MCP Server Boundary]
        CLA[Claude AI Boundary]
        LOG1[Log File Interface]
    end
    
    subgraph "🟨 Control Objects"
        TMC[Task Monitor Controller]
        LQC[Lead Qualification Controller]
        LSC[Lead Scoring Controller]
        BRC[Business Rules Controller]
        EHC[Error Handler Controller]
    end
    
    subgraph "🟩 Entity Objects"
        TASK1[Task]
        CON1[Contact]
        COMP1[Company]
        LEAD1[Lead]
        SCORE[Score]
        ENG1[Engagement]
    end
    
    CRON -.->|1. Trigger| TMC
    TMC -.->|2. Query Tasks| HSA
    HSA -.->|3. Return Tasks| TMC
    TMC -.->|4. Extract Task Data| TASK1
    
    TMC -->|5. Dispatch Task| LQC
    LQC -->|6. Fetch Contact| HSA
    HSA -.->|7. Contact Data| CON1
    
    LQC -->|8. Get Company Info| HSA
    HSA -.->|9. Company Data| COMP1
    
    LQC -->|10. Calculate Score| LSC
    LSC -->|11. Apply Rules| BRC
    BRC -->|12. Validate| CON1
    BRC -->|13. Validate| COMP1
    LSC -->|14. Generate| SCORE
    
    LSC -->|15. AI Analysis| CLA
    CLA -.->|16. Enhanced Score| LSC
    
    LQC -->|17. Create Lead| LEAD1
    LEAD1 -->|18. Store Score| SCORE
    
    LQC -->|19. Update Contact| HSA
    LQC -->|20. Update Task| HSA
    LQC -->|21. Create Follow-up| TASK1
    
    LQC -->|22. Log Activity| LOG1
    LQC -->|23. Create Note| ENG1
    
    LSC -.->|Error Handling| EHC
    EHC -.->|Retry Logic| LOG1
    
    style CRON fill:#e3f2fd,stroke:#1565c0
    style HSA fill:#e3f2fd,stroke:#1565c0
    style MCP fill:#e3f2fd,stroke:#1565c0
    style CLA fill:#e3f2fd,stroke:#1565c0
    style LOG1 fill:#e3f2fd,stroke:#1565c0
    
    style TMC fill:#fff3e0,stroke:#ff8f00
    style LQC fill:#fff3e0,stroke:#ff8f00
    style LSC fill:#fff3e0,stroke:#ff8f00
    style BRC fill:#fff3e0,stroke:#ff8f00
    style EHC fill:#fff3e0,stroke:#ff8f00
    
    style TASK1 fill:#e8f5e8,stroke:#2e7d32
    style CON1 fill:#e8f5e8,stroke:#2e7d32
    style COMP1 fill:#e8f5e8,stroke:#2e7d32
    style LEAD1 fill:#e8f5e8,stroke:#2e7d32
    style SCORE fill:#e8f5e8,stroke:#2e7d32
    style ENG1 fill:#e8f5e8,stroke:#2e7d32
```

### Lead Qualification Interaction Flow

```mermaid
sequenceDiagram
    participant CRON as 🟦 Cron Interface
    participant TMC as 🟨 Task Monitor Controller
    participant HSA as 🟦 HubSpot API
    participant LQC as 🟨 Lead Qualifier Controller
    participant BRC as 🟨 Business Rules Controller
    participant CON as 🟩 Contact Entity
    participant LEAD as 🟩 Lead Entity
    participant TASK as 🟩 Task Entity
    
    CRON->>TMC: Trigger scan
    TMC->>HSA: Query qualification tasks
    HSA->>TASK: Retrieve task entities
    TASK-->>TMC: Task list
    
    loop For each qualification task
        TMC->>LQC: Process task
        LQC->>HSA: Fetch contact data
        HSA->>CON: Load contact entity
        CON-->>LQC: Contact details
        
        LQC->>BRC: Apply scoring rules
        BRC->>CON: Validate contact data
        CON-->>BRC: Data validation
        BRC-->>LQC: Calculated score
        
        LQC->>LEAD: Create/update lead
        LEAD->>LEAD: Set score and tier
        LQC->>HSA: Update contact properties
        LQC->>HSA: Complete task
        
        alt High score lead (>= 70)
            LQC->>TASK: Create outreach task
        else Medium score (40-69)
            LQC->>TASK: Create nurture task
        else Low score (< 40)
            LQC->>TASK: Create enrichment task
        end
    end
```

---

## Data Enrichment Use Case

### Robustness Diagram: Enrich Contact Data

```mermaid
graph TD
    subgraph "🟦 Boundary Objects"
        TMI[Task Monitor Interface]
        HSA2[HubSpot API Boundary]
        PUP[Puppeteer Browser]
        WEB[Web Interface]
        LIN[LinkedIn Interface]
        CLA2[Claude AI Boundary]
        LOG2[Log Interface]
    end
    
    subgraph "🟨 Control Objects"
        DEC[Data Enrichment Controller]
        WEC[Web Enrichment Controller]
        DQC[Data Quality Controller]
        VCC[Validation Controller]
        SRC[Source Ranking Controller]
    end
    
    subgraph "🟩 Entity Objects"
        TASK2[Task]
        CON2[Contact]
        COMP2[Company]
        ENR[Enrichment Data]
        SRC_E[Data Source]
        MET2[Quality Metrics]
        GAP[Data Gap]
    end
    
    TMI -.->|1. Dispatch Task| DEC
    DEC -.->|2. Extract Contact ID| TASK2
    DEC -->|3. Fetch Contact| HSA2
    HSA2 -.->|4. Contact Data| CON2
    
    DEC -->|5. Analyze Gaps| DQC
    DQC -->|6. Identify Missing| GAP
    DQC -->|7. Rank Sources| SRC
    SRC -->|8. Select Source| SRC_E
    
    DEC -->|9. Web Enrichment| WEC
    WEC -->|10. Launch Browser| PUP
    PUP -.->|11. Navigate| WEB
    WEB -.->|12. Scrape Data| WEC
    
    WEC -->|13. LinkedIn Search| LIN
    LIN -.->|14. Profile Data| WEC
    
    WEC -->|15. Compile Data| ENR
    DEC -->|16. AI Analysis| CLA2
    CLA2 -.->|17. Enhanced Data| ENR
    
    DEC -->|18. Validate Quality| VCC
    VCC -->|19. Quality Check| ENR
    VCC -->|20. Generate Metrics| MET2
    
    DEC -->|21. Update Contact| CON2
    DEC -->|22. Update Company| COMP2
    DEC -->|23. Store Enrichment| ENR
    
    DEC -->|24. Update Task| HSA2
    DEC -->|25. Log Results| LOG2
    
    style TMI fill:#e3f2fd,stroke:#1565c0
    style HSA2 fill:#e3f2fd,stroke:#1565c0
    style PUP fill:#e3f2fd,stroke:#1565c0
    style WEB fill:#e3f2fd,stroke:#1565c0
    style LIN fill:#e3f2fd,stroke:#1565c0
    style CLA2 fill:#e3f2fd,stroke:#1565c0
    style LOG2 fill:#e3f2fd,stroke:#1565c0
    
    style DEC fill:#fff3e0,stroke:#ff8f00
    style WEC fill:#fff3e0,stroke:#ff8f00
    style DQC fill:#fff3e0,stroke:#ff8f00
    style VCC fill:#fff3e0,stroke:#ff8f00
    style SRC fill:#fff3e0,stroke:#ff8f00
    
    style TASK2 fill:#e8f5e8,stroke:#2e7d32
    style CON2 fill:#e8f5e8,stroke:#2e7d32
    style COMP2 fill:#e8f5e8,stroke:#2e7d32
    style ENR fill:#e8f5e8,stroke:#2e7d32
    style SRC_E fill:#e8f5e8,stroke:#2e7d32
    style MET2 fill:#e8f5e8,stroke:#2e7d32
    style GAP fill:#e8f5e8,stroke:#2e7d32
```

---

## Outreach Campaign Use Case

### Robustness Diagram: Execute Outreach Campaign

```mermaid
graph TD
    subgraph "🟦 Boundary Objects"
        TMI3[Task Monitor Interface]
        HSA3[HubSpot API Boundary]
        CLA3[Claude AI Boundary]
        EML[Email Service Boundary]
        TPL[Template Interface]
        LOG3[Log Interface]
        NTF[Notification Interface]
    end
    
    subgraph "🟨 Control Objects"
        OAC[Outreach Agent Controller]
        CGC[Content Generation Controller]
        PSC[Personalization Controller]
        STC[Send Timing Controller]
        FUC[Follow-up Controller]
        MTC[Metrics Tracking Controller]
    end
    
    subgraph "🟩 Entity Objects"
        TASK3[Task]
        CON3[Contact]
        LEAD3[Lead]
        CAM[Campaign]
        MSG[Message]
        ENG3[Engagement]
        TEMP[Template]
        MET3[Campaign Metrics]
    end
    
    TMI3 -.->|1. Dispatch Task| OAC
    OAC -.->|2. Parse Task| TASK3
    OAC -->|3. Get Contact| HSA3
    HSA3 -.->|4. Contact Data| CON3
    
    OAC -->|5. Get Lead Info| LEAD3
    OAC -->|6. Determine Strategy| PSC
    PSC -->|7. Select Template| TEMP
    
    OAC -->|8. Generate Content| CGC
    CGC -->|9. AI Generation| CLA3
    CLA3 -.->|10. Generated Content| MSG
    
    CGC -->|11. Personalize| PSC
    PSC -->|12. Apply Contact Data| CON3
    PSC -->|13. Apply Lead Data| LEAD3
    PSC -->|14. Finalize Message| MSG
    
    OAC -->|15. Validate Content| MSG
    OAC -->|16. Schedule Send| STC
    STC -->|17. Send Email| EML
    EML -.->|18. Delivery Status| OAC
    
    OAC -->|19. Create Engagement| ENG3
    OAC -->|20. Update Campaign| CAM
    OAC -->|21. Track Metrics| MTC
    MTC -->|22. Update Metrics| MET3
    
    OAC -->|23. Schedule Follow-up| FUC
    FUC -->|24. Create Follow-up Task| TASK3
    
    OAC -->|25. Update Contact| HSA3
    OAC -->|26. Complete Task| HSA3
    OAC -->|27. Log Activity| LOG3
    OAC -->|28. Send Notification| NTF
    
    style TMI3 fill:#e3f2fd,stroke:#1565c0
    style HSA3 fill:#e3f2fd,stroke:#1565c0
    style CLA3 fill:#e3f2fd,stroke:#1565c0
    style EML fill:#e3f2fd,stroke:#1565c0
    style TPL fill:#e3f2fd,stroke:#1565c0
    style LOG3 fill:#e3f2fd,stroke:#1565c0
    style NTF fill:#e3f2fd,stroke:#1565c0
    
    style OAC fill:#fff3e0,stroke:#ff8f00
    style CGC fill:#fff3e0,stroke:#ff8f00
    style PSC fill:#fff3e0,stroke:#ff8f00
    style STC fill:#fff3e0,stroke:#ff8f00
    style FUC fill:#fff3e0,stroke:#ff8f00
    style MTC fill:#fff3e0,stroke:#ff8f00
    
    style TASK3 fill:#e8f5e8,stroke:#2e7d32
    style CON3 fill:#e8f5e8,stroke:#2e7d32
    style LEAD3 fill:#e8f5e8,stroke:#2e7d32
    style CAM fill:#e8f5e8,stroke:#2e7d32
    style MSG fill:#e8f5e8,stroke:#2e7d32
    style ENG3 fill:#e8f5e8,stroke:#2e7d32
    style TEMP fill:#e8f5e8,stroke:#2e7d32
    style MET3 fill:#e8f5e8,stroke:#2e7d32
```

### Campaign Priority Logic

```mermaid
graph TD
    subgraph "🟨 Priority Controller Logic"
        PC[Priority Controller]
        HS[High Score Check]
        PS[Priority Setter]
        TS[Template Selector]
        FS[Follow-up Scheduler]
    end
    
    PC -->|Lead Score >= 80| HS
    HS -->|HIGH Priority| PS
    PS -->|Direct Meeting Request| TS
    TS -->|2 days| FS
    
    PC -->|Lead Score 50-79| PS
    PS -->|MEDIUM Priority| TS
    TS -->|Educational Content| FS
    FS -->|5 days| FS
    
    PC -->|Lead Score < 50| PS
    PS -->|LOW Priority| TS
    TS -->|Nurture Content| FS
    FS -->|14 days| FS
    
    style PC fill:#fff3e0,stroke:#ff8f00
    style HS fill:#fff3e0,stroke:#ff8f00
    style PS fill:#fff3e0,stroke:#ff8f00
    style TS fill:#fff3e0,stroke:#ff8f00
    style FS fill:#fff3e0,stroke:#ff8f00
```

---

## Task Orchestration Use Case

### Robustness Diagram: Task Orchestration System

```mermaid
graph TD
    subgraph "🟦 Boundary Objects"
        CRON4[Cron Scheduler]
        LOCK[Lock File Interface]
        HSA4[HubSpot API]
        PROC[Process Interface]
        LOG4[Log Interface]
        SIG[Signal Interface]
    end
    
    subgraph "🟨 Control Objects"
        TMC4[Task Monitor Controller]
        AOC[Agent Orchestration Controller]
        QMC[Queue Management Controller]
        LMC[Lock Management Controller]
        RTC[Routing Controller]
        HMC[Health Monitor Controller]
    end
    
    subgraph "🟩 Entity Objects"
        QUEUE[Task Queue]
        AGENT[Agent]
        TASK4[Task]
        PROC_E[Process]
        LOCK_E[Lock]
        STATUS[Agent Status]
        MET4[Performance Metrics]
    end
    
    CRON4 -.->|1. Trigger| TMC4
    TMC4 -->|2. Check Lock| LMC
    LMC -->|3. Acquire Lock| LOCK
    LOCK -.->|4. Lock Status| LOCK_E
    
    TMC4 -->|5. Scan Tasks| HSA4
    HSA4 -.->|6. Task List| QUEUE
    
    TMC4 -->|7. Route Tasks| RTC
    RTC -->|8. Classify Task| TASK4
    RTC -->|9. Select Agent| AOC
    AOC -->|10. Check Availability| AGENT
    
    AOC -->|11. Dispatch| QMC
    QMC -->|12. Create Process| PROC
    PROC -.->|13. Process ID| PROC_E
    
    AOC -->|14. Monitor Health| HMC
    HMC -->|15. Check Status| STATUS
    HMC -->|16. Update Metrics| MET4
    
    TMC4 -->|17. Update Tasks| HSA4
    TMC4 -->|18. Release Lock| LMC
    TMC4 -->|19. Log Activity| LOG4
    
    HMC -.->|Health Issues| SIG
    SIG -.->|Signal Handlers| TMC4
    
    style CRON4 fill:#e3f2fd,stroke:#1565c0
    style LOCK fill:#e3f2fd,stroke:#1565c0
    style HSA4 fill:#e3f2fd,stroke:#1565c0
    style PROC fill:#e3f2fd,stroke:#1565c0
    style LOG4 fill:#e3f2fd,stroke:#1565c0
    style SIG fill:#e3f2fd,stroke:#1565c0
    
    style TMC4 fill:#fff3e0,stroke:#ff8f00
    style AOC fill:#fff3e0,stroke:#ff8f00
    style QMC fill:#fff3e0,stroke:#ff8f00
    style LMC fill:#fff3e0,stroke:#ff8f00
    style RTC fill:#fff3e0,stroke:#ff8f00
    style HMC fill:#fff3e0,stroke:#ff8f00
    
    style QUEUE fill:#e8f5e8,stroke:#2e7d32
    style AGENT fill:#e8f5e8,stroke:#2e7d32
    style TASK4 fill:#e8f5e8,stroke:#2e7d32
    style PROC_E fill:#e8f5e8,stroke:#2e7d32
    style LOCK_E fill:#e8f5e8,stroke:#2e7d32
    style STATUS fill:#e8f5e8,stroke:#2e7d32
    style MET4 fill:#e8f5e8,stroke:#2e7d32
```

---

## Error Handling Use Case

### Robustness Diagram: Error Handling and Recovery

```mermaid
graph TD
    subgraph "🟦 Boundary Objects"
        ERR[Error Interface]
        LOG5[Log Interface]
        ALERT[Alert Interface]
        HSA5[HubSpot API]
        RETRY[Retry Interface]
        ESC[Escalation Interface]
    end
    
    subgraph "🟨 Control Objects"
        EHC5[Error Handler Controller]
        CLC[Classification Controller]
        RCC[Retry Controller]
        ESC_C[Escalation Controller]
        REC[Recovery Controller]
        NTC[Notification Controller]
    end
    
    subgraph "🟩 Entity Objects"
        ERROR[Error]
        RETRY_E[Retry Attempt]
        ESC_E[Escalation]
        REC_E[Recovery Action]
        TASK5[Task]
        STATUS5[Error Status]
        HIST[Error History]
    end
    
    ERR -.->|1. Error Occurred| EHC5
    EHC5 -->|2. Classify Error| CLC
    CLC -->|3. Create Error Entity| ERROR
    ERROR -->|4. Determine Type| CLC
    
    CLC -->|5. Route to Retry| RCC
    RCC -->|6. Check Retry Count| RETRY_E
    RETRY_E -->|7. Under Limit| RCC
    RCC -->|8. Create Retry| RETRY
    
    CLC -->|9. Route to Escalation| ESC_C
    ESC_C -->|10. Create Escalation| ESC_E
    ESC_C -->|11. Notify Human| ESC
    
    EHC5 -->|12. Attempt Recovery| REC
    REC -->|13. Execute Action| REC_E
    REC -->|14. Update Task| TASK5
    
    EHC5 -->|15. Update Status| STATUS5
    EHC5 -->|16. Log Error| LOG5
    EHC5 -->|17. Record History| HIST
    
    EHC5 -->|18. Send Alert| NTC
    NTC -->|19. Alert Stakeholders| ALERT
    
    REC -->|20. Update HubSpot| HSA5
    
    style ERR fill:#e3f2fd,stroke:#1565c0
    style LOG5 fill:#e3f2fd,stroke:#1565c0
    style ALERT fill:#e3f2fd,stroke:#1565c0
    style HSA5 fill:#e3f2fd,stroke:#1565c0
    style RETRY fill:#e3f2fd,stroke:#1565c0
    style ESC fill:#e3f2fd,stroke:#1565c0
    
    style EHC5 fill:#fff3e0,stroke:#ff8f00
    style CLC fill:#fff3e0,stroke:#ff8f00
    style RCC fill:#fff3e0,stroke:#ff8f00
    style ESC_C fill:#fff3e0,stroke:#ff8f00
    style REC fill:#fff3e0,stroke:#ff8f00
    style NTC fill:#fff3e0,stroke:#ff8f00
    
    style ERROR fill:#e8f5e8,stroke:#2e7d32
    style RETRY_E fill:#e8f5e8,stroke:#2e7d32
    style ESC_E fill:#e8f5e8,stroke:#2e7d32
    style REC_E fill:#e8f5e8,stroke:#2e7d32
    style TASK5 fill:#e8f5e8,stroke:#2e7d32
    style STATUS5 fill:#e8f5e8,stroke:#2e7d32
    style HIST fill:#e8f5e8,stroke:#2e7d32
```

### Error Recovery Flow

```mermaid
stateDiagram-v2
    [*] --> ErrorDetected
    ErrorDetected --> Classify
    Classify --> NetworkError : Network Issue
    Classify --> ValidationError : Data Issue
    Classify --> AIError : AI Service Issue
    Classify --> SystemError : System Issue
    
    NetworkError --> Retry1
    Retry1 --> Success : Retry Works
    Retry1 --> Retry2 : Still Failing
    Retry2 --> Success : Retry Works
    Retry2 --> Retry3 : Still Failing
    Retry3 --> Success : Retry Works
    Retry3 --> EscalateNetwork : Max Retries
    
    ValidationError --> DataEnrichment : Missing Data
    ValidationError --> ManualReview : Invalid Data
    
    AIError --> RetryAI : Temporary Issue
    AIError --> AlternativeAI : Service Down
    RetryAI --> Success : AI Recovered
    AlternativeAI --> Success : Fallback Used
    
    SystemError --> Restart : Process Issue
    SystemError --> EscalateSystem : Critical Error
    
    Success --> [*]
    EscalateNetwork --> HumanReview
    ManualReview --> HumanReview
    EscalateSystem --> HumanReview
    HumanReview --> [*]
    DataEnrichment --> [*]
    Restart --> [*]
```

---

## System Integration Overview

### Complete System Robustness Map

```mermaid
graph TB
    subgraph "🟦 External Boundaries"
        USER[Sales Team Interface]
        CRON6[Cron Scheduler]
        HS[HubSpot CRM]
        WEB6[External Websites]
        EMAIL6[Email Services]
        AI[AI Services]
    end
    
    subgraph "🟦 System Boundaries"
        CLI6[Command Interface]
        API[API Gateway]
        LOG6[Logging System]
        FILE[File System]
        BROWSER[Browser Interface]
    end
    
    subgraph "🟨 Core Controllers"
        ORK[Orchestration Controller]
        BIZ[Business Logic Controller]
        DATA[Data Controller]
        COMM[Communication Controller]
        HEALTH[Health Controller]
    end
    
    subgraph "🟨 Agent Controllers"
        TMC6[Task Monitor]
        LQC6[Lead Qualifier]
        DEC6[Data Enricher]
        OAC6[Outreach Agent]
    end
    
    subgraph "🟩 Core Entities"
        TASK6[Tasks]
        CONTACT6[Contacts]
        LEADS6[Leads]
        COMPANY6[Companies]
        ENGAGEMENTS[Engagements]
    end
    
    subgraph "🟩 Support Entities"
        CONFIG[Configuration]
        METRICS6[Metrics]
        WORKFLOWS[Workflows]
        TEMPLATES[Templates]
    end
    
    USER --> CLI6
    CRON6 --> ORK
    HS <--> API
    WEB6 <--> BROWSER
    EMAIL6 <--> COMM
    AI <--> COMM
    
    CLI6 --> ORK
    API --> DATA
    LOG6 --> HEALTH
    FILE --> CONFIG
    BROWSER --> DEC6
    
    ORK --> TMC6
    BIZ --> LQC6
    DATA --> DEC6
    COMM --> OAC6
    HEALTH --> TMC6
    
    TMC6 --> TASK6
    LQC6 --> LEADS6
    DEC6 --> CONTACT6
    OAC6 --> ENGAGEMENTS
    
    TASK6 --> CONTACT6
    LEADS6 --> CONTACT6
    CONTACT6 --> COMPANY6
    ENGAGEMENTS --> CONTACT6
    
    CONFIG --> WORKFLOWS
    METRICS6 --> WORKFLOWS
    WORKFLOWS --> TEMPLATES
    
    style USER fill:#ffebee,stroke:#c62828
    style HS fill:#ffebee,stroke:#c62828
    style WEB6 fill:#ffebee,stroke:#c62828
    
    style CLI6 fill:#e3f2fd,stroke:#1565c0
    style API fill:#e3f2fd,stroke:#1565c0
    style LOG6 fill:#e3f2fd,stroke:#1565c0
    style FILE fill:#e3f2fd,stroke:#1565c0
    style BROWSER fill:#e3f2fd,stroke:#1565c0
    
    style ORK fill:#fff3e0,stroke:#ff8f00
    style BIZ fill:#fff3e0,stroke:#ff8f00
    style DATA fill:#fff3e0,stroke:#ff8f00
    style COMM fill:#fff3e0,stroke:#ff8f00
    style HEALTH fill:#fff3e0,stroke:#ff8f00
    
    style TMC6 fill:#fff8e1,stroke:#f57c00
    style LQC6 fill:#fff8e1,stroke:#f57c00
    style DEC6 fill:#fff8e1,stroke:#f57c00
    style OAC6 fill:#fff8e1,stroke:#f57c00
    
    style TASK6 fill:#e8f5e8,stroke:#2e7d32
    style CONTACT6 fill:#e8f5e8,stroke:#2e7d32
    style LEADS6 fill:#e8f5e8,stroke:#2e7d32
    style COMPANY6 fill:#e8f5e8,stroke:#2e7d32
    style ENGAGEMENTS fill:#e8f5e8,stroke:#2e7d32
    
    style CONFIG fill:#f3e5f5,stroke:#7b1fa2
    style METRICS6 fill:#f3e5f5,stroke:#7b1fa2
    style WORKFLOWS fill:#f3e5f5,stroke:#7b1fa2
    style TEMPLATES fill:#f3e5f5,stroke:#7b1fa2
```

---

## Object Interaction Patterns

### ICONIX Pattern Implementation

```mermaid
graph LR
    subgraph "Boundary → Control → Entity Pattern"
        B1[🟦 Boundary] -->|1. Input/Request| C1[🟨 Control]
        C1 -->|2. Business Logic| E1[🟩 Entity]
        E1 -->|3. Data Access| C1
        C1 -->|4. Response| B1
    end
    
    subgraph "Control → Control Coordination"
        C2[🟨 Controller A] -->|Delegate| C3[🟨 Controller B]
        C3 -->|Collaborate| C4[🟨 Controller C]
        C4 -->|Coordinate| C2
    end
    
    subgraph "Entity → Entity Relationships"
        E2[🟩 Primary Entity] -->|Associates| E3[🟩 Related Entity]
        E3 -->|References| E4[🟩 Supporting Entity]
        E4 -->|Aggregates| E2
    end
    
    style B1 fill:#e3f2fd,stroke:#1565c0
    style C1 fill:#fff3e0,stroke:#ff8f00
    style E1 fill:#e8f5e8,stroke:#2e7d32
    style C2 fill:#fff3e0,stroke:#ff8f00
    style C3 fill:#fff3e0,stroke:#ff8f00
    style C4 fill:#fff3e0,stroke:#ff8f00
    style E2 fill:#e8f5e8,stroke:#2e7d32
    style E3 fill:#e8f5e8,stroke:#2e7d32
    style E4 fill:#e8f5e8,stroke:#2e7d32
```

### Design Principles Validation

| ICONIX Principle | Implementation | Validation |
|-----------------|----------------|------------|
| **Separation of Concerns** | Boundary/Control/Entity layers | ✅ Clear separation maintained |
| **Single Responsibility** | Each object has one clear purpose | ✅ Controllers focus on specific business logic |
| **Object Communication** | Well-defined interfaces | ✅ Clean interaction patterns |
| **Business Logic Centralization** | Logic in control objects only | ✅ No business logic in boundaries or entities |
| **Data Integrity** | Entity objects manage state | ✅ Entities encapsulate business data |
| **Use Case Traceability** | Clear path from use case to implementation | ✅ Robustness diagrams map to code |

---

[⬆️ Back to top](#-table-of-contents) | [⬅️ Entity Objects](./entity-objects.md) | [➡️ Index](./index.md)