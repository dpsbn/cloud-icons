/**
 * Database Migration Script
 *
 * This script migrates icon data from the JSON file to PostgreSQL database.
 * It creates the necessary tables, indexes, and populates them with data.
 */

import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cloudicons',
  user: process.env.DB_USER || 'cloudicons',
  password: process.env.DB_PASSWORD || 'cloudicons',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create a connection pool with better defaults
const pool = new Pool({
  ...dbConfig,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Paths to the JSON data file
const POSSIBLE_ICON_PATHS = [
  path.join(process.cwd(), 'data', 'icons.json'),
  path.join(process.cwd(), '..', 'data', 'icons.json'),
];

/**
 * Create database schema with improved indexes and constraints
 */
async function createSchema() {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    console.log('Creating database schema...');

    // Create icons table with better constraints and version tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS icons (
        id VARCHAR(255) PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        icon_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        svg_path VARCHAR(255) NOT NULL,
        license VARCHAR(255),
        version INTEGER NOT NULL DEFAULT 1,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_provider CHECK (length(provider) > 0),
        CONSTRAINT valid_icon_name CHECK (length(icon_name) > 0),
        CONSTRAINT valid_svg_path CHECK (length(svg_path) > 0)
      )
    `);

    // Create tags table with better constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_tag_name CHECK (length(name) > 0)
      )
    `);

    // Create icon_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS icon_tags (
        icon_id VARCHAR(255) REFERENCES icons(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (icon_id, tag_id)
      )
    `);

    // Create improved indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_icons_provider ON icons(provider)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icons_data ON icons USING GIN (data)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icon_tags_tag_id ON icon_tags(tag_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icon_tags_icon_id ON icon_tags(icon_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icons_provider_name ON icons(provider, icon_name)');

    // Add full-text search capabilities
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_icons_description_trgm ON icons USING GIN (description gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_icons_icon_name_trgm ON icons USING GIN (icon_name gin_trgm_ops);
    `);

    // Create a function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_icons_updated_at ON icons;
      CREATE TRIGGER update_icons_updated_at
        BEFORE UPDATE ON icons
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Commit transaction
    await client.query('COMMIT');

    console.log('Database schema created successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error creating database schema:', error);
    throw error;
  } finally {
    // Release client back to the pool
    client.release();
  }
}

/**
 * Read icons data from JSON file
 */
