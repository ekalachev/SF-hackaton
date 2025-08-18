[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [⬆️ Robustness](./index.md)

---

# Entity Objects Analysis (ICONIX Process)

**Author:** Alex Fedin | [O2.services](https://O2.services) | [LinkedIn](https://linkedin.com/in/alex-fedin)  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0  
**Methodology:** ICONIX Process

## 📑 Table of Contents

1. [Overview](#overview)
2. [Entity Objects Definition](#entity-objects-definition)
3. [Core Domain Entities](#core-domain-entities)
4. [Business Data Objects](#business-data-objects)
5. [Value Objects](#value-objects)
6. [Aggregate Structures](#aggregate-structures)
7. [Entity Relationships](#entity-relationships)
8. [Entity Objects Catalog](#entity-objects-catalog)
9. [Related Components](#related-components)

---

## Overview

In the ICONIX methodology, **Entity Objects** represent the core business data and domain concepts. These objects model the real-world entities that the system manages, along with their attributes, states, and relationships.

### ICONIX Notation in Mermaid
- **Entity Objects**: Represented with `<<entity>>` stereotype
- **Domain Models**: Business concepts and data structures
- **Persistent Data**: Information that survives across system sessions

---

## Entity Objects Definition

### Classification Criteria
1. **Core Business Entities**: Primary domain objects (Contact, Lead, Task)
2. **Supporting Entities**: Secondary objects that support business operations
3. **Value Objects**: Immutable objects that describe characteristics
4. **Configuration Entities**: System configuration and metadata

---

## Core Domain Entities

### Primary Business Entities

```mermaid
classDiagram
    class Contact {
        <<entity>>
        +id: String
        +email: String
        +firstName: String
        +lastName: String
        +company: String
        +jobTitle: String
        +phone: String
        +website: String
        +linkedinProfile: String
        +lastContactedDate: DateTime
        +createdDate: DateTime
        +updatedDate: DateTime
        +getFullName(): String
        +isValidEmail(): Boolean
        +hasCompleteProfile(): Boolean
    }
    
    class Lead {
        <<entity>>
        +contactId: String
        +score: Integer
        +tier: LeadTier
        +status: LeadStatus
        +qualificationDate: DateTime
        +lastScoredDate: DateTime
        +scoringNotes: String
        +decisionMakerScore: Integer
        +qualificationCriteria: Map
        +calculateScore(): Integer
        +isQualified(): Boolean
        +updateTier(): Void
    }
    
    class Company {
        <<entity>>
        +id: String
        +name: String
        +domain: String
        +website: String
        +industry: String
        +size: CompanySize
        +description: String
        +technologies: List<String>
        +location: String
        +foundedYear: Integer
        +revenue: String
        +isTargetCompany(): Boolean
        +getTechnologyStack(): List<String>
    }
    
    class Task {
        <<entity>>
        +id: String
        +subject: String
        +description: String
        +status: TaskStatus
        +priority: Priority
        +type: TaskType
        +assignedTo: String
        +associatedContacts: List<String>
        +associatedCompanies: List<String>
        +dueDate: DateTime
        +createdDate: DateTime
        +completedDate: DateTime
        +notes: String
        +isOverdue(): Boolean
        +markCompleted(): Void
        +updateStatus(status: TaskStatus): Void
    }
    
    Contact ||--o{ Lead : "becomes"
    Contact }o--|| Company : "works at"
    Task }o--o{ Contact : "associated with"
    Task }o--o{ Company : "related to"
```

### Secondary Business Entities

```mermaid
classDiagram
    class Engagement {
        <<entity>>
        +id: String
        +type: EngagementType
        +timestamp: DateTime
        +contactId: String
        +subject: String
        +body: String
        +direction: Direction
        +status: EngagementStatus
        +metadata: Map<String, Object>
        +attachments: List<String>
        +isSuccessful(): Boolean
        +getDuration(): Integer
    }
    
    class OutreachCampaign {
        <<entity>>
        +id: String
        +name: String
        +contactIds: List<String>
        +messageTemplate: String
        +personalizations: Map<String, String>
        +scheduledDate: DateTime
        +sentDate: DateTime
        +status: CampaignStatus
        +metrics: CampaignMetrics
        +followUpDays: Integer
        +getResponseRate(): Float
        +isActive(): Boolean
    }
    
    class EnrichmentData {
        <<entity>>
        +contactId: String
        +companyId: String
        +source: EnrichmentSource
        +quality: DataQuality
        +timestamp: DateTime
        +enrichedFields: Map<String, Object>
        +confidence: Float
        +dataGaps: List<String>
        +verificationStatus: VerificationStatus
        +isHighQuality(): Boolean
        +getCompleteness(): Float
    }
    
    class WorkflowExecution {
        <<entity>>
        +id: String
        +workflowName: String
        +triggeredBy: String
        +startTime: DateTime
        +endTime: DateTime
        +status: ExecutionStatus
        +steps: List<WorkflowStep>
        +errors: List<String>
        +metadata: Map<String, Object>
        +isCompleted(): Boolean
        +getDuration(): Integer
    }
    
    Engagement }o--|| Contact : "involves"
    OutreachCampaign }o--o{ Contact : "targets"
    EnrichmentData }o--|| Contact : "enriches"
    EnrichmentData }o--|| Company : "enriches"
    WorkflowExecution }o--o{ Task : "creates"
```

---

## Business Data Objects

### Configuration and Metadata Entities

```mermaid
classDiagram
    class TaskTemplate {
        <<entity>>
        +name: String
        +subject: String
        +description: String
        +priority: Priority
        +assignee: String
        +estimatedDuration: Integer
        +requiredFields: List<String>
        +businessRules: List<String>
        +createTask(context: Map): Task
        +validate(data: Map): Boolean
    }
    
    class WorkflowTrigger {
        <<entity>>
        +id: String
        +name: String
        +triggerType: TriggerType
        +conditions: List<Condition>
        +actions: List<Action>
        +isActive: Boolean
        +priority: Integer
        +evaluateConditions(context: Map): Boolean
        +executeActions(): Void
    }
    
    class ScoringRule {
        <<entity>>
        +id: String
        +name: String
        +description: String
        +criteria: String
        +points: Integer
        +weight: Float
        +isActive: Boolean
        +category: RuleCategory
        +evaluate(contact: Contact): Integer
        +isApplicable(contact: Contact): Boolean
    }
    
    class AgentConfiguration {
        <<entity>>
        +agentName: String
        +maxConcurrentTasks: Integer
        +retryAttempts: Integer
        +timeoutSeconds: Integer
        +enabledFeatures: List<String>
        +apiEndpoints: Map<String, String>
        +businessRules: List<String>
        +isEnabled(): Boolean
        +getTimeout(): Integer
    }
    
    TaskTemplate ||--o{ Task : "generates"
    WorkflowTrigger ||--o{ Task : "creates"
    ScoringRule }o--|| Lead : "scores"
    AgentConfiguration ||--o{ WorkflowExecution : "configures"
```

### Performance and Analytics Entities

```mermaid
classDiagram
    class AgentMetrics {
        <<entity>>
        +agentName: String
        +executionDate: Date
        +tasksProcessed: Integer
        +successfulTasks: Integer
        +failedTasks: Integer
        +averageProcessingTime: Float
        +errorRate: Float
        +throughputPerHour: Float
        +getSuccessRate(): Float
        +isPerformingWell(): Boolean
    }
    
    class LeadMetrics {
        <<entity>>
        +date: Date
        +totalLeads: Integer
        +qualifiedLeads: Integer
        +hotLeads: Integer
        +warmLeads: Integer
        +coldLeads: Integer
        +averageScore: Float
        +conversionRate: Float
        +getQualificationRate(): Float
        +getTierDistribution(): Map<String, Integer>
    }
    
    class CampaignMetrics {
        <<entity>>
        +campaignId: String
        +emailsSent: Integer
        +emailsDelivered: Integer
        +emailsOpened: Integer
        +emailsClicked: Integer
        +emailsReplied: Integer
        +bounceRate: Float
        +openRate: Float
        +clickRate: Float
        +replyRate: Float
        +getEngagementScore(): Float
        +isSuccessful(): Boolean
    }
    
    AgentMetrics }o--|| AgentConfiguration : "measures"
    LeadMetrics }o--o{ Lead : "aggregates"
    CampaignMetrics }o--|| OutreachCampaign : "tracks"
```

---

## Value Objects

### Immutable Value Objects

```mermaid
classDiagram
    class Email {
        <<value object>>
        +value: String
        +domain: String
        +localPart: String
        +isValid(): Boolean
        +isCorporate(): Boolean
        +getDomain(): String
        +equals(other: Email): Boolean
        +hashCode(): Integer
    }
    
    class Score {
        <<value object>>
        +value: Integer
        +maxValue: Integer
        +category: ScoreCategory
        +normalize(): Float
        +isAboveThreshold(threshold: Integer): Boolean
        +compareTo(other: Score): Integer
        +toString(): String
    }
    
    class Address {
        <<value object>>
        +street: String
        +city: String
        +state: String
        +zipCode: String
        +country: String
        +isComplete(): Boolean
        +getFormattedAddress(): String
        +equals(other: Address): Boolean
    }
    
    class DateRange {
        <<value object>>
        +startDate: DateTime
        +endDate: DateTime
        +getDuration(): Integer
        +contains(date: DateTime): Boolean
        +overlaps(other: DateRange): Boolean
        +isValid(): Boolean
    }
    
    class ContactInfo {
        <<value object>>
        +email: Email
        +phone: String
        +linkedInProfile: String
        +isComplete(): Boolean
        +hasValidEmail(): Boolean
        +getPrimaryContact(): String
    }
    
    Contact --> Email : "has"
    Contact --> Address : "has"
    Contact --> ContactInfo : "has"
    Lead --> Score : "has"
    Task --> DateRange : "has due period"
```

### Enumeration Value Objects

```mermaid
classDiagram
    class LeadTier {
        <<enumeration>>
        HOT
        WARM
        COLD
        UNQUALIFIED
        +getMinScore(): Integer
        +getDescription(): String
        +getPriority(): Integer
    }
    
    class TaskStatus {
        <<enumeration>>
        NOT_STARTED
        IN_PROGRESS
        WAITING
        COMPLETED
        FAILED
        +isActive(): Boolean
        +isTerminal(): Boolean
        +getNextStates(): List<TaskStatus>
    }
    
    class EngagementType {
        <<enumeration>>
        EMAIL
        CALL
        MEETING
        NOTE
        TASK
        +getDisplayName(): String
        +isInteractive(): Boolean
        +requiresResponse(): Boolean
    }
    
    class DataQuality {
        <<enumeration>>
        HIGH
        MEDIUM
        LOW
        UNKNOWN
        +getThreshold(): Float
        +isAcceptable(): Boolean
        +getRequiredFields(): List<String>
    }
    
    Lead --> LeadTier : "categorized as"
    Task --> TaskStatus : "has"
    Engagement --> EngagementType : "type of"
    EnrichmentData --> DataQuality : "rated as"
```

---

## Aggregate Structures

### Lead Aggregate Root

```mermaid
classDiagram
    class LeadAggregate {
        <<aggregate root>>
        +contact: Contact
        +lead: Lead
        +company: Company
        +enrichmentData: List<EnrichmentData>
        +engagements: List<Engagement>
        +tasks: List<Task>
        +qualifyLead(): Void
        +enrichContact(): Void
        +scoreContact(): Integer
        +createOutreachTask(): Task
        +getCompleteness(): Float
        +isReadyForOutreach(): Boolean
        -validateBusinessRules(): Boolean
        -updateLastModified(): Void
    }
    
    class CampaignAggregate {
        <<aggregate root>>
        +campaign: OutreachCampaign
        +contacts: List<Contact>
        +engagements: List<Engagement>
        +metrics: CampaignMetrics
        +executeCampaign(): Void
        +trackProgress(): Void
        +generateReport(): CampaignReport
        +isCompleted(): Boolean
        -validateCampaignRules(): Boolean
        -updateMetrics(): Void
    }
    
    class WorkflowAggregate {
        <<aggregate root>>
        +execution: WorkflowExecution
        +tasks: List<Task>
        +triggers: List<WorkflowTrigger>
        +metrics: AgentMetrics
        +executeWorkflow(): Void
        +handleFailure(): Void
        +generateExecutionReport(): WorkflowReport
        +isHealthy(): Boolean
        -validateWorkflowIntegrity(): Boolean
        -updateExecutionMetrics(): Void
    }
    
    LeadAggregate --> Contact
    LeadAggregate --> Lead
    LeadAggregate --> Company
    LeadAggregate --> EnrichmentData
    LeadAggregate --> Engagement
    LeadAggregate --> Task
    
    CampaignAggregate --> OutreachCampaign
    CampaignAggregate --> Contact
    CampaignAggregate --> Engagement
    CampaignAggregate --> CampaignMetrics
    
    WorkflowAggregate --> WorkflowExecution
    WorkflowAggregate --> Task
    WorkflowAggregate --> WorkflowTrigger
    WorkflowAggregate --> AgentMetrics
```

---

## Entity Relationships

### Core Entity Relationship Diagram

```mermaid
erDiagram
    Contact {
        string id PK
        string email UK
        string firstName
        string lastName
        string company
        string jobTitle
        string phone
        string website
        string linkedinProfile
        datetime lastContactedDate
        datetime createdDate
        datetime updatedDate
    }
    
    Lead {
        string contactId PK,FK
        integer score
        string tier
        string status
        datetime qualificationDate
        datetime lastScoredDate
        string scoringNotes
        integer decisionMakerScore
        json qualificationCriteria
    }
    
    Company {
        string id PK
        string name
        string domain UK
        string website
        string industry
        string size
        string description
        json technologies
        string location
        integer foundedYear
        string revenue
    }
    
    Task {
        string id PK
        string subject
        string description
        string status
        string priority
        string type
        string assignedTo
        json associatedContacts
        json associatedCompanies
        datetime dueDate
        datetime createdDate
        datetime completedDate
        text notes
    }
    
    Engagement {
        string id PK
        string type
        datetime timestamp
        string contactId FK
        string subject
        text body
        string direction
        string status
        json metadata
        json attachments
    }
    
    EnrichmentData {
        string contactId FK
        string companyId FK
        string source
        string quality
        datetime timestamp
        json enrichedFields
        float confidence
        json dataGaps
        string verificationStatus
    }
    
    Contact ||--o{ Lead : "becomes"
    Contact }o--|| Company : "works_at"
    Contact ||--o{ Engagement : "has"
    Contact ||--o{ EnrichmentData : "enriched_by"
    Company ||--o{ EnrichmentData : "enriched_by"
    Task }o--o{ Contact : "associated_with"
    Task }o--o{ Company : "related_to"
```

### Business Process Relationships

```mermaid
graph TD
    subgraph "Lead Management Process"
        C[Contact] --> ED[EnrichmentData]
        ED --> L[Lead]
        L --> T1[Qualification Task]
        T1 --> T2[Outreach Task]
        T2 --> E[Engagement]
    end
    
    subgraph "Campaign Management"
        OC[OutreachCampaign] --> CL[Contact List]
        CL --> ET[Email Template]
        ET --> SE[Sent Engagements]
        SE --> CM[Campaign Metrics]
    end
    
    subgraph "Workflow Execution"
        WT[WorkflowTrigger] --> WE[WorkflowExecution]
        WE --> GT[Generated Tasks]
        GT --> AM[Agent Metrics]
    end
    
    C -.-> CL
    E -.-> SE
    T1 -.-> GT
    T2 -.-> GT
    
    style C fill:#e3f2fd,stroke:#1565c0
    style L fill:#e8f5e8,stroke:#2e7d32
    style T1 fill:#fff3e0,stroke:#ef6c00
    style T2 fill:#fff3e0,stroke:#ef6c00
    style E fill:#fce4ec,stroke:#c2185b
```

---

## Entity Objects Catalog

### Complete Entity Objects List

| Entity Category | Entity Object | Primary Key | Key Attributes | Business Rules |
|----------------|---------------|-------------|----------------|----------------|
| **Core Entities** | Contact | id | email, name, company, jobTitle | Unique email, valid contact info |
| | Lead | contactId | score, tier, status | Score 0-100, tier based on score |
| | Company | id | name, domain, industry | Unique domain, valid website |
| | Task | id | subject, status, priority | Valid status transitions |
| **Support Entities** | Engagement | id | type, timestamp, contactId | Must be associated with contact |
| | OutreachCampaign | id | name, contactIds, status | Must have at least one contact |
| | EnrichmentData | contactId + source | quality, enrichedFields | Must reference valid contact |
| | WorkflowExecution | id | workflowName, status | Must complete all steps |
| **Config Entities** | TaskTemplate | name | subject, priority, rules | Valid template structure |
| | WorkflowTrigger | id | conditions, actions | Valid condition syntax |
| | ScoringRule | id | criteria, points | Valid scoring criteria |
| | AgentConfiguration | agentName | settings, endpoints | Valid configuration |
| **Metrics Entities** | AgentMetrics | agentName + date | tasksProcessed, successRate | Must aggregate from executions |
| | LeadMetrics | date | totalLeads, conversionRate | Must aggregate from leads |
| | CampaignMetrics | campaignId | emailsSent, responseRate | Must track campaign performance |

### Entity State Transitions

```mermaid
stateDiagram-v2
    [*] --> Contact : Create
    Contact --> Lead : Qualify
    Lead --> Qualified : Score >= 40
    Lead --> Unqualified : Score < 40
    Qualified --> Hot : Score >= 70
    Qualified --> Warm : Score 40-69
    Hot --> Contacted : Outreach Sent
    Warm --> Contacted : Outreach Sent
    Contacted --> Responded : Response Received
    Contacted --> NoResponse : Follow-up Needed
    NoResponse --> Contacted : Follow-up Sent
    Responded --> Opportunity : Meeting Scheduled
    Unqualified --> [*] : Archive
    
    state Lead {
        [*] --> Scoring
        Scoring --> Scored
        Scored --> Enrichment
        Enrichment --> Enriched
        Enriched --> [*]
    }
```

---

## Related Components

### Mapping to Code Components

| Entity Object | Implementation | Data Source | Persistence |
|---------------|----------------|-------------|-------------|
| **Contact** | HubSpot Contact Object | HubSpot CRM | HubSpot Database |
| **Lead** | Contact properties (lead_score, tier) | Calculated from Contact | HubSpot Properties |
| **Company** | HubSpot Company Object | HubSpot CRM + Web Enrichment | HubSpot Database |
| **Task** | HubSpot Task Object | HubSpot Workflows | HubSpot Database |
| **Engagement** | HubSpot Engagement Object | Agent Activities | HubSpot Database |
| **EnrichmentData** | Contact/Company Properties | Web Scraping + APIs | HubSpot Properties |
| **TaskTemplate** | `config/task_templates.json` | Configuration Files | File System |
| **WorkflowTrigger** | `config/workflow_triggers.json` | Configuration Files | File System |
| **AgentMetrics** | `logs/*.log` files | Agent Execution Logs | File System |

### Entity Creation Patterns

```mermaid
sequenceDiagram
    participant BC as Boundary Controller
    participant CC as Control Controller
    participant EF as Entity Factory
    participant ER as Entity Repository
    participant DB as Database
    
    BC->>CC: Create Entity Request
    CC->>EF: Create Entity Instance
    EF->>EF: Validate Business Rules
    EF->>EF: Set Default Values
    EF-->>CC: Entity Instance
    CC->>ER: Save Entity
    ER->>DB: Persist Data
    DB-->>ER: Success
    ER-->>CC: Entity Saved
    CC-->>BC: Entity Created
```

### Entity Validation Framework

```mermaid
classDiagram
    class EntityValidator {
        <<interface>>
        +validate(entity: Entity): ValidationResult
        +validateBusinessRules(entity: Entity): Boolean
        +getValidationErrors(): List<String>
    }
    
    class ContactValidator {
        +validate(contact: Contact): ValidationResult
        -validateEmail(): Boolean
        -validateRequiredFields(): Boolean
        -validateUniqueConstraints(): Boolean
    }
    
    class LeadValidator {
        +validate(lead: Lead): ValidationResult
        -validateScoreRange(): Boolean
        -validateTierConsistency(): Boolean
        -validateStatusTransition(): Boolean
    }
    
    class TaskValidator {
        +validate(task: Task): ValidationResult
        -validateAssignee(): Boolean
        -validateDueDate(): Boolean
        -validateAssociations(): Boolean
    }
    
    EntityValidator <|-- ContactValidator
    EntityValidator <|-- LeadValidator
    EntityValidator <|-- TaskValidator
```

---

[⬆️ Back to top](#-table-of-contents) | [⬅️ Control Objects](./control-objects.md) | [➡️ Use Case Diagrams](./use-case-diagrams.md)