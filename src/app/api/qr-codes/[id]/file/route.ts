import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { qrRepo } from '@/lib/qr/qr-repo';
import { isUnlocked, unlockCookieName } from '@/lib/link-unlock';
import { generateEventString, generateVCardString, type EventPayload, type VCardPayload } from '@/lib/qr-payloads';

/**
 * Public download for a dynamic QR code's hosted content: the contact card
 * (.vcf), the calendar event (.ics) or the text. Subject to the same rules as
 * its short link (disabled, archived, expired, password).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qr = await qrRepo.getById(id);
  const link = qr?.link_id ? await db.getLinkById(qr.link_id) : undefined;
  const notFound = () => new NextResponse('Not found', { status: 404 });
  if (!qr || !link || !link.is_active || link.is_archived) return notFound();
  if (link.expires_at && link.expires_at < new Date()) return notFound();
  if (link.password && !isUnlocked(link, (await cookies()).get(unlockCookieName(link))?.value)) return notFound();

  const file = hostedFile(qr.type, qr.content);
  if (!file) return notFound();
  return new NextResponse(file.body, {
    headers: {
      'Content-Type': file.contentType,
      // Non-ASCII names (Cyrillic, o‘) go in filename*, with a plain fallback
      'Content-Disposition': `attachment; filename="${file.fallback}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Cache-Control': 'no-store',
    },
  });
}

function hostedFile(type: string, content: Record<string, unknown>) {
  const safeName = (value: unknown, fallback: string) =>
    (typeof value === 'string' ? value : '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 60) || fallback;
  if (type === 'vcard') {
    const card = content as unknown as VCardPayload;
    // Contacts apps expect CRLF line endings in .vcf files
    return {
      body: generateVCardString(card).replace(/\n/g, '\r\n'),
      contentType: 'text/vcard; charset=utf-8',
      filename: `${safeName([card.firstName, card.lastName].filter(Boolean).join(' '), 'contact')}.vcf`,
      fallback: 'contact.vcf',
    };
  }
  if (type === 'event') {
    const event = content as unknown as EventPayload;
    return {
      body: generateEventString(event).replace(/\n/g, '\r\n'),
      contentType: 'text/calendar; charset=utf-8',
      filename: `${safeName(event.title, 'event')}.ics`,
      fallback: 'event.ics',
    };
  }
  if (type === 'text') {
    return { body: String(content.text ?? ''), contentType: 'text/plain; charset=utf-8', filename: 'text.txt', fallback: 'text.txt' };
  }
  return null;
}
