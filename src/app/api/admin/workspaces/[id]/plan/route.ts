import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/auth';
import { endPlan, grantPlan, grantPlanSchema } from '@/lib/billing/grant-plan';
import { parseJson } from '@/lib/validation';

type Params = { params: Promise<{ id: string }> };

const forbidden = () => NextResponse.json({ success: false, error: 'Faqat super admin uchun' }, { status: 403 });

/** Records a payment and gives the workspace a paid plan for N months (superadmins only). */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) return forbidden();
    const parsed = await parseJson(request, grantPlanSchema);
    if (!parsed.ok) return parsed.response;

    const { id } = await params;
    const payment = await grantPlan(id, parsed.data, admin.id);
    if (!payment) return NextResponse.json({ success: false, error: 'Ish maydoni topilmadi' }, { status: 404 });
    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/workspaces/[id]/plan failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

/** Ends the paid plan now; payments stay as history. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    if (!(await getSuperAdmin())) return forbidden();
    const { id } = await params;
    if (!(await endPlan(id))) return NextResponse.json({ success: false, error: 'Ish maydoni topilmadi' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/workspaces/[id]/plan failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
