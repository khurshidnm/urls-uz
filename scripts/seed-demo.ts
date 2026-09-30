/**
 * Creates (or resets) the read-only demo workspace.
 * Usage: npm run db:seed
 */
import { pg, pool } from '../src/db/client';
import { seedDemo } from '../src/db/seed-demo';

seedDemo(pg)
  .then(() => console.log('Demo workspace seeded.'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
