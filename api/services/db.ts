import { Pool } from 'pg';
import { createLogger } from './logger';

const logger = createLogger('dbService');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cloudicons',
  user: process.env.DB_USER || 'cloudicons',
  password: process.env.DB_PASSWORD || 'cloudicons',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle client');
  process.exit(-1);
});

/**
 * Execute a query with automatic retries and error handling
 */
export async function executeQuery<T>(
  query: string,
  params: any[] = [],
  retries = 3
): Promise<T[]> {
  let lastError: Error | null = null;

  while (retries > 0) {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } catch (error: any) {
      lastError = error;
      logger.warn({ err: error, query, params, retriesLeft: retries }, 'Query failed, retrying');
      retries--;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      client.release();
    }
  }

  throw lastError;
}

/**
 * Execute a query within a transaction
 */
export async function executeTransaction<T>(
  queries: Array<{ query: string; params?: any[] }>,
  retries = 3
): Promise<T[][]> {
  let lastError: Error | null = null;

  while (retries > 0) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const { query, params = [] } of queries) {
        const result = await client.query(query, params);
        results.push(result.rows);
      }

      await client.query('COMMIT');
      return results;
    } catch (error: any) {
      await client.query('ROLLBACK');
      lastError = error;
      logger.warn({ err: error, retriesLeft: retries }, 'Transaction failed, retrying');
      retries--;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      client.release();
    }
  }

  throw lastError;
}

/**
 * Get icons with pagination and filtering
 */
export async function getIcons(
  provider: string,
  search?: string,
  page = 1,
  pageSize = 24
): Promise<{ icons: any[]; total: number }> {
  const offset = (page - 1) * pageSize;
  let query = `
    SELECT i.*, array_agg(t.name) as tags
    FROM icons i
    LEFT JOIN icon_tags it ON i.id = it.icon_id
    LEFT JOIN tags t ON it.tag_id = t.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (provider.toLowerCase() !== 'all') {
    conditions.push('i.provider = $1');
    params.push(provider);
  }

  if (search) {
    const searchParam = `%${search.toLowerCase()}%`;
    conditions.push(`(
      LOWER(i.icon_name) LIKE $${params.length + 1} OR
      LOWER(i.description) LIKE $${params.length + 1} OR
      EXISTS (
        SELECT 1 FROM icon_tags it2
        JOIN tags t2 ON it2.tag_id = t2.id
        WHERE it2.icon_id = i.id AND LOWER(t2.name) LIKE $${params.length + 1}
      )
    )`);
    params.push(searchParam);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY i.id
    ORDER BY i.provider, i.icon_name
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(pageSize, offset);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM icons i';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const [icons, [countResult]] = await executeTransaction<any>([
    { query, params },
    { query: countQuery, params: params.slice(0, -2) }
  ]);

  return {
    icons,
    total: parseInt(countResult.count)
  };
}

/**
 * Get a specific icon by provider and name
 */
export async function getIconByName(
  provider: string,
  iconName: string
): Promise<any | null> {
  const query = `
    SELECT i.*, array_agg(t.name) as tags
    FROM icons i
    LEFT JOIN icon_tags it ON i.id = it.icon_id
    LEFT JOIN tags t ON it.tag_id = t.id
    WHERE LOWER(i.provider) = LOWER($1)
    AND LOWER(i.id) = LOWER($2)
    GROUP BY i.id
  `;

  const [icon] = await executeQuery(query, [provider, iconName]);
  return icon || null;
}

/**
 * Get all providers
 */
export async function getProviders(): Promise<string[]> {
  const query = 'SELECT DISTINCT provider FROM icons ORDER BY provider';
  const results = await executeQuery<{ provider: string }>(query);
  return results.map(r => r.provider);
}

// Export pool for direct access if needed
export { pool };