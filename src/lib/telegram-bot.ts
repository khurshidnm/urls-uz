import crypto from 'crypto';
import QRCode from 'qrcode';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

export interface TelegramSendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  reply_to_message_id?: number;
  reply_markup?: {
    inline_keyboard?: TelegramInlineButton[][];
    keyboard?: any[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    remove_keyboard?: boolean;
  };
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export const TelegramBot = {
  get isConfigured(): boolean {
    return Boolean(BOT_TOKEN && BOT_TOKEN.includes(':'));
  },

  /**
   * Verify Telegram Webhook Secret Token in constant time
   */
  verifySecretToken(headerSecret: string | null, expectedSecret?: string): boolean {
    const secret = expectedSecret || process.env.TELEGRAM_WEBHOOK_SECRET;
    // Without a secret anyone could post fake updates; allow that only in local development
    if (!secret) return process.env.NODE_ENV !== 'production';
    if (!headerSecret) return false;

    try {
      const a = Buffer.from(headerSecret);
      const b = Buffer.from(secret);
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  /**
   * Fetch information about current bot account
   */
  async getMe() {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${TELEGRAM_API}/getMe`);
      const data = await res.json();
      return data.ok ? data.result : null;
    } catch (err) {
      console.error('Telegram getMe error:', err);
      return null;
    }
  },

  /**
   * Send text message with HTML/Markdown and inline buttons
   */
  async sendMessage(
    chatId: number | string,
    text: string,
    options: TelegramSendMessageOptions = {}
  ) {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options.parse_mode ?? 'HTML',
          disable_web_page_preview: options.disable_web_page_preview ?? false,
          reply_to_message_id: options.reply_to_message_id,
          reply_markup: options.reply_markup,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('Telegram sendMessage error:', err);
      return null;
    }
  },

  /**
   * Send photo using image URL or binary Buffer
   */
  async sendPhoto(
    chatId: number | string,
    photoBufferOrUrl: Buffer | string,
    caption?: string,
    options: {
      reply_markup?: TelegramSendMessageOptions['reply_markup'];
      filename?: string;
    } = {}
  ) {
    if (!this.isConfigured) return null;

    try {
      if (typeof photoBufferOrUrl === 'string' && photoBufferOrUrl.startsWith('http')) {
        // Photo via external URL
        const res = await fetch(`${TELEGRAM_API}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: photoBufferOrUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: options.reply_markup,
          }),
        });
        return await res.json();
      }

      // Photo via Buffer upload (Multipart Form Data)
      const buffer = typeof photoBufferOrUrl === 'string'
        ? Buffer.from(photoBufferOrUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        : photoBufferOrUrl;

      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      if (caption) formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      if (options.reply_markup) {
        formData.append('reply_markup', JSON.stringify(options.reply_markup));
      }

      const blob = new Blob([buffer as any], { type: 'image/png' });
      formData.append('photo', blob, options.filename || 'urls-uz-qr.png');

      const res = await fetch(`${TELEGRAM_API}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (err) {
      console.error('Telegram sendPhoto error:', err);
      return null;
    }
  },

  /**
   * Acknowledge and stop loading state for Telegram callback queries
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    options: {
      text?: string;
      show_alert?: boolean;
      url?: string;
    } = {}
  ) {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: options.text,
          show_alert: options.show_alert,
          url: options.url,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('Telegram answerCallbackQuery error:', err);
      return null;
    }
  },

  /**
   * Answer Telegram Inline Queries (@urls_uz_bot https://...)
   */
  async answerInlineQuery(
    inlineQueryId: string,
    results: any[],
    options: { cache_time?: number; is_personal?: boolean } = {}
  ) {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${TELEGRAM_API}/answerInlineQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inline_query_id: inlineQueryId,
          results,
          cache_time: options.cache_time ?? 10,
          is_personal: options.is_personal ?? true,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('Telegram answerInlineQuery error:', err);
      return null;
    }
  },

  /**
   * Configure Telegram Webhook with v3 secret token
   */
  async setWebhook(webhookUrl: string, secretToken?: string) {
    if (!this.isConfigured) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN sozlanmagan' };
    }
    try {
      const payload: Record<string, any> = {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query'],
        drop_pending_updates: false,
      };
      if (secretToken) {
        payload.secret_token = secretToken;
      }

      const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, description: err.message };
    }
  },

  /**
   * Check current Webhook status from Telegram
   */
  async getWebhookInfo(): Promise<TelegramWebhookInfo | null> {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
      const data = await res.json();
      return data.ok ? data.result : null;
    } catch (err) {
      console.error('Telegram getWebhookInfo error:', err);
      return null;
    }
  },

  /**
   * Delete existing Telegram Webhook
   */
  async deleteWebhook(dropPendingUpdates = false) {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: dropPendingUpdates }),
      });
      return await res.json();
    } catch (err) {
      console.error('Telegram deleteWebhook error:', err);
      return null;
    }
  },

  /**
   * Generate High-Resolution QR Code Buffer for Telegram Photos
   */
  async generateQrBuffer(text: string): Promise<Buffer> {
    return QRCode.toBuffer(text, {
      type: 'png',
      width: 540,
      margin: 2,
      color: {
        dark: '#09090b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  },
};
