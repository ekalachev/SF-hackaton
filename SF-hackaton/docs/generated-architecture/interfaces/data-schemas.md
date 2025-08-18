[🏠 Home](../../../README.md) | [📚 Documentation](../../index.md) | [🏗️ Generated Architecture](../index.md)

---

# Data Schemas Documentation

**Author:** AI Analysis Engine  
**Generated:** 2025-08-18  
**Version:** 1.0.0  

## 📑 Table of Contents
1. [Executive Summary](#executive-summary)
2. [HubSpot CRM Data Schemas](#hubspot-crm-data-schemas)
3. [Agent Communication Schemas](#agent-communication-schemas)
4. [Configuration Data Schemas](#configuration-data-schemas)
5. [Lead Processing Schemas](#lead-processing-schemas)
6. [Task Management Schemas](#task-management-schemas)
7. [Enrichment Data Schemas](#enrichment-data-schemas)
8. [Outreach Schemas](#outreach-schemas)
9. [Log Format Schemas](#log-format-schemas)
10. [Validation Rules](#validation-rules)
11. [Schema Evolution](#schema-evolution)
12. [Related Documents](#related-documents)

---

## Executive Summary

The SF-hackaton system utilizes well-defined data schemas for seamless communication between AI agents, HubSpot CRM, and browser automation components. The schemas emphasize consistency, extensibility, and clear data lineage for sales automation workflows.

### Key Schema Categories
- **CRM Objects:** HubSpot contacts, tasks, engagements
- **Agent Data:** Lead qualification, enrichment results  
- **Configuration:** Task templates, workflow triggers
- **Communication:** MCP messages, CLI responses
- **Logging:** Structured audit trails

---

## HubSpot CRM Data Schemas

### Contact Object Schema

**Source:** HubSpot API v3 `/crm/v3/objects/contacts`  
**Usage:** Core entity for lead management

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HubSpot Contact Object",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "HubSpot unique contact identifier"
    },
    "properties": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "description": "Primary contact email"
        },
        "firstname": {
          "type": "string",
          "description": "Contact first name"
        },
        "lastname": {
          "type": "string", 
          "description": "Contact last name"
        },
        "company": {
          "type": "string",
          "description": "Company name"
        },
        "jobtitle": {
          "type": "string",
          "description": "Job title/position"
        },
        "phone": {
          "type": "string",
          "description": "Phone number"
        },
        "website": {
          "type": "string",
          "format": "uri",
          "description": "Company website URL"
        },
        "lead_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "description": "AI-generated lead qualification score"
        },
        "lead_tier": {
          "type": "string",
          "enum": ["HOT", "WARM", "COLD"],
          "description": "Lead temperature classification"
        },
        "lead_qualification_date": {
          "type": "string",
          "format": "date-time",
          "description": "ISO8601 timestamp of qualification"
        },
        "lead_qualification_notes": {
          "type": "string",
          "description": "AI qualification reasoning"
        },
        "company_size": {
          "type": "string",
          "description": "Estimated company size category"
        },
        "industry": {
          "type": "string",
          "description": "Industry classification"
        },
        "linkedin_profile": {
          "type": "string",
          "format": "uri",
          "description": "LinkedIn profile URL"
        },
        "decision_maker_score": {
          "type": "number",
          "minimum": 1,
          "maximum": 10,
          "description": "Decision making authority score"
        },
        "data_enrichment_date": {
          "type": "string",
          "format": "date-time",
          "description": "Last data enrichment timestamp"
        },
        "data_quality": {
          "type": "string",
          "enum": ["HIGH", "MEDIUM", "LOW"],
          "description": "Data completeness assessment"
        },
        "enrichment_notes": {
          "type": "string",
          "description": "Data enrichment process notes"
        },
        "last_outreach_date": {
          "type": "string",
          "format": "date-time",
          "description": "Last outreach attempt timestamp"
        },
        "outreach_status": {
          "type": "string",
          "enum": ["CONTACTED", "PENDING", "RESPONDED", "BOUNCED"],
          "description": "Current outreach status"
        },
        "next_follow_up": {
          "type": "string",
          "format": "date-time",
          "description": "Scheduled follow-up date"
        }
      },
      "required": ["email"]
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Record creation timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time", 
      "description": "Last update timestamp"
    },
    "associations": {
      "type": "object",
      "properties": {
        "companies": {
          "type": "array",
          "items": {"type": "string"}
        },
        "deals": {
          "type": "array", 
          "items": {"type": "string"}
        }
      }
    }
  },
  "required": ["id", "properties"]
}
```

### Task Object Schema

**Source:** HubSpot API v3 `/crm/v3/objects/tasks`  
**Usage:** Agent workflow coordination

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HubSpot Task Object",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "HubSpot unique task identifier"
    },
    "properties": {
      "type": "object",
      "properties": {
        "hs_task_subject": {
          "type": "string",
          "description": "Task title/subject",
          "examples": [
            "Qualify Lead: John Doe",
            "Send Outreach - HOT Lead: Jane Smith",
            "Enrich Data: Acme Corp Contact"
          ]
        },
        "hs_task_body": {
          "type": "string",
          "description": "Detailed task description"
        },
        "hs_task_status": {
          "type": "string",
          "enum": ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "WAITING", "DEFERRED"],
          "description": "Current task status"
        },
        "hs_task_priority": {
          "type": "string",
          "enum": ["HIGH", "MEDIUM", "LOW"],
          "description": "Task priority level"
        },
        "hs_task_type": {
          "type": "string",
          "enum": ["TODO", "EMAIL", "CALL", "MEETING"],
          "description": "Task category"
        },
        "hs_task_assigned_to": {
          "type": "string",
          "description": "Assignee user ID or name"
        },
        "hs_task_due_date": {
          "type": "string",
          "format": "date-time",
          "description": "Task due date"
        }
      },
      "required": ["hs_task_subject", "hs_task_status"]
    },
    "associations": {
      "type": "object",
      "properties": {
        "contacts": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Associated contact IDs"
        },
        "companies": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Associated company IDs"
        }
      }
    }
  },
  "required": ["id", "properties"]
}
```

### Engagement Object Schema

**Source:** HubSpot Engagements API `/engagements/v1/engagements`  
**Usage:** Activity tracking and email logging

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HubSpot Engagement Object",
  "type": "object",
  "properties": {
    "engagement": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "active": {"type": "boolean"},
        "type": {
          "type": "string",
          "enum": ["EMAIL", "NOTE", "TASK", "CALL", "MEETING"]
        },
        "timestamp": {"type": "number", "description": "Unix timestamp"}
      }
    },
    "associations": {
      "type": "object",
      "properties": {
        "contactIds": {
          "type": "array",
          "items": {"type": "number"}
        },
        "companyIds": {
          "type": "array",
          "items": {"type": "number"}
        },
        "dealIds": {
          "type": "array",
          "items": {"type": "number"}
        },
        "ownerIds": {
          "type": "array",
          "items": {"type": "number"}
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Type-specific metadata",
      "oneOf": [
        {
          "title": "Email Metadata",
          "properties": {
            "from": {
              "type": "object",
              "properties": {
                "email": {"type": "string", "format": "email"},
                "firstName": {"type": "string"},
                "lastName": {"type": "string"}
              }
            },
            "to": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "email": {"type": "string", "format": "email"}
                }
              }
            },
            "subject": {"type": "string"},
            "html": {"type": "string", "description": "HTML email body"}
          }
        },
        {
          "title": "Note Metadata",
          "properties": {
            "body": {"type": "string", "description": "Note content"}
          }
        }
      ]
    }
  }
}
```

---

## Agent Communication Schemas

### Agent Task Input Schema

**Source:** Shell script parameters across `/agents/` directory  
**Usage:** Standardized agent invocation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agent Task Input",
  "type": "object",
  "properties": {
    "taskId": {
      "type": "string",
      "description": "HubSpot task ID for processing"
    },
    "taskData": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "subject": {"type": "string"},
        "status": {
          "type": "string",
          "enum": ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "WAITING"]
        },
        "contactIds": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Associated contact IDs"
        },
        "companyIds": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Associated company IDs"
        },
        "priority": {
          "type": "string",
          "enum": ["HIGH", "MEDIUM", "LOW"]
        },
        "notes": {"type": "string"}
      },
      "required": ["id", "subject", "status"]
    }
  },
  "required": ["taskId", "taskData"]
}
```

### Claude Engineering Response Schema

**Source:** Claude CLI responses across agent scripts  
**Usage:** Structured AI responses

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Claude Engineering Response",
  "type": "object",
  "oneOf": [
    {
      "title": "Confirmation Response",
      "type": "string",
      "enum": ["OK", "COMPLETED", "SUCCESS"]
    },
    {
      "title": "Structured Data Response",
      "type": "object",
      "description": "Context-specific structured data"
    },
    {
      "title": "Error Response",
      "type": "object",
      "properties": {
        "error": {"type": "string"},
        "details": {"type": "string"},
        "recoverable": {"type": "boolean"}
      }
    }
  ]
}
```

---

## Configuration Data Schemas

### MCP Configuration Schema

**Source:** `/config/mcp_hubspot_config.json`  
**Usage:** MCP server setup and capabilities

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MCP Configuration",
  "type": "object",
  "properties": {
    "mcp_servers": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z0-9_]+$": {
          "type": "object",
          "properties": {
            "command": {"type": "string"},
            "args": {
              "type": "array",
              "items": {"type": "string"}
            },
            "env": {
              "type": "object",
              "patternProperties": {
                "^[A-Z_]+$": {"type": "string"}
              }
            },
            "capabilities": {
              "type": "object",
              "properties": {
                "contacts": {"type": "boolean"},
                "tasks": {"type": "boolean"},
                "emails": {"type": "boolean"},
                "workflows": {"type": "boolean"}
              }
            }
          },
          "required": ["command", "args"]
        }
      }
    },
    "puppeteer": {
      "type": "object",
      "properties": {
        "command": {"type": "string"},
        "args": {
          "type": "array",
          "items": {"type": "string"}
        },
        "env": {
          "type": "object",
          "properties": {
            "PUPPETEER_EXECUTABLE_PATH": {
              "type": "string",
              "description": "Path to Chrome executable"
            }
          }
        }
      }
    },
    "ai_agents": {
      "type": "object",
      "properties": {
        "assignee": {"type": "string"},
        "email": {"type": "string", "format": "email"}
      }
    },
    "task_prefixes": {
      "type": "object",
      "properties": {
        "qualify": {"type": "string"},
        "outreach": {"type": "string"},
        "enrich": {"type": "string"},
        "followup": {"type": "string"}
      }
    }
  },
  "required": ["mcp_servers"]
}
```

