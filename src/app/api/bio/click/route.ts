import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bioClickSchema, parseJson } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson(request, bioClickSchema);
    if (!parsed.ok) return parsed.response;

    await db.recordBioLinkClick(parsed.data.linkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/bio/click failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
