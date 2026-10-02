import type { Metadata } from 'next';
import React from 'react';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import { qrRepo } from '@/lib/qr/qr-repo';
import QrLibrary from './qr-library';
import { getTr } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return { title: tr('QR kodlar', 'QR-коды', 'QR codes') };
}

interface Props {
  searchParams: Promise<{ link?: string }>;
}

export default async function QrCodesPage({ searchParams }: Props) {
  // Older links into the studio (/dashboard/qr?link=...)
  const { link } = await searchParams;
  if (link) redirect(`/dashboard/qr/new?link=${encodeURIComponent(link)}`);

  const ctx = await requireWorkspace();
  const qrCodes = await qrRepo.list(ctx.workspace.id);
  return <QrLibrary qrCodes={toClientJson(qrCodes)} canWrite={ctx.canWrite} />;
}
