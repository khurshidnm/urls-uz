'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  Link2,
  Search,
  Plus,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Edit2,
  Trash2,
  Smartphone,
  Shield,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { QrCanvas } from '@/components/ui/qr-canvas';
import CreateLinkModal from '@/components/dashboard/create-link-modal';
import { Modal } from '@/components/ui/modal';

interface Props {
  initialLinks: any[];
}

export default function LinksManagerClient({ initialLinks }: Props) {
  const { t, locale } = useLanguage();
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeQrLink, setActiveQrLink] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editOpenInApp, setEditOpenInApp] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase()) ||
    l.destination_url.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = async (id: string, slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham ushbu havolani o‘chirmoqchimisiz?')) return;

    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLinks(links.filter((l) => l.id !== id));
      }
    } catch {
      alert('O‘chirishda xatolik yuz berdi');
    }
  };

  const openEdit = (link: any) => {
    setEditingLink(link);
    setEditTitle(link.title);
    setEditDestination(link.destination_url);
    setEditOpenInApp(!!link.open_in_app);
    setEditPassword(link.password || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          destination_url: editDestination,
          open_in_app: editOpenInApp ? 1 : 0,
          password: editPassword || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(links.map((l) => (l.id === editingLink.id ? data.link : l)));
        setEditingLink(null);
      }
    } catch {
      alert('Saqlashda xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const refreshLinks = async () => {
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      if (data.success) {
        setLinks(data.links);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t.myLinks}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Barcha qisqa havolalar ro‘yxati, tahrirlash va QR kodlar
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createNewLink}</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Havola nomi, slug yoki URL bo‘yicha qidirish..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Links List Cards */}
      <div className="space-y-3">
        {filteredLinks.length > 0 ? (
          filteredLinks.map((link) => {
            const shortUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${link.slug}`;
            const isCopied = copiedId === link.id;

            return (
              <div
                key={link.id}
                className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Link Info */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm hover:text-indigo-300 transition-colors">
                      {link.title}
                    </span>
                    {link.open_in_app === 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Smartphone className="w-3 h-3" />
                        <span>Smart Deep Link</span>
                      </span>
                    )}
                    {link.password && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Shield className="w-3 h-3" />
                        <span>Parolli</span>
                      </span>
                    )}
                  </div>

                  {/* Short and Original URLs */}
                  <div className="flex items-center gap-2 text-xs">
                    <a
                      href={`/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>{shortUrl}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-400 truncate max-w-xl">
                    <span className="text-slate-500">Manzil: </span>
                    {link.destination_url}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Yaratilgan: {formatDate(link.created_at)}</span>
                    <span>•</span>
                    <span className="text-slate-300 font-semibold">{formatNumber(link.click_count)} ta bosish</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleCopy(link.id, link.slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Nusxalandi' : 'Nusxa'}</span>
                  </button>

                  <button
                    onClick={() => setActiveQrLink(link)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    title="QR Kod"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openEdit(link)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    title="Tahrirlash"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
            <Link2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Havolalar topilmadi</h3>
            <p className="text-xs text-slate-400 mb-4">Birinchi qisqa havolangizni yarating!</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl"
            >
              Havola yaratish
            </button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {activeQrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setActiveQrLink(null)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 z-10 text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">{activeQrLink.title}</h3>
            <p className="text-xs text-slate-400 mb-4">urls.uz/{activeQrLink.slug}</p>
            <QrCanvas
              url={`${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${activeQrLink.slug}`}
              size={240}
              fgColor="#0f172a"
              bgColor="#ffffff"
              centerLogo={activeQrLink.open_in_app ? 'telegram' : 'none'}
              frameText={activeQrLink.title}
              frameStyle="bottom"
            />
            <button
              onClick={() => setActiveQrLink(null)}
              className="mt-4 px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <Modal isOpen={!!editingLink} onClose={() => setEditingLink(null)} title="Havolani tahrirlash">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Havola nomi</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Asosiy manzil URL</label>
              <input
                type="text"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Smart Deep Link</div>
                <div className="text-[10px] text-slate-400">Telegram va Instagramda darhol ochish</div>
              </div>
              <input
                type="checkbox"
                checked={editOpenInApp}
                onChange={(e) => setEditOpenInApp(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parol (ixtiyoriy)</label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Parol qo‘yish yoki olib tashlash..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl"
              >
                {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Modal */}
      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={refreshLinks}
      />
    </div>
  );
}
