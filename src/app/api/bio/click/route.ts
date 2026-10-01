import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bioClickSchema, parseJson } from '@/lib/validation';
import { getClientIp } from '@/lib/auth';
import { hashIp } from '@/lib/link-unlock';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson(request, bioClickSchema);
    if (!parsed.ok) return parsed.response;

    // One visitor can't pump a button's counter: at most 10 counted clicks a minute
    const limit = await rateLimit(`bio-click:${hashIp(getClientIp(request.headers))}:${parsed.data.linkId}`, 10, 60_000);
    if (limit.ok) await db.recordBioLinkClick(parsed.data.linkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/bio/click failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
