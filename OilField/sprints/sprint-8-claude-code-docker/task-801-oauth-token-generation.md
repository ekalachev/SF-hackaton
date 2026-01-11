# Task 801: OAuth Token Generation & Secure Storage

## Status
- **State**: Not Started
- **Priority**: Critical
- **Estimated Time**: 30 minutes
- **Assigned To**: TBD
- **Depends On**: None (First task)

## Objective

Generate a long-lived OAuth authentication token from Claude subscription and implement secure storage system to enable Docker container authentication without exposing secrets.

## Requirements

### Functional
- Generate OAuth token using `claude setup-token` command
- Store token securely in `.env` file (git-ignored)
- Create `.env.example` template for team
- Update `.gitignore` to prevent secret leakage
- Verify token format and validity
- Document token lifecycle and refresh process

### Non-Functional
- Token must be stored encrypted at rest (OS handles this)
- No token exposure in logs or console output
- Git history must be clean (no committed secrets)
- `.env` file permissions: 600 (owner read/write only)

## Implementation Steps

### Step 1: Generate OAuth Token

Run the token generation command and capture output:

```bash
# On host machine (NOT in Docker)
claude setup-token
```

**Expected Output:**
1. Browser opens for authentication
2. User authenticates with Claude.ai credentials
3. Token is generated and displayed
4. Format: `sk-ant-oat01-[long-random-string]`

**Save this token securely** - you'll need it for all subsequent tasks.

### Step 2: Create .env File

Create `.env` in project root:

```bash
# File: .env (NEVER commit to git!)

# Claude Code OAuth Token (Subscription-based)
# Generated: 2025-11-03
# Expires: ~6 hours (auto-refresh recommended)
# Account: user@example.com (Claude Max - $200/month)
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-YOUR-TOKEN-HERE

# IMPORTANT: DO NOT USE ANTHROPIC_API_KEY
# That would use expensive pay-as-you-go API instead of subscription!

# Project-specific configuration
PROJECT_NAME=OilField
CLAUDE_WORKSPACE=/workspace
```

**File Permissions:**
```bash
chmod 600 .env  # Owner read/write only
```

### Step 3: Create .env.example Template

Create `.env.example` (safe to commit):

```bash
# File: .env.example

# Claude Code OAuth Token (Subscription-based)
# Generate your token with: claude setup-token
# DO NOT commit the actual .env file!
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-REPLACE_WITH_YOUR_TOKEN

# Project Configuration
PROJECT_NAME=OilField
CLAUDE_WORKSPACE=/workspace
```

### Step 4: Update .gitignore

Add to `.gitignore`:

```bash
# Claude Code Secrets
.env
.env.local
.env.*.local

# Claude Code OAuth tokens (backup location)
.claude-token
claude-oauth.txt
```

### Step 5: Verify Git Ignores .env

```bash
# Test that .env is ignored
echo "test" > .env
git status

# Should NOT appear in:
# - Untracked files
# - Changes to be committed
# - Changes not staged for commit

# Clean up test
rm .env
```

### Step 6: Scan Git History for Leaked Secrets

```bash
# Check if any tokens were ever committed
git log --all --source --full-history -- .env
git grep -i "sk-ant-oat" $(git rev-list --all)
git grep -i "CLAUDE_CODE_OAUTH_TOKEN" $(git rev-list --all)

# Should return empty results
```

### Step 7: Create Token Verification Script

Create `scripts/verify-claude-token.sh`:

```bash
#!/bin/bash
# Verify Claude OAuth token format and environment setup

set -e

echo "🔍 Verifying Claude Code OAuth Token Setup..."

# Check .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "📝 Run: claude setup-token"
    echo "📝 Then create .env with: CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-..."
    exit 1
fi

# Check .env permissions
PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
if [ "$PERMS" != "600" ]; then
    echo "⚠️  .env permissions should be 600, found: $PERMS"
    echo "🔧 Fixing permissions..."
    chmod 600 .env
fi

# Load .env
source .env

# Check token format
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ]; then
    echo "❌ CLAUDE_CODE_OAUTH_TOKEN not set in .env"
    exit 1
fi

if [[ ! "$CLAUDE_CODE_OAUTH_TOKEN" =~ ^sk-ant-oat01- ]]; then
    echo "❌ Invalid token format. Should start with: sk-ant-oat01-"
    echo "📝 Run: claude setup-token to generate valid OAuth token"
    exit 1
fi

# Check token length (should be ~100+ characters)
TOKEN_LEN=${#CLAUDE_CODE_OAUTH_TOKEN}
if [ $TOKEN_LEN -lt 50 ]; then
    echo "❌ Token too short ($TOKEN_LEN chars). Seems invalid."
    exit 1
fi

# Verify not using API key by mistake
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  WARNING: ANTHROPIC_API_KEY is set!"
    echo "⚠️  This will use expensive pay-as-you-go API instead of subscription"
    echo "🔧 Unset it with: unset ANTHROPIC_API_KEY"
fi

# Check .gitignore
if ! grep -q ".env" .gitignore; then
    echo "❌ .env not in .gitignore!"
    echo "🔧 Adding to .gitignore..."
    echo -e "\n# Claude Code Secrets\n.env\n.env.local\n.env.*.local" >> .gitignore
fi

echo "✅ OAuth token setup verified"
echo "📊 Token format: ${CLAUDE_CODE_OAUTH_TOKEN:0:20}... ($(($TOKEN_LEN - 20)) more chars)"
echo "🔒 Permissions: $PERMS"
echo "✅ Ready for Docker integration"
```

