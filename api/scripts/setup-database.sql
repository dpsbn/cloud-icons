-- PostgreSQL Database Setup Script for Cloud Icons API
-- Run this script to create the database and user for the Cloud Icons API

-- Create database
CREATE DATABASE cloudicons;

-- Create user (change password in production)
CREATE USER cloudicons WITH ENCRYPTED PASSWORD 'cloudicons';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cloudicons TO cloudicons;

-- Connect to the cloudicons database
\c cloudicons;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO cloudicons;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudicons;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudicons;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cloudicons;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cloudicons;

-- Exit
\q