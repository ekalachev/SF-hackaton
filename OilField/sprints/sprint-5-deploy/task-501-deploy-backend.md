# Task 501: Deploy Backend with Docker Compose

## References
- `docker-compose.yml` - Root Docker Compose configuration
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Infrastructure setup
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "10. Deployment Architecture" lines 833-874

## Objective
Deploy Express backend locally using Docker Compose with PostgreSQL.

## Acceptance Criteria
- [ ] Docker Compose file updated with backend service
- [ ] Backend Dockerfile created
- [ ] PostgreSQL service running (already in docker-compose.yml)
- [ ] Environment variables configured for Docker
- [ ] Migrations run in Docker container
- [ ] Seeds run in Docker container
- [ ] Backend accessible via http://localhost:3001
- [ ] Health check endpoint responding

## Implementation Steps

### 1. Create Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

### 2. Update docker-compose.yml
Add backend service to root `docker-compose.yml`:
```yaml
services:
  postgres:
    # ... existing postgres service ...

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: oilfield-backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://oilfield:oilfield_dev@postgres:5432/oilfield
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
```

### 3. Run Deployment
```bash
# From project root
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate:latest

# Run seeds
docker-compose exec backend npm run seed

# Verify backend is running
docker-compose ps
```

## Verification
```bash
# Check containers are running
docker-compose ps

# Test health endpoint (if exists)
curl http://localhost:3001/health

# Test wells API
curl http://localhost:3001/api/wells | jq '.wells | length'
# Should return wells data

# Check backend logs
docker-compose logs backend

# Test database connection
docker-compose exec postgres psql -U oilfield -d oilfield -c "SELECT COUNT(*) FROM wells;"
```

## Environment Variables
Backend container environment:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://oilfield:oilfield_dev@postgres:5432/oilfield
CORS_ORIGIN=http://localhost:5173
```

## Troubleshooting
```bash
# Rebuild backend if needed
docker-compose up -d --build backend

# View backend logs
docker-compose logs -f backend

# Shell into backend container
docker-compose exec backend sh

# Reset and restart
docker-compose down
docker-compose up -d
```

## Time Estimate
25 minutes (Docker setup + testing)
