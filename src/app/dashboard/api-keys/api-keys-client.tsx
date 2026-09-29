'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface Props {
  initialKeys: any[];
}

export default function ApiKeysClient({ initialKeys }: Props) {
  const { t, locale } = useLanguage();
  const [keys, setKeys] = useState(initialKeys);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);

  // Playground state
  const [testUrl, setTestUrl] = useState('https://t.me/urls_uz');
  const [testSlug, setTestSlug] = useState('api-test');
  const [playgroundOutput, setPlaygroundOutput] = useState<any | null>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setKeys([
          {
            id: data.id,
            name: data.name,
            key_prefix: data.keyPrefix,
            created_at: new Date().toISOString(),
          },
          ...keys,
        ]);
        setKeyName('');
      }
    } catch {
      alert('Kalit yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
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
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const runPlaygroundTest = async () => {
    setPlaygroundLoading(true);
    setPlaygroundOutput(null);

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: testUrl,
          slug: testSlug,
          title: 'API Playground Demo',
        }),
      });
      const data = await res.json();
      setPlaygroundOutput(data);
    } catch (err: any) {
      setPlaygroundOutput({ success: false, error: err.message });
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dasturchilar & REST API</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            API kalitlar, interaktiv playground va tizimlaringiz bilan integratsiya
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedKey(null);
            setNewKeyModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi API Kalit</span>
        </button>
      </div>

      {/* API Keys Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight">Faol API Kalitlar</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Nomi</th>
                <th className="pb-3 font-semibold">Prefiks</th>
                <th className="pb-3 font-semibold">Yaratilgan sana</th>
                <th className="pb-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-900/40">
                  <td className="py-3 font-semibold text-white">{k.name}</td>
                  <td className="py-3 font-mono text-indigo-400">{k.key_prefix}••••••••••••</td>
                  <td className="py-3 text-slate-400">{formatDate(k.created_at)}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Bekor qilish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {playgroundOutput && (
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
