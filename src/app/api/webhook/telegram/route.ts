import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TelegramBot, TelegramInlineButton } from '@/lib/telegram-bot';
import { isValidSlug, isReservedSlug, generateRandomSlug, formatNumber } from '@/lib/utils';
import { detectAndBuildDeepLink } from '@/lib/deep-link';
import { checkUrlSafety } from '@/lib/anti-phishing';
import { pickTelegramFields, upsertTelegramUser } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://urls.uz';

/**
 * Helper to generate unique 5-char slug
 */
async function getUniqueSlug(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = generateRandomSlug(i > 8 ? 6 : 5);
    if (!isReservedSlug(candidate) && !(await db.isSlugTaken(candidate))) {
      return candidate;
    }
  }
  return 'u_' + Math.random().toString(36).substring(2, 8);
}

type TelegramFrom = { id?: number; first_name?: string; last_name?: string; username?: string };

/**
 * Telegram guarantees who sent a webhook update, so bot users get a real
 * account and personal workspace; their links then show up in the dashboard.
 */
async function workspaceFor(from: TelegramFrom): Promise<{ userId: string; workspaceId: string } | null> {
  if (!from?.id) return null;
  const user = await upsertTelegramUser(pickTelegramFields(from));
  const [membership] = await db.listWorkspacesForUser(user.id);
  return membership ? { userId: user.id, workspaceId: membership.workspace.id } : null;
}

/** User-supplied text is interpolated into HTML-formatted bot messages. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * GET /api/webhook/telegram
 * Health check & Webhook Diagnostic telemetry
 */
export async function GET(req: NextRequest) {
  try {
    const isBotConfigured = TelegramBot.isConfigured;
    const botInfo = isBotConfigured ? await TelegramBot.getMe() : null;
    const webhookInfo = isBotConfigured ? await TelegramBot.getWebhookInfo() : null;

    return NextResponse.json({
      status: 'online',
      version: 'v3.0.0',
      service: 'urls.uz Telegram Bot Webhook Engine',
      app_url: APP_URL,
      webhook_endpoint: `${APP_URL}/api/webhook/telegram`,
      bot_configured: isBotConfigured,
      bot: botInfo
        ? {
            id: botInfo.id,
            first_name: botInfo.first_name,
            username: botInfo.username,
          }
        : null,
      webhook_registered: Boolean(webhookInfo?.url),
      webhook_info: webhookInfo,
      supported_commands: [
        { command: '/start', description: 'Botni ishga tushirish va xush kelibsiz xabari' },
        { command: '/shorten <url> [slug]', description: 'Havolani qisqartirish' },
        { command: '/stats <slug>', description: 'Havolaning real vaqt bosishlar statistikasi' },
        { command: '/qr <slug>', description: 'Havola uchun yuqori sifatli QR-kod olish' },
        { command: '/mylinks', description: 'Siz yaratgan so‘nggi qisqa havolalar ro‘yxati' },
        { command: '/help', description: 'Yordam va qo‘llanma' },
      ],
    });
  } catch (err) {
    console.error('GET /api/webhook/telegram failed:', err);
    return NextResponse.json({ status: 'error', message: 'Server xatosi' }, { status: 500 });
  }
}

