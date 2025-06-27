# CloudIcons Migration Plan

This document outlines the plan for migrating CloudIcons from JSON-based storage to PostgreSQL and implementing GraphQL.

## Phase 1: PostgreSQL Migration

### 1. Database Schema
```sql
-- Icons table
CREATE TABLE icons (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(255) NOT NULL,
    icon_name VARCHAR(255) NOT NULL,
    description TEXT,
    svg_path VARCHAR(255) NOT NULL,
    png_path VARCHAR(255),
    license VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, icon_name)
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for icons and tags
CREATE TABLE icon_tags (
    icon_id INTEGER REFERENCES icons(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (icon_id, tag_id)
);

-- Indexes
CREATE INDEX idx_icons_provider ON icons(provider);
CREATE INDEX idx_icons_icon_name ON icons(icon_name);
CREATE INDEX idx_tags_name ON tags(name);
```

### 2. Data Migration Steps
1. Set up PostgreSQL in docker-compose
2. Create database schemas
3. Run migration script with validation
4. Keep JSON as fallback during transition
5. Add rollback capability

## Phase 2: GraphQL Implementation

### 1. Schema Design
```graphql
type Icon {
  id: ID!
  provider: String!
  iconName: String!
  description: String
  svgPath: String!
  pngPath: String
  license: String
  tags: [Tag!]
  svgContent(size: Int): String!
}

type Tag {
  id: ID!
  name: String!
  icons: [Icon!]!
}

type Query {
  icons(
    provider: String
    search: String
    tags: [String!]
    page: Int
    pageSize: Int
  ): IconConnection!

  icon(provider: String!, name: String!): Icon
  providers: [String!]!
  tags: [Tag!]!
}

type IconConnection {
  edges: [IconEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type IconEdge {
  node: Icon!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

## Phase 3: Implementation Timeline

### Week 1-2: Backend Changes
1. PostgreSQL Setup
   - Set up PostgreSQL in docker-compose
   - Update environment variables
   - Create database schemas
   - Run migration script
   - Add database connection pooling

2. GraphQL Setup
   - Install dependencies (apollo-server-express, type-graphql)
   - Create GraphQL schema
   - Implement resolvers
   - Add DataLoader for N+1 query prevention

### Week 2-3: Frontend Changes
1. GraphQL Client Setup
   - Install Apollo Client
   - Set up GraphQL codegen for TypeScript
   - Create GraphQL queries/fragments

2. Component Updates
   - Update IconGrid to use GraphQL queries
   - Implement proper pagination
   - Add tag filtering
   - Update search functionality

### Week 3-4: Testing & Optimization
1. Backend Testing
   - Unit tests for resolvers
   - Integration tests for GraphQL endpoints
   - Performance testing
   - Cache strategy updates

2. Frontend Testing
   - Component tests with GraphQL mocks
   - End-to-end tests
   - Performance optimization

### Deployment & Monitoring
1. Infrastructure
   - Update Docker configuration
   - Set up database backups
   - Configure connection pooling
   - Update CI/CD pipeline

2. Monitoring
   - Add GraphQL specific metrics
   - Database performance monitoring
   - Query performance tracking

## Dependencies
```json
{
  "backend": {
    "apollo-server-express": "^3.x",
    "type-graphql": "^1.x",
    "typeorm": "^0.3.x",
    "pg": "^8.x",
    "dataloader": "^2.x"
  },
  "frontend": {
    "@apollo/client": "^3.x",
    "@graphql-codegen/cli": "^2.x",
    "@graphql-codegen/typescript": "^2.x",
    "@graphql-codegen/typescript-operations": "^2.x"
  }
}
```

## Rollback Plan
1. Keep JSON-based system running in parallel during migration
2. Implement feature flags for gradual rollout
3. Monitor error rates and performance metrics
4. Have database backup and restore procedures in place
5. Document rollback procedures for each phase