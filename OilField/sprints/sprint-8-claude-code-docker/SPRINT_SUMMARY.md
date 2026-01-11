# Sprint 8: Claude Code Docker Integration - Quick Summary

## Overview
Set up Claude Code CLI in Docker containers using subscription OAuth authentication ($200/month) instead of expensive pay-as-you-go API.

## Total Estimated Time: ~8.5 hours (6 hours core + 2.5 hours optional)

## Task Breakdown

| # | Task | Time | Status |
|---|------|------|--------|
| 801 | OAuth Token Generation & Secure Storage | 30 min | Not Started |
| 802 | Claude Code Dockerfile Creation | 1 hour | Not Started |
| 803 | Docker Compose Integration | 1 hour | Not Started |
| 804 | Volume Mounting Strategy | 45 min | Not Started |
| 805 | Authentication Verification | 30 min | Not Started |
| 806 | Token Refresh Automation | 1 hour | Not Started |
| 807 | Usage Scripts & CLI Wrappers | 1 hour | Not Started |
| 808 | Security Audit & Best Practices | 45 min | Not Started |
| 809 | Documentation & Examples | 1 hour | Not Started |
| 810 | CI/CD Integration (Optional) | 1.5 hours | Not Started |

## Key Files to Create/Modify

```
OilField/
├── .env.example                    # NEW - Template (safe to commit)
├── .env                            # NEW - Actual secrets (git-ignored)
├── .gitignore                      # UPDATE - Add .env
├── docker/
│   └── claude-code/
│       ├── Dockerfile              # NEW - Claude Code image
│       └── entrypoint.sh           # NEW - Startup script
├── docker-compose.yml              # UPDATE - Add claude-code service
├── scripts/
│   ├── claude-docker.sh            # NEW - Wrapper script
│   ├── refresh-claude-token.sh     # NEW - Token refresh
│   └── verify-claude-auth.sh       # NEW - Auth verification
└── docs/
    └── claude-code-docker.md       # NEW - Usage guide
```

## Critical Implementation Points

### 1. Authentication Flow
```
Host Machine:
1. Run: claude setup-token
2. Browser opens → Authenticate
3. Copy token: sk-ant-oat01-...
4. Save to .env: CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...

Docker Container:
5. Reads env var: CLAUDE_CODE_OAUTH_TOKEN
6. Authenticates with subscription
7. Verify with: /status
8. Should show subscription, NOT API key
```

### 2. Environment Variables (CRITICAL!)
```bash
# .env (NEVER commit to git!)
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...  # ✅ Use this (subscription)

# DON'T USE THIS:
# ANTHROPIC_API_KEY=sk-ant-api03-...      # ❌ Pay-as-you-go (expensive!)
```

### 3. Docker Compose Service
```yaml
services:
  claude-code:
    build: ./docker/claude-code
    container_name: oilfield-claude-code
    environment:
      - CLAUDE_CODE_OAUTH_TOKEN=${CLAUDE_CODE_OAUTH_TOKEN}
    volumes:
      - .:/workspace                        # Project files
      - ~/.claude:/home/node/.claude:ro     # Settings (optional)
    command: tail -f /dev/null              # Keep running
```

### 4. Usage Examples
```bash
# Interactive mode
docker exec -it oilfield-claude-code claude

# Non-interactive (headless)
docker exec oilfield-claude-code claude "Review backend code for bugs"

# Specific file
docker exec oilfield-claude-code claude --prompt "Explain MapView.tsx"
```

## Success Criteria

### Core Functionality
- ✅ Docker container builds successfully (<2 min)
- ✅ Claude Code authenticates with subscription
- ✅ `/status` shows subscription account (NOT API key)
- ✅ Can access project files via volume mount
- ✅ No API charges incurred (100% subscription usage)

### Security
- ✅ No secrets committed to git
- ✅ `.env` properly git-ignored
- ✅ Git history scanned for leaks
- ✅ Token passed only via environment variables
- ✅ Volume mounts read-only where possible

### Automation
- ✅ Token refresh script works
- ✅ CLI wrapper simplifies usage
- ✅ Error handling for expired tokens
- ✅ Documentation complete

## Cost Savings

**API Pricing** (Pay-As-You-Go):
- Input: ~$15 per million tokens
- Output: ~$75 per million tokens
- Typical session: $2-5

**Subscription** (Claude Max):
- $200/month unlimited usage
- Break-even: ~40-100 sessions/month
- **Potential savings: $1000s/month**

## Phase 1: Core (Tasks 801-805) - 3.5 hours

**Goal**: Get Claude Code running in Docker with subscription

**Priority**: Critical

**Tasks**:
1. Generate OAuth token (`claude setup-token`)
2. Create secure storage (`.env`, `.gitignore`)
3. Build Dockerfile with Claude Code installer
4. Add service to `docker-compose.yml`
5. Configure volume mounts
6. Verify authentication works

## Phase 2: Automation (Tasks 806-807) - 2 hours

**Goal**: Streamline token management and usage

**Priority**: High

**Tasks**:
7. Token refresh automation (cron/script)
8. CLI wrapper scripts for common operations

## Phase 3: Hardening (Tasks 808-809) - 1.75 hours

**Goal**: Production-ready security and docs

**Priority**: High

**Tasks**:
9. Security audit and best practices
10. Comprehensive documentation

## Phase 4: CI/CD (Task 810) - 1.5 hours

**Goal**: Enable automated workflows

**Priority**: Optional

**Tasks**:
11. GitHub Actions integration

## Known Issues & Workarounds

### Issue 1: Token Expiration (~6 hours)
- **Problem**: OAuth tokens expire after ~6 hours
- **Solution**: Automated refresh script (Task 806)

### Issue 2: Authentication Prompts
- **Problem**: Container may still prompt for auth (GitHub #8938)
- **Workaround**: Mount entire `~/.claude` directory (read-write)

### Issue 3: No Browser in Container
- **Problem**: Interactive OAuth needs browser
- **Solution**: Generate token on host, pass via env var

## Verification Checklist

After completing sprint:

```bash
# 1. Container is running
docker ps | grep claude-code

# 2. Can execute Claude
docker exec oilfield-claude-code claude --version

# 3. Authentication works
docker exec -it oilfield-claude-code claude
# Then in prompt: /status
# Should show: "Authenticated as: user@example.com (Claude Max)"
# NOT: "API Key: sk-ant-api03-..."

# 4. Project access works
docker exec oilfield-claude-code ls -la /workspace

# 5. No secrets in git
git log --all --source --full-history -- .env
# Should be empty

# 6. .gitignore working
git status | grep .env
# Should not appear in untracked files
```

## Quick Start (After Sprint)

```bash
# 1. Generate token (one-time)
claude setup-token
# Copy the sk-ant-oat01-... token

# 2. Create .env file
echo "CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-YOUR-TOKEN-HERE" > .env

# 3. Start container
docker compose up -d claude-code

# 4. Use Claude Code
docker exec -it oilfield-claude-code claude
```

## Resources

- Main README: `sprints/sprint-8-claude-code-docker/README.md`
- Task 801: OAuth Token Generation
- Task 802: Dockerfile Creation
- Task 803: Docker Compose Integration

---

**Ready to start?** Begin with Task 801 (OAuth Token Generation & Secure Storage)
