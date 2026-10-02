'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Terminal,
  Send,
  Sparkles,
} from 'lucide-react';
import { formatDate, copyToClipboard as copyToClipboardUtil } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import type { ClientApiKey } from '@/lib/client-types';
import WebhookAdminPanel from './webhook-admin-panel';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

interface Props {
  initialKeys: ClientApiKey[];
  /** The plan includes the REST API (keys work only then). */
  apiAccess: boolean;
  isAdmin: boolean;
}

export default function ApiKeysClient({ initialKeys, apiAccess, isAdmin }: Props) {
  const { tr, locale } = useLanguage();
  const { user } = useAuth();
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

  // Playground state
  const [testUrl, setTestUrl] = useState('https://t.me/urls_uz');
  const [testSlug, setTestSlug] = useState('api-test');
  // Raw API response, shown as JSON
  const [playgroundOutput, setPlaygroundOutput] = useState<unknown>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');

  const handleOpenNewKeyModal = () => {
    if (checkDemoRestricted(tr('Yangi API kalit yaratish', 'Создание API-ключа', 'Creating an API key'))) return;
    setGeneratedKey(null);
    setNewKeyModal(true);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkDemoRestricted(tr('Yangi API kalit yaratish', 'Создание API-ключа', 'Creating an API key'))) return;
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
      alert(tr('Kalit yaratishda xatolik yuz berdi', 'Не удалось создать ключ', 'Couldn’t create the key'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (checkDemoRestricted(tr('API kalitni bekor qilish', 'Отзыв API-ключа', 'Revoking an API key'))) return;
    if (!confirm(tr('Haqiqatan ham ushbu API kalitini bekor qilmoqchimisiz?', 'Отозвать этот API-ключ?', 'Revoke this API key?'))) return;

    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch {
      alert(tr('O‘chirishda xatolik yuz berdi', 'Не удалось удалить', 'Couldn’t delete'));
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

  const curlSnippet = `curl -X POST ${SITE_URL}/api/links \\
  -H "Authorization: Bearer ${generatedKey || 'urls_live_YOUR_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination_url": "${testUrl}",
    "slug": "${testSlug}",
    "open_in_app": true
  }'`;

  const jsSnippet = `const res = await fetch('${SITE_URL}/api/links', {
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

url = "${SITE_URL}/api/links"
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
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{tr('Dasturchilar & REST API', 'Разработчикам: REST API', 'Developers & REST API')}</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {tr('API kalitlar, interaktiv playground va tizimlaringiz bilan integratsiya', 'API-ключи, интерактивная песочница и интеграция с вашими системами', 'API keys, an interactive playground and integration with your systems')}
          </p>
        </div>

        {apiAccess || !user ? (
          <button
            onClick={handleOpenNewKeyModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr('Yangi API Kalit', 'Новый API-ключ', 'New API key')}</span>
          </button>
        ) : (
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{tr('Pro tarifga o‘tish', 'Перейти на Pro', 'Upgrade to Pro')}</span>
          </Link>
        )}
      </div>

      {/* REST API is a paid feature; the Telegram bot below is free */}
      {user && !apiAccess && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-indigo-100/90 leading-relaxed">
            <p className="font-semibold text-white mb-0.5">{tr('REST API — Pro va Biznes tariflarida', 'REST API — на тарифах Pro и Бизнес', 'REST API — on the Pro and Business plans')}</p>
            <p>
              {tr('API kalitlar orqali o‘z tizimlaringizdan havola yaratish va statistikani olish pullik tariflarda mavjud.', 'Создание ссылок и получение статистики из ваших систем через API-ключи доступно на платных тарифах.', 'Creating links and fetching stats from your own systems with API keys is available on paid plans.')}
              {keys.length > 0 && tr(' Mavjud kalitlaringiz tarif yangilanguncha ishlamaydi.', ' Ваши ключи не работают, пока тариф не обновлён.', ' Your existing keys won’t work until you upgrade.')}{' '}
              {tr('Bepul tarifda havolalarni dashboard va Telegram bot orqali yaratasiz.', 'На бесплатном тарифе ссылки создаются в панели и через Telegram-бота.', 'On the free plan you create links in the dashboard and through the Telegram bot.')}
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
          >
            {tr('Tariflarni ko‘rish', 'Посмотреть тарифы', 'See plans')}
          </Link>
        </div>
      )}

      {/* API Keys Table or Empty State */}
      <div className="bg-zinc-900/40 p-5 sm:p-6 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">{tr('Faol API Kalitlar', 'Активные API-ключи', 'Active API keys')}</h3>
          <span className="text-[11px] font-mono text-zinc-500">{tr(`${keys.length} ta kalit`, `ключей: ${keys.length}`, `${keys.length} keys`)}</span>
        </div>

        {keys.length > 0 ? (
          <div>
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-medium">{tr('Nomi', 'Название', 'Name')}</th>
                    <th className="pb-3 font-medium">{tr('Prefiks', 'Префикс', 'Prefix')}</th>
                    <th className="pb-3 font-medium">{tr('Yaratilgan sana', 'Дата создания', 'Created')}</th>
                    <th className="pb-3 font-medium text-right">{tr('Amallar', 'Действия', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 font-medium text-white">{k.name}</td>
                      <td className="py-3 font-mono text-zinc-300">{k.key_prefix}••••••••••••</td>
                      <td className="py-3 text-zinc-500">{formatDate(k.created_at, locale)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          title={tr('O‘chirish', 'Удалить', 'Delete')}
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
                      title={tr('O‘chirish', 'Удалить', 'Delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">{k.key_prefix}••••••••••••</span>
                    <span className="text-zinc-500">{formatDate(k.created_at, locale)}</span>
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
            <div className="text-xs font-semibold text-white mb-1">{tr('Hozircha faol API kalitlar yo‘q', 'Активных API-ключей пока нет', 'No active API keys yet')}</div>
            <p className="text-[11px] text-zinc-400 mb-4 max-w-xs mx-auto leading-relaxed">
              {apiAccess || !user ? tr(`${SITE_NAME} API dan foydalanish uchun birinchi xavfsiz kalitingizni yarating.`, `Создайте первый ключ, чтобы пользоваться API ${SITE_NAME}.`, `Create your first key to use the ${SITE_NAME} API.`) : tr('API kalitlar Pro va Biznes tariflarida yaratiladi.', 'API-ключи доступны на тарифах Pro и Бизнес.', 'API keys are available on the Pro and Business plans.')}
            </p>
            {(apiAccess || !user) && (
              <button
                onClick={handleOpenNewKeyModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr('Yangi API Kalit', 'Новый API-ключ', 'New API key')}</span>
              </button>
            )}
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
            <h3 className="text-base font-bold text-white">{tr('Interaktiv API Sinov Maydoni (Playground)', 'Интерактивная песочница API', 'Interactive API playground')}</h3>
            <p className="text-xs text-slate-400">{tr('Brauzerdan turib API so‘rovlarini real vaqtda sinab ko‘ring', 'Пробуйте запросы к API прямо из браузера', 'Try API requests live from your browser')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Manzil (URL)', 'Целевой URL', 'Target URL')}</label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Maxsus slug', 'Свой адрес (slug)', 'Custom slug')}</label>
              <input
                type="text"
                value={testSlug}
                onChange={(e) => setTestSlug(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <button
              onClick={runPlaygroundTest}
              disabled={playgroundLoading || !apiAccess}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{!apiAccess ? tr('Pro tarifda mavjud', 'Доступно на Pro', 'Available on Pro') : playgroundLoading ? tr('So‘rov yuborilmoqda...', 'Отправляем запрос...', 'Sending request...') : tr('So‘rovni Yuborish (POST)', 'Отправить запрос (POST)', 'Send request (POST)')}</span>
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
                <span>{tr('Nusxalash', 'Копировать', 'Copy')}</span>
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

      {isAdmin && <WebhookAdminPanel />}

      {/* Create Key Modal */}
      <Modal
        isOpen={newKeyModal}
        onClose={() => setNewKeyModal(false)}
        title={tr('Yangi API Kalit Yaratish', 'Создание API-ключа', 'Create an API key')}
      >
        {!generatedKey ? (
          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{tr('Kalit nomi', 'Название ключа', 'Key name')}</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder={tr('Masalan, Telegram Bot Backend yoki Mobil Ilova', 'Например: бэкенд Telegram-бота или мобильное приложение', 'e.g. Telegram bot backend or mobile app')}
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
                {tr('Bekor qilish', 'Отмена', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl"
              >
                {loading ? tr('Yaratilmoqda...', 'Создаём...', 'Creating...') : tr('Yaratish', 'Создать', 'Create')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">{tr('Kalit muvaffaqiyatli yaratildi', 'Ключ создан', 'Key created')}</h4>
            <p className="text-xs text-amber-400">
              {tr('Iltimos, ushbu kalitni xavfsiz joyga saqlang. Bu kalit qayta ko‘rsatilmaydi!', 'Сохраните ключ в надёжном месте. Он больше не будет показан!', 'Save this key somewhere safe. It won’t be shown again!')}
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
              {tr('Tushundim va saqladim', 'Понятно, сохранил(а)', 'Got it, I saved it')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
