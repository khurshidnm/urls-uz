'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { QrCanvas } from '@/components/ui/qr-canvas';
import {
  Link2,
  Search,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Edit2,
  Trash2,
  Smartphone,
  Shield,
  Download,
  CheckSquare,
  Square,
  Archive,
  ArchiveRestore,
  Tag,
  X,
  Save,
  Loader2,
  Plus,
  BarChart3,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import type { ClientLink } from '@/lib/client-types';

interface Props {
  initialLinks: ClientLink[];
}

export default function LinksManagerClient({ initialLinks }: Props) {
  const { user, isSuperAdmin, demoEditMode } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [links, setLinks] = useState(initialLinks);

  const checkDemoRestricted = (actionName: string) => {
    if (isSuperAdmin && demoEditMode) {
      return false;
    }
    if (!user) {
      window.dispatchEvent(
        new CustomEvent('open-demo-restriction', { detail: { actionTitle: actionName } })
      );
      return true;
    }
    return false;
  };

  const getHeaders = () => ({ 'Content-Type': 'application/json' });

  // Reset local state when the server sends a fresh list (e.g. after router.refresh())
  const [prevInitialLinks, setPrevInitialLinks] = useState(initialLinks);
  if (initialLinks !== prevInitialLinks) {
    setPrevInitialLinks(initialLinks);
    setLinks(initialLinks);
  }

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [activeQrLink, setActiveQrLink] = useState<ClientLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isMultiSelectMode = selectedIds.size > 0;
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [batchTagInput, setBatchTagInput] = useState('');

  // Inline edit title
  const [inlineEditingTitleId, setInlineEditingTitleId] = useState<string | null>(null);
  const [inlineTitleValue, setInlineTitleValue] = useState('');

  // Inline add tag
  const [inlineTagId, setInlineTagId] = useState<string | null>(null);
  const [inlineTagValue, setInlineTagValue] = useState('');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach((l) => l.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [links]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      // Search
      const matchesSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.slug.toLowerCase().includes(search.toLowerCase()) ||
        l.destination_url.toLowerCase().includes(search.toLowerCase()) ||
        l.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      // Status
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'archived'
          ? l.is_archived
          : !l.is_archived;

      // Tag
      const matchesTag =
        !selectedTag ||
        l.tags.includes(selectedTag);

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [links, search, statusFilter, selectedTag]);

  // Tactile Copy
  const handleCopy = async (id: string, slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(id);
    showToast('copied', `${url} nusxalandi!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Inline Title Save
  const saveInlineTitle = async (id: string) => {
    if (checkDemoRestricted('Havola nomini o‘zgartirish')) return;
    if (!inlineTitleValue.trim()) {
      setInlineEditingTitleId(null);
      return;
    }

    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ title: inlineTitleValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(links.map((l) => (l.id === id ? { ...l, title: inlineTitleValue.trim() } : l)));
        showToast('success', 'Nomi yangilandi');
      }
    } catch {
      showToast('error', 'Saqlashda xatolik');
    } finally {
      setInlineEditingTitleId(null);
    }
  };

  // Inline Tag Add
  const addInlineTag = async (linkId: string) => {
    if (checkDemoRestricted('Teg qo‘shish')) return;
    if (!inlineTagValue.trim()) {
      setInlineTagId(null);
      return;
    }

    const targetLink = links.find((l) => l.id === linkId);
    if (!targetLink) return;

    const newTag = inlineTagValue.trim().toLowerCase();
    const updatedTags = targetLink.tags.includes(newTag) ? targetLink.tags : [...targetLink.tags, newTag];

    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ tags: updatedTags }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(links.map((l) => (l.id === linkId ? { ...l, tags: data.link.tags } : l)));
        showToast('success', `Teg #${newTag} qo‘shildi`);
      }
    } catch {
      showToast('error', 'Teg saqlashda xatolik');
    } finally {
      setInlineTagId(null);
      setInlineTagValue('');
    }
  };

  // Inline Tag Remove
  const removeInlineTag = async (linkId: string, tagToRemove: string) => {
    if (checkDemoRestricted('Tegni o‘chirish')) return;
    const targetLink = links.find((l) => l.id === linkId);
    if (!targetLink) return;

    const updatedTags = targetLink.tags.filter((t) => t !== tagToRemove);

    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ tags: updatedTags }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(links.map((l) => (l.id === linkId ? { ...l, tags: data.link.tags } : l)));
        showToast('info', `Teg #${tagToRemove} olib tashlandi`);
      }
    } catch {
      showToast('error', 'Tegni o‘chirishda xatolik');
    }
  };

  // Delete Single Link
  const handleDelete = async (id: string) => {
    if (checkDemoRestricted('Havolani o‘chirish')) return;
    if (!confirm("Haqiqatan ham ushbu havolani o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(links.filter((l) => l.id !== id));
        showToast('success', "Havola o'chirildi");
      }
    } catch {
      showToast('error', "O'chirishda xatolik yuz berdi");
    }
  };

  // Archive Single Link
  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    if (checkDemoRestricted('Havolani arxivlash')) return;
    const nextStatus = !currentArchived;
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_archived: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(links.map((l) => (l.id === id ? { ...l, is_archived: nextStatus } : l)));
        showToast('success', nextStatus ? 'Havola arxivlandi' : 'Havola faollashtirildi');
      }
    } catch {
      showToast('error', 'Statusni o‘zgartirishda xatolik');
    }
  };

  // Multi-Select Toggle
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLinks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLinks.map((l) => l.id)));
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (checkDemoRestricted('Havolalarni o‘chirish')) return;
    if (!confirm(`${selectedIds.size} ta havolani o'chirmoqchimisiz?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    }
    setLinks(links.filter((l) => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
    showToast('success', `${selectedIds.size} ta havola o'chirildi`);
  };

  // Batch Archive
  const handleBatchArchive = async (archive: boolean = true) => {
    if (checkDemoRestricted('Havolalarni arxivlash')) return;
    for (const id of selectedIds) {
      await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_archived: archive }),
      });
    }
    setLinks(
      links.map((l) => (selectedIds.has(l.id) ? { ...l, is_archived: archive } : l))
    );
    setSelectedIds(new Set());
    showToast('success', `${selectedIds.size} ta havola ${archive ? 'arxivlandi' : 'faollashtirildi'}`);
  };

  // Batch Tag Apply
  const applyBatchTag = async () => {
    if (checkDemoRestricted('Teglarni o‘zgartirish')) return;
    if (!batchTagInput.trim()) return;
    const tagToAdd = batchTagInput.trim().toLowerCase();

    for (const id of selectedIds) {
      const link = links.find((l) => l.id === id);
      if (link) {
        if (!link.tags.includes(tagToAdd)) {
          await fetch(`/api/links/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ tags: [...link.tags, tagToAdd] }),
          });
        }
      }
    }

    setLinks(
      links.map((l) => {
        if (!selectedIds.has(l.id)) return l;
        return l.tags.includes(tagToAdd) ? l : { ...l, tags: [...l.tags, tagToAdd] };
      })
    );

    setShowBatchTagModal(false);
    setBatchTagInput('');
    setSelectedIds(new Set());
    showToast('success', `${selectedIds.size} ta havolaga #${tagToAdd} tegi qo‘shildi`);
  };

  // Batch CSV Export
  const handleBatchExport = () => {
    const selected = links.filter((l) => selectedIds.has(l.id));
    let csv = 'Title,Short URL,Destination URL,Clicks,Tags,Archived,Created At\n';
    selected.forEach((l) => {
      csv += `"${l.title}","urls.uz/${l.slug}","${l.destination_url}",${l.click_count},"${l.tags.join(', ')}",${l.is_archived ? 'Yes' : 'No'},"${l.created_at}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urls-uz-export-${Date.now()}.csv`;
    a.click();
    showToast('success', `${selected.length} ta havola eksport qilindi`);
  };

  return (
    <div className="space-y-5">
      {/* Header & Status Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{t.myLinks}</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {filteredLinks.length} ta havola ko‘rsatilmoqda · Tahrirlash, teglar, batch amallar va QR kodlar
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex bg-[var(--surface-1)] border border-[var(--border-subtle)] p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Barchasi ({links.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Faol ({links.filter((l) => !l.is_archived).length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'archived'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Arxivlangan ({links.filter((l) => l.is_archived).length})
          </button>
        </div>
      </div>

      {/* Free Plan 10 Links Limit Usage Banner */}
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            10
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white">Bepul Tarif (Hozir Faol)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Havolalar: {links.filter((l) => !l.is_archived).length} / 10
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Deep Link: {links.filter((l) => !l.is_archived && l.open_in_app).length} / 1
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-purple-400 border border-purple-500/25">
                Qurilmalar: {links.filter((l) => !l.is_archived && (l.ios_url || l.android_url || l.huawei_url || l.desktop_url)).length} / 1 (100 klik/kun)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Cheksiz havolalar, cheksiz deep linklar va kengaytirilgan imkoniyatlar Pro tarifda tez kunda ishga tushadi.
            </p>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="w-full sm:w-44 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Ishlatildi</span>
            <span>{Math.round((links.filter((l) => !l.is_archived).length / 10) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                links.filter((l) => !l.is_archived).length >= 10
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(100, (links.filter((l) => !l.is_archived).length / 10) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Limit Reached Warning */}
      {links.filter((l) => !l.is_archived).length >= 10 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Bepul tarif limiti to‘lgan (10/10 ta faol havola). </span>
            <span className="text-amber-200/90 text-[11px]">
              Yangi havola yaratish uchun eskilarini arxivlang yoki o‘chiring. Cheksiz havolalar imkoniyati Pro tarifda tez kunda ishga tushadi!
            </span>
          </div>
        </div>
      )}

      {/* Tag Filters Row */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Teglar:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              selectedTag === null
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'bg-[var(--surface-1)] text-slate-400 border-[var(--border-subtle)] hover:text-white'
            }`}
          >
            Barchasi
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-[var(--surface-1)] text-slate-300 border-[var(--border-subtle)] hover:border-indigo-500/30'
              }`}
            >
              <span>#{tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search & Batch Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish: nom, slug, manzil URL yoki #teg..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
          />
        </div>

        {/* Multi-Select Batch Actions Bar */}
        {isMultiSelectMode && (
          <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-[var(--surface-1)] border border-indigo-500/30 rounded-xl animate-fade-in">
            <Badge variant="indigo" size="sm" className="font-mono">
              {selectedIds.size} tanlandi
            </Badge>

            {/* Batch Tag Button */}
            <button
              onClick={() => setShowBatchTagModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg border border-[var(--border-subtle)] transition-colors"
              title="Tanlanganlarga teg qo‘shish"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Teg</span>
            </button>

            {/* Batch Archive Button */}
            <button
              onClick={() => handleBatchArchive(statusFilter !== 'archived')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg border border-[var(--border-subtle)] transition-colors"
              title="Arxivlash / Qayta tiklash"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>{statusFilter === 'archived' ? 'Faollashtirish' : 'Arxivlash'}</span>
            </button>

            {/* Batch Export */}
            <button
              onClick={handleBatchExport}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg border border-[var(--border-subtle)] transition-colors"
              title="CSV yuklab olish"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Batch Delete */}
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-colors"
              title="O‘chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>O‘chirish</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Bekor qilish"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Links List */}
      <div className="space-y-2">
        {/* Select All Row */}
        {filteredLinks.length > 0 && (
          <div className="flex items-center justify-between px-3 py-1 text-[11px] text-slate-500">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-slate-300 transition-colors"
            >
              {selectedIds.size === filteredLinks.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>
                {selectedIds.size === filteredLinks.length
                  ? 'Barchasini bekor qilish'
                  : `Barchasini tanlash (${filteredLinks.length})`}
              </span>
            </button>
          </div>
        )}

        {filteredLinks.length > 0 ? (
          filteredLinks.map((link) => {
            const shortUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${link.slug}`;
            const isCopied = copiedId === link.id;
            const isSelected = selectedIds.has(link.id);
            const isTitleEditing = inlineEditingTitleId === link.id;
            const isAddingTag = inlineTagId === link.id;

            const linkTags = link.tags;

            return (
              <div
                key={link.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-zinc-800/60 border-zinc-600'
                    : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                } ${link.is_archived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Select Checkbox */}
                  <button
                    onClick={() => toggleSelect(link.id)}
                    className="mt-1 shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Main Link Info */}
                  <div className="flex-1 min-w-0">
                    {/* Title with Inline Edit */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isTitleEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-md animate-fade-in">
                          <input
                            type="text"
                            value={inlineTitleValue}
                            onChange={(e) => setInlineTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineTitle(link.id);
                              if (e.key === 'Escape') setInlineEditingTitleId(null);
                            }}
                            autoFocus
                            className="w-full px-2.5 py-1 bg-[var(--surface-1)] border border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
                            placeholder="Havola nomi..."
                          />
                          <button
                            onClick={() => saveInlineTitle(link.id)}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                            title="Saqlash (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInlineEditingTitleId(null)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Bekor qilish (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <Link
                            href={`/dashboard/links/${link.id}`}
                            className="font-bold text-white text-sm hover:text-indigo-300 transition-colors"
                            title="Havola sahifasi: analitika, QR, sozlamalar va tarix"
                          >
                            {link.title}
                          </Link>
                          <button
                            onClick={() => {
                              setInlineEditingTitleId(link.id);
                              setInlineTitleValue(link.title);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity"
                            title="Nomini tahrirlash"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {link.is_archived && (
                        <Badge variant="warning" size="xs">
                          Arxivlangan
                        </Badge>
                      )}
                      {link.open_in_app && (
                        <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>
                          Deep Link
                        </Badge>
                      )}
                      {link.has_password && (
                        <Badge variant="warning" size="xs" icon={<Shield className="w-3 h-3" />}>
                          Parolli
                        </Badge>
                      )}
                      {Boolean(link.ios_url || link.android_url || link.huawei_url || link.desktop_url) && (
                        <Badge variant="purple" size="xs" icon={<Smartphone className="w-3 h-3" />}>
                          Qurilmalar
                        </Badge>
                      )}
                    </div>

                    {/* Short URL & External Target */}
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <a
                        href={`/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <span>{shortUrl}</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate max-w-lg mb-2">
                      → {link.destination_url}
                    </p>

                    {/* Tags Inline Section */}
                    <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                      {linkTags.map((tagItem: string) => (
                        <span
                          key={tagItem}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[10px] font-mono border border-zinc-700/60 group"
                        >
                          <span>#{tagItem}</span>
                          <button
                            onClick={() => removeInlineTag(link.id, tagItem)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Tegni o‘chirish"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}

                      {/* Inline Add Tag Input / Button */}
                      {isAddingTag ? (
                        <div className="inline-flex items-center gap-1 animate-fade-in">
                          <input
                            type="text"
                            value={inlineTagValue}
                            onChange={(e) => setInlineTagValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addInlineTag(link.id);
                              if (e.key === 'Escape') setInlineTagId(null);
                            }}
                            autoFocus
                            placeholder="teg nomi..."
                            className="w-20 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-white focus:outline-none font-mono"
                          />
                          <button
                            onClick={() => addInlineTag(link.id)}
                            className="p-0.5 rounded bg-white text-zinc-950 hover:bg-zinc-200"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => setInlineTagId(null)}
                            className="p-0.5 rounded text-zinc-400 hover:text-white"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setInlineTagId(link.id);
                            setInlineTagValue('');
                          }}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono border border-zinc-800 transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Teg</span>
                        </button>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 mt-2">
                      <span className="font-mono">{formatDate(link.created_at)}</span>
                      <span className="text-zinc-700">•</span>
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="text-zinc-200 hover:text-indigo-400 font-medium font-mono tabular-nums transition-colors flex items-center gap-1 group/clicks"
                        title="Ushbu havola bo‘yicha batafsil analitika"
                      >
                        <span>{formatNumber(link.click_count)} clicks</span>
                        <BarChart3 className="w-3 h-3 text-indigo-400 opacity-60 group-hover/clicks:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                  </div>

                  {/* Actions (One-click copy with distinct tactile feedback) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(link.id, link.slug)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white hover:bg-zinc-200 text-zinc-950 border border-transparent'
                      }`}
                      title="Havolani nusxalash"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline font-mono">{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Analytics Direct Button */}
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300 border border-zinc-800 transition-colors"
                      title="Havola bo‘yicha batafsil analitika"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </Link>

                    {/* QR Button */}
                    <button
                      onClick={() => setActiveQrLink(link)}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                      title="QR Kod"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {/* Archive Toggle Button */}
                    <button
                      onClick={() => handleToggleArchive(link.id, link.is_archived)}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                      title={link.is_archived ? 'Qayta tiklash' : 'Arxivlash'}
                    >
                      {link.is_archived ? (
                        <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Single Button */}
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/20 transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State (Senior Linear Design Standard) */
          <div className="p-10 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <Link2 className="w-5 h-5 text-zinc-300" />
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 mb-2">
              STATUS // NO_RECORDS_FOUND
            </span>
            <h3 className="text-sm font-semibold text-white mb-1">
              {search || statusFilter !== 'all' || selectedTag
                ? 'Filtrlar bo‘yicha havola topilmadi'
                : 'Hali hech qanday qisqa havola yaratilmagan'}
            </h3>
            <p className="text-xs text-zinc-400 mb-5 max-w-sm mx-auto leading-relaxed">
              {search || statusFilter !== 'all' || selectedTag
                ? 'Qidiruv so‘rovi yoki holat filtrini tozalab qayta urinib ko‘ring.'
                : 'Birinchi qisqa havolangizni yarating. Global hotkey: C tugmasini bosing.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              {search || statusFilter !== 'all' || selectedTag ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setSelectedTag(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                >
                  Filtrlarni tozalash
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-create-link'));
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yangi havola yaratish</span>
                  <kbd className="ml-1 px-1 py-0.2 bg-zinc-200 text-[10px] rounded font-mono">C</kbd>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Batch Tagging Modal */}
      {showBatchTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowBatchTagModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--surface-0)] border border-[var(--border-default)] rounded-2xl p-6 z-10 shadow-2xl animate-scale-in">
            <h3 className="text-base font-bold text-white mb-1">Teg qo‘shish</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tanlangan {selectedIds.size} ta havolaga teg biriktirish:
            </p>
            <input
              type="text"
              value={batchTagInput}
              onChange={(e) => setBatchTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyBatchTag();
              }}
              placeholder="masalan: marketing, promo, telegram"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowBatchTagModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={applyBatchTag}
                className="px-4 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl"
              >
                Tegni qo‘llash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal with PNG/SVG/PDF Export */}
      {activeQrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setActiveQrLink(null)}
          />
          <div className="relative w-full max-w-sm bg-[var(--surface-0)] border border-[var(--border-default)] rounded-2xl p-6 z-10 text-center shadow-2xl animate-scale-in">
            <h3 className="text-base font-bold text-white mb-1">{activeQrLink.title}</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">urls.uz/{activeQrLink.slug}</p>
            <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner">
              <QrCanvas
                url={`${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${activeQrLink.slug}`}
                size={220}
                fgColor="#0f172a"
                bgColor="#ffffff"
                centerLogo={activeQrLink.open_in_app ? 'telegram' : 'none'}
                frameText={activeQrLink.title}
                frameStyle="bottom"
              />
            </div>
            <button
              onClick={() => setActiveQrLink(null)}
              className="mt-4 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
