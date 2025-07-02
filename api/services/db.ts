import { Pool } from 'pg';
import { createLogger } from './logger';
import { Icon } from '../types/icon';

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
  pageSize = 24,
  tags?: string[]
): Promise<{ icons: Icon[]; total: number }> {
  try {
    const offset = (page - 1) * pageSize;
    let query = `
      SELECT i.*, 
             COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
      FROM icons i
      LEFT JOIN icon_tags it ON i.id = it.icon_id
      LEFT JOIN tags t ON it.tag_id = t.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Filter by provider
    if (provider.toLowerCase() !== 'all') {
      conditions.push(`LOWER(i.provider) = LOWER($${params.length + 1})`);
      params.push(provider);
    }

    // Search functionality
    if (search) {
      const searchParam = `%${search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(i.icon_name) LIKE $${params.length + 1} OR
        LOWER(i.description) LIKE $${params.length + 1} OR
        LOWER(i.id) LIKE $${params.length + 1} OR
        EXISTS (
          SELECT 1 FROM icon_tags it2
          JOIN tags t2 ON it2.tag_id = t2.id
          WHERE it2.icon_id = i.id AND LOWER(t2.name) LIKE $${params.length + 1}
        )
      )`);
      params.push(searchParam);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      const tagConditions = tags.map((_, index) => `LOWER(t.name) = LOWER($${params.length + index + 1})`).join(' OR ');
      conditions.push(`EXISTS (
        SELECT 1 FROM icon_tags it3
        JOIN tags t3 ON it3.tag_id = t3.id
        WHERE it3.icon_id = i.id AND (${tagConditions})
      )`);
      params.push(...tags);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY i.id, i.provider, i.icon_name, i.description, i.svg_path, i.license, i.created_at
      ORDER BY i.provider, i.icon_name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(pageSize, offset);

    // Get total count with same conditions
    let countQuery = 'SELECT COUNT(DISTINCT i.id) as count FROM icons i';
    if (search || (tags && tags.length > 0)) {
      countQuery += ' LEFT JOIN icon_tags it ON i.id = it.icon_id LEFT JOIN tags t ON it.tag_id = t.id';
    }
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countParams = params.slice(0, -2); // Remove LIMIT and OFFSET

    logger.debug({ query, params, countQuery, countParams }, 'Executing icon query');

    const [icons, [countResult]] = await executeTransaction<any>([
      { query, params },
      { query: countQuery, params: countParams }
    ]);

    // Transform database result to Icon format
    const transformedIcons: Icon[] = icons.map((row: any) => ({
      id: row.id,
      provider: row.provider,
      icon_name: row.icon_name,
      description: row.description || '',
      tags: Array.isArray(row.tags) ? row.tags.filter((tag: string) => tag !== null) : [],
      svg_path: row.svg_path,
      license: row.license
    }));

    const total = parseInt(countResult.count || '0');

    logger.info({ 
      provider, 
      search, 
      tags, 
      page, 
      pageSize, 
      resultCount: transformedIcons.length, 
      total 
    }, 'Retrieved icons from database');

    return {
      icons: transformedIcons,
      total
    };
  } catch (error: any) {
    logger.error({ error, provider, search, page, pageSize }, 'Failed to get icons from database');
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Get a specific icon by provider and name
 */
export async function getIconByName(
  provider: string,
  iconName: string
): Promise<Icon | null> {
  try {
    const query = `
      SELECT i.*, 
             COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
      FROM icons i
      LEFT JOIN icon_tags it ON i.id = it.icon_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE LOWER(i.provider) = LOWER($1)
      AND LOWER(i.id) = LOWER($2)
      GROUP BY i.id, i.provider, i.icon_name, i.description, i.svg_path, i.license, i.created_at
    `;

    logger.debug({ provider, iconName, query }, 'Getting icon by name');

    const results = await executeQuery(query, [provider, iconName]);
    const [row] = results;

    if (!row) {
      logger.debug({ provider, iconName }, 'Icon not found in database');
      return null;
    }

    // Transform database result to Icon format
    const icon: Icon = {
      id: (row as any).id,
      provider: (row as any).provider,
      icon_name: (row as any).icon_name,
      description: (row as any).description || '',
      tags: Array.isArray((row as any).tags) ? (row as any).tags.filter((tag: string) => tag !== null) : [],
      svg_path: (row as any).svg_path,
      license: (row as any).license
    };

    logger.info({ iconId: icon.id, provider, iconName }, 'Retrieved icon from database');
    return icon;
  } catch (error: any) {
    logger.error({ error, provider, iconName }, 'Failed to get icon by name from database');
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Get all providers
 */
export async function getProviders(): Promise<string[]> {
  try {
    const query = 'SELECT DISTINCT provider FROM icons ORDER BY provider';
    logger.debug({ query }, 'Getting providers from database');
    
    const results = await executeQuery<{ provider: string }>(query);
    const providers = results.map(r => r.provider);
    
    logger.info({ count: providers.length, providers }, 'Retrieved providers from database');
    return providers;
  } catch (error: any) {
    logger.error({ error }, 'Failed to get providers from database');
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Get all available tags
 */
export async function getTags(): Promise<string[]> {
  try {
    const query = 'SELECT DISTINCT name FROM tags ORDER BY name';
    logger.debug({ query }, 'Getting tags from database');
    
    const results = await executeQuery<{ name: string }>(query);
    const tags = results.map(r => r.name);
    
    logger.info({ count: tags.length }, 'Retrieved tags from database');
    return tags;
  } catch (error: any) {
    logger.error({ error }, 'Failed to get tags from database');
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Check if database connection is healthy
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string; iconCount?: number }> {
  try {
    const query = 'SELECT COUNT(*) as count FROM icons';
    const results = await executeQuery<{ count: string }>(query);
    const iconCount = parseInt(results[0]?.count || '0');
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      iconCount
    };
  } catch (error: any) {
    logger.error({ error }, 'Database health check failed');
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<{
  totalIcons: number;
  providerCounts: Record<string, number>;
  totalTags: number;
}> {
  try {
    const queries = [
      { query: 'SELECT COUNT(*) as count FROM icons', params: [] },
      { query: 'SELECT provider, COUNT(*) as count FROM icons GROUP BY provider ORDER BY provider', params: [] },
      { query: 'SELECT COUNT(*) as count FROM tags', params: [] }
    ];

    const [totalResult, providerResults, tagsResult] = await executeTransaction(queries);
    
    const totalIcons = parseInt((totalResult[0] as any)?.count || '0');
    const totalTags = parseInt((tagsResult[0] as any)?.count || '0');
    
    const providerCounts: Record<string, number> = {};
    providerResults.forEach((row: any) => {
      providerCounts[row.provider] = parseInt(row.count);
    });

    logger.info({ totalIcons, providerCounts, totalTags }, 'Retrieved database statistics');
    
    return {
      totalIcons,
      providerCounts,
      totalTags
    };
  } catch (error: any) {
    logger.error({ error }, 'Failed to get database statistics');
    throw new Error(`Database query failed: ${error.message}`);
  }
}

// Export pool for direct access if needed
export { pool };