[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [📊 Diagrams](./index.md)

---

# System Context Diagram (C4 Level 1)

**Author:** AI Architecture Assistant  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0

## 📑 Table of Contents
1. [Overview](#overview)
2. [System Context Diagram](#system-context-diagram)
3. [External Systems](#external-systems)
4. [User Roles](#user-roles)
5. [Key Interactions](#key-interactions)
6. [Related Documents](#related-documents)

---

## Overview

This document provides the highest-level view of the AI Sales Agent Swarm system, showing how it fits into the broader ecosystem and interacts with external users and systems.

## System Context Diagram

```mermaid
graph TB
    %% Styling
    classDef person fill:#08427b,stroke:#073b6f,color:#fff
    classDef system fill:#1168bd,stroke:#0e5ba8,color:#fff
    classDef external fill:#999999,stroke:#8a8a8a,color:#fff
    
    %% Actors (People)
    SalesUser[Sales User<br/><<Person>>]:::person
    SalesManager[Sales Manager<br/><<Person>>]:::person
    Admin[System Administrator<br/><<Person>>]:::person
    Lead[Lead/Prospect<br/><<Person>>]:::person
    
    %% Main System
    AgentSwarm[AI Sales Agent Swarm<br/><<Software System>><br/>Autonomous AI agents for<br/>sales automation]:::system
    
    %% External Systems
    HubSpot[HubSpot CRM<br/><<External System>><br/>Customer relationship<br/>management platform]:::external
    
    Claude[Claude AI<br/><<External System>><br/>Advanced language model<br/>for intelligent processing]:::external
    
    MCP[MCP Server<br/><<External System>><br/>Model Context Protocol<br/>integration layer]:::external
    
    WebData[Web Data Sources<br/><<External System>><br/>LinkedIn, Company websites,<br/>Public data sources]:::external
    
    EmailService[Email Service<br/><<External System>><br/>SMTP/Email delivery<br/>infrastructure]:::external
    
    %% Relationships
    SalesUser -->|Creates leads,<br/>assigns tasks| AgentSwarm
    SalesUser -->|Views enriched data,<br/>receives notifications| AgentSwarm
    
    SalesManager -->|Monitors performance,<br/>configures workflows| AgentSwarm
    SalesManager -->|Reviews analytics| AgentSwarm
    
    Admin -->|Configures agents,<br/>manages API keys| AgentSwarm
    Admin -->|Monitors system health| AgentSwarm
    
    Lead -->|Receives outreach,<br/>engages with content| AgentSwarm
    
    AgentSwarm -->|Reads/writes contacts,<br/>manages tasks| HubSpot
    HubSpot -->|Webhooks, events| AgentSwarm
    
    AgentSwarm -->|Processes with AI,<br/>generates content| Claude
    Claude -->|Returns insights,<br/>personalized content| AgentSwarm
    
    AgentSwarm <-->|API communication| MCP
    MCP <-->|Protocol translation| HubSpot
    MCP <-->|Model interaction| Claude
    
    AgentSwarm -->|Searches for<br/>company data| WebData
    WebData -->|Returns enrichment<br/>information| AgentSwarm
    
    AgentSwarm -->|Sends personalized<br/>emails| EmailService
    EmailService -->|Delivery status| AgentSwarm
```

## External Systems

### HubSpot CRM
- **Purpose**: Central customer data repository and task management system
- **Integration**: RESTful API via MCP Server
- **Data Exchange**: Contacts, companies, tasks, emails, activities
- **Authentication**: Private App Token

### Claude AI
- **Purpose**: Intelligent text processing and content generation
- **Integration**: API via MCP Server
- **Capabilities**: Lead scoring, email personalization, data analysis
- **Model**: Claude 3 Opus

### MCP Server
- **Purpose**: Protocol abstraction and integration layer
- **Technology**: Model Context Protocol
- **Benefits**: Unified interface for multiple AI models and services

### Web Data Sources
- **Purpose**: External data enrichment
- **Sources**: LinkedIn, company websites, public databases
- **Methods**: Web scraping, API integration
- **Data Types**: Company info, contact details, social profiles

### Email Service
- **Purpose**: Outbound communication delivery
- **Protocol**: SMTP
- **Features**: Template rendering, tracking, bounce handling

## User Roles

### Sales User
- **Primary Actions**:
  - Create and import leads
  - Trigger qualification tasks
  - Review enriched data
  - Monitor outreach campaigns
- **Benefits**: Automated lead processing, enriched insights

### Sales Manager
- **Primary Actions**:
  - Configure scoring criteria
  - Set up workflow rules
  - Monitor team performance
  - Review conversion metrics
- **Benefits**: Team productivity insights, automated workflows

### System Administrator
- **Primary Actions**:
  - Configure agent parameters
  - Manage API credentials
  - Monitor system health
  - Handle integrations
- **Benefits**: Centralized management, system observability

### Lead/Prospect
- **Interactions**:
  - Receives personalized outreach
  - Engages with content
  - Responds to communications
- **Experience**: Relevant, timely, personalized engagement

## Key Interactions

### 1. Lead Processing Flow
```mermaid
sequenceDiagram
    actor SalesUser
    participant AgentSwarm
    participant HubSpot
    participant Claude
    participant WebData
    
    SalesUser->>HubSpot: Create new lead
    HubSpot->>AgentSwarm: Task notification
    AgentSwarm->>HubSpot: Fetch lead data
    AgentSwarm->>WebData: Search enrichment data
    WebData-->>AgentSwarm: Company/contact info
    AgentSwarm->>Claude: Analyze and score
    Claude-->>AgentSwarm: Scoring results
    AgentSwarm->>HubSpot: Update lead with insights
    AgentSwarm->>SalesUser: Notification complete
```

### 2. Outreach Automation
```mermaid
sequenceDiagram
    actor Lead
    participant AgentSwarm
    participant Claude
    participant EmailService
    participant HubSpot
    
    AgentSwarm->>Claude: Generate personalized content
    Claude-->>AgentSwarm: Email content
    AgentSwarm->>EmailService: Send email
    EmailService->>Lead: Deliver message
    Lead->>EmailService: Open/click action
    EmailService-->>AgentSwarm: Engagement data
    AgentSwarm->>HubSpot: Update activity
```

### 3. Task Orchestration
```mermaid
sequenceDiagram
    participant HubSpot
    participant AgentSwarm
    participant TaskMonitor
    participant SpecificAgent
    
    HubSpot->>HubSpot: New task created
    loop Every 60 seconds
        TaskMonitor->>HubSpot: Poll for tasks
        HubSpot-->>TaskMonitor: Pending tasks
    end
    TaskMonitor->>SpecificAgent: Dispatch task
    SpecificAgent->>HubSpot: Process and update
    SpecificAgent->>HubSpot: Mark complete
```

---

## Related Documents

- [Container Architecture](./container-architecture.md) - Detailed view of system containers
- [Component Diagrams](./component-diagrams.md) - Internal component structure
- [Deployment Architecture](./deployment-architecture.md) - Infrastructure and deployment
- [Data Flow Diagrams](./data-flow.md) - Data movement and transformations

[⬆️ Back to top](#-table-of-contents)

---

[⬅️ Architecture Index](../../architecture/index.md) | [⬆️ Diagrams](./index.md) | [➡️ Container Architecture](./container-architecture.md)