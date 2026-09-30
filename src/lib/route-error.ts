import { NextResponse } from 'next/server';
import { ApiAuthError } from '@/lib/auth';

/** The response for an error thrown in a route handler: API key problems as 401/403, anything else as 500. */
export function routeError(error: unknown, label: string): NextResponse {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
  }
  console.error(`${label} failed:`, error);
  return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
}
