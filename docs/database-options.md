# Database Options for Cloud Icons API

This document outlines the options for implementing a proper database for the Cloud Icons API project, replacing the current JSON file-based approach for storing icon metadata.

## Current Approach

Currently, the Cloud Icons API stores icon metadata in a JSON file (`data/icons.json`). This approach has several limitations:

- **Scalability**: As the number of icons grows, loading the entire JSON file into memory becomes inefficient
- **Performance**: Searching and filtering operations require scanning the entire dataset
- **Concurrency**: No built-in support for concurrent updates
- **Versioning**: No built-in versioning or history tracking
- **Backup & Recovery**: Manual backup process required

## Database Requirements

The ideal database solution for the Cloud Icons API should support:

1. **Efficient querying**: Fast searches by provider, tags, and text
2. **Schema flexibility**: Ability to evolve the schema as new icon properties are added
3. **Scalability**: Handle thousands of icons without performance degradation
4. **Indexing**: Support for indexing to optimize common queries
5. **Versioning**: Track changes to icon metadata over time
6. **Integration**: Easy integration with Node.js and the existing codebase

## Database Options

### Option 1: MongoDB (Document Database)

MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like documents.

#### Pros:
- **Schema flexibility**: Ideal for evolving data structures
- **JSON compatibility**: Natural fit for the existing JSON data
- **Query language**: Rich query capabilities including text search
- **Indexing**: Support for various index types
- **Node.js integration**: Excellent driver and ecosystem
- **Scalability**: Horizontal scaling with sharding

#### Cons:
- **Transaction support**: Limited compared to relational databases
- **Memory usage**: Can be memory-intensive
- **Learning curve**: Different paradigm from SQL

### Option 2: PostgreSQL (Relational Database)

PostgreSQL is a powerful, open-source object-relational database system.

#### Pros:
- **ACID compliance**: Full transaction support
- **JSON support**: Native JSONB data type with indexing
- **Full-text search**: Built-in text search capabilities
- **Reliability**: Mature, battle-tested database
- **Extensibility**: Rich ecosystem of extensions
- **SQL standard**: Familiar query language

#### Cons:
- **Schema changes**: Less flexible for rapid schema evolution
- **Horizontal scaling**: More complex than MongoDB
- **Setup complexity**: More initial configuration

## Recommended Approach: PostgreSQL with JSONB

For the Cloud Icons API, **PostgreSQL with JSONB** is recommended for the following reasons:

1. **Best of both worlds**: PostgreSQL's JSONB type provides schema flexibility similar to MongoDB while maintaining the benefits of a relational database
2. **Performance**: JSONB indexes can make queries very efficient
3. **Text search**: PostgreSQL's full-text search capabilities are excellent for searching icon metadata
4. **Reliability**: PostgreSQL's maturity and stability are important for production use
5. **Future-proofing**: If relational aspects become more important (e.g., user accounts, collections), PostgreSQL is already equipped

## Proposed Schema

```sql
-- Icons table
CREATE TABLE icons (
    id VARCHAR(255) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    icon_name VARCHAR(255) NOT NULL,
    description TEXT,
    svg_path VARCHAR(255) NOT NULL,
    license VARCHAR(255),
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table (for many-to-many relationship)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Icon-Tags relationship table
CREATE TABLE icon_tags (
    icon_id VARCHAR(255) REFERENCES icons(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (icon_id, tag_id)
);

-- Indexes
CREATE INDEX idx_icons_provider ON icons(provider);
CREATE INDEX idx_icons_data ON icons USING GIN (data);
CREATE INDEX idx_icon_tags_tag_id ON icon_tags(tag_id);
CREATE INDEX idx_icon_tags_icon_id ON icon_tags(icon_id);
```

## Implementation Plan

1. **Set up PostgreSQL**: Add PostgreSQL service to docker-compose.yml
2. **Create database schema**: Implement the schema above
3. **Create migration script**: Write a script to migrate data from JSON to PostgreSQL
4. **Update iconService**: Modify the service to use PostgreSQL instead of JSON file
5. **Add versioning**: Implement a versioning system for tracking changes
6. **Update API endpoints**: Ensure all endpoints work with the new database
7. **Performance testing**: Benchmark and optimize queries

## Next Steps

1. Add PostgreSQL to the development environment
2. Create a database migration script
3. Update the iconService to use PostgreSQL
4. Add database connection pooling and error handling
5. Update tests to work with the database