/**
 * POST /api/webhook/telegram
 * Telegram Bot Update Dispatcher
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Webhook Secret Token Verification (v3 Security Specification)
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    if (!TelegramBot.verifySecretToken(secretHeader)) {
      return NextResponse.json({ error: 'Ruxsatsiz webhook so‘rovi' }, { status: 403 });
    }

    const update = await req.json();

    // -------------------------------------------------------------
    // A. MESSAGE HANDLER
    // -------------------------------------------------------------
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const from: TelegramFrom = msg.from || {};

      if (!chatId) {
        return NextResponse.json({ ok: true });
      }

      // 1. /start [payload]
      if (text.startsWith('/start')) {
        const payload = text.split(' ')[1]?.trim();

        // Agar /start link_xyz shaklida havolaga bog'langan bo'lsa
        if (payload && payload.startsWith('stats_')) {
          const targetSlug = payload.replace('stats_', '');
          await sendStatsMessage(chatId, from, targetSlug);
          return NextResponse.json({ ok: true });
        }

        const welcomeText =
          `👋 <b>Assalomu alaykum, ${from.first_name || 'Hurmatli foydalanuvchi'}!</b>\n\n` +
          `<b>urls.uz</b> — Oʻzbekistonning zamonaviy havola infratuzilmasi rasmiy Telegram botiga xush kelibsiz.\n\n` +
          `⚡ <b>Imkoniyatlar:</b>\n` +
          `• Menga istalgan <b>uzun havolani</b> yuboring — bir zumda qisqartirib beraman\n` +
          `• Har bir havola uchun <b>Dinamik QR-kod</b> va <b>Smart Deep Link</b>\n` +
          `• Viloyatlar kesimida real vaqtli <b>tahlil va statistika</b>\n\n` +
          `💡 <i>Sinab ko‘ring: shunchaki istalgan veb-sayt havolasini chatga yuboring!</i>`;

        const keyboard: TelegramInlineButton[][] = [
          [
            { text: '🌐 urls.uz Sayti', url: APP_URL },
            { text: '📊 Dashboard', url: `${APP_URL}/dashboard` },
          ],
          [
            { text: '📚 Yordam & Buyruqlar', callback_data: 'cmd:help' },
            { text: '📋 Mening havolalarim', callback_data: 'cmd:mylinks' },
          ],
        ];

        await TelegramBot.sendMessage(chatId, welcomeText, {
          reply_markup: { inline_keyboard: keyboard },
        });
        return NextResponse.json({ ok: true });
      }

      // 2. /help
      if (text.startsWith('/help')) {
        await sendHelpMessage(chatId);
        return NextResponse.json({ ok: true });
      }

      // 3. /stats <slug>
      if (text.startsWith('/stats')) {
        const slug = text.split(/\s+/)[1]?.trim().toLowerCase();
        if (!slug) {
          await TelegramBot.sendMessage(
            chatId,
            `ℹ️ <b>Statistikani ko‘rish uchun slug kiriting:</b>\nMisol: <code>/stats promo2026</code>`
          );
          return NextResponse.json({ ok: true });
        }

        await sendStatsMessage(chatId, from, slug);
        return NextResponse.json({ ok: true });
      }

      // 4. /qr <slug_or_url>
      if (text.startsWith('/qr')) {
        const target = text.split(/\s+/)[1]?.trim();
        if (!target) {
          await TelegramBot.sendMessage(
            chatId,
            `ℹ️ <b>QR-kod olish uchun slug yoki havola kiriting:</b>\nMisol: <code>/qr promo2026</code>`
          );
          return NextResponse.json({ ok: true });
        }

        await sendQrCodeMessage(chatId, target);
        return NextResponse.json({ ok: true });
      }

      // 5. /mylinks
      if (text.startsWith('/mylinks')) {
        await sendUserLinksMessage(chatId, from);
        return NextResponse.json({ ok: true });
      }

      // 6. /shorten <url> [custom_slug]
      if (text.startsWith('/shorten')) {
        const parts = text.split(/\s+/).slice(1);
        const targetUrl = parts[0]?.trim();
        const customSlug = parts[1]?.trim().toLowerCase();

        if (!targetUrl) {
          await TelegramBot.sendMessage(
            chatId,
            `⚠️ <b>Qisqartirish uchun havola kiriting:</b>\nMisol: <code>/shorten https://kun.uz yangilik</code>`
          );
          return NextResponse.json({ ok: true });
        }

        await processAndCreateShortLink(chatId, from, targetUrl, customSlug);
        return NextResponse.json({ ok: true });
      }

      // 7. Plain URL Message (Avtomatik qisqartirish)
      // Detect if user sent a URL directly: https://..., http://..., or t.me/...
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/i;
      const match = text.match(urlRegex);

      if (match) {
        let extractedUrl = match[0];
        if (extractedUrl.startsWith('www.')) {
          extractedUrl = 'https://' + extractedUrl;
        } else if (extractedUrl.startsWith('t.me/')) {
          extractedUrl = 'https://' + extractedUrl;
        }

        await processAndCreateShortLink(chatId, from, extractedUrl);
        return NextResponse.json({ ok: true });
      }

      // Oddiy noma'lum matn yuborilganda
      await TelegramBot.sendMessage(
        chatId,
        `💡 Qisqa havola yaratish uchun menga to‘g‘ridan-to‘g‘ri veb-sayt manzilini yuboring (masalan: <code>https://sayt.uz/promo</code>) yoki /help buyrug‘idan foydalaning.`
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // B. CALLBACK QUERY HANDLER (Inline Tugmalar)
    // -------------------------------------------------------------
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = (cb.data || '').trim();
      const from: TelegramFrom = cb.from || {};

      if (!chatId) {
        await TelegramBot.answerCallbackQuery(cb.id);
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('stats:')) {
        const slug = data.replace('stats:', '');
        await sendStatsMessage(chatId, from, slug);
        await TelegramBot.answerCallbackQuery(cb.id, { text: `Statistika yangilandi` });
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('qr:')) {
        const slug = data.replace('qr:', '');
        await sendQrCodeMessage(chatId, slug);
        await TelegramBot.answerCallbackQuery(cb.id, { text: `QR-kod tayyorlandi` });
        return NextResponse.json({ ok: true });
      }

      if (data === 'cmd:help') {
        await sendHelpMessage(chatId);
        await TelegramBot.answerCallbackQuery(cb.id);
        return NextResponse.json({ ok: true });
      }

      if (data === 'cmd:mylinks') {
        await sendUserLinksMessage(chatId, from);
        await TelegramBot.answerCallbackQuery(cb.id);
        return NextResponse.json({ ok: true });
      }

      await TelegramBot.answerCallbackQuery(cb.id);
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // C. INLINE QUERY HANDLER (@urls_uz_bot https://...)
    // -------------------------------------------------------------
    if (update.inline_query) {
      const iq = update.inline_query;
      const query = (iq.query || '').trim();

      const owner = await workspaceFor(iq.from || {});
      if (owner && query && (query.startsWith('http://') || query.startsWith('https://')) && checkUrlSafety(query).isSafe) {
        const slug = await getUniqueSlug();
        const shortUrl = `${APP_URL}/${slug}`;

        // Create link on the fly for inline usage
        await db.createLink({
          title: `Inline Telegram Link`,
          destination_url: query,
          slug,
          workspaceId: owner.workspaceId,
          createdBy: owner.userId,
          open_in_app: detectAndBuildDeepLink(query).isDeepLinkable,
        });

        const results = [
          {
            type: 'article',
            id: `short_${slug}`,
            title: `🔗 Qisqa havola: ${shortUrl}`,
            description: `Asl manzil: ${query}`,
            input_message_content: {
              message_text: `🔗 <b>Qisqa havola:</b> ${shortUrl}\n🎯 <b>Manzil:</b> ${escapeHtml(query)}`,
              parse_mode: 'HTML',
            },
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌐 Havolani ochish', url: shortUrl }],
              ],
            },
          },
        ];

        await TelegramBot.answerInlineQuery(iq.id, results, { cache_time: 5 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram Bot Webhook unhandled exception:', err);
    // Return 200 OK so Telegram doesn't retry broken updates repeatedly
    return NextResponse.json({ ok: true });
  }
}

// =================================================================
// HELPER FUNCTIONS FOR CLEAN MODULAR LOGIC
// =================================================================

/**
 * Havolani qisqartirib, Telegram foydalanuvchisiga chiroyli javob yuborish
 */
