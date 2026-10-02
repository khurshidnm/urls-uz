import type { Metadata } from 'next';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardLayoutClient from './dashboard-layout-client';
import { SITE_NAME } from '@/lib/site';
import { getTr } from '@/lib/locale';

// The app itself is private: never in search results
export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return {
    title: { default: tr('Boshqaruv paneli', 'Панель управления', 'Dashboard'), template: `%s — ${SITE_NAME}` },
    robots: { index: false, follow: false },
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The sidebar links to the current workspace's own bio page (the demo's for visitors)
  const { workspace } = await requireWorkspace();
  const bioPage = await db.getBioPageByWorkspace(workspace.id);
  return <DashboardLayoutClient bioHandle={bioPage?.handle ?? null}>{children}</DashboardLayoutClient>;
}