### Task Templates Schema

**Source:** `/config/task_templates.json`  
**Usage:** Standardized task creation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Task Templates Configuration",
  "type": "object",
  "properties": {
    "task_templates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Template identifier"
          },
          "queue": {
            "type": "string",
            "description": "Assignment queue name"
          },
          "assignee": {
            "type": "string",
            "description": "Default assignee"
          },
          "priority": {
            "type": "string",
            "enum": ["HIGH", "NORMAL", "LOW"]
          },
          "template": {
            "type": "string",
            "description": "Template string with placeholders",
            "pattern": ".*\\{[a-z_]+\\}.*"
          }
        },
        "required": ["name", "queue", "assignee", "priority", "template"]
      }
    }
  },
  "required": ["task_templates"]
}
```

### Workflow Triggers Schema

**Source:** `/config/workflow_triggers.json`  
**Usage:** Automated workflow configuration

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Workflow Triggers Configuration",
  "type": "object",
  "properties": {
    "workflows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "trigger": {
            "type": "string",
            "enum": [
              "contact_created",
              "form_submitted",
              "lead_score_above_70",
              "lead_score_above_85"
            ]
          },
          "action": {
            "type": "string",
            "enum": ["create_task", "send_email", "update_contact"]
          },
          "task_type": {
            "type": "string",
            "description": "Type of task to create"
          },
          "assignee": {
            "type": "string",
            "description": "Task assignee"
          },
          "due_in_minutes": {
            "type": "number",
            "minimum": 1,
            "description": "Minutes until task is due"
          }
        },
        "required": ["trigger", "action", "assignee"]
      }
    }
  },
  "required": ["workflows"]
}
```

