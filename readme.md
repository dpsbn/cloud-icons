# Cloud Icons API

A comprehensive service for serving cloud provider icons with dynamic sizing and advanced features.

## Features

### API Features
- Dynamic SVG resizing with customizable dimensions
- Multiple cloud providers support (Azure, AWS, and more)
- JSON metadata and SVG format responses
- Advanced security with rate limiting and security headers
- Multi-level caching (memory and Redis) for optimal performance
- Compression and ETag support for efficient data transfer
- SVG sanitization to prevent XSS attacks
- Comprehensive error handling and logging
- OpenAPI/Swagger documentation

### Web Application Features
- Modern, responsive UI with dark mode support
- Dynamic provider selection for multiple cloud platforms
- Advanced search functionality for finding icons quickly
- Tag-based filtering to narrow down results
- Icon size customization for different use cases
- Copy-to-clipboard functionality for SVG code
- Download options in SVG and PNG formats
- Infinite scrolling for browsing large icon collections

## Getting Started

### Quick Start with Docker (Recommended)

The fastest way to get Cloud Icons running with full database support:

```bash
# One-command setup
./docker-setup.sh --clean
```

This will automatically set up PostgreSQL, Redis, API, and Web services. See [DOCKER_README.md](DOCKER_README.md) for details.

### Manual Installation

#### Prerequisites
- Node.js (v18 or later)
- npm (v8 or later)  
- PostgreSQL 12+ (for database support)
- Redis (optional, for enhanced caching)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cloudicons.git
   cd cloudicons
   ```

2. Install dependencies for both API and web application:
   ```bash
   npm install
   ```
   This will install dependencies for the monorepo root. The individual project dependencies will be installed when running the build or dev commands.

3. Set up environment variables:
   ```bash
   cd api
   cp .env.example .env
   ```

   Edit the `.env` file to configure your environment:

   ```
   # API Configuration
   PORT=3002
   NODE_ENV=development

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

   # Cache Configuration
   CACHE_ENABLED=true
   REDIS_URL=redis://localhost:6379  # Optional, remove if not using Redis
   CACHE_TTL=3600                    # Default cache TTL in seconds
   ICON_CACHE_TTL=86400              # Icon metadata cache TTL in seconds
   SVG_CACHE_TTL=604800              # SVG content cache TTL in seconds
   MEMORY_CACHE_SIZE=1000            # Maximum number of items in memory cache

   # Security Configuration
   API_KEYS=key1:name1:500:100:1000,key2:name2:1000:200:2000
   # Format: key:name:standardLimit:metadataLimit:svgLimit
   ```

### Running in Development Mode

1. Start the API server:
   ```bash
   npm run dev:api
   ```
   The API will be available at http://localhost:3002

   You can access the OpenAPI documentation at http://localhost:3002/api-docs (if you've set up Swagger UI)

2. In a new terminal, start the web application:
   ```bash
   npm run dev:web
   ```
   The web application will be available at http://localhost:3000

### Building for Production

1. Build both the API and web application:
   ```bash
   npm run build:all
   ```

2. Start the production server:
   ```bash
   npm start
   ```

   This will start the API server. The web application can be deployed separately to a static hosting service.

### Docker Support

Run the complete stack with PostgreSQL database:

```bash
# Quick setup with database migration
./docker-setup.sh --clean

# Or manually
docker compose up -d --build
docker compose exec api npm run db:migrate
```

For detailed Docker instructions, see [DOCKER_README.md](DOCKER_README.md).

### Database Setup

The project now uses PostgreSQL as the primary data source. For manual database setup:

```bash
# See detailed database setup instructions
cat DATABASE_SETUP.md

# Quick setup
createdb cloudicons
psql cloudicons < api/scripts/setup-database.sql
cd api && npm run db:migrate
```

## API Reference

The Cloud Icons API provides a RESTful interface for accessing cloud provider icons. For complete API documentation, refer to the OpenAPI specification in `/api/openapi.yaml`.

> **Note:** All API endpoints can be accessed without an API token. API tokens are optional and provide higher rate limits.

### Authentication

API keys can be provided via the `X-API-Key` header for higher rate limits:

```
X-API-Key: your-api-key
```

### Endpoints

#### Get Cloud Providers
```http
GET /cloud-providers
```

Returns a list of all supported cloud providers.

**Example Response:**
```json
["azure", "aws", "gcp"]
```

#### Get Icons for a Provider
```http
GET /:provider/icons
```

Returns a paginated list of icons for the specified cloud provider.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `pageSize` | integer | 24 | Number of icons per page (max: 100) |
| `search` | string | | Optional search term to filter icons |
| `size` | integer | 64 | Size of the icons in pixels |
| `tags` | string | | Comma-separated list of tags to filter by |

**Example Request:**
```http
GET /azure/icons?page=1&pageSize=24&search=storage&size=64&tags=compute,storage
```

**Example Response:**
```json
{
  "total": 42,
  "page": 1,
  "pageSize": 24,
  "data": [
    {
      "id": "storage-accounts",
      "provider": "azure",
      "icon_name": "Storage Accounts",
      "description": "Azure service for Storage Accounts",
      "tags": ["storage", "data"],
      "svg_path": "/icons/azure/storage-accounts.svg",
      "license": "Microsoft Azure trademark",
      "svg_content": "<svg>...</svg>"
    },
    // More icons...
  ]
}
```

#### Get a Specific Icon
```http
GET /:provider/icon/:icon_name
```

Returns a specific icon in the requested format and size.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | "json" | Response format: "json" or "svg" |
| `size` | integer | 24 | Size of the icon in pixels |

**Example Requests:**

JSON format with metadata:
```http
GET /azure/icon/storage-accounts?format=json&size=64
```

Direct SVG access:
```http
GET /azure/icon/storage-accounts?format=svg&size=128
```

**Example JSON Response:**
```json
{
  "id": "storage-accounts",
  "provider": "azure",
  "icon_name": "Storage Accounts",
  "description": "Azure service for Storage Accounts",
  "tags": ["storage", "data"],
  "svg_path": "/icons/azure/storage-accounts.svg",
  "license": "Microsoft Azure trademark",
  "svg_content": "<svg>...</svg>"
}
```

### Error Handling

The API returns standard HTTP status codes and JSON error responses:

```json
{
  "error": "Icon not found"
}
```

Common status codes:
- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
