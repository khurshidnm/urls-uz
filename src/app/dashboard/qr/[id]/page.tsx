import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import { qrRepo } from '@/lib/qr/qr-repo';
import QrStudioClient from '@/components/qr-studio/qr-studio';
import { getTr } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return { title: tr('QR kod', 'QR-код', 'QR code') };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQrPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requireWorkspace();
  const qrCode = await qrRepo.get(id, ctx.workspace.id);
  if (!qrCode) notFound();

  // key: saving a new QR code replaces /new with this page, which must start from the saved values
  return <QrStudioClient key={qrCode.id} links={[]} initialLinkId={null} saved={toClientJson(qrCode)} canWrite={ctx.canWrite} />;
}
