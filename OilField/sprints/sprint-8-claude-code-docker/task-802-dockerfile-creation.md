# Task 802: Claude Code Dockerfile Creation

## Status
- **State**: Not Started
- **Priority**: Critical
- **Estimated Time**: 1 hour
- **Depends On**: Task 801 (OAuth Token)

## Objective

Create optimized Dockerfile for Claude Code CLI with proper authentication, minimal image size, and production-ready configuration.

## Implementation

### File: `docker/claude-code/Dockerfile`

```dockerfile
# Claude Code Docker Image
# Base: Node.js 20 Alpine (lightweight)
FROM node:20-alpine

# Metadata
LABEL maintainer="OilField Dev Team"
LABEL description="Claude Code CLI with subscription OAuth authentication"
LABEL version="1.0.0"

# Install dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git \
    ca-certificates

# Create non-root user for security
RUN addgroup -g 1000 claude && \
    adduser -D -u 1000 -G claude claude

# Install Claude Code CLI
RUN curl -fsSL https://downloads.claude.ai/cli/install.sh | sh

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER claude

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD claude --version || exit 1

# Default command (keep container running)
CMD ["tail", "-f", "/dev/null"]
```

### File: `docker/claude-code/entrypoint.sh`

```bash
#!/bin/bash
set -e

# Verify environment variables
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ]; then
    echo "❌ ERROR: CLAUDE_CODE_OAUTH_TOKEN not set"
    echo "📝 Generate token with: claude setup-token"
    exit 1
fi

# Verify token format
if [[ ! "$CLAUDE_CODE_OAUTH_TOKEN" =~ ^sk-ant-oat01- ]]; then
    echo "❌ ERROR: Invalid OAuth token format"
    echo "📝 Token should start with: sk-ant-oat01-"
    exit 1
fi

echo "✅ Claude Code OAuth token detected"
echo "📊 Starting Claude Code container..."

# Execute command
exec "$@"
```

### File: `docker/claude-code/.dockerignore`

```
.git
.env
.env.local
node_modules
dist
build
*.log
.DS_Store
```

## Testing

```bash
# Build image
docker build -t oilfield-claude-code docker/claude-code/

# Test without token (should fail gracefully)
docker run --rm oilfield-claude-code claude --version

# Test with token
docker run --rm \
  -e CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN}" \
  oilfield-claude-code \
  claude --version
```

## Acceptance Criteria

- [ ] Dockerfile builds successfully
- [ ] Image size < 500MB
- [ ] Non-root user (claude:1000)
- [ ] Health check configured
- [ ] Entrypoint validates token
- [ ] Claude Code CLI installed and working

## Next Steps

Proceed to Task 803 (Docker Compose Integration)
