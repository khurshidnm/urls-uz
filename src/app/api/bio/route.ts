import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { parseJson, saveBioSchema } from '@/lib/validation';

// Free plan allows up to 4 custom links inside bio page
const BIO_LINKS_LIMIT = 4;
// Free plan allowed themes
const FREE_THEMES = ['midnight', 'emerald', 'clean-light'];

export async function GET() {
  try {
    const ctx = await requireWorkspace();
    const bioPage = await db.getBioPageByWorkspace(ctx.workspace.id);
    return NextResponse.json({ success: true, bioPage });
  } catch (error) {
    console.error('GET /api/bio failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({
        success: false,
        error: 'Demo rejimida bio sahifani saqlash cheklangan. Bepul versiyadan foydalanish uchun ro‘yxatdan o‘ting.',
        code: 'DEMO_RESTRICTED',
      }, { status: 403 });
    }

    const parsed = await parseJson(request, saveBioSchema);
    if (!parsed.ok) return parsed.response;
    const input = parsed.data;

    // Handles are unique across all workspaces
    const handleOwner = await db.getBioPageByHandle(input.handle);
    if (handleOwner && handleOwner.workspace_id !== ctx.workspace.id) {
      return NextResponse.json({ success: false, error: 'Bu handle band. Boshqasini tanlang.', code: 'HANDLE_TAKEN' }, { status: 409 });
    }

    const saved = await db.saveBioPage(ctx.workspace.id, {
      ...input,
      theme: FREE_THEMES.includes(input.theme) ? input.theme : 'midnight',
      links: input.links.slice(0, BIO_LINKS_LIMIT),
    });

    return NextResponse.json({
      success: true,
      bioPage: saved,
      limitNotice: input.links.length > BIO_LINKS_LIMIT ? 'Bepul tarifda faqat 4 ta havola saqlandi.' : undefined,
    });
  } catch (error) {
    console.error('POST /api/bio failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
