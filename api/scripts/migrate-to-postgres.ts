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

// Create a connection pool
const pool = new Pool(dbConfig);

// Paths to the JSON data file
const POSSIBLE_ICON_PATHS = [
  path.join(process.cwd(), 'data', 'icons.json'),
  path.join(process.cwd(), '..', 'data', 'icons.json'),
];

/**
 * Create database schema
 */
async function createSchema() {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    console.log('Creating database schema...');

    // Create icons table
    await client.query(`
            CREATE TABLE IF NOT EXISTS icons
            (
                id
                VARCHAR
            (
                255
            ) PRIMARY KEY,
                provider VARCHAR
            (
                50
            ) NOT NULL,
                icon_name VARCHAR
            (
                255
            ) NOT NULL,
                description TEXT,
                svg_path VARCHAR
            (
                255
            ) NOT NULL,
                license VARCHAR
            (
                255
            ),
                data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                         )
        `);

    // Create tags table
    await client.query(`
            CREATE TABLE IF NOT EXISTS tags
            (
                id
                SERIAL
                PRIMARY
                KEY,
                name
                VARCHAR
            (
                50
            ) UNIQUE NOT NULL
                )
        `);

    // Create icon_tags table
    await client.query(`
            CREATE TABLE IF NOT EXISTS icon_tags
            (
                icon_id
                VARCHAR
            (
                255
            ) REFERENCES icons
            (
                id
            ),
                tag_id INTEGER REFERENCES tags
            (
                id
            ),
                PRIMARY KEY
            (
                icon_id,
                tag_id
            )
                )
        `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_icons_provider ON icons(provider)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icons_data ON icons USING GIN (data)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icon_tags_tag_id ON icon_tags(tag_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_icon_tags_icon_id ON icon_tags(icon_id)');

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
 * Insert tags into the database and return a map of tag name to tag id
 */
async function insertTags(icons: any[]) {
  const client = await pool.connect();
  const tagMap = new Map<string, number>();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Collect all unique tags
    const uniqueTags = new Set<string>();
    icons.forEach(icon => {
      if (Array.isArray(icon.tags)) {
        icon.tags.forEach((tag: string) => uniqueTags.add(tag));
      }
    });

    console.log(`Found ${uniqueTags.size} unique tags`);

    // Insert tags and build tag map
    for (const tag of uniqueTags) {
      // Check if tag already exists
      const existingTag = await client.query('SELECT id FROM tags WHERE name = $1', [tag]);

      if (existingTag.rows.length > 0) {
        tagMap.set(tag, existingTag.rows[0].id);
      } else {
        // Insert new tag
        const result = await client.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [
          tag,
        ]);
        tagMap.set(tag, result.rows[0].id);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`Inserted ${tagMap.size} tags into the database`);
    return tagMap;
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error inserting tags:', error);
    throw error;
  } finally {
    // Release client back to the pool
    client.release();
  }
}

/**
 * Insert icons and their tags into the database
 */
async function insertIcons(icons: any[], tagMap: Map<string, number>) {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    console.log(`Inserting ${icons.length} icons into the database...`);

    // Insert icons
    for (const icon of icons) {
      // Store the full icon data as JSONB
      const data = { ...icon };

      // Insert into icons table
      await client.query(
        `INSERT INTO icons (id, provider, icon_name, description, svg_path, license, data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO
                UPDATE SET
                    provider = $2,
                    icon_name = $3,
                    description = $4,
                    svg_path = $5,
                    license = $6,
                    data = $7,
                    updated_at = CURRENT_TIMESTAMP`,
        [
          icon.id,
          icon.provider,
          icon.icon_name,
          icon.description,
          icon.svg_path,
          icon.license,
          JSON.stringify(data),
        ]
      );

      // Insert icon-tag relationships
      if (Array.isArray(icon.tags)) {
        for (const tag of icon.tags) {
          const tagId = tagMap.get(tag);
          if (tagId) {
            await client.query(
              `INSERT INTO icon_tags (icon_id, tag_id)
                             VALUES ($1, $2) ON CONFLICT (icon_id, tag_id) DO NOTHING`,
              [icon.id, tagId]
            );
          }
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`Inserted ${icons.length} icons into the database`);
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error inserting icons:', error);
    throw error;
  } finally {
    // Release client back to the pool
    client.release();
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('Starting migration from JSON to PostgreSQL...');

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
    // Close the pool
    await pool.end();
  }
}

// Run the migration
migrate();
