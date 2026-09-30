import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardLayoutClient from './dashboard-layout-client';

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
