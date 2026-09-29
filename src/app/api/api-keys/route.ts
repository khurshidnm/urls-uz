import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const keys = db.getApiKeys('demo_user');
    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Key name is required' }, { status: 400 });
    }

    const newKey = db.createApiKey('demo_user', name.trim());
    return NextResponse.json({ success: true, ...newKey }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Key id is required' }, { status: 400 });
    }

    db.deleteApiKey(id, 'demo_user');
    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
