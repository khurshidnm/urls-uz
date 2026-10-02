'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/sidebar';
import Topbar from '@/components/dashboard/topbar';
import CreateLinkDrawer from '@/components/dashboard/create-link-modal';
import { DemoBanner } from '@/components/dashboard/demo-banner';
import { DemoRestrictionModal } from '@/components/dashboard/demo-restriction-modal';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';

export default function DashboardLayoutClient({
  children,
  bioHandle,
}: {
  children: React.ReactNode;
  bioHandle: string | null;
}) {
  const router = useRouter();
  const { user, openAuthModal, isSuperAdmin, demoEditMode } = useAuth();
  const { tr } = useLanguage();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoActionTitle, setDemoActionTitle] = useState<string | undefined>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Trigger link creation or show demo restriction if not logged in
  const handleRequestCreateLink = (actionTitle = tr('Yangi havola yaratish', 'Создание ссылки', 'Creating a link')) => {
    if (!user && !isSuperAdmin) {
      setDemoActionTitle(actionTitle);
      setDemoModalOpen(true);
      return;
    }
    setCreateDrawerOpen(true);
  };

  // Global hotkeys: Cmd+K / Ctrl+K and key 'c'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleRequestCreateLink();
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
        handleRequestCreateLink();
      }
    };

    const handleOpenEvent = () => handleRequestCreateLink();
    const handleDemoEvent = (e: Event) => {
      if (isSuperAdmin && demoEditMode) return;
      setDemoActionTitle((e as CustomEvent<{ actionTitle?: string }>).detail?.actionTitle);
      setDemoModalOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-create-link', handleOpenEvent);
    window.addEventListener('open-demo-restriction', handleDemoEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-create-link', handleOpenEvent);
      window.removeEventListener('open-demo-restriction', handleDemoEvent);
    };
  }, [user]);

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
        <Sidebar bioHandle={bioHandle} onCreateLink={() => { handleRequestCreateLink(); setMobileSidebarOpen(false); }} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onCreateLink={() => handleRequestCreateLink()}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        
        {/* Demo Mode Notice Banner */}
        <DemoBanner onStartFree={() => { setDemoActionTitle(tr('Bepul ro‘yxatdan o‘tish', 'Бесплатная регистрация', 'Free sign-up')); openAuthModal(undefined, undefined, 'signup'); }} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-dot-pattern">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Create Link Drawer */}
      <CreateLinkDrawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={() => router.refresh()}
      />

      {/* Demo Mode Restriction Modal */}
      <DemoRestrictionModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        actionTitle={demoActionTitle}
        onStartFree={() => {
          setDemoModalOpen(false);
          openAuthModal();
        }}
      />
    </div>
  );
}
