# Cloud Icons API

A service for serving cloud provider icons with dynamic sizing.

## Features
- Dynamic SVG resizing
- Multiple cloud providers support
- JSON metadata and SVG format support
- Rate limiting and security headers
- Caching and compression

### Get Icons List
GET `/icons`
### Get Icons List
GET `/icons`
Returns a list of all available icons. provider.GET `/:provider/icon/:icon_name?format=svg&size=64`
Returns an icon in the specified format and size.```
GET /cloud-providers
GET `/cloud-providers`
Returns a list of supported cloud providers.```
GET /:provider/icon/:icon_name?format=svg&size=64
```- `NODE_ENV`: Environment (development/production)
GET `/:provider/icons?page=1&pageSize=10`
Returns paginated icons for a specific provider.
1. **Get Azure Storage Icon (64x64)**
   ```
GET `/:provider/icon/:icon_name?format=svg&size=64`
Returns an icon in the specified format and size.
2. **Get Icon Metadata**
   ```
   GET /azure/icon/storage-accounts