Make it executable:
```bash
chmod +x scripts/verify-claude-token.sh
```

## Testing

### Manual Verification

```bash
# 1. Generate token
claude setup-token
# Copy the sk-ant-oat01-... token

# 2. Create .env
cat > .env << EOF
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-paste-your-token-here
PROJECT_NAME=OilField
CLAUDE_WORKSPACE=/workspace
EOF

# 3. Set permissions
chmod 600 .env

# 4. Verify setup
./scripts/verify-claude-token.sh

# Expected output:
# ✅ OAuth token setup verified
# 📊 Token format: sk-ant-oat01-AbCdEf... (80 more chars)
# 🔒 Permissions: 600
# ✅ Ready for Docker integration

# 5. Verify git ignores it
git status | grep .env
# Should NOT appear

# 6. Verify .env.example is trackable
git add .env.example
git status
# Should appear in "Changes to be committed"
```

### Automated Tests

Create `scripts/test-token-setup.sh`:

```bash
#!/bin/bash
# Automated tests for token setup

set -e

echo "Running token setup tests..."

# Test 1: .env exists
if [ -f .env ]; then
    echo "✅ Test 1: .env file exists"
else
    echo "❌ Test 1 FAILED: .env file missing"
    exit 1
fi

# Test 2: .env has correct permissions
PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
if [ "$PERMS" = "600" ]; then
    echo "✅ Test 2: .env permissions correct (600)"
else
    echo "❌ Test 2 FAILED: .env permissions incorrect ($PERMS)"
    exit 1
fi

# Test 3: Token is set
source .env
if [ -n "$CLAUDE_CODE_OAUTH_TOKEN" ]; then
    echo "✅ Test 3: OAuth token is set"
else
    echo "❌ Test 3 FAILED: OAuth token not set"
    exit 1
fi

# Test 4: Token format is correct
if [[ "$CLAUDE_CODE_OAUTH_TOKEN" =~ ^sk-ant-oat01- ]]; then
    echo "✅ Test 4: Token format correct"
else
    echo "❌ Test 4 FAILED: Invalid token format"
    exit 1
fi

# Test 5: .gitignore contains .env
if grep -q "^\.env$" .gitignore; then
    echo "✅ Test 5: .env in .gitignore"
else
    echo "❌ Test 5 FAILED: .env not in .gitignore"
    exit 1
fi

# Test 6: No secrets in git history
if git log --all --oneline -- .env | grep -q "."; then
    echo "❌ Test 6 FAILED: .env found in git history!"
    exit 1
else
    echo "✅ Test 6: No secrets in git history"
fi

echo ""
echo "✅ All tests passed!"
echo "Token is ready for use in Docker containers"
```

## Acceptance Criteria

- [ ] `claude setup-token` executed successfully
- [ ] OAuth token generated (format: `sk-ant-oat01-...`)
- [ ] `.env` file created with token
- [ ] `.env` file permissions set to 600
- [ ] `.env.example` template created (safe to commit)
- [ ] `.gitignore` updated to exclude `.env`
- [ ] Git history verified clean (no committed secrets)
- [ ] `verify-claude-token.sh` script created and passing
- [ ] `test-token-setup.sh` automated tests passing
- [ ] `ANTHROPIC_API_KEY` environment variable NOT set
- [ ] Token format validated (starts with `sk-ant-oat01-`)
- [ ] Token length verified (>50 characters)
- [ ] Documentation updated with token generation process

## Security Checklist

- [ ] Token never logged to console (masked in scripts)
- [ ] Token never committed to git
- [ ] `.env` file has restrictive permissions (600)
- [ ] `.env.example` contains no real secrets
- [ ] Git history scanned for leaks
- [ ] Team members know NOT to commit `.env`
- [ ] Backup token stored securely (1Password, etc.)
- [ ] Token expiration (6 hours) documented
- [ ] Refresh process documented

## Documentation

Add to project README:

```markdown
## Claude Code Docker Setup

### Prerequisites

- Claude subscription (Pro, Max, Team, or Enterprise)
- Docker installed and running
- Git repository access

### 1. Generate OAuth Token

\`\`\`bash
# One-time setup - generates token for your subscription
claude setup-token
\`\`\`

This opens your browser for authentication and returns a token like:
`sk-ant-oat01-...`

### 2. Configure Environment

\`\`\`bash
# Copy example and add your token
cp .env.example .env
nano .env  # Add your token

# Set secure permissions
chmod 600 .env
\`\`\`

### 3. Verify Setup

\`\`\`bash
./scripts/verify-claude-token.sh
\`\`\`

**IMPORTANT**: Never commit `.env` to git! It contains your authentication token.
```

## Troubleshooting

### Issue: "Token invalid or expired"
**Solution**: Regenerate token with `claude setup-token`

### Issue: "ANTHROPIC_API_KEY detected"
**Solution**: `unset ANTHROPIC_API_KEY` to avoid API charges

### Issue: ".env appears in git status"
**Solution**: Ensure `.gitignore` contains `.env` and run `git rm --cached .env`

### Issue: "Permission denied reading .env"
**Solution**: `chmod 600 .env` to set correct permissions

## Next Steps

After completing this task:
- ✅ Proceed to Task 802 (Dockerfile Creation)
- Token will be used in Docker container via environment variable
- Never expose token in Dockerfile or docker-compose.yml directly

## Resources

- [Claude Code Quickstart](https://docs.claude.com/en/docs/claude-code/quickstart)
- [Managing API Keys in Claude Code](https://support.claude.com/en/articles/12304248)
- [Docker Secrets Best Practices](https://docs.docker.com/engine/swarm/secrets/)
