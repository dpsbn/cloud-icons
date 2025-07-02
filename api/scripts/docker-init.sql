-- Docker PostgreSQL Initialization Script
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create extensions that will be needed
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- The main database 'cloudicons' is already created by the POSTGRES_DB environment variable
-- The user 'cloudicons' is already created by the POSTGRES_USER environment variable

-- Additional setup can be done here if needed
-- For example, creating additional schemas, setting up permissions, etc.

-- Grant additional permissions (these may be redundant but ensure proper access)
GRANT ALL PRIVILEGES ON DATABASE cloudicons TO cloudicons;
GRANT ALL ON SCHEMA public TO cloudicons;

-- Set default search path
ALTER USER cloudicons SET search_path TO public;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Cloud Icons PostgreSQL database initialized successfully';
END $$;