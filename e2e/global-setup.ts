import { execSync } from 'child_process';
import { E2E_ENV } from './env';

/** Wipes the test database, applies migrations and seeds the demo workspace. */
export default function globalSetup() {
  const url = new URL(E2E_ENV.DATABASE_URL);
  if (!url.pathname.endsWith('_test')) {
    throw new Error(`Refusing to reset "${url.pathname.slice(1)}": the e2e database name must end in _test.`);
  }

  const env = { ...process.env, DATABASE_URL: E2E_ENV.DATABASE_URL, PGOPTIONS: '--client-min-messages=warning' };
  execSync(
    `psql "${E2E_ENV.DATABASE_URL}" -q -c "drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;"`,
    { stdio: 'inherit', env }
  );
  execSync('npx tsx scripts/migrate.ts', { stdio: 'inherit', env });
  execSync('npx tsx scripts/seed-demo.ts', { stdio: 'inherit', env });
}
