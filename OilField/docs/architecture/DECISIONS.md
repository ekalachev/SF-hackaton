# Architecture Decision Record (ADR)

## Overview
This document tracks important technical decisions made during the hackathon.

## Template for New Decisions
```
### [Number]. [Title]
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated
**Decision Makers:** [Names]

**Context:**
What is the issue we're trying to solve?

**Decision:**
What did we decide to do?

**Consequences:**
What becomes easier or harder as a result?

**Alternatives Considered:**
What other options did we consider?
```

## Decisions

### 1. Project Structure
**Date:** 2025-10-31
**Status:** Accepted
**Decision Makers:** Team

**Context:**
Need to organize code for a full-stack hackathon project.

**Decision:**
Monorepo structure with separate frontend, backend, and shared directories.

**Consequences:**
- Easy to share types and constants
- Clear separation of concerns
- Simple to navigate during rapid development

**Alternatives Considered:**
- Separate repositories (too complex for hackathon)
- Mixed frontend/backend in same directory (harder to manage)
