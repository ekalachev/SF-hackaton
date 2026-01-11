# Task 803: Docker Compose Integration

## Status
- **State**: Not Started
- **Priority**: Critical
- **Estimated Time**: 1 hour
- **Depends On**: Task 802 (Dockerfile)

## Objective

Integrate Claude Code service into existing `docker-compose.yml` with proper networking, volume mounts, and environment configuration.

## Implementation

### Update: `docker-compose.yml`

```yaml
services:
  # ... existing services (postgres, backend, frontend) ...

  # Claude Code AI Assistant Service
  claude-code:
    build:
      context: ./docker/claude-code
      dockerfile: Dockerfile
    container_name: oilfield-claude-code
    restart: unless-stopped

    # Environment variables
    environment:
      - CLAUDE_CODE_OAUTH_TOKEN=${CLAUDE_CODE_OAUTH_TOKEN}
      - PROJECT_NAME=OilField
      - CLAUDE_WORKSPACE=/workspace

    # Volume mounts
    volumes:
      # Project root (read-write for code generation)
      - .:/workspace

      # Claude settings (optional, read-only)
      - ~/.claude:/home/claude/.claude:ro

      # Git config for commits
      - ~/.gitconfig:/home/claude/.gitconfig:ro

    # Network configuration
    networks:
      - oilfield-network

    # Health check
    healthcheck:
      test: ["CMD", "claude", "--version"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M

networks:
  oilfield-network:
    driver: bridge
```

## Testing

```bash
# Start service
docker compose up -d claude-code

# Check status
docker compose ps claude-code

# View logs
docker compose logs -f claude-code

# Test authentication
docker compose exec claude-code claude
# Then run: /status
# Should show subscription account

# Test project access
docker compose exec claude-code ls -la /workspace
```

## Acceptance Criteria

- [ ] Service starts successfully
- [ ] Health check passes
- [ ] Authentication works (subscription)
- [ ] Project files accessible
- [ ] Network connectivity established

## Next Steps

Proceed to Task 804 (Volume Mounting Strategy)