### AI Agent User Schema

**Source:** `/config/ai_agents_user.json`  
**Usage:** Agent identity and permissions

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AI Agent User Configuration",
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "email": {"type": "string", "format": "email"},
        "firstName": {"type": "string"},
        "lastName": {"type": "string"},
        "role": {"type": "string"},
        "permissions": {
          "type": "object",
          "properties": {
            "contacts": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["read", "write", "delete"]
              }
            },
            "tasks": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["read", "write", "complete"]
              }
            },
            "emails": {
              "type": "array", 
              "items": {
                "type": "string",
                "enum": ["send", "read"]
              }
            },
            "workflows": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["trigger", "read"]
              }
            },
            "activities": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["create", "read"]
              }
            }
          }
        }
      },
      "required": ["email", "firstName", "lastName", "permissions"]
    },
    "api_settings": {
      "type": "object",
      "properties": {
        "rate_limit": {
          "type": "number",
          "minimum": 1
        },
        "concurrent_tasks": {
          "type": "number",
          "minimum": 1
        },
        "retry_attempts": {
          "type": "number",
          "minimum": 0
        },
        "timeout_seconds": {
          "type": "number",
          "minimum": 1
        }
      }
    },
    "task_assignment": {
      "type": "object",
      "properties": {
        "default_queue": {"type": "string"},
        "auto_accept": {"type": "boolean"},
        "priority_handling": {
          "type": "string",
          "enum": ["FIFO", "LIFO", "PRIORITY"]
        },
        "max_tasks_per_minute": {
          "type": "number",
          "minimum": 1
        }
      }
    }
  },
  "required": ["user", "api_settings", "task_assignment"]
}
```

---

## Lead Processing Schemas

### Lead Qualification Result Schema

**Source:** `/agents/lead_qualifier.sh` output  
**Usage:** Standardized qualification results

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Lead Qualification Result",
  "type": "object",
  "properties": {
    "score": {
      "type": "number",
      "minimum": 1,
      "maximum": 100,
      "description": "Composite qualification score"
    },
    "tier": {
      "type": "string",
      "enum": ["HOT", "WARM", "COLD"],
      "description": "Lead temperature classification"
    },
    "reasoning": {
      "type": "string",
      "description": "Human-readable scoring rationale"
    },
    "next_action": {
      "type": "string",
      "description": "Recommended next step"
    },
    "contact_name": {
      "type": "string",
      "description": "Full contact name"
    },
    "company_name": {
      "type": "string",
      "description": "Company name"
    },
    "title": {
      "type": "string",
      "description": "Job title"
    },
    "scoring_breakdown": {
      "type": "object",
      "properties": {
        "title_score": {"type": "number"},
        "company_size_score": {"type": "number"},
        "industry_score": {"type": "number"},
        "completeness_score": {"type": "number"},
        "engagement_score": {"type": "number"}
      }
    }
  },
  "required": ["score", "tier", "reasoning", "next_action", "contact_name"]
}
```