async function processAndCreateShortLink(
  chatId: number,
  from: TelegramFrom,
  destinationUrl: string,
  customSlug?: string
) {
  const owner = await workspaceFor(from);
  if (!owner) return;

  const safety = checkUrlSafety(destinationUrl);
  if (!safety.isSafe) {
    await TelegramBot.sendMessage(chatId, `⛔️ ${escapeHtml(safety.reason || 'Ushbu havola xavfsizlik filtri tomonidan bloklandi.')}`);
    return;
  }

  let finalSlug = customSlug;

  if (finalSlug) {
    if (!isValidSlug(finalSlug)) {
      await TelegramBot.sendMessage(
        chatId,
        `❌ <b>Yaroqsiz slug:</b> <code>${escapeHtml(finalSlug)}</code>\n` +
          `Slug kamida 3 ta belgidan iborat bo‘lishi va faqat harf, raqam yoki tire o‘z ichiga olishi kerak.`
      );
      return;
    }

    if (isReservedSlug(finalSlug)) {
      await TelegramBot.sendMessage(
        chatId,
        `⚠️ <code>${finalSlug}</code> tizim tomonidan band qilingan. Boshqa nom tanlang.`
      );
      return;
    }

    if (await db.isSlugTaken(finalSlug)) {
      await TelegramBot.sendMessage(
        chatId,
        `⚠️ <code>${finalSlug}</code> slugi allaqachon band qilingan. Boshqa nom tanlang.`
      );
      return;
    }
  } else {
    finalSlug = await getUniqueSlug();
  }

  // 10 ta faol havola bepul limiti tekshiruvi
  const FREE_PLAN_LIMIT = 10;
  const userLinks = await db.getAllLinks(owner.workspaceId);
  const activeCount = userLinks.filter((l) => !l.is_archived).length;
  if (activeCount >= FREE_PLAN_LIMIT) {
    await TelegramBot.sendMessage(
      chatId,
      `⚠️ <b>Bepul tarif limiti to‘lgan (${activeCount}/${FREE_PLAN_LIMIT} ta faol havola).</b>\n\n` +
        `Yangi havola yaratish uchun avval yaratilgan keraksiz havolalarni dashboard orqali arxivlang yoki o‘chiring.\n\n` +
        `🚀 <i>Cheksiz havolalar va kengaytirilgan imkoniyatlarga ega Pro tarif tez kunda ishga tushadi!</i>`
    );
    return;
  }

  // Deep Link aniqlash
  const deepLinkInfo = detectAndBuildDeepLink(destinationUrl);
  const isOpenInApp = deepLinkInfo.isDeepLinkable;

  const newLink = await db.createLink({
    title: `Telegram (${finalSlug})`,
    destination_url: destinationUrl,
    slug: finalSlug,
    workspaceId: owner.workspaceId,
    createdBy: owner.userId,
    open_in_app: isOpenInApp,
  });

  const shortUrl = `${APP_URL}/${newLink.slug}`;

  const messageText =
    `✅ <b>Havolangiz muvaffaqiyatli qisqartirildi!</b>\n\n` +
    `🔗 <b>Qisqa havola:</b> <code>${shortUrl}</code>\n` +
    `🎯 <b>Asl manzil:</b> <code>${escapeHtml(destinationUrl)}</code>\n` +
    (isOpenInApp ? `📱 <b>Smart Deep Link:</b> Yoqilgan (${deepLinkInfo.appName})\n` : '') +
    `\n<i>Quyidagi tugmalar orqali havolani ulashing, statistika yoki QR-kodini oling:</i>`;

  const inlineKeyboard: TelegramInlineButton[][] = [
    [
      { text: '📋 Do‘stlarga ulashish', url: `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent('Qisqa havola:')}` },
      { text: '🌐 Ochish', url: shortUrl },
    ],
    [
      { text: '🖼 QR Kod', callback_data: `qr:${newLink.slug}` },
      { text: '📊 Statistika', callback_data: `stats:${newLink.slug}` },
    ],
  ];

  await TelegramBot.sendMessage(chatId, messageText, {
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
}

/**
 * Havola bo'yicha real vaqt statistikasini yuborish
 */
async function sendStatsMessage(chatId: number, from: TelegramFrom, slug: string) {
  const owner = await workspaceFor(from);
  const link = await db.getLinkBySlug(slug);
  // Statistics are private: only links in the sender's own workspace
  if (!owner || !link || link.workspace_id !== owner.workspaceId) {
    await TelegramBot.sendMessage(
      chatId,
      `❌ <code>${escapeHtml(slug)}</code> nomli havola sizning havolalaringiz orasida topilmadi.`
    );
    return;
  }

  const analytics = await db.getLinkAnalytics(link.id);
  const shortUrl = `${APP_URL}/${link.slug}`;
  const totalClicks = link.click_count || 0;

  let regionsText = '—';
  if (analytics?.regions && analytics.regions.length > 0) {
    regionsText = analytics.regions
      .slice(0, 4)
      .map((r, i) => `${i + 1}. ${r.region}: <b>${r.count}</b>`)
      .join('\n');
  }

  let devicesText = '—';
  if (analytics?.devices && analytics.devices.length > 0) {
    devicesText = analytics.devices
      .map((d) => `• ${d.device_type}: <b>${d.count}</b>`)
      .join('\n');
  }

  let referrersText = '—';
  if (analytics?.referrers && analytics.referrers.length > 0) {
    referrersText = analytics.referrers
      .slice(0, 3)
      .map((ref) => `• ${ref.referer}: <b>${ref.count}</b>`)
      .join('\n');
  }

  const statsMessage =
    `📊 <b>Havola Tahlili & Telemetriyasi</b>\n\n` +
    `🔗 <b>Qisqa havola:</b> <code>${shortUrl}</code>\n` +
    `🎯 <b>Asl manzil:</b> <code>${escapeHtml(link.destination_url)}</code>\n` +
    `👁 <b>Jami bosishlar:</b> <b>${formatNumber(totalClicks)}</b> ta\n` +
    `📅 <b>Yaratilgan sana:</b> ${link.created_at.toISOString().slice(0, 10)}\n\n` +
    `🇺🇿 <b>Viloyatlar kesimida:</b>\n${regionsText}\n\n` +
    `📱 <b>Qurilmalar turi:</b>\n${devicesText}\n\n` +
    `🌐 <b>Trafik manbalari (Referrers):</b>\n${referrersText}`;

  const keyboard: TelegramInlineButton[][] = [
    [
      { text: '🔄 Yangilash', callback_data: `stats:${link.slug}` },
      { text: '🖼 QR Kod', callback_data: `qr:${link.slug}` },
    ],
    [
      { text: '📈 Veb Dashboardda ko‘rish', url: `${APP_URL}/dashboard/analytics?link_id=${link.id}` },
    ],
  ];

  await TelegramBot.sendMessage(chatId, statsMessage, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * QR Kod rasmini generatsiya qilib jo'natish
 */
async function sendQrCodeMessage(chatId: number, target: string) {
  let targetUrl = target;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `${APP_URL}/${target}`;
  }

  try {
    const qrBuffer = await TelegramBot.generateQrBuffer(targetUrl);
    const caption =
      `🖼 <b>Dinamik QR-Kod</b>\n\n` +
      `🔗 <b>Havola:</b> <code>${targetUrl}</code>\n` +
      `⚡ <i>Smartfon kamerasi orqali skanerlang!</i>`;

    const keyboard: TelegramInlineButton[][] = [
      [
        { text: '🌐 Havolani ochish', url: targetUrl },
        { text: '📊 Statistika', callback_data: `stats:${target.replace(`${APP_URL}/`, '')}` },
      ],
    ];

    await TelegramBot.sendPhoto(chatId, qrBuffer, caption, {
      reply_markup: { inline_keyboard: keyboard },
      filename: `qr-${Date.now()}.png`,
    });
  } catch (err) {
    console.error('QR generation error:', err);
    await TelegramBot.sendMessage(chatId, `❌ QR-kod yaratishda xatolik yuz berdi.`);
  }
}

/**
 * Foydalanuvchining so'nggi havolalari
 */
async function sendUserLinksMessage(chatId: number, from: TelegramFrom) {
  const owner = await workspaceFor(from);
  const links = owner ? await db.getAllLinks(owner.workspaceId) : [];

  if (!links || links.length === 0) {
    await TelegramBot.sendMessage(
      chatId,
      `📭 <b>Siz hali birorta ham havola qisqartirmagansiz.</b>\n\n` +
        `Havola qisqartirish uchun menga istalgan veb-sayt manzilini yuboring!`
    );
    return;
  }

  let text = `📋 <b>Sizning so‘nggi havolalaringiz (Jami: ${links.length} ta):</b>\n\n`;

  const topLinks = links.slice(0, 6);
  topLinks.forEach((l, idx) => {
    const shortUrl = `${APP_URL}/${l.slug}`;
    text += `${idx + 1}. <code>${shortUrl}</code>\n`;
    text += `   ↳ 🎯 ${l.destination_url.slice(0, 40)}${l.destination_url.length > 40 ? '...' : ''}\n`;
    text += `   ↳ 👁 Bosishlar: <b>${l.click_count || 0}</b> ta (/stats ${l.slug})\n\n`;
  });

  const keyboard: TelegramInlineButton[][] = [
    [{ text: '📊 Barcha havolalar (Dashboard)', url: `${APP_URL}/dashboard/links` }],
  ];

  await TelegramBot.sendMessage(chatId, text, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * /help buyrug'i qo'llanmasi
 */
async function sendHelpMessage(chatId: number) {
  const helpText =
    `📖 <b>urls.uz Telegram Bot — Qo‘llanma</b>\n\n` +
    `🤖 <b>Asosiy buyruqlar:</b>\n` +
    `• <code>/start</code> — Botni qayta ishga tushirish\n` +
    `• <code>/shorten [url] [slug]</code> — Maxsus nom bilan havola yaratish\n` +
    `• <code>/stats [slug]</code> — Havola statistikasini tekshirish\n` +
    `• <code>/qr [slug]</code> — Havolaning QR-kodini olish\n` +
    `• <code>/mylinks</code> — Havolalaringiz ro‘yxati\n\n` +
    `⚡ <b>Tezkor qisqartirish:</b>\n` +
    `Shunchaki istalgan uzun havolani botga yuboring, u avtomatik qisqartiriladi.\n\n` +
    `👥 <b>Inline rejim:</b>\n` +
    `Istalgan chatda <code>@urls_uz_bot https://...</code> deb yozing va havolani joyida qisqartirib ulashing!`;

  const keyboard: TelegramInlineButton[][] = [
    [{ text: '🌐 urls.uz Dashboard', url: `${APP_URL}/dashboard` }],
  ];

  await TelegramBot.sendMessage(chatId, helpText, {
    reply_markup: { inline_keyboard: keyboard },
  });
}
