import type { Metadata } from 'next';
import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { parseLinkFilter } from '@/lib/links/list-filter';
import { limitsFor, toJsonLimit } from '@/lib/plans';
import { toClientJson } from '@/lib/serialize';
import LinksManagerClient from './links-client';
import { getTr } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return { title: tr('Havolalar', 'Ссылки', 'Links') };
}

const PAGE_SIZE = 25;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Filters live in the URL, so a filtered view can be bookmarked and shared. */
export default async function LinksPage({ searchParams }: Props) {
  const ctx = await requireWorkspace();
  const filter = parseLinkFilter(await searchParams, { status: 'active', limit: PAGE_SIZE });

  const [{ links, total }, folders, tags, usage, archivedCount] = await Promise.all([
    db.queryLinks(ctx.workspace.id, filter),
    db.listFolders(ctx.workspace.id),
    db.listTags(ctx.workspace.id),
    db.getLinkUsage(ctx.workspace.id),
    db.queryLinks(ctx.workspace.id, { status: 'archived', limit: 1, offset: 0 }).then((r) => r.total),
  ]);
  const limits = limitsFor(ctx.workspace, ctx.isAdmin);

  return (
    <LinksManagerClient
      links={toClientJson(links.map(toPublicLink))}
      total={total}
      filter={{ q: filter.q ?? '', status: filter.status, tag: filter.tag ?? '', folder: filter.folder ?? '', sort: filter.sort, page: filter.page }}
      pageSize={PAGE_SIZE}
      folders={toClientJson(folders)}
      tags={tags}
      archivedCount={archivedCount}
      usage={{
        plan: ctx.workspace.plan,
        usage,
        limits: {
          activeLinks: toJsonLimit(limits.activeLinks),
          deepLinks: toJsonLimit(limits.deepLinks),
          deviceTargeting: toJsonLimit(limits.deviceTargeting),
          bioLinks: toJsonLimit(limits.bioLinks),
        },
      }}
      canWrite={ctx.canWrite}
    />
  );
}
