'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Code2,
  Terminal,
  Send,
  Sparkles,
  Bot,
  Zap,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatDate, copyToClipboard as copyToClipboardUtil } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import type { ClientApiKey } from '@/lib/client-types';

interface Props {
  initialKeys: ClientApiKey[];
}

export default function ApiKeysClient({ initialKeys }: Props) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [keys, setKeys] = useState(initialKeys);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkDemoRestricted = (actionName: string) => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent('open-demo-restriction', { detail: { actionTitle: actionName } })
      );
      return true;
    }
    return false;
  };

  // Webhook state
  const [webhookStatus, setWebhookStatus] = useState<{
    status?: string;
    version?: string;
    bot_configured?: boolean;
    bot?: { username?: string } | null;
    webhook_registered?: boolean;
    message?: string;
  } | null>(null);
  const [checkingWebhook, setCheckingWebhook] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Playground state
  const [testUrl, setTestUrl] = useState('https://t.me/urls_uz');
  const [testSlug, setTestSlug] = useState('api-test');
  // Raw API response, shown as JSON
  const [playgroundOutput, setPlaygroundOutput] = useState<unknown>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');

  const handleOpenNewKeyModal = () => {
    if (checkDemoRestricted('Yangi API kalit yaratish')) return;
    setGeneratedKey(null);
    setNewKeyModal(true);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkDemoRestricted('Yangi API kalit yaratish')) return;
    if (!keyName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.apiKey);
        setKeys([data.key, ...keys]);
        setKeyName('');
      }
    } catch {
      alert('Kalit yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (checkDemoRestricted('API kalitni bekor qilish')) return;
    if (!confirm('Haqiqatan ham ushbu API kalitini bekor qilmoqchimisiz?')) return;

    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch {
      alert('O‘chirishda xatolik yuz berdi');
    }
  };

  const copyToClipboard = async (text: string) => {
    const ok = await copyToClipboardUtil(text);
    if (ok) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const runPlaygroundTest = async () => {
    setPlaygroundLoading(true);
    setPlaygroundOutput(null);

    try {
      // Use the freshly generated key if there is one; otherwise the session cookie authenticates
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(generatedKey ? { Authorization: `Bearer ${generatedKey}` } : {}),
        },
        body: JSON.stringify({
          destination_url: testUrl,
          slug: testSlug,
          title: 'API Playground Demo',
        }),
      });
      const data = await res.json();
      setPlaygroundOutput(data);
    } catch (err) {
      setPlaygroundOutput({ success: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const curlSnippet = `curl -X POST https://urls.uz/api/links \\
  -H "Authorization: Bearer ${generatedKey || 'urls_live_YOUR_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination_url": "${testUrl}",
    "slug": "${testSlug}",
    "open_in_app": true
  }'`;

  const jsSnippet = `const res = await fetch('https://urls.uz/api/links', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${generatedKey || 'urls_live_YOUR_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    destination_url: '${testUrl}',
    slug: '${testSlug}',
    open_in_app: true
  })
});
const data = await res.json();
console.log(data.link.slug);`;

  const pythonSnippet = `import requests

url = "https://urls.uz/api/links"
headers = {
    "Authorization": "Bearer ${generatedKey || 'urls_live_YOUR_KEY'}",
    "Content-Type": "application/json"
}
payload = {
    "destination_url": "${testUrl}",
    "slug": "${testSlug}",
    "open_in_app": True
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Dasturchilar & REST API</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            API kalitlar, interaktiv playground va tizimlaringiz bilan integratsiya
          </p>
        </div>

        <button
          onClick={handleOpenNewKeyModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yangi API Kalit</span>
        </button>
      </div>

      {/* API Keys Table or Empty State */}
      <div className="bg-zinc-900/40 p-5 sm:p-6 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">Faol API Kalitlar</h3>
          <span className="text-[11px] font-mono text-zinc-500">{keys.length} ta kalit</span>
        </div>

        {keys.length > 0 ? (
          <div>
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-medium">Nomi</th>
                    <th className="pb-3 font-medium">Prefiks</th>
                    <th className="pb-3 font-medium">Yaratilgan sana</th>
                    <th className="pb-3 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 font-medium text-white">{k.name}</td>
                      <td className="py-3 font-mono text-zinc-300">{k.key_prefix}••••••••••••</td>
                      <td className="py-3 text-zinc-500">{formatDate(k.created_at)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (sm:hidden) */}
            <div className="sm:hidden space-y-2.5">
              {keys.map((k) => (
                <div key={k.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-xs">{k.name}</span>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">{k.key_prefix}••••••••••••</span>
                    <span className="text-zinc-500">{formatDate(k.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-5 h-5 text-zinc-300" />
            </div>
            <div className="text-xs font-semibold text-white mb-1">Hozircha faol API kalitlar yo‘q</div>
            <p className="text-[11px] text-zinc-400 mb-4 max-w-xs mx-auto leading-relaxed">
              urls.uz API dan foydalanish uchun birinchi xavfsiz kalitingizni yarating.
            </p>
            <button
              onClick={handleOpenNewKeyModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi API Kalit</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive API Playground */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Interaktiv API Sinov Maydoni (Playground)</h3>
            <p className="text-xs text-slate-400">Brauzerdan turib API so‘rovlarini real vaqtda sinab ko‘ring</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target URL</label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Slug</label>
              <input
                type="text"
                value={testSlug}
                onChange={(e) => setTestSlug(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <button
              onClick={runPlaygroundTest}
              disabled={playgroundLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{playgroundLoading ? 'So‘rov yuborilmoqda...' : 'So‘rovni Yuborish (POST)'}</span>
            </button>

            {/* Output view */}
            {playgroundOutput !== null && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono overflow-x-auto text-emerald-400 max-h-48">
                <pre>{JSON.stringify(playgroundOutput, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Right Code Snippets */}
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
              <div className="flex gap-2 text-xs">
                {(['curl', 'js', 'python'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-2.5 py-1 rounded-lg uppercase font-semibold text-[11px] transition-colors ${
                      activeCodeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    activeCodeTab === 'curl'
                      ? curlSnippet
                      : activeCodeTab === 'js'
                      ? jsSnippet
                      : pythonSnippet
                  )
                }
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nusxalash</span>
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto flex-1 leading-relaxed">
              <code>
                {activeCodeTab === 'curl'
                  ? curlSnippet
                  : activeCodeTab === 'js'
                  ? jsSnippet
                  : pythonSnippet}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Telegram Bot Webhook (v3) Section */}
      <div id="telegram-webhook" className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Telegram Bot Webhook (v3)</h3>
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

      {/* Create Key Modal */}
      <Modal
        isOpen={newKeyModal}
        onClose={() => setNewKeyModal(false)}
        title="Yangi API Kalit Yaratish"
      >
        {!generatedKey ? (
          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kalit nomi</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Masalan, Telegram Bot Backend yoki Mobil Ilova"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNewKeyModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl"
              >
                {loading ? 'Yaratilmoqda...' : 'Yaratish'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Kalit muvaffaqiyatli yaratildi</h4>
            <p className="text-xs text-amber-400">
              Iltimos, ushbu kalitni xavfsiz joyga saqlang. Bu kalit qayta ko‘rsatilmaydi!
            </p>

            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="font-mono text-xs text-white truncate flex-1 text-left">{generatedKey}</span>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={() => setNewKeyModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
            >
              Tushundim va saqladim
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
