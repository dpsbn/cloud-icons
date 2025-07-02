# Database Setup Guide

The Cloud Icons API now uses PostgreSQL as the primary data source for icon metadata, with automatic fallback to JSON files if the database is unavailable.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ 
- npm 8+

## Quick Setup

### 1. Install and Start PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/)

### 2. Create Database and User

Run the setup script:
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Or on macOS/Windows:
psql postgres

# Run the setup commands from the script
\i api/scripts/setup-database.sql
```

Or manually:
```sql
CREATE DATABASE cloudicons;
CREATE USER cloudicons WITH ENCRYPTED PASSWORD 'cloudicons';
GRANT ALL PRIVILEGES ON DATABASE cloudicons TO cloudicons;

-- Connect to the database
\c cloudicons;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO cloudicons;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudicons;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudicons;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cloudicons;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cloudicons;
```

### 3. Configure Environment Variables

Copy the environment template:
```bash
cd api
cp .env.example .env
```

Update the database configuration in `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudicons
DB_USER=cloudicons
DB_PASSWORD=cloudicons
DB_SSL=false
```

### 4. Run Database Migration

Migrate the icon data to PostgreSQL:
```bash
# From the api directory
npm run db:migrate
```

This will:
- Create the required tables and indexes
- Insert all icon metadata from icons.json
- Set up full-text search capabilities
- Create proper relationships between icons and tags

## Database Schema

### Tables

**icons**
- `id` (VARCHAR, PRIMARY KEY) - Unique icon identifier
- `provider` (VARCHAR) - Cloud provider (aws, azure, alibaba)
- `icon_name` (VARCHAR) - Human-readable icon name
- `description` (TEXT) - Icon description
- `svg_path` (VARCHAR) - Path to SVG file
- `license` (VARCHAR) - License information
- `data` (JSONB) - Complete icon metadata as JSON
- `created_at`, `updated_at` (TIMESTAMP) - Audit fields

**tags**
- `id` (SERIAL, PRIMARY KEY) - Tag identifier
- `name` (VARCHAR, UNIQUE) - Tag name
- `created_at` (TIMESTAMP) - Creation timestamp

**icon_tags**
- `icon_id` (VARCHAR, FK) - References icons.id
- `tag_id` (INTEGER, FK) - References tags.id
- `created_at` (TIMESTAMP) - Relationship creation time

### Indexes

- `idx_icons_provider` - For provider filtering
- `idx_icons_data` (GIN) - For JSON queries
- `idx_icons_provider_name` - For provider + name lookups
- `idx_icons_description_trgm` (GIN) - For full-text search on descriptions
- `idx_icons_icon_name_trgm` (GIN) - For full-text search on names

## API Changes

### New Endpoints

**Database Health Check:**
```
GET /health
```
Returns database connectivity status and icon count.

**Database Statistics:**
```
GET /stats
```
Returns comprehensive database statistics including provider counts.

**Enhanced Search:**
```
GET /:provider/icons?search=query&tags=tag1,tag2&page=1&pageSize=24
```
- `search` - Full-text search across names, descriptions, and tags
- `tags` - Comma-separated tag filtering
- Improved pagination and performance

### Backward Compatibility

The API maintains full backward compatibility:
- All existing endpoints work unchanged
- Automatic fallback to JSON files if database is unavailable
- Same response formats and behavior

## Performance Features

### Caching Strategy

1. **Database Query Results** - Cached in Redis (if configured)
2. **Individual Icon Metadata** - Cached with configurable TTL
3. **SVG Content** - Multi-level caching (memory + Redis)
4. **Provider Lists** - Cached to reduce database queries

### Query Optimization

- Efficient pagination with `LIMIT`/`OFFSET`
- Full-text search using PostgreSQL's trigram extension
- Proper indexing for common query patterns
- JSON path queries for complex metadata searches

## Monitoring and Maintenance

### Health Checks

Monitor database health via the `/health` endpoint:
```bash
curl http://localhost:3002/health
```

Response includes:
- Database connectivity status
- Total icon count
- Redis status (if configured)
- Service uptime

### Database Statistics

Get detailed statistics via `/stats`:
```bash
curl http://localhost:3002/stats
```

Returns:
- Total icons by provider
- Tag count
- Database performance metrics

### Backup and Recovery

**Create Backup:**
```bash
pg_dump cloudicons > cloudicons_backup.sql
```

**Restore Backup:**
```bash
psql cloudicons < cloudicons_backup.sql
```

**Automated Backups:**
The migration script automatically creates JSON backups in `api/backups/` before each migration.

## Troubleshooting

### Common Issues

**Connection Refused:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running: `brew services start postgresql`
- Check connection details in `.env`

**Permission Denied:**
```
Error: permission denied for table icons
```
- Re-run the database setup script
- Ensure user has proper privileges

**Migration Fails:**
```
Error: Failed to read icons data from any path
```
- Ensure `icons.json` exists in the correct location
- Check file permissions

### Fallback Behavior

If the database is unavailable, the API automatically falls back to JSON files:
- Performance may be reduced
- Advanced search features may be limited
- Health endpoint will show `json_fallback` status

### Re-running Migration

To update the database with new icons:
```bash
npm run db:migrate
```

This is safe to run multiple times and will update existing records.

## Development vs Production

### Development
- Use local PostgreSQL instance
- Disable SSL: `DB_SSL=false`
- Enable verbose logging: `LOG_LEVEL=debug`

### Production
- Use managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Enable SSL: `DB_SSL=true`
- Configure connection pooling
- Set up monitoring and alerting
- Use environment-specific credentials

### Environment Configuration

**Development (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudicons
DB_USER=cloudicons
DB_PASSWORD=cloudicons
DB_SSL=false
LOG_LEVEL=debug
```

**Production:**
```env
DB_HOST=your-prod-db-host.com
DB_PORT=5432
DB_NAME=cloudicons_prod
DB_USER=cloudicons_prod
DB_PASSWORD=secure_random_password
DB_SSL=true
LOG_LEVEL=info
```

## Next Steps

1. **Set up Redis** for enhanced caching performance
2. **Configure monitoring** with health checks and alerts
3. **Implement backup strategy** for production environments
4. **Consider read replicas** for high-traffic scenarios
5. **Set up CI/CD** for automated migrations in deployment pipelines