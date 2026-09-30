import { and, desc, eq } from 'drizzle-orm';
import { pg } from '@/db/client';
import { links, qrCodes } from '@/db/schema';
import { newId, type Executor } from '@/lib/db';

export type QrCodeRecord = typeof qrCodes.$inferSelect;

/** A saved QR code with what the UI needs from its link (dynamic ones only). */
const withLink = {
  qr: qrCodes,
  link: {
    id: links.id,
    slug: links.slug,
    click_count: links.click_count,
    is_active: links.is_active,
    is_archived: links.is_archived,
  },
};

function shape<T extends { qr: QrCodeRecord; link: unknown }>(row: T) {
  return { ...row.qr, link: row.link as { id: string; slug: string; click_count: number; is_active: boolean; is_archived: boolean } | null };
}

export const qrRepo = {
  async list(workspaceId: string) {
    const rows = await pg
      .select(withLink)
      .from(qrCodes)
      .leftJoin(links, eq(links.id, qrCodes.link_id))
      .where(eq(qrCodes.workspace_id, workspaceId))
      .orderBy(desc(qrCodes.updated_at))
      .limit(500);
    return rows.map(shape);
  },

  async get(id: string, workspaceId: string, exec: Executor = pg) {
    const [row] = await exec
      .select(withLink)
      .from(qrCodes)
      .leftJoin(links, eq(links.id, qrCodes.link_id))
      .where(and(eq(qrCodes.id, id), eq(qrCodes.workspace_id, workspaceId)));
    return row ? shape(row) : undefined;
  },

  /** The QR code behind a short link, when it's a dynamic one. */
  async getByLinkId(linkId: string): Promise<QrCodeRecord | undefined> {
    const [row] = await pg.select().from(qrCodes).where(eq(qrCodes.link_id, linkId));
    return row;
  },

  async getById(id: string): Promise<QrCodeRecord | undefined> {
    const [row] = await pg.select().from(qrCodes).where(eq(qrCodes.id, id));
    return row;
  },

  async insert(
    data: Pick<QrCodeRecord, 'workspace_id' | 'created_by' | 'name' | 'type' | 'content' | 'design' | 'link_id'> & { id?: string },
    exec: Executor = pg
  ): Promise<QrCodeRecord> {
    const [row] = await exec.insert(qrCodes).values({ id: data.id ?? newId('qr'), ...data }).returning();
    return row;
  },

  async update(
    id: string,
    workspaceId: string,
    data: Partial<Pick<QrCodeRecord, 'name' | 'content' | 'design' | 'link_id'>>,
    exec: Executor = pg
  ) {
    await exec
      .update(qrCodes)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(qrCodes.id, id), eq(qrCodes.workspace_id, workspaceId)));
  },

  async delete(id: string, workspaceId: string, exec: Executor = pg) {
    await exec.delete(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.workspace_id, workspaceId)));
  },
};
