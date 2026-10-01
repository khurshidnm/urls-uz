# Deploying to the urlss.uz test site

The whole site follows `NEXT_PUBLIC_APP_URL`: short links, bio pages, the logo text,
SEO, the Telegram bot and emails. It is read **at build time**, so set it before
`npm run build`. Moving to urls.uz later is the same steps with `https://urls.uz`.

## 1. Environment (`.env` on the server)

| Variable | urlss.uz value / where to get it |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://urlss.uz` |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | `openssl rand -hex 32` (keep it: changing it breaks 2FA secrets and sessions) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud console (see step 3) |
| `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | @BotFather (a separate test bot is recommended) |
| `TELEGRAM_WEBHOOK_SECRET` | any random string |
| `ZEPTOMAIL_TOKEN`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | ZeptoMail; sender on the verified domain, e.g. `no-reply@urlss.uz` |
| `ADMIN_PHONES` / `ADMIN_EMAILS` / `ADMIN_TELEGRAM_IDS` | super admins |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `TELEGRAM_GATEWAY_TOKEN` | optional: phone-code login |
| `GOOGLE_SITE_VERIFICATION`, `YANDEX_SITE_VERIFICATION` | optional |

## 2. Build and start

```bash
npm ci
npm run db:migrate
npm run db:seed          # demo workspace and the device-routing demo links
npm run build
npm run start            # behind HTTPS (nginx / Caddy) on urlss.uz
```

## 3. External services

- **Google OAuth**: add `https://urlss.uz/api/auth/google/callback` as an authorized redirect URI and `https://urlss.uz` as an authorized JavaScript origin.
- **Telegram login widget**: in @BotFather, `/setdomain` → `urlss.uz`.
- **Telegram bot webhook**: as a super admin, call `POST https://urlss.uz/api/webhook/telegram/setup` (or the button in API keys → webhook panel).
- **ZeptoMail**: the sending domain must stay verified (SPF/DKIM records in DNS).
- **Daily cleanup** (cron): `curl -H "Authorization: Bearer $CRON_SECRET" https://urlss.uz/api/cron/prune-clicks`
  or `npm run clicks:prune` on the server.

## 4. Smoke test after deploy

1. `https://urlss.uz` loads; the logo reads **urlss.uz**; `https://urlss.uz/robots.txt` and `/sitemap.xml` list urlss.uz.
2. Sign up with email → the code arrives → you are logged in.
3. Log in with Google and with Telegram; connect both in Settings → Kirish usullari.
4. Create a short link → open `https://urlss.uz/<slug>` on a phone → it redirects and the click appears in analytics.
5. Scan the QR on the landing page with an iPhone and an Android phone.
