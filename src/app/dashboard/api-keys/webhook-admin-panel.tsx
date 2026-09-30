'use client';

import React, { useState } from 'react';
import { Bot, Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { copyToClipboard as copyToClipboardUtil } from '@/lib/utils';

/**
 * Where Telegram delivers messages for the platform's bot, and whether that's
 * set up. Platform infrastructure: shown to superadmins only.
 */
export default function WebhookAdminPanel() {
  const [webhookStatus, setWebhookStatus] = useState<{
    status?: string;
    message?: string;
    bot_configured?: boolean;
    bot?: { username?: string } | null;
    webhook_registered?: boolean;
    version?: string;
  } | null>(null);
  const [checkingWebhook, setCheckingWebhook] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  return (
      <div id="telegram-webhook" className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Bot webhook (faqat adminlar)</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v3.0.0 SPEC
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Telegram orqali havolalarni tezkor qisqartirish, QR-kodlar yaratish va statistika olish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setCheckingWebhook(true);
                try {
                  const res = await fetch('/api/webhook/telegram');
                  const data = await res.json();
                  setWebhookStatus(data);
                } catch {
                  setWebhookStatus({ status: 'error', message: 'Ulanishda xatolik yuz berdi' });
                } finally {
                  setCheckingWebhook(false);
                }
              }}
              disabled={checkingWebhook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono border border-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingWebhook ? 'animate-spin' : ''}`} />
              <span>{checkingWebhook ? 'Tekshirilmoqda...' : 'Holatni tekshirish'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Webhook Details & Setup */}
          <div className="lg:col-span-6 space-y-4 text-xs font-mono">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                Webhook Endpoint URL
              </label>
              <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-zinc-300 font-mono text-xs flex-1 truncate select-all">
                  https://urls.uz/api/webhook/telegram
                </span>
                <button
                  onClick={async () => {
                    await copyToClipboardUtil('https://urls.uz/api/webhook/telegram');
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors shrink-0"
                  title="Nusxalash"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Live Diagnosis Response */}
            {webhookStatus && (
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/90 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 uppercase">ENGINE DIAGNOSTICS</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${webhookStatus.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'}`}>
                    {webhookStatus.status?.toUpperCase()}
                  </span>
                </div>
                <div className="text-zinc-300 space-y-1 text-[11px]">
                  <div>Bot Holati: <span className="text-white font-semibold">{webhookStatus.bot_configured ? `Faol (${webhookStatus.bot?.username || 'ulangan'})` : 'TOKEN kutilmoqda'}</span></div>
                  <div>Webhook Ro‘yxati: <span className="text-white font-semibold">{webhookStatus.webhook_registered ? 'Telegram API ga ulangan' : 'Bog‘lanmagan (setWebhook zarur)'}</span></div>
                  <div>Protokol: <span className="text-indigo-400 font-semibold">{webhookStatus.version}</span></div>
                </div>
              </div>
            )}

            {/* Quick Setup cURL */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-zinc-400">
                <span>Webhookni Telegramga Biriktirish (cURL):</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed overflow-x-auto">
                <code>
                  curl -F &quot;url=https://urls.uz/api/webhook/telegram&quot; \<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://api.telegram.org/bot&lt;BOT_TOKEN&gt;/setWebhook
                </code>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-400 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Xavfsizlik:</strong> Telegram Bot API <code>X-Telegram-Bot-Api-Secret-Token</code> orqali so‘rovlar haqiqiyligi tekshiriladi.
              </span>
            </div>
          </div>

          {/* Right Column: Supported Bot Capabilities */}
          <div className="lg:col-span-6 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Qo‘llab-quvvatlanuvchi buyruqlar va xususiyatlar:
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-white">⚡ Avtomatik Qisqartirish</span>
                  <span className="text-[10px] text-zinc-500 font-mono">AUTO_DETECT</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Botga shunchaki istalgan veb-sayt havolasini yuborish kifoya. Bot uni darhol qisqartirib, QR-kod va boshqaruv tugmalari bilan qaytaradi.
                </p>
              </div>

              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-white">📊 /stats &lt;slug&gt;</span>
                  <span className="text-[10px] text-indigo-400 font-mono">LIVE_TELEMETRY</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Havola bo‘yicha jami bosishlar, Oʻzbekiston viloyatlari va manbalar (referrers) tahlilini real vaqtda chatda ko‘rish.
                </p>
              </div>

              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-white">🖼 /qr &lt;slug&gt;</span>
                  <span className="text-[10px] text-emerald-400 font-mono">PNG_GENERATOR</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Havola uchun yuqori aniqlikdagi optik QR-kodni rasm shaklida Telegramga qabul qilish.
                </p>
              </div>

              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-white">👥 Inline Query Rejimi</span>
                  <span className="text-[10px] text-purple-400 font-mono">@urls_uz_bot</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Istalgan guruh yoki chatda <code>@urls_uz_bot https://...</code> deb yozish orqali joyida qisqartirib ulashish.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
