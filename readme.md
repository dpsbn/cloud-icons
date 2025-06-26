# Cloud Icons API

A service for serving cloud provider icons with dynamic sizing.

## Features
- Dynamic SVG resizing
- Multiple cloud providers support
- JSON metadata and SVG format support
- Rate limiting and security headers
- Caching and compression
- ETag support for client-side caching

## Running Locally

### Prerequisites
- Node.js (v18 or later)
- npm
- Redis (optional, for caching)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cloudicons.git
   cd cloudicons
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cd api
   cp .env.example .env
   ```
   Edit the `.env` file to configure your environment.

### Running the Backend

1. Start the API server in development mode:
   ```bash
   npm run dev:api
   ```
   The API will be available at http://localhost:3002

### Running the Frontend

1. In a new terminal, start the web application:
   ```bash
   npm run dev:web
   ```
   The web application will be available at http://localhost:3000

## API Endpoints

All API endpoints can be accessed without an API token. API tokens are optional and can be used for higher rate limits.

### Get Cloud Providers
```
GET /api/cloud-providers
```
Returns a list of supported cloud providers.

### Get Icons for a Provider
```
GET /api/:provider/icons?page=1&pageSize=24&search=storage
```
Returns paginated icons for a specific provider.

Parameters:
- `provider`: The cloud provider (e.g., azure, aws)
- `page`: Page number (default: 1)
- `pageSize`: Number of icons per page (default: 24)
- `search`: Optional search term
- `size`: Icon size in pixels (default: 64)

### Get a Specific Icon
```
GET /api/:provider/icon/:icon_name?format=svg&size=64
```
Returns an icon in the specified format and size.

Parameters:
- `provider`: The cloud provider (e.g., azure, aws)
- `icon_name`: The icon identifier
- `format`: Response format (json or svg, default: json)
- `size`: Icon size in pixels (default: 24)

Example direct access to an SVG icon:
```
http://localhost:3002/azure/icon/storage-accounts?format=svg&size=64
```