async function readIconsData() {
  for (const iconPath of POSSIBLE_ICON_PATHS) {
    try {
      console.log(`Trying to read icons from ${iconPath}`);
      const data = await fs.readFile(iconPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.log(`Failed to read from ${iconPath}`);
    }
  }

  throw new Error('Failed to read icons data from any path');
}

/**
 * Validates an icon object
 */
function validateIcon(icon: any): boolean {
  const requiredFields = ['id', 'provider', 'icon_name', 'svg_path'];
  for (const field of requiredFields) {
    if (!icon[field] || typeof icon[field] !== 'string' || icon[field].trim().length === 0) {
      console.error(`Invalid icon: missing or invalid ${field}`, icon);
      return false;
    }
  }

  if (!Array.isArray(icon.tags)) {
    console.error(`Invalid icon: tags must be an array`, icon);
    return false;
  }

  return true;
}

/**
 * Creates a backup of the database
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(process.cwd(), 'backups', `backup-${timestamp}.json`);

  try {
    // Ensure backups directory exists
    await fs.mkdir(path.join(process.cwd(), 'backups'), { recursive: true });

    // Read current data
    const icons = await readIconsData();

    // Write backup
    await fs.writeFile(backupPath, JSON.stringify(icons, null, 2));
    console.log(`Backup created at ${backupPath}`);
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

/**
 * Insert tags into the database and return a map of tag name to tag id
 */
async function insertTags(icons: any[]) {
  const client = await pool.connect();
  const tagMap = new Map<string, number>();
  let progress = 0;

  try {
    await client.query('BEGIN');

    // Collect all unique tags
    const uniqueTags = new Set<string>();
    icons.forEach(icon => {
      if (Array.isArray(icon.tags)) {
        icon.tags.forEach((tag: string) => {
          if (typeof tag === 'string' && tag.trim().length > 0) {
            uniqueTags.add(tag.trim());
          }
        });
      }
    });

    console.log(`Found ${uniqueTags.size} unique tags`);
    const totalTags = uniqueTags.size;

    // Insert tags and build tag map
    for (const tag of uniqueTags) {
      try {
        // Check if tag already exists
        const existingTag = await client.query('SELECT id FROM tags WHERE name = $1', [tag]);

        if (existingTag.rows.length > 0) {
          tagMap.set(tag, existingTag.rows[0].id);
        } else {
          // Insert new tag
          const result = await client.query(
            'INSERT INTO tags (name) VALUES ($1) RETURNING id',
            [tag]
          );
          tagMap.set(tag, result.rows[0].id);
        }

        // Update progress
        progress++;
        if (progress % 100 === 0 || progress === totalTags) {
          console.log(`Processed ${progress}/${totalTags} tags (${Math.round((progress/totalTags)*100)}%)`);
        }
      } catch (error) {
        console.error(`Error processing tag "${tag}":`, error);
        throw error;
      }
    }

    await client.query('COMMIT');
    console.log(`Inserted ${tagMap.size} tags into the database`);
    return tagMap;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting tags:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Insert icons and their tags into the database
 */
async function insertIcons(icons: any[], tagMap: Map<string, number>) {
  const client = await pool.connect();
  let progress = 0;
  const validIcons = icons.filter(validateIcon);

  if (validIcons.length !== icons.length) {
    console.warn(`Found ${icons.length - validIcons.length} invalid icons that will be skipped`);
  }

  try {
    await client.query('BEGIN');
    console.log(`Inserting ${validIcons.length} icons into the database...`);

    for (const icon of validIcons) {
      try {
        // Store the full icon data as JSONB
        const data = { ...icon };

        // Insert into icons table with retry logic
        let retries = 3;
        while (retries > 0) {
          try {
            await client.query(
              `INSERT INTO icons (id, provider, icon_name, description, svg_path, license, data)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE SET
                  provider = $2,
                  icon_name = $3,
                  description = $4,
                  svg_path = $5,
                  license = $6,
                  data = $7,
                  version = icons.version + 1,
                  updated_at = CURRENT_TIMESTAMP`,
              [
                icon.id,
                icon.provider,
                icon.icon_name,
                icon.description || '',
                icon.svg_path,
                icon.license || null,
                JSON.stringify(data),
              ]
            );
            break;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Insert icon-tag relationships
        if (Array.isArray(icon.tags)) {
          const validTags = icon.tags.filter((tag: string) =>
            typeof tag === 'string' && tag.trim().length > 0 && tagMap.has(tag)
          );

          for (const tag of validTags) {
            const tagId = tagMap.get(tag);
            await client.query(
              `INSERT INTO icon_tags (icon_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT (icon_id, tag_id) DO NOTHING`,
              [icon.id, tagId]
            );
          }
        }

        // Update progress
        progress++;
        if (progress % 100 === 0 || progress === validIcons.length) {
          console.log(`Processed ${progress}/${validIcons.length} icons (${Math.round((progress/validIcons.length)*100)}%)`);
        }
      } catch (error) {
        console.error(`Error processing icon "${icon.id}":`, error);
        throw error;
      }
    }

    await client.query('COMMIT');
    console.log(`Inserted ${validIcons.length} icons into the database`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting icons:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('Starting migration from JSON to PostgreSQL...');

    // Create backup first
    await createBackup();

    // Create database schema
    await createSchema();

    // Read icons data from JSON file
    const icons = await readIconsData();
    console.log(`Read ${icons.length} icons from JSON file`);

    // Insert tags and get tag map
    const tagMap = await insertTags(icons);

    // Insert icons and their tags
    await insertIcons(icons, tagMap);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Add command line options
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('Performing dry run - no changes will be made to the database');
  // TODO: Implement dry run functionality
} else {
  // Run the migration
  migrate();
}
