# Task 502: Deploy Frontend with Docker

## References
- `docker-compose.yml` - Root Docker Compose configuration
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Infrastructure setup
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Deployment lines 841-843

## Objective
Deploy React frontend locally using Docker or Vite dev server.

## Acceptance Criteria
- [ ] Frontend Dockerfile created (for production build)
- [ ] Docker Compose service added for frontend
- [ ] Environment variables configured (.env.local)
- [ ] `VITE_API_URL` points to http://localhost:3001
- [ ] `VITE_MAPBOX_TOKEN` configured
- [ ] Build succeeds
- [ ] Site accessible via http://localhost:5173 (dev) or http://localhost:8080 (production)
- [ ] Map loads correctly

## Implementation Steps

### Option A: Development Server (Recommended for local testing)

1. **Create .env.local**
Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=<your-mapbox-token>
```

2. **Run Dev Server**
```bash
cd frontend
npm run dev
# Accessible at http://localhost:5173
```

### Option B: Docker Production Build

1. **Create Frontend Dockerfile**
Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

2. **Create nginx.conf**
Create `frontend/nginx.conf`:
```nginx
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Update docker-compose.yml**
Add frontend service:
```yaml
services:
  # ... postgres and backend services ...

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:3001
        VITE_MAPBOX_TOKEN: ${VITE_MAPBOX_TOKEN}
    container_name: oilfield-frontend
    ports:
      - "8080:8080"
    depends_on:
      - backend
    restart: unless-stopped
```

4. **Run Deployment**
```bash
# From project root
docker-compose up -d frontend

# Check status
docker-compose ps
```

## Verification

### Development Mode:
```bash
# Start dev server
cd frontend
npm run dev

# Visit http://localhost:5173
# Map should display Texas wells
# Click well should open modal
# API calls should work to http://localhost:3001
```

### Production Mode (Docker):
```bash
# Check frontend container
docker-compose ps frontend

# Check logs
docker-compose logs frontend

# Visit http://localhost:8080
# Map should display Texas wells
# Click well should open modal
# API calls should proxy through nginx to backend
```

## Environment Variables

### Development (.env.local):
```
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=<your-mapbox-token>
```

### Production (docker-compose.yml):
```
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN}
```

## Testing Checklist
- [ ] Frontend loads without errors
- [ ] Map displays Texas region
- [ ] Wells appear as markers on map
- [ ] Clicking well opens detail modal
- [ ] Valuation data loads correctly
- [ ] Similar wells panel displays
- [ ] AI report generation works
- [ ] Console has no errors

## Troubleshooting
```bash
# Development mode issues
cd frontend
npm install
npm run dev

# Docker build issues
docker-compose build --no-cache frontend
docker-compose up -d frontend

# View logs
docker-compose logs -f frontend

# Shell into container
docker-compose exec frontend sh

# Check nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

## Time Estimate
20 minutes (Docker setup + testing) or 5 minutes (dev server only)
