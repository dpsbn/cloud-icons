# Cloud Icons Docker Setup

This guide explains how to run the Cloud Icons project using Docker, including the PostgreSQL database, Redis cache, API service, and web application.

## Quick Start

### Prerequisites

- Docker 20.10+ with Docker Compose v2
- 4GB+ available RAM
- 10GB+ available disk space

### One-Command Setup

```bash
# Clean setup (recommended for first time)
./docker-setup.sh --clean

# Or standard setup
./docker-setup.sh
```

The setup script will automatically:
- Build all Docker images
- Start PostgreSQL, Redis, API, and Web services
- Run database migrations
- Verify all services are healthy

## Manual Setup

### 1. Environment Configuration

The Docker environment uses `.env.docker` for configuration:

```bash
# Copy the Docker environment file if needed
cp .env.docker.example .env.docker  # If you have a template
```

### 2. Build and Start Services

```bash
# Build all services
docker compose build

# Start all services
docker compose up -d

# Or build and start in one command
docker compose up -d --build
```

### 3. Run Database Migration

```bash
# Run the migration to populate the database
docker compose exec api npm run db:migrate
```

### 4. Verify Setup

```bash
# Check service health
curl http://localhost:3002/health

# Check providers
curl http://localhost:3002/cloud-providers

# Access web application
open http://localhost:3000
```

## Service Architecture

### Services

1. **PostgreSQL Database** (`postgres`)
   - Port: 5432
   - Database: cloudicons
   - User: cloudicons/cloudicons
   - Stores icon metadata and tags

2. **Redis Cache** (`redis`)
   - Port: 6379
   - Provides caching for API responses
   - Improves performance significantly

3. **API Service** (`api`)
   - Port: 3002
   - Node.js/Express application
   - Serves icon metadata and SVG files
   - Connects to PostgreSQL and Redis

4. **Web Application** (`web`)
   - Port: 3000
   - Next.js React application
   - User interface for browsing icons
   - Connects to API service

### Data Flow

```
Web App (3000) → API (3002) → PostgreSQL (5432)
                           → Redis (6379)
                           → SVG Files (filesystem)
```

## Configuration

### Environment Variables

Key environment variables in `.env.docker`:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cloudicons
DB_USER=cloudicons
DB_PASSWORD=cloudicons

# Cache
REDIS_URL=redis://redis:6379
CACHE_ENABLED=true

# API Keys (change for production!)
API_KEYS=development:Development:1000:500:2000
```

### Development vs Production

**Development (default)**:
- Hot reloading enabled
- Debug logging
- Source code mounted as volumes
- Development database credentials

**Production**:
- Optimized builds
- Production logging
- Secure credentials
- Health checks enabled

## Common Operations

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f postgres
```

### Database Operations

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U cloudicons -d cloudicons

# Run migration again
docker compose exec api npm run db:migrate

# Check database health
docker compose exec postgres pg_isready -U cloudicons
```

### Cache Operations

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Clear cache
docker compose exec redis redis-cli FLUSHALL

# Check Redis status
docker compose exec redis redis-cli ping
```

### Service Management

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart specific service
docker compose restart api

# Rebuild and restart
docker compose up -d --build api
```

### Data Management

```bash
# Backup database
docker compose exec postgres pg_dump -U cloudicons cloudicons > backup.sql

# Restore database
docker compose exec -T postgres psql -U cloudicons cloudicons < backup.sql

# View volume data
docker volume ls
docker volume inspect cloudicons_postgres-data
```

## Development Workflow

### Development Mode

The `docker-compose.override.yml` automatically provides development settings:

```bash
# Start in development mode (default)
docker compose up -d

# The API will use ts-node for hot reloading
# Source code is mounted as volumes for instant updates
```

### Making Changes

1. **API Changes**: 
   - Edit files in `./api/`
   - Changes reflect immediately (hot reload)

2. **Web Changes**:
   - Edit files in `./cloudicons-web/`
   - Next.js hot reloading works automatically

3. **Database Changes**:
   - Update migration scripts
   - Run: `docker compose exec api npm run db:migrate`

### Adding New Icons

1. Add SVG files to `./public/icons/{provider}/`
2. Update `./data/icons.json` or regenerate:
   ```bash
   node scripts/generate-icons.js
   ```
3. Run migration:
   ```bash
   docker compose exec api npm run db:migrate
   ```

## Production Deployment

### Production Configuration

Create a production Docker Compose file:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    environment:
      - NODE_ENV=production
      - DB_HOST=your-prod-db-host
      - DB_PASSWORD=secure-password
      - API_KEYS=prod-key:Production:5000:2000:10000
    restart: always
    
  postgres:
    environment:
      - POSTGRES_PASSWORD=secure-password
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
    restart: always
```

### Security Considerations

1. **Change Default Passwords**:
   ```env
   DB_PASSWORD=secure-random-password
   POSTGRES_PASSWORD=secure-random-password
   ```

2. **Use Strong API Keys**:
   ```env
   API_KEYS=long-random-key:Production:5000:2000:10000
   ```

3. **Enable SSL for Database**:
   ```env
   DB_SSL=true
   ```

4. **Configure CORS**:
   ```env
   ALLOWED_ORIGINS=https://your-domain.com
   ```

## Troubleshooting

### Common Issues

**Services Won't Start**:
```bash
# Check Docker daemon
docker info

# Check available resources
docker system df

# View detailed logs
docker compose logs
```

**Database Connection Failed**:
```bash
# Check PostgreSQL status
docker compose exec postgres pg_isready -U cloudicons

# Check network connectivity
docker compose exec api ping postgres

# Verify credentials
docker compose exec postgres psql -U cloudicons -d cloudicons -c "SELECT 1;"
```

**API Health Check Fails**:
```bash
# Check API logs
docker compose logs api

# Verify database migration
docker compose exec api npm run db:migrate

# Test database connectivity
curl http://localhost:3002/health
```

**Port Already in Use**:
```bash
# Find what's using the port
lsof -i :3002
lsof -i :5432

# Change ports in docker-compose.yml
ports:
  - "3003:3002"  # Use different external port
```

### Performance Issues

**Slow API Responses**:
- Check Redis connection: `docker compose logs redis`
- Monitor database queries: `docker compose logs postgres`
- Verify disk space: `docker system df`

**High Memory Usage**:
- Check container stats: `docker stats`
- Adjust memory limits in docker-compose.yml
- Clear unused images: `docker system prune`

### Monitoring

**Health Checks**:
```bash
# API health
curl http://localhost:3002/health

# Database statistics
curl http://localhost:3002/stats

# Service status
docker compose ps
```

**Resource Usage**:
```bash
# Container stats
docker stats

# Volume usage
docker system df

# Service logs
docker compose logs --tail=100 -f
```

## Cleanup

### Remove Everything

```bash
# Stop and remove containers, networks, and volumes
docker compose down -v --remove-orphans

# Remove images
docker rmi cloudicons-api cloudicons-web

# Clean up Docker system
docker system prune -a --volumes
```

### Selective Cleanup

```bash
# Stop services only
docker compose stop

# Remove containers but keep volumes
docker compose down

# Remove specific service
docker compose rm api
```

## Advanced Configuration

### Custom Docker Networks

```yaml
networks:
  cloudicons-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Health Check Customization

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

## Support

For issues with the Docker setup:

1. Check the logs: `docker compose logs`
2. Verify service health: `curl http://localhost:3002/health`
3. Review this documentation
4. Check Docker and Docker Compose versions
5. Ensure sufficient system resources

The Docker setup is designed to be production-ready while maintaining ease of development. All services include proper health checks, restart policies, and monitoring capabilities.