/**
 * Crawlers and link-preview fetchers (Google, Telegram, WhatsApp, Slack, ...).
 * They aren't visitors: their requests don't count as clicks or page views.
 */
const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|discord|embedly|vkshare|skypeuripreview|headless|lighthouse|pingdom|uptime/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}
