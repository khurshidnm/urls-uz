/**
 * Environment for the e2e server. The bot token and secret are fake, so tests
 * can sign Telegram logins themselves and the real ones are never used.
 */
export const E2E_ENV = {
  DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/urls_uz_test',
  TELEGRAM_BOT_TOKEN: 'e2e-test-bot-token',
  TELEGRAM_WEBHOOK_SECRET: 'e2e-webhook-secret',
  AUTH_SECRET: 'e2e-auth-secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3100',
  // Never talk to real providers from tests
  TELEGRAM_GATEWAY_TOKEN: '',
  GOOGLE_CLIENT_ID: 'e2e-google-client',
  GOOGLE_CLIENT_SECRET: 'e2e-google-secret',
  ADMIN_EMAILS: '',
  // The admin-panel tests log in as this Telegram user
  ADMIN_TELEGRAM_IDS: '900000990',
  // Clicks are written in batches after the redirect; keep the wait short in tests
  CLICK_FLUSH_MS: '50',
  CRON_SECRET: 'e2e-cron-secret',
};
