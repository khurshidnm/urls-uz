import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

// Reuse one pool across hot reloads in development
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. See .env.example.');
  }
  return new Pool({ connectionString, max: 10 });
}

const pool = globalForDb.pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

export const pg: Database = drizzle(pool, { schema });
export { pool };
