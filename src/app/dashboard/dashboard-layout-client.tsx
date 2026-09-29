'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Topbar from '@/components/dashboard/topbar';
import CreateLinkDrawer from '@/components/dashboard/create-link-modal';
import { Plus } from 'lucide-react';

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global hotkeys: Cmd+K / Ctrl+K and key 'c'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCreateDrawerOpen((prev) => !prev);
        return;
      }

      // Hotkey 'c' when not inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setCreateDrawerOpen(true);
      }
    };

    const handleOpenEvent = () => setCreateDrawerOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-create-link', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-create-link', handleOpenEvent);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[var(--background)] text-slate-100 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 block' : 'hidden'} md:relative md:block`}>
        <Sidebar onCreateLink={() => { setCreateDrawerOpen(true); setMobileSidebarOpen(false); }} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onCreateLink={() => setCreateDrawerOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-dot-pattern">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) for quick create */}
      <button
        onClick={() => setCreateDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-btn text-white font-semibold text-xs shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all group"
        title="Yangi havola yaratish (Hotkey: C yoki ⌘K)"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        <span className="hidden sm:inline">Havola yaratish</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/25 text-white/80 rounded border border-white/10">
          C
        </kbd>
      </button>

      {/* Global Create Link Drawer */}
      <CreateLinkDrawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
