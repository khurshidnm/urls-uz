import { execSync } from 'child_process';
import fs from 'fs';
import http from 'http';
import { E2E_ENV, MAIL_OUTBOX } from './env';

/** Wipes the test database, applies migrations and seeds the demo workspace. */
/**
 * A stand-in for ZeptoMail's send API: records every message (with its
 * Authorization header) so tests can read the codes the app emails.
 */
function startFakeZeptoMail(): Promise<http.Server> {
  fs.writeFileSync(MAIL_OUTBOX, '');
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      fs.appendFileSync(MAIL_OUTBOX, JSON.stringify({ path: req.url, authorization: req.headers.authorization, body: JSON.parse(raw || '{}') }) + '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: [{ code: 'EM_104', message: 'OK' }], message: 'OK' }));
    });
  });
  return new Promise((resolve) => server.listen(Number(new URL(E2E_ENV.ZEPTOMAIL_API_URL).port), () => resolve(server)));
}

export default async function globalSetup() {
  const mailServer = await startFakeZeptoMail();

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
  return () => new Promise<void>((resolve) => mailServer.close(() => resolve()));
}
