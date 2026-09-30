import { NextRequest, NextResponse } from 'next/server';
import { TelegramBot } from '@/lib/telegram-bot';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'superadmin'
    ? null
    : NextResponse.json({ success: false, error: 'Faqat super admin ruxsatiga ega.' }, { status: 403 });
}

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://urls.uz';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!TelegramBot.isConfigured) {
    return NextResponse.json(
      {
        configured: false,
        error: 'TELEGRAM_BOT_TOKEN .env faylida belgilanmagan',
        instructions: '@BotFather orqali bot oching va tokenini TELEGRAM_BOT_TOKEN sifatida kiriting.',
      },
      { status: 400 }
    );
  }

  const botInfo = await TelegramBot.getMe();
  const webhookInfo = await TelegramBot.getWebhookInfo();

  return NextResponse.json({
    configured: true,
    bot: botInfo,
    webhook_info: webhookInfo,
    suggested_webhook_url: `${APP_URL}/api/webhook/telegram`,
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!TelegramBot.isConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: 'TELEGRAM_BOT_TOKEN sozlanmagan',
      },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'set';

    if (action === 'delete') {
      const res = await TelegramBot.deleteWebhook(true);
      return NextResponse.json({ success: true, result: res });
    }

    const webhookUrl = `${APP_URL}/api/webhook/telegram`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    const res = await TelegramBot.setWebhook(webhookUrl, secretToken);

    return NextResponse.json({
      success: res.ok,
      result: res,
      webhook_url: webhookUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
