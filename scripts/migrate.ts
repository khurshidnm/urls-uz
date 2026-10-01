/**
 * Applies pending Drizzle migrations from ./drizzle.
 * Usage: npm run db:migrate   (reads DATABASE_URL from the environment or .env)
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pg, pool } from '../src/db/client';

async function main() {
  await migrate(pg, { migrationsFolder: './drizzle' });
  console.log('Migrations applied.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