### Lead Qualification Criteria Schema

**Source:** `/agents/lead_qualifier.sh` scoring logic  
**Usage:** Standardized scoring criteria

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Lead Qualification Criteria",
  "type": "object",
  "properties": {
    "title_scoring": {
      "type": "object",
      "properties": {
        "C-level": {"type": "number", "const": 30},
        "VP": {"type": "number", "const": 25},
        "Director": {"type": "number", "const": 20},
        "Manager": {"type": "number", "const": 15},
        "other": {"type": "number", "const": 5}
      }
    },
    "company_size_scoring": {
      "type": "object",
      "properties": {
        "Enterprise (1000+)": {"type": "number", "const": 25},
        "Mid-market (100-999)": {"type": "number", "const": 20},
        "SMB (<100)": {"type": "number", "const": 15}
      }
    },
    "industry_scoring": {
      "type": "object",
      "properties": {
        "Tech/SaaS": {"type": "number", "const": 20},
        "Finance": {"type": "number", "const": 15},
        "Other B2B": {"type": "number", "const": 10},
        "B2C": {"type": "number", "const": 5}
      }
    },
    "completeness_scoring": {
      "type": "object",
      "properties": {
        "Email": {"type": "number", "const": 10},
        "Phone": {"type": "number", "const": 5},
        "LinkedIn": {"type": "number", "const": 5},
        "Company website": {"type": "number", "const": 5}
      }
    },
    "engagement_scoring": {
      "type": "object",
      "properties": {
        "Recent website visit": {"type": "number", "const": 10},
        "Email opens": {"type": "number", "const": 5},
        "Form submission": {"type": "number", "const": 15}
      }
    },
    "tier_thresholds": {
      "type": "object",
      "properties": {
        "HOT": {"type": "number", "const": 80},
        "WARM": {"type": "number", "const": 50}
      }
    }
  }
}
```

---

## Task Management Schemas

### Task Assignment Rules Schema

**Source:** `/config/task_assignment_rules.json`  
**Usage:** Automated task routing

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Task Assignment Rules",
  "type": "object",
  "properties": {
    "rules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "condition": {
            "type": "string",
            "description": "Boolean expression for rule matching",
            "examples": [
              "task_type == 'Qualify Lead'",
              "lead_score > 85",
              "company_size == 'Enterprise'"
            ]
          },
          "assignee": {
            "type": "string",
            "description": "Target assignee for matching tasks"
          },
          "auto_accept": {
            "type": "boolean",
            "description": "Whether to auto-accept assignment"
          },
          "escalation": {
            "type": "string",
            "enum": ["immediate", "delayed", "none"],
            "description": "Escalation strategy"
          },
          "priority_boost": {
            "type": "number",
            "description": "Priority adjustment (-10 to +10)"
          }
        },
        "required": ["condition", "assignee", "auto_accept"]
      }
    }
  },
  "required": ["rules"]
}
```

