# Sprint 8: Claude Code Docker Integration

## Overview

Integrate Claude Code CLI into Docker containers using subscription-based OAuth authentication to enable AI-assisted development workflows within the containerized development environment.

**Priority**: High
**Estimated Time**: ~6-8 hours
**Dependencies**: Claude Pro/Max subscription ($200/month)
**Risk Level**: Medium (authentication complexity, token expiration)

## Business Value

### Why This Matters

1. **Consistent Development Environment**: All team members use identical Claude Code setup
2. **CI/CD Integration**: Enable automated code review and generation in pipelines
3. **Cost Efficiency**: Use $200/month subscription instead of expensive pay-as-you-go API
4. **Isolated Execution**: Run Claude Code safely in containers with controlled permissions
5. **Reproducible Workflows**: Standardize AI-assisted development across environments

### Cost Savings

- **API Pricing**: ~$15 per million input tokens, $75 per million output tokens
- **Subscription**: $200/month unlimited usage (Claude Max)
- **Potential Savings**: $1000s/month for heavy usage
- **Break-even**: ~20-30 API calls per day

## Sprint Goals

1. ✅ Generate long-lived OAuth token from Claude subscription
2. ✅ Create secure token storage and management system
3. ✅ Build Claude Code Docker image with proper authentication
4. ✅ Integrate with existing docker-compose.yml infrastructure
5. ✅ Implement volume mounting for project access
6. ✅ Create token refresh automation
7. ✅ Document usage patterns and best practices
8. ✅ Verify subscription billing (not pay-as-you-go)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Host Machine                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Generate OAuth Token (claude setup-token)        │   │
│  │     Output: sk-ant-oat01-...                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. Store in .env (git-ignored)                      │   │
│  │     CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Docker Container                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Claude Code CLI                                     │   │
│  │  - Reads CLAUDE_CODE_OAUTH_TOKEN env var            │   │
│  │  - Authenticates with subscription                  │   │
│  │  - Accesses project via volume mount                │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Volume Mounts                                       │   │
│  │  - /workspace → Project files                        │   │
│  │  - ~/.claude → Settings/history (optional)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Task Breakdown

| # | Task | Time | Priority | Depends On |
|---|------|------|----------|------------|
| 801 | OAuth Token Generation & Secure Storage | 30 min | Critical | - |
| 802 | Claude Code Dockerfile Creation | 1 hour | Critical | 801 |
| 803 | Docker Compose Integration | 1 hour | Critical | 802 |
| 804 | Volume Mounting Strategy | 45 min | High | 803 |
| 805 | Authentication Verification | 30 min | High | 804 |
| 806 | Token Refresh Automation | 1 hour | Medium | 805 |
| 807 | Usage Scripts & CLI Wrappers | 1 hour | Medium | 805 |
| 808 | Security Audit & Best Practices | 45 min | High | 801-807 |
| 809 | Documentation & Examples | 1 hour | Medium | 801-808 |
| 810 | CI/CD Integration (Optional) | 1.5 hours | Low | 806 |

**Total Estimated Time**: ~8.5 hours (6 hours core + 2.5 hours optional)

## Phase 1: Core Setup (Tasks 801-805) - ~3.5 hours

**Goal**: Get Claude Code running in Docker with subscription auth

### Success Criteria
- ✅ OAuth token generated and stored securely
- ✅ Docker image builds successfully
- ✅ Container starts and authenticates
- ✅ `/status` command shows subscription account (not API)
- ✅ Can access project files via volume mount

## Phase 2: Automation (Tasks 806-807) - ~2 hours

**Goal**: Streamline token management and usage

### Success Criteria
- ✅ Token refresh script works automatically
- ✅ CLI wrapper scripts simplify common operations
- ✅ Error handling for expired tokens

## Phase 3: Hardening (Tasks 808-809) - ~1.75 hours

**Goal**: Production-ready security and documentation

### Success Criteria
- ✅ No secrets in git history
- ✅ Proper .gitignore entries
- ✅ Security scan passes
- ✅ Complete usage documentation
- ✅ Example workflows documented

## Phase 4: CI/CD (Task 810) - ~1.5 hours (Optional)

**Goal**: Enable automated workflows in pipelines

### Success Criteria
- ✅ GitHub Actions workflow configured
- ✅ Secret management in CI
- ✅ Automated code review on PRs

## Implementation Details

### Technology Stack

- **Container**: Docker 20.10+
- **Base Image**: node:20-alpine (lightweight)
- **Claude Code**: Latest via official installer
- **Orchestration**: Docker Compose v2
- **Secrets**: .env file (local), GitHub Secrets (CI)

### Authentication Flow

```typescript
// Pseudocode
1. Host: claude setup-token
   → Opens browser
   → User authenticates
   → Returns: sk-ant-oat01-xxxxx

2. Host: Save to .env
   CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-xxxxx

3. Docker: Load from environment
   ENV CLAUDE_CODE_OAUTH_TOKEN=${CLAUDE_CODE_OAUTH_TOKEN}

4. Claude Code: Authenticate
   Uses token → Verifies subscription → Authenticated!

5. Verification: /status
   Shows: "Authenticated as: user@example.com (Claude Max)"
   NOT: "API Key: sk-ant-api03-..."
```

