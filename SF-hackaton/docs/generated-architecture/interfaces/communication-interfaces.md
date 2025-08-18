[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Generated Architecture](../index.md)

---

# Communication Interfaces Documentation

**Author:** AI Analysis Engine  
**Generated:** 2025-08-18  
**Version:** 1.0.0  

## 📑 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Discovered Interfaces](#discovered-interfaces)
3. [External API Interfaces](#external-api-interfaces)
4. [Shell Command Interfaces](#shell-command-interfaces)
5. [Browser Automation Interfaces](#browser-automation-interfaces)
6. [File System Interfaces](#file-system-interfaces)
7. [Process Communication](#process-communication)
8. [Configuration Interfaces](#configuration-interfaces)
9. [Interface Matrix](#interface-matrix)
10. [Related Documents](#related-documents)

---

## Executive Summary

The SF-hackaton codebase implements a distributed AI agent swarm architecture using HubSpot CRM as the central message bus. The system leverages multiple communication interfaces including REST APIs, shell scripts, browser automation, and file-based configuration.

### Key Findings
- **Primary Protocol:** REST API (HubSpot API v3)
- **Secondary Protocol:** Shell script orchestration
- **Automation Layer:** Puppeteer browser control
- **Configuration:** JSON-based static files
- **No Traditional Databases:** All persistence through HubSpot CRM
- **No Message Queues:** HubSpot Tasks serve as queue mechanism

---

## Discovered Interfaces

### Interface Classification Summary

| Category | Count | Primary Technology | Communication Model |
|----------|-------|-------------------|-------------------|
| External APIs | 2 | REST/HTTP | Request-Response |
| Shell Commands | 8 | Bash/CLI | Fire-and-Forget |
| Browser Automation | 1 | Puppeteer/CDP | Event-Driven |
| File I/O | 6 | JSON/Shell | Static Configuration |
| Process IPC | 3 | Unix Pipes | Stream-Based |
| Environment Config | 4 | Shell Variables | Static |

---

## External API Interfaces

### 1. HubSpot CRM API

**Location:** `/agents/hubspot_api_helper.sh`

```yaml
interface:
  name: HubSpot CRM API
  type: REST API
  version: v3
  base_url: https://api.hubapi.com
  
  authentication:
    type: Bearer Token
    header: Authorization
    format: "Bearer ${HUBSPOT_ACCESS_TOKEN}"
    
  endpoints:
    - path: /crm/v3/objects/contacts
      methods: [GET, POST, PATCH]
      description: Contact management
      
    - path: /crm/v3/objects/tasks
      methods: [GET, POST, PATCH]
      description: Task queue operations
      
    - path: /engagements/v1/engagements
      methods: [POST]
      description: Email sending
      
  data_format:
    request: application/json
    response: application/json
    
  error_handling:
    format: JSON error responses
    retry: Not implemented
    
  rate_limiting:
    limit: 100 requests/10 seconds
    strategy: Not handled in code
```

### 2. Model Context Protocol (MCP) Server

**Location:** `/config/mcp_hubspot_config.json`

```yaml
interface:
  name: MCP HubSpot Server
  type: RPC-style interface
  transport: Node.js process communication
  
  servers:
    hubspot:
      command: npx
      args: ["@modelcontextprotocol/server-hubspot"]
      capabilities:
        - contacts
        - tasks
        - emails
        - workflows
        
    puppeteer:
      command: npx
      args: ["@modelcontextprotocol/server-puppeteer"]
      
  communication:
    model: Request-Response
    format: JSON-RPC style
    async: true
```

---

## Shell Command Interfaces

### 3. Claude Engineering CLI

**Location:** Multiple agent scripts

```yaml
interface:
  name: Claude Engineering CLI
  type: Command Line Interface
  executable: ~/claude-eng
  
  usage_pattern: |
    ~/claude-eng --mcp-config <config_path> --print "<prompt>"
    
  parameters:
    --mcp-config: Path to MCP configuration
    --print: Natural language prompt
    --mcp: Direct MCP server selection
    
  input: Natural language prompts
  output: Structured text/JSON
  
  examples:
    - ~/claude-eng --mcp hubspot --print "list contacts"
    - ~/claude-eng --mcp-config .mcp.json --print "create task"
```

### 4. Git Command Interface

**Location:** `/scripts/python/analysis/analyze_repo.py`

```yaml
interface:
  name: Git Repository Interface
  type: Shell command execution
  
  commands:
    - git log --format="<format_string>"
    - git show --stat <commit_hash>
    - git show --numstat <commit_hash>
    
  execution:
    method: subprocess.run()
    shell: true
    capture_output: true
    
  data_flow:
    input: Git commands
    output: Parsed stdout text
    error_handling: Try-catch with stderr capture
```

---

## Browser Automation Interfaces

### 5. Puppeteer Browser Control

**Location:** `/scripts/js/demo/hubspot-puppeteer-helper.js`

```yaml
interface:
  name: Puppeteer Browser Automation
  type: Chrome DevTools Protocol
  
  operations:
    navigate:
      function: mcp__puppeteer__puppeteer_navigate
      params:
        url: string
        launchOptions: object
        
    fill:
      function: mcp__puppeteer__puppeteer_fill
      params:
        selector: CSS selector
        value: string
        
    click:
      function: mcp__puppeteer__puppeteer_click
      params:
        selector: CSS selector
        
    evaluate:
      function: mcp__puppeteer__puppeteer_evaluate
      params:
        script: JavaScript code
        
  security:
    credentials_in_code: true (SECURITY ISSUE)
    storage: None (credentials hardcoded)
```

---

## File System Interfaces

### 6. JSON Configuration Files

**Location:** `/config/` directory

```yaml
interface:
  name: Static Configuration
  type: File-based configuration
  
  files:
    - name: mcp_hubspot_config.json
      purpose: MCP server configuration
      format: JSON
      
    - name: task_templates.json
      purpose: Task creation templates
      format: JSON
      
    - name: workflow_triggers.json
      purpose: Workflow automation rules
      format: JSON
      
    - name: task_assignment_rules.json
      purpose: Agent task routing
      format: JSON
      
  access_pattern:
    read: At startup/runtime
    write: Manual updates only
    watch: No file watching
```

### 7. Log File Interface

**Location:** `/logs/` directory

```yaml
interface:
  name: Logging System
  type: File append
  
  files:
    - path: logs/task_monitor.log
      format: Plain text with timestamps
      
    - path: logs/lead_qualifier.log
      format: Plain text with timestamps
      
    - path: logs/cron.log
      format: Cron execution logs
      
  pattern: "$(date): <message> >> $LOG_FILE"
  rotation: None implemented
  retention: Manual cleanup required
```

---

## Process Communication

### 8. Shell Script Orchestration

**Location:** `/agents/` directory

```yaml
interface:
  name: Agent Process Communication
  type: Shell script invocation
  
  pattern:
    parent: task_monitor.sh
    children:
      - lead_qualifier.sh
      - data_enricher.sh
      - outreach_agent.sh
      - web_enricher.sh
      
  data_passing:
    method: Command line arguments
    format: 
      - $1: Task ID
      - $2: Task data (JSON)
      
  execution:
    async: Background processes (&)
    wait: No process waiting
    error_handling: Exit codes
```

### 9. Cron Job Interface

**Location:** System cron

```yaml
interface:
  name: Scheduled Task Execution
  type: Unix cron
  
  schedule: "* * * * *" (every minute)
  command: /path/to/task_monitor.sh
  
  environment:
    source: ~/.zshrc
    variables: Inherited from shell
    
  logging:
    stdout: >> logs/cron.log
    stderr: 2>&1
```

---

## Configuration Interfaces

### 10. Environment Variables

**Location:** Shell scripts

```yaml
interface:
  name: Environment Configuration
  type: Shell environment variables
  
  required_vars:
    HUBSPOT_ACCESS_TOKEN:
      type: string
      format: pat-na-xxxxx
      source: Manual export or .zshrc
      
    HUBSPOT_PORTAL_ID:
      type: string
      source: Manual configuration
      
    AGENT_USER:
      type: string
      default: AI-Agents
      source: config/agent_identity.sh
      
  loading:
    method: source ~/.zshrc
    timing: Script initialization
```

---

## Interface Matrix

### Communication Flow Matrix

| From Component | To Component | Interface Type | Protocol | Data Format |
|---------------|--------------|---------------|----------|-------------|
| task_monitor.sh | HubSpot API | REST API | HTTPS | JSON |
| Agents | claude-eng CLI | Shell Exec | Process | Text/JSON |
| claude-eng | MCP Server | IPC | Node.js | JSON-RPC |
| MCP Server | HubSpot API | REST API | HTTPS | JSON |
| Puppeteer | Chrome Browser | CDP | WebSocket | JSON |
| Cron | task_monitor.sh | Process | Fork/Exec | None |
| Scripts | Log Files | File I/O | Append | Text |

### Security Considerations

| Interface | Authentication | Encryption | Risk Level | Mitigation Needed |
|-----------|---------------|------------|------------|-------------------|
| HubSpot API | Bearer Token | TLS | Medium | Token rotation |
| MCP Server | None | None | Low | Local only |
| Puppeteer | Hardcoded creds | None | HIGH | Secure storage |
| Shell Scripts | None | None | Medium | File permissions |
| Log Files | None | None | Low | Access control |

---

## Related Documents

- [Protocol Analysis](./protocol-analysis.md) - Detailed protocol specifications
- [Integration Points](./integration-points.md) - External system integrations
- [System Architecture](../../architecture/SYSTEM_ARCHITECTURE.md) - Overall architecture
- [Component Interactions](../../architecture/COMPONENT_INTERACTIONS.md) - Component details

---

[⬅️ Generated Architecture](../index.md) | [⬆️ Top](#communication-interfaces-documentation) | [➡️ Protocol Analysis](./protocol-analysis.md)