### Task Monitor Query Schema

**Source:** `/agents/task_monitor.sh` HubSpot queries  
**Usage:** Task discovery and filtering

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Task Monitor Query",
  "type": "object",
  "properties": {
    "filter_criteria": {
      "type": "object",
      "properties": {
        "status": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["NOT_STARTED", "WAITING"]
          }
        },
        "subject_contains": {
          "type": "array",
          "items": {"type": "string"},
          "examples": ["Qualify Lead", "Send Outreach", "Enrich Data"]
        },
        "assignee": {
          "type": "string",
          "const": "AI-Agents"
        }
      }
    },
    "response_format": {
      "type": "object",
      "properties": {
        "fields": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["id", "subject", "status", "contactIds", "companyIds"]
          }
        },
        "format": {
          "type": "string",
          "enum": ["JSON"]
        }
      }
    }
  }
}
```

---

## Enrichment Data Schemas

### Data Enrichment Result Schema

**Source:** `/agents/data_enricher.sh` output  
**Usage:** Structured enrichment results

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Data Enrichment Result",
  "type": "object",
  "properties": {
    "contact_name": {"type": "string"},
    "email": {"type": "string", "format": "email"},
    "company_name": {"type": "string"},
    "company_website": {"type": "string", "format": "uri"},
    "enriched_data": {
      "type": "object",
      "properties": {
        "verified_title": {
          "type": "string",
          "description": "LinkedIn-verified job title"
        },
        "company_size": {
          "type": "string",
          "enum": ["Startup (1-10)", "Small (11-50)", "Medium (51-200)", "Large (201-1000)", "Enterprise (1000+)"]
        },
        "industry": {
          "type": "string",
          "description": "Industry classification"
        },
        "technologies": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Technology stack identified"
        },
        "recent_news": {
          "type": "string",
          "description": "Recent company updates"
        },
        "linkedin_profile": {
          "type": "string",
          "format": "uri",
          "description": "Contact LinkedIn URL"
        },
        "decision_maker_score": {
          "type": "number",
          "minimum": 1,
          "maximum": 10,
          "description": "Decision making authority assessment"
        },
        "enrichment_quality": {
          "type": "string",
          "enum": ["HIGH", "MEDIUM", "LOW"],
          "description": "Data quality assessment"
        }
      },
      "required": ["enrichment_quality"]
    },
    "data_gaps": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Missing data fields identified"
    },
    "recommended_action": {
      "type": "string",
      "description": "Next step recommendation based on enrichment"
    },
    "enrichment_sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "source": {"type": "string"},
          "confidence": {"type": "number", "minimum": 0, "maximum": 1},
          "last_updated": {"type": "string", "format": "date-time"}
        }
      }
    }
  },
  "required": ["contact_name", "email", "enriched_data", "data_gaps", "recommended_action"]
}
```

### Web Scraping Schema