### Volume Strategy

**Option A: Project Only (Recommended for CI/CD)**
```yaml
volumes:
  - .:/workspace  # Just the project
```

**Option B: Project + Settings (Better for dev)**
```yaml
volumes:
  - .:/workspace
  - ~/.claude:/home/node/.claude:ro  # Read-only settings
```

**Option C: Full Access (Most features, less secure)**
```yaml
volumes:
  - .:/workspace
  - ~/.claude:/home/node/.claude:rw  # Read-write settings
```

## Key Files to Create/Modify

```
OilField/
├── .env.example                          # Template (safe to commit)
├── .env                                  # Actual secrets (git-ignored)
├── .gitignore                            # Add .env
├── docker/
│   └── claude-code/
│       ├── Dockerfile                    # Claude Code image
│       └── entrypoint.sh                 # Startup script
├── docker-compose.yml                    # Add claude-code service
├── scripts/
│   ├── claude-docker.sh                  # Wrapper script
│   ├── refresh-claude-token.sh           # Token refresh
│   └── verify-claude-auth.sh             # Auth verification
└── docs/
    └── claude-code-docker.md             # Usage guide
```

## Security Considerations

### Critical Rules

1. **NEVER commit tokens to git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template
   - Scan git history for leaked tokens

2. **NEVER use ANTHROPIC_API_KEY**
   - Only use `CLAUDE_CODE_OAUTH_TOKEN`
   - Verify with `/status` command

3. **Token expiration handling**
   - Tokens expire every ~6 hours
   - Implement automatic refresh
   - Graceful degradation on expiry

4. **Principle of least privilege**
   - Read-only volume mounts where possible
   - Minimal container permissions
   - Network isolation

### Security Checklist

- [ ] `.env` in `.gitignore`
- [ ] No secrets in Dockerfile
- [ ] Token passed via environment variables only
- [ ] Git history scanned for leaks
- [ ] Volume mounts read-only where possible
- [ ] Container runs as non-root user
- [ ] Network access restricted
- [ ] Token rotation automated

## Known Issues & Workarounds

### Issue 1: Token Expiration (~6 hours)

**Problem**: OAuth tokens expire after ~6 hours
**Workaround**:
```bash
# Automated refresh script
*/5 * * * * /path/to/refresh-claude-token.sh
```

### Issue 2: Authentication Prompts in Container

**Problem**: GitHub issue #8938 - occasional auth failures
**Workarounds**:
1. Mount entire `~/.claude` directory (read-write)
2. Regenerate token with `claude setup-token`
3. Restart container

### Issue 3: No Browser in Container

**Problem**: Interactive OAuth flow requires browser
**Solution**: Generate token on host, pass to container via environment

## Testing Strategy

### Unit Tests
- Token validation functions
- Environment variable parsing
- Secret masking in logs

### Integration Tests
- Container build succeeds
- Authentication works
- Project files accessible
- `/status` shows subscription

### E2E Tests
- Full workflow: token → build → run → verify
- Token refresh automation
- Error scenarios (expired, invalid)

## Success Metrics

### Technical
- ✅ Docker build time < 2 minutes
- ✅ Container startup time < 10 seconds
- ✅ Authentication success rate > 95%
- ✅ Token refresh success rate > 99%

### Business
- ✅ Zero API charges (100% subscription usage)
- ✅ Developer productivity: 2x faster with Claude in Docker
- ✅ Consistent environment across team

## Rollout Plan

### Phase 1: Local Development (Week 1)
- Single developer testing
- Iterate on Dockerfile
- Refine volume strategy

### Phase 2: Team Rollout (Week 2)
- Share token securely (1Password, etc.)
- Document setup process
- Train team on usage

### Phase 3: CI/CD (Week 3)
- Integrate with GitHub Actions
- Automated code review
- Pre-commit hooks

## Future Enhancements (Not in Sprint)

- Multiple Claude accounts (team vs. personal)
- Token rotation with 1Password API
- Claude Code as a service (API wrapper)
- Metrics and usage tracking
- Multi-region token distribution

## Resources

### Official Documentation
- [Claude Code Quickstart](https://docs.claude.com/en/docs/claude-code/quickstart)
- [Claude Code Settings](https://docs.claude.com/en/docs/claude-code/configuration-options/settings)

### Community Projects
- [claude-code-yolo](https://github.com/thevibeworks/claude-code-yolo)
- [claude-docker](https://github.com/VishalJ99/claude-docker)
- [claude-code-sdk-docker](https://github.com/cabinlab/claude-code-sdk-docker)

### Related Issues
- [GitHub #8938](https://github.com/anthropics/claude-code/issues/8938) - OAuth token authentication
- [GitHub #1736](https://github.com/anthropics/claude-code/issues/1736) - Docker re-authentication

---

**Ready to start?** Begin with Task 801 (OAuth Token Generation)
