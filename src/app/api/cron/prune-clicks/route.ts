import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { pruneRawClicks } from '@/lib/clicks/retention';

/**
 * Daily job: deletes raw clicks past the plan's retention period. Call it with
 * `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends exactly that), or run
 * `npm run clicks:prune` from a server cron instead.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (!secret || given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const deleted = await pruneRawClicks();
  return NextResponse.json({ success: true, deleted });
}