**Source:** `/agents/web_enricher.sh` and `/agents/data_enricher.sh`  
**Usage:** Browser automation results

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Web Scraping Result",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Source URL"
    },
    "scrape_timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "success": {"type": "boolean"},
    "extracted_data": {
      "type": "object",
      "properties": {
        "company_description": {"type": "string"},
        "industry_sector": {"type": "string"},
        "key_products": {
          "type": "array",
          "items": {"type": "string"}
        },
        "contact_info": {
          "type": "object",
          "properties": {
            "phone": {"type": "string"},
            "email": {"type": "string", "format": "email"},
            "address": {"type": "string"}
          }
        },
        "team_size_indicators": {
          "type": "array",
          "items": {"type": "string"}
        },
        "technology_stack": {
          "type": "array",
          "items": {"type": "string"}
        },
        "social_links": {
          "type": "object",
          "properties": {
            "linkedin": {"type": "string", "format": "uri"},
            "twitter": {"type": "string", "format": "uri"},
            "facebook": {"type": "string", "format": "uri"}
          }
        }
      }
    },
    "screenshot": {
      "type": "object",
      "properties": {
        "path": {"type": "string"},
        "size": {"type": "number"},
        "format": {"type": "string", "enum": ["png", "jpg"]}
      }
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string"},
          "message": {"type": "string"},
          "recoverable": {"type": "boolean"}
        }
      }
    }
  },
  "required": ["url", "scrape_timestamp", "success"]
}
```

---

## Outreach Schemas

### Outreach Content Schema

**Source:** `/agents/outreach_agent.sh` output  
**Usage:** Generated outreach messages

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Outreach Content",
  "type": "object",
  "properties": {
    "email_subject": {
      "type": "string",
      "maxLength": 100,
      "description": "Compelling subject line"
    },
    "email_body": {
      "type": "string",
      "description": "Personalized HTML email body"
    },
    "follow_up_days": {
      "type": "number",
      "minimum": 1,
      "maximum": 30,
      "description": "Days until follow-up"
    },
    "contact_name": {
      "type": "string",
      "description": "Recipient full name"
    },
    "company_name": {
      "type": "string",
      "description": "Recipient company"
    },
    "personalization_notes": {
      "type": "string",
      "description": "What made this message personalized"
    },
    "priority_context": {
      "type": "string",
      "enum": ["HIGH", "MEDIUM", "LOW"],
      "description": "Priority-based messaging strategy"
    },
    "call_to_action": {
      "type": "string",
      "description": "Primary CTA used"
    },
    "template_used": {
      "type": "string",
      "description": "Base template identifier"
    }
  },
  "required": ["email_subject", "email_body", "follow_up_days", "contact_name", "personalization_notes"]
}
```

### Outreach Priority Templates Schema

**Source:** `/agents/outreach_agent.sh` logic  
**Usage:** Priority-based message templates

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Outreach Priority Templates",
  "type": "object",
  "properties": {
    "HIGH": {
      "type": "object",
      "properties": {
        "strategy": {"type": "string", "const": "Direct, value-focused message requesting a meeting this week"},
        "tone": {"type": "string", "const": "Urgent, confident"},
        "cta": {"type": "string", "const": "Book meeting this week"},
        "follow_up_days": {"type": "number", "const": 3}
      }
    },
    "MEDIUM": {
      "type": "object", 
      "properties": {
        "strategy": {"type": "string", "const": "Educational content with soft CTA for discovery call"},
        "tone": {"type": "string", "const": "Helpful, consultative"},
        "cta": {"type": "string", "const": "Schedule discovery call"},
        "follow_up_days": {"type": "number", "const": 7}
      }
    },
    "LOW": {
      "type": "object",
      "properties": {
        "strategy": {"type": "string", "const": "Nurture content with helpful resources"},
        "tone": {"type": "string", "const": "Educational, patient"},
        "cta": {"type": "string", "const": "Download resource or connect"},
        "follow_up_days": {"type": "number", "const": 14}
      }
    }
  }
}
```

---

## Log Format Schemas

### Agent Log Entry Schema

**Source:** Log files across `/logs/` directory  
**Usage:** Structured logging format

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agent Log Entry",
  "type": "object",
  "properties": {
    "timestamp": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$",
      "description": "YYYY-MM-DD HH:MM:SS format"
    },
    "level": {
      "type": "string",
      "enum": ["INFO", "ERROR", "WARN", "DEBUG"],
      "description": "Log level"
    },
    "agent": {
      "type": "string",
      "enum": ["TaskMonitor", "LeadQualifier", "DataEnricher", "OutreachAgent"],
      "description": "Source agent"
    },
    "message": {
      "type": "string",
      "description": "Log message content"
    },
    "task_id": {
      "type": "string",
      "description": "Associated task ID (optional)"
    },
    "contact_id": {
      "type": "string", 
      "description": "Associated contact ID (optional)"
    },
    "context": {
      "type": "object",
      "description": "Additional context data"
    }
  },
  "required": ["timestamp", "agent", "message"]
}
```

