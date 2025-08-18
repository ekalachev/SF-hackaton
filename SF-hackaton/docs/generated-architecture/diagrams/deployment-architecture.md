[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Architecture](../../architecture/index.md) | [📊 Diagrams](./index.md)

---

# Deployment Architecture Diagram

**Author:** AI Architecture Assistant  
**Last Updated:** 2025-08-18  
**Version:** 1.0.0

## 📑 Table of Contents
1. [Overview](#overview)
2. [Deployment Topology](#deployment-topology)
3. [Infrastructure Components](#infrastructure-components)
4. [Environment Configuration](#environment-configuration)
5. [Scaling Strategy](#scaling-strategy)
6. [Deployment Process](#deployment-process)
7. [Monitoring & Operations](#monitoring--operations)
8. [Disaster Recovery](#disaster-recovery)
9. [Related Documents](#related-documents)

---

## Overview

This document describes the deployment architecture of the AI Sales Agent Swarm, including infrastructure topology, scaling strategies, and operational considerations.

## Deployment Topology

```mermaid
graph TB
    %% Styling
    classDef env fill:#4ECDC4,stroke:#45b7b5,color:#fff
    classDef infra fill:#95E1D3,stroke:#85d1c3,color:#000
    classDef external fill:#999999,stroke:#8a8a8a,color:#fff
    classDef storage fill:#FFA07A,stroke:#FF8C69,color:#fff
    
    subgraph "Development Environment"
        DevMachine[Developer Machine<br/><<macOS/Linux>><br/>Local development]:::env
        DevMCP[Local MCP Server<br/><<Node.js>><br/>Port 3000]:::env
        DevAgents[Local Agents<br/><<Shell Scripts>><br/>Manual execution]:::env
        DevCron[Test Cron<br/><<Crontab>><br/>Every 5 minutes]:::env
    end
    
    subgraph "Staging Environment"
        StageServer[Staging Server<br/><<Linux VM>><br/>Integration testing]:::env
        StageMCP[Staging MCP<br/><<Node.js>><br/>Port 3000]:::env
        StageAgents[Staging Agents<br/><<Shell Scripts>><br/>Cron scheduled]:::env
        StageCron[Staging Cron<br/><<Crontab>><br/>Every minute]:::env
    end
    
    subgraph "Production Environment"
        subgraph "Primary Node"
            ProdServer1[Production Server 1<br/><<Linux VM>><br/>Primary node]:::env
            ProdMCP1[MCP Instance 1<br/><<Node.js>><br/>Port 3000]:::env
            ProdAgents1[Agent Pool 1<br/><<Shell Scripts>><br/>5 instances each]:::env
            ProdCron1[Cron Scheduler<br/><<Crontab>><br/>Every minute]:::env
        end
        
        subgraph "Secondary Node"
            ProdServer2[Production Server 2<br/><<Linux VM>><br/>Failover node]:::env
            ProdMCP2[MCP Instance 2<br/><<Node.js>><br/>Port 3000]:::env
            ProdAgents2[Agent Pool 2<br/><<Shell Scripts>><br/>5 instances each]:::env
            ProdCron2[Cron Scheduler<br/><<Crontab>><br/>Every minute]:::env
        end
    end
    
    subgraph "Shared Infrastructure"
        LoadBalancer[Load Balancer<br/><<HAProxy>><br/>Round-robin]:::infra
        LogAggregator[Log Aggregator<br/><<Filebeat>><br/>Centralized logs]:::infra
        Monitoring[Monitoring<br/><<Prometheus/Grafana>><br/>Metrics & alerts]:::infra
    end
    
    subgraph "External Services"
        HubSpot[HubSpot CRM<br/><<SaaS>><br/>api.hubspot.com]:::external
        Claude[Claude AI<br/><<SaaS>><br/>api.anthropic.com]:::external
        GitHub[GitHub<br/><<SaaS>><br/>Code repository]:::external
    end
    
    subgraph "Storage"
        ConfigStore[Config Store<br/><<Git>><br/>Version controlled]:::storage
        LogStorage[Log Storage<br/><<File System>><br/>7-day retention]:::storage
        BackupStorage[Backup Storage<br/><<S3>><br/>30-day retention]:::storage
    end
    
    %% Connections
    DevMachine --> DevMCP
    DevMCP --> DevAgents
    DevCron --> DevAgents
    
    StageServer --> StageMCP
    StageMCP --> StageAgents
    StageCron --> StageAgents
    
    LoadBalancer --> ProdMCP1
    LoadBalancer --> ProdMCP2
    
    ProdServer1 --> ProdMCP1
    ProdMCP1 --> ProdAgents1
    ProdCron1 --> ProdAgents1
    
    ProdServer2 --> ProdMCP2
    ProdMCP2 --> ProdAgents2
    ProdCron2 --> ProdAgents2
    
    ProdAgents1 --> LogAggregator
    ProdAgents2 --> LogAggregator
    LogAggregator --> LogStorage
    LogAggregator --> Monitoring
    
    DevMCP --> HubSpot
    StageMCP --> HubSpot
    ProdMCP1 --> HubSpot
    ProdMCP2 --> HubSpot
    
    DevMCP --> Claude
    StageMCP --> Claude
    ProdMCP1 --> Claude
    ProdMCP2 --> Claude
    
    DevMachine --> GitHub
    ConfigStore --> GitHub
    LogStorage --> BackupStorage
```

## Infrastructure Components

### Server Specifications

#### Development Environment
```yaml
Machine:
  Type: Developer Workstation
  OS: macOS/Linux
  CPU: 2+ cores
  RAM: 8GB minimum
  Storage: 20GB available
  Network: Broadband internet
  
Software:
  - Node.js 18+
  - Bash 4+
  - Python 3.9+
  - Git
  - Cron
```

#### Staging Environment
```yaml
Server:
  Type: Virtual Machine
  Provider: AWS EC2 / DigitalOcean
  Instance: t3.medium or equivalent
  OS: Ubuntu 22.04 LTS
  CPU: 2 vCPUs
  RAM: 4GB
  Storage: 40GB SSD
  Network: 100 Mbps
  
Software Stack:
  - Node.js 18+
  - PM2 for process management
  - Nginx for reverse proxy
  - Cron for scheduling
  - Filebeat for log shipping
```

#### Production Environment
```yaml
Primary Node:
  Type: Dedicated VM/Container
  Provider: AWS EC2 / GCP Compute
  Instance: t3.large or equivalent
  OS: Ubuntu 22.04 LTS
  CPU: 4 vCPUs
  RAM: 8GB
  Storage: 100GB SSD
  Network: 1 Gbps
  
Secondary Node:
  Type: Identical to Primary
  Purpose: High availability
  Location: Different availability zone
  
Load Balancer:
  Type: HAProxy / AWS ALB
  Algorithm: Round-robin
  Health Checks: Every 30 seconds
  Failover: Automatic
```

### Network Architecture

```mermaid
graph LR
    subgraph "Network Zones"
        subgraph "DMZ"
            LB[Load Balancer<br/>Public IP]
            WAF[Web Application<br/>Firewall]
        end
        
        subgraph "Application Zone"
            App1[App Server 1<br/>Private IP]
            App2[App Server 2<br/>Private IP]
        end
        
        subgraph "Management Zone"
            Monitor[Monitoring<br/>Private IP]
            Logs[Log Server<br/>Private IP]
        end
    end
    
    Internet[Internet] --> WAF
    WAF --> LB
    LB --> App1
    LB --> App2
    App1 --> Monitor
    App2 --> Monitor
    App1 --> Logs
    App2 --> Logs
```

### Security Configuration

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            Firewall[Firewall Rules]
            VPN[VPN Access]
            PrivateSubnet[Private Subnets]
        end
        
        subgraph "Application Security"
            APIKeys[API Key Management]
            EnvVars[Environment Variables]
            Secrets[Secrets Manager]
        end
        
        subgraph "Data Security"
            Encryption[TLS Encryption]
            Backup[Encrypted Backups]
            Audit[Audit Logging]
        end
    end
    
    Firewall --> PrivateSubnet
    VPN --> PrivateSubnet
    
    APIKeys --> Secrets
    EnvVars --> Secrets
    
    Encryption --> Backup
    Backup --> Audit
```

## Environment Configuration

### Environment Variables

```bash
# Development
export HUBSPOT_API_KEY="dev-key-xxx"
export CLAUDE_API_KEY="dev-key-yyy"
export MCP_PORT="3000"
export LOG_LEVEL="debug"
export ENVIRONMENT="development"

# Staging
export HUBSPOT_API_KEY="stage-key-xxx"
export CLAUDE_API_KEY="stage-key-yyy"
export MCP_PORT="3000"
export LOG_LEVEL="info"
export ENVIRONMENT="staging"

# Production
export HUBSPOT_API_KEY="prod-key-xxx"
export CLAUDE_API_KEY="prod-key-yyy"
export MCP_PORT="3000"
export LOG_LEVEL="warning"
export ENVIRONMENT="production"
export ENABLE_MONITORING="true"
export ENABLE_BACKUP="true"
```

### Cron Configuration

```cron
# Development (manual testing)
*/5 * * * * /path/to/agents/task_monitor.sh

# Staging (integration testing)
* * * * * /path/to/agents/task_monitor.sh
*/15 * * * * /path/to/scripts/health_check.sh

# Production (full automation)
* * * * * /path/to/agents/task_monitor.sh
*/5 * * * * /path/to/scripts/health_check.sh
*/10 * * * * /path/to/scripts/metrics_collector.sh
0 * * * * /path/to/scripts/log_rotation.sh
0 2 * * * /path/to/scripts/backup.sh
```

## Scaling Strategy

### Horizontal Scaling

```mermaid
graph TB
    subgraph "Scaling Triggers"
        CPU[CPU > 70%]
        Queue[Queue Length > 100]
        Response[Response Time > 2s]
    end
    
    subgraph "Scaling Actions"
        AddNode[Add Server Node]
        AddAgent[Add Agent Instance]
        AddMCP[Add MCP Instance]
    end
    
    subgraph "Scaling Limits"
        MaxNodes[Max Nodes: 10]
        MaxAgents[Max Agents: 50]
        MaxMCP[Max MCP: 20]
    end
    
    CPU --> AddAgent
    Queue --> AddNode
    Response --> AddMCP
    
    AddNode --> MaxNodes
    AddAgent --> MaxAgents
    AddMCP --> MaxMCP
```

### Vertical Scaling

| Component | Initial | Scale Up | Maximum |
|-----------|---------|----------|---------|
| CPU | 2 cores | 4 cores | 16 cores |
| RAM | 4 GB | 8 GB | 32 GB |
| Storage | 40 GB | 100 GB | 1 TB |
| Network | 100 Mbps | 1 Gbps | 10 Gbps |

### Auto-Scaling Rules

```yaml
AutoScaling:
  Metrics:
    - Name: CPU_Utilization
      Threshold: 70%
      Duration: 5 minutes
      Action: Scale Up
    
    - Name: Queue_Length
      Threshold: 100 tasks
      Duration: 2 minutes
      Action: Add Agent
    
    - Name: Response_Time
      Threshold: 2000ms
      Duration: 3 minutes
      Action: Add MCP Instance
  
  Cooldown:
    ScaleUp: 300 seconds
    ScaleDown: 600 seconds
  
  Limits:
    MinInstances: 1
    MaxInstances: 10
```

## Deployment Process

### CI/CD Pipeline

```mermaid
graph LR
    subgraph "Development"
        Code[Code Changes]
        Test[Local Tests]
        Commit[Git Commit]
    end
    
    subgraph "CI Pipeline"
        Build[Build]
        UnitTest[Unit Tests]
        IntTest[Integration Tests]
        Package[Package]
    end
    
    subgraph "CD Pipeline"
        DeployStage[Deploy Staging]
        TestStage[Test Staging]
        Approve[Manual Approval]
        DeployProd[Deploy Production]
    end
    
    Code --> Test
    Test --> Commit
    Commit --> Build
    Build --> UnitTest
    UnitTest --> IntTest
    IntTest --> Package
    Package --> DeployStage
    DeployStage --> TestStage
    TestStage --> Approve
    Approve --> DeployProd
```

### Deployment Scripts

```bash
#!/bin/bash
# deploy.sh - Deployment script

ENVIRONMENT=$1
VERSION=$2

# Pre-deployment checks
check_health() {
    curl -f http://localhost:3000/health || exit 1
}

# Backup current version
backup_current() {
    tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz ./
}

# Deploy new version
deploy() {
    git fetch origin
    git checkout $VERSION
    npm install
    pm2 restart all
}

# Post-deployment validation
validate() {
    sleep 10
    check_health
    run_smoke_tests
}

# Rollback on failure
rollback() {
    git checkout previous-version
    pm2 restart all
}

# Main deployment flow
backup_current
deploy || rollback
validate || rollback
```

## Monitoring & Operations

### Monitoring Stack

```mermaid
graph TB
    subgraph "Metrics Collection"
        AppMetrics[Application Metrics]
        SysMetrics[System Metrics]
        LogMetrics[Log Metrics]
    end
    
    subgraph "Processing"
        Prometheus[Prometheus<br/>Time-series DB]
        Loki[Loki<br/>Log aggregation]
        Jaeger[Jaeger<br/>Distributed tracing]
    end
    
    subgraph "Visualization"
        Grafana[Grafana<br/>Dashboards]
        Alerts[Alert Manager<br/>Notifications]
    end
    
    AppMetrics --> Prometheus
    SysMetrics --> Prometheus
    LogMetrics --> Loki
    
    Prometheus --> Grafana
    Loki --> Grafana
    Jaeger --> Grafana
    
    Grafana --> Alerts
```

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% |
| Response Time | < 1s | > 2s |
| Error Rate | < 1% | > 5% |
| Task Processing | < 2 min | > 5 min |
| API Rate Limit | < 80% | > 90% |
| CPU Usage | < 60% | > 80% |
| Memory Usage | < 70% | > 85% |
| Disk Usage | < 80% | > 90% |

### Operational Runbooks

```yaml
Runbooks:
  - Name: High CPU Usage
    Symptoms:
      - CPU > 80% for 5 minutes
      - Slow response times
    Actions:
      1. Check running processes
      2. Identify resource-heavy tasks
      3. Scale horizontally if needed
      4. Optimize problematic code
    
  - Name: API Rate Limiting
    Symptoms:
      - 429 errors from HubSpot
      - Task processing delays
    Actions:
      1. Check current API usage
      2. Implement backoff strategy
      3. Distribute load across time
      4. Request higher limits if needed
    
  - Name: Agent Failure
    Symptoms:
      - Tasks not being processed
      - Error logs showing crashes
    Actions:
      1. Check agent logs
      2. Restart failed agents
      3. Investigate root cause
      4. Deploy fix if needed
```

## Disaster Recovery

### Backup Strategy

```mermaid
graph TB
    subgraph "Backup Types"
        Config[Configuration<br/>Every commit]
        Logs[Logs<br/>Daily]
        Data[Data<br/>Hourly]
        System[System<br/>Weekly]
    end
    
    subgraph "Backup Locations"
        Local[Local Disk<br/>Immediate]
        Remote[Remote Storage<br/>S3/GCS]
        Offsite[Offsite<br/>Different region]
    end
    
    subgraph "Retention"
        Short[7 days<br/>Local]
        Medium[30 days<br/>Remote]
        Long[90 days<br/>Offsite]
    end
    
    Config --> Local
    Logs --> Remote
    Data --> Remote
    System --> Offsite
    
    Local --> Short
    Remote --> Medium
    Offsite --> Long
```

### Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Agent Crash | 1 min | 0 | Automatic restart via supervisor |
| Server Failure | 5 min | 1 min | Failover to secondary node |
| Data Corruption | 30 min | 1 hour | Restore from hourly backup |
| Complete Outage | 1 hour | 1 hour | Full system restore |
| Region Failure | 4 hours | 1 day | Deploy to new region |

### Failover Process

```mermaid
stateDiagram-v2
    [*] --> Monitoring: System Running
    Monitoring --> Detection: Failure Detected
    Detection --> Assessment: Evaluate Impact
    
    Assessment --> AutoFailover: Non-Critical
    Assessment --> ManualFailover: Critical
    
    AutoFailover --> Validation: Switch to Backup
    ManualFailover --> Approval: Get Approval
    Approval --> Validation: Execute Failover
    
    Validation --> Recovery: System Restored
    Recovery --> PostMortem: Analyze Cause
    PostMortem --> [*]: Normal Operations
```

---

## Related Documents

- [System Context](./system-context.md) - System overview
- [Container Architecture](./container-architecture.md) - Application containers
- [Component Diagrams](./component-diagrams.md) - Component details
- [Data Flow Diagrams](./data-flow.md) - Data movement

[⬆️ Back to top](#-table-of-contents)

---

[⬅️ Component Diagrams](./component-diagrams.md) | [⬆️ Diagrams](./index.md) | [➡️ Data Flow](./data-flow.md)