### Task Monitor Log Schema

**Source:** `/logs/task_monitor.log`  
**Usage:** Task processing audit trail

```text
# Log format pattern:
YYYY-MM-DD HH:MM:SS: [ACTION] TaskMonitor: Description with task_id=X

# Examples:
2025-12-07 10:30:45: [INFO] TaskMonitor: Starting task monitor scan...
2025-12-07 10:30:46: [PROCESS] TaskMonitor: Processing task 12345: Qualify Lead: John Doe
2025-12-07 10:30:47: [DISPATCH] TaskMonitor: Dispatching to lead_qualifier.sh for task 12345
2025-12-07 10:30:48: [COMPLETE] TaskMonitor: Task monitor scan completed
```

---

## Validation Rules

### Data Validation Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Data Validation Rules",
  "type": "object",
  "properties": {
    "email_validation": {
      "type": "object",
      "properties": {
        "pattern": {"type": "string", "const": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"},
        "required": {"type": "boolean", "const": true},
        "max_length": {"type": "number", "const": 254}
      }
    },
    "score_validation": {
      "type": "object",
      "properties": {
        "min": {"type": "number", "const": 1},
        "max": {"type": "number", "const": 100},
        "type": {"type": "string", "const": "integer"}
      }
    },
    "tier_validation": {
      "type": "object",
      "properties": {
        "enum": {
          "type": "array",
          "items": {"type": "string"},
          "const": ["HOT", "WARM", "COLD"]
        },
        "case_sensitive": {"type": "boolean", "const": true}
      }
    },
    "task_status_validation": {
      "type": "object",
      "properties": {
        "enum": {
          "type": "array",
          "items": {"type": "string"},
          "const": ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "WAITING", "DEFERRED"]
        },
        "transitions": {
          "type": "object",
          "properties": {
            "NOT_STARTED": ["IN_PROGRESS", "WAITING"],
            "IN_PROGRESS": ["COMPLETED", "WAITING", "DEFERRED"],
            "WAITING": ["IN_PROGRESS", "DEFERRED"],
            "COMPLETED": [],
            "DEFERRED": ["NOT_STARTED", "IN_PROGRESS"]
          }
        }
      }
    }
  }
}
```

---

## Schema Evolution

### Current Version (v1.0)
- **HubSpot Objects:** Standard CRM fields with custom lead scoring
- **Agent Communication:** JSON command-line parameters
- **Configuration:** Static JSON files
- **Logging:** Plain text with timestamps

### Planned Evolution (v2.0)

```yaml
schema_improvements:
  versioning:
    - Add $schema field to all data structures
    - Implement semantic versioning
    - Backward compatibility validation
    
  extensions:
    - Multi-language support for outreach
    - Advanced scoring algorithms
    - Real-time validation hooks
    - Schema migration tools
    
  standardization:
    - Adopt JSON Schema 2020-12
    - OpenAPI 3.1 for REST APIs
    - GraphQL schema for complex queries
    - Avro schemas for high-volume data
```

### Migration Strategy

1. **Phase 1:** Add schema validation to existing data
2. **Phase 2:** Implement versioned schemas with migration
3. **Phase 3:** Real-time schema validation
4. **Phase 4:** Schema-driven code generation

---

## Related Documents

- [API Contracts](./api-contracts.md) - API interface specifications
- [Integration Points](./integration-points.md) - External system integration
- [Protocols](./protocols.md) - Communication protocol details
- [Component Interactions](../components/interaction-sequences.md) - Data flow patterns

---

[⬅️ API Contracts](./api-contracts.md) | [⬆️ Top](#data-schemas-documentation) | [➡️ Integration Points](./integration-points.md)