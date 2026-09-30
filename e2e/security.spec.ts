import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { signTelegram } from './helpers';

/*
 * API-level security and validation checks: identity spoofing, login
 * verification, workspace isolation, password links, analytics honesty,
 * input validation and API key scoping.
 */

const BASE = E2E_ENV.NEXT_PUBLIC_APP_URL;

// Response bodies are loosely typed on purpose; each check inspects a few fields
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

type ApiResponse = { status: number; json: Json; text: string; headers: Headers };

function check(name: string, cond: unknown, extra = '') {
  expect.soft(Boolean(cond), `${name}${extra ? ' — ' + extra : ''}`).toBe(true);
}

async function req(
  path: string,
  { method = 'GET', body, headers = {}, cookie }: { method?: string; body?: unknown; headers?: Record<string, string>; cookie?: string } = {}
): Promise<ApiResponse> {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Json;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text, headers: res.headers };
}

function sessionCookie(res: ApiResponse) {
  const raw = res.headers.getSetCookie().find((c) => c.startsWith('urls_sid='));
  if (!raw) throw new Error(`No session cookie (status ${res.status}): ${res.text}`);
  return { cookie: raw.split(';')[0], raw };
}

async function loginTelegram(id: number, name: string) {
  const widgetData = signTelegram({ id: String(id), first_name: name, auth_date: String(Math.floor(Date.now() / 1000)) });
  const res = await req('/api/auth/telegram', { method: 'POST', body: { action: 'verify-widget', widgetData } });
  return { res, session: sessionCookie(res) };
}

test('security and validation checks', async () => {
  let r: ApiResponse;
  // ---------------------------------------------------------------------------
  // == Identity spoofing ==
  r = await req('/api/links', { method: 'POST', headers: { 'x-user-id': 'usr_victim', 'x-super-admin': 'true' }, body: { destination_url: 'https://example.com', user_id: 'demo_user' } });
  check('forged x-user-id / x-super-admin cannot create links', r.status === 401, `status ${r.status}`);

  r = await req('/api/links', { method: 'POST', cookie: 'urls_session=session_x; urls_user_id=usr_superadmin; urls_role=superadmin', body: { destination_url: 'https://example.com' } });
  check('old forgeable cookies are ignored', r.status === 401, `status ${r.status}`);

  r = await req('/api/demo/reset', { method: 'POST', headers: { 'x-super-admin': 'true' } });
  check('demo reset requires real admin', r.status === 403, `status ${r.status}`);

  r = await req('/api/webhook/telegram/setup', { method: 'POST', body: { url: 'https://evil.example/hook' } });
  check('webhook setup requires real admin', r.status === 403, `status ${r.status}`);

  // == Login verification ==
  r = await req('/api/auth/telegram', { method: 'POST', body: { action: 'verify-otp', phone: '+998901234567', code: '12345' } });
  check('hard-coded OTP 12345 rejected', r.status !== 200 && !r.json?.success, `status ${r.status}`);
  r = await req('/api/auth/telegram', { method: 'POST', body: { action: 'verify-otp', phone: '+998901234567', code: '77701' } });
  check('hard-coded OTP 77701 rejected', r.status !== 200 && !r.json?.success, `status ${r.status}`);
  r = await req('/api/auth/telegram', { method: 'POST', body: { action: 'one-click', user: { username: 'x' } } });
  check('fake one-click login removed', r.status === 400, `status ${r.status}`);
  r = await req('/api/auth/telegram', { method: 'POST', body: { action: 'verify-widget', widgetData: { id: 1, first_name: 'X', auth_date: Date.now() / 1000, is_dev: true } } });
  check('widget data without hash rejected (even with is_dev)', r.status === 401, `status ${r.status}`);
  r = await req('/api/auth/telegram', { method: 'POST', body: { action: 'verify-widget', widgetData: { ...signTelegram({ id: '1', first_name: 'X', auth_date: String(Math.floor(Date.now() / 1000)) }), first_name: 'Tampered' } } });
  check('tampered widget data rejected', r.status === 401, `status ${r.status}`);
  r = await req('/api/auth/google', { method: 'POST', body: { email: 'admin@urls.uz', name: 'Admin' } });
  check('Google POST "login by email" removed', r.status === 405, `status ${r.status}`);
  r = await req('/api/auth/google');
  const googleLoc = r.headers.get('location') || '';
  check('Google OAuth redirect includes state', googleLoc.includes('state='), googleLoc.slice(0, 60));
  r = await req('/api/auth/google/callback?code=abc&state=forged');
  check('Google callback rejects mismatched state', (r.headers.get('location') || '').includes('auth_error'), r.headers.get('location') ?? '');

  const a = await loginTelegram(900000001, 'Alice');
  const b = await loginTelegram(900000002, 'Bob');
  check('valid Telegram login creates a session', a.res.status === 200 && !!a.session, `status ${a.res.status}`);
  check('session cookie is httpOnly', /HttpOnly/i.test(a.session?.raw || ''), a.session?.raw?.split(';').slice(1).join(';'));
  check('user object comes from the server', a.res.json?.user?.name === 'Alice' && !!a.res.json?.user?.id, a.res.json?.user?.id);

  r = await req('/api/auth/me', { cookie: a.session.cookie });
  check('/api/auth/me returns the session user', !!r.json?.user?.id && r.json?.user?.id === a.res.json?.user?.id);
  check('regular user is not superadmin', r.json?.user?.role === 'user');
  const aliceWs = r.json?.workspace?.id;
  check('Alice gets a personal workspace as owner', aliceWs?.startsWith('ws_') && r.json?.workspace?.role === 'owner' && !r.json?.workspace?.is_demo, aliceWs);
  r = await req('/api/auth/me', { cookie: b.session.cookie });
  const bobWs = r.json?.workspace?.id;
  check('Bob gets a different workspace', bobWs && bobWs !== aliceWs);
  r = await req('/api/auth/me');
  check('anonymous visitors are in the demo workspace', r.json?.user === null && r.json?.workspace?.is_demo === true);

  // == Data ownership ==
  r = await req('/api/links', { method: 'POST', cookie: a.session.cookie, body: { destination_url: 'https://example.com/alice', title: 'Alice link', password: 'hunter2' } });
  check('Alice can create a link', r.status === 201, `status ${r.status} ${r.json?.error || ''}`);
  const aliceLink = r.json?.link;
  check('API response has no password hash', aliceLink && !('password' in aliceLink) && aliceLink.has_password === true);

  r = await req('/api/links', { cookie: a.session.cookie });
  check("Alice's list contains her link", r.json?.links?.some((l: Json) => l.id === aliceLink.id));
  check("Alice's list excludes demo links", !r.json?.links?.some((l: Json) => l.workspace_id === 'ws_demo'));

  r = await req('/api/links', { cookie: b.session.cookie });
  check("Bob's list does not contain Alice's link", !r.json?.links?.some((l: Json) => l.id === aliceLink.id));

  r = await req(`/api/links/${aliceLink.id}`, { method: 'PATCH', cookie: b.session.cookie, body: { destination_url: 'https://evil.example' } });
  check("Bob cannot edit Alice's link", r.status === 404, `status ${r.status}`);
  r = await req(`/api/links/${aliceLink.id}`, { method: 'DELETE', cookie: b.session.cookie });
  check("Bob cannot delete Alice's link", r.status === 404, `status ${r.status}`);
  r = await req(`/api/analytics?link_id=${aliceLink.id}`, { cookie: b.session.cookie });
  check("Bob cannot read Alice's analytics", r.status === 404, `status ${r.status}`);
  r = await req(`/api/analytics?link_id=${aliceLink.id}`);
  check("Anonymous cannot read Alice's analytics", r.status === 404, `status ${r.status}`);
  r = await req(`/api/links/${aliceLink.id}`, { method: 'PATCH', cookie: a.session.cookie, body: { title: 'Renamed', workspace_id: bobWs, click_count: 999999 } });
  check('Alice can edit her link; workspace/counters not writable', r.status === 200 && r.json?.link?.workspace_id === aliceWs && r.json?.link?.click_count === 0, `status ${r.status}`);

  r = await req('/api/links');
  check('Anonymous sees read-only demo links', r.json?.links?.length > 0 && r.json.links.every((l: Json) => l.workspace_id === 'ws_demo'));
  r = await req(`/api/links/${r.json.links[0].id}`, { method: 'DELETE' });
  check('Anonymous cannot delete demo links', r.status === 403, `status ${r.status}`);

  r = await req('/dashboard/links', { cookie: a.session.cookie });
  check("Dashboard renders Alice's links for Alice", r.text.includes('Renamed') && !r.text.includes('ApexPay'));

  // == Bio pages ==
  r = await req('/api/bio', { method: 'POST', cookie: a.session.cookie, body: { handle: 'alice_test', title: 'Alice', links: [{ title: 'x', url: 'javascript:alert(document.cookie)' }] } });
  check('javascript: bio links rejected', r.status === 400, `status ${r.status}`);
  r = await req('/api/bio', { method: 'POST', cookie: a.session.cookie, body: { handle: 'alice_test', title: 'Alice', links: [{ title: 'Site', url: 'https://example.com' }] } });
  check('Alice saves her own bio page', r.status === 200 && r.json?.bioPage?.workspace_id === aliceWs, `status ${r.status}`);
  check('new bio page is not auto-verified', r.json?.bioPage?.verified === false);
  r = await req('/api/bio', { method: 'POST', cookie: b.session.cookie, body: { handle: 'alice_test', title: 'Bob' } });
  check("Bob cannot take Alice's handle", r.status === 409, `status ${r.status}`);
  r = await req('/api/bio', { method: 'POST', cookie: b.session.cookie, body: { handle: 'apextech', title: 'Bob' } });
  check('Bob cannot overwrite the demo bio page', r.status === 409, `status ${r.status}`);

  // == Password-protected links ==
  const slug = aliceLink.slug;
  r = await req(`/${slug}`);
  check('locked page does not leak destination', r.status === 200 && !r.text.includes('example.com/alice'));
  r = await req('/api/links/unlock', { method: 'POST', body: { slug, password: 'wrong' } });
  check('wrong password rejected', r.status === 401, `status ${r.status}`);
  check('unlock no longer returns the destination', !r.text.includes('example.com/alice'));
  r = await req('/api/links/unlock', { method: 'POST', body: { slug, password: 'hunter2' } });
  const unlock = r.headers.getSetCookie().find((c: Json) => c.startsWith('urls_unlock_')) ?? '';
  check('correct password sets httpOnly unlock cookie', r.status === 200 && /HttpOnly/i.test(unlock || ''));
  r = await req(`/${slug}`, { cookie: unlock.split(';')[0], headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' } });
  check('unlocked link redirects to destination', r.status === 307 && r.headers.get('location') === 'https://example.com/alice', `${r.status} ${r.headers.get('location')}`);

  let limited = 0;
  for (let i = 0; i < 12; i++) {
    const x = await req('/api/links/unlock', { method: 'POST', body: { slug, password: 'guess' + i } });
    if (x.status === 429) limited++;
  }
  check('password guessing is rate limited', limited > 0, `${limited} of 12 blocked`);

  // == Analytics honesty ==
  r = await req(`/api/links/${aliceLink.id}`, { cookie: a.session.cookie });
  const before = r.json.link.click_count;
  check('one real click recorded so far', before === 1, `click_count ${before}`);
  const lastClick = r.json.clicks[0];
  check('missing geo is recorded as Unknown, not Tashkent', lastClick?.country === 'Unknown' && lastClick?.region === 'Unknown', JSON.stringify({ c: lastClick?.country, r: lastClick?.region }));
  check('iPhone UA detected as iOS', lastClick?.os === 'iOS', lastClick?.os);
  check('IP stored only as salted hash', lastClick?.ip_hash && lastClick.ip_hash !== 'anon' && !lastClick.ip_hash.includes('.'), lastClick?.ip_hash);

  await req(`/${slug}`, { cookie: unlock.split(';')[0], headers: { 'User-Agent': 'TelegramBot (like TwitterBot)' } });
  r = await req(`/api/links/${aliceLink.id}`, { cookie: a.session.cookie });
  check('Telegram link-preview bot not counted', r.json.link.click_count === before, `click_count ${r.json.link.click_count}`);

  // Click limit: 2 allowed, fire 6 concurrent requests
  r = await req('/api/links', { method: 'POST', cookie: a.session.cookie, body: { destination_url: 'https://example.com/limited', click_limit: 2 } });
  const limitedLink = r.json.link;
  await Promise.all(Array.from({ length: 6 }, () => req(`/${limitedLink.slug}`, { headers: { 'User-Agent': 'Mozilla/5.0' } })));
  r = await req(`/api/links/${limitedLink.id}`, { cookie: a.session.cookie });
  check('click limit holds under concurrency', r.json.link.click_count === 2, `click_count ${r.json.link.click_count}`);

  // == Validation ==
  const bad = async (name: string, body: Record<string, unknown>, expectCode = 'VALIDATION_ERROR') => {
    const x = await req('/api/links', { method: 'POST', cookie: a.session.cookie, body });
    check(name, x.status === 400 && x.json?.code === expectCode, `${x.status} ${x.json?.code} ${x.json?.error || ''}`);
  };
  await bad('javascript: destination rejected', { destination_url: 'javascript:alert(1)' });
  await bad('missing destination rejected', { title: 'x' });
  await bad('negative click limit rejected', { destination_url: 'https://example.com', click_limit: -5 });
  await bad('past expiry rejected', { destination_url: 'https://example.com', expires_at: '2020-01-01T00:00:00Z' });
  await bad('oversized title rejected', { destination_url: 'https://example.com', title: 'x'.repeat(500) });
  await bad('non-http device URL rejected', { destination_url: 'https://example.com', ios_url: 'ftp://example.com/app' });
  const malformed = await fetch(`${BASE}/api/links`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: a.session.cookie }, body: '{not json' });
  check('malformed JSON rejected', malformed.status === 400);
  r = await req('/api/links', { method: 'POST', cookie: a.session.cookie, body: { destination_url: 'example.com/no-scheme', expires_at: new Date(Date.now() + 3600e3).toISOString() } });
  check('scheme-less URL normalized to https', r.status === 201 && r.json?.link?.destination_url === 'https://example.com/no-scheme', `${r.status}`);
  const normLink = r.json?.link;
  r = await req(`/api/links/${normLink.id}`, { method: 'PATCH', cookie: a.session.cookie, body: {} });
  check('empty PATCH rejected', r.status === 400);
  r = await req(`/api/links/${normLink.id}`, { method: 'PATCH', cookie: a.session.cookie, body: { is_archived: true } });
  check('archive via PATCH', r.json?.link?.is_archived === true);
  r = await req(`/api/links/${normLink.id}`, { method: 'PATCH', cookie: a.session.cookie, body: { is_archived: false } });
  check('unarchive via PATCH (boolean regression)', r.json?.link?.is_archived === false);
  r = await req(`/api/links/${normLink.id}`, { method: 'PATCH', cookie: a.session.cookie, body: { expires_at: null } });
  check('null clears optional field', r.status === 200 && r.json?.link?.expires_at === null);
  r = await req('/api/bio', { method: 'POST', cookie: a.session.cookie, body: { handle: 'x', title: 'Alice' } });
  check('too-short handle rejected', r.status === 400 && r.json?.code === 'VALIDATION_ERROR');
  r = await req('/api/api-keys', { method: 'POST', cookie: a.session.cookie, body: { name: '   ' } });
  check('blank API key name rejected', r.status === 400);

  // == API keys ==
  r = await req('/api/api-keys', { method: 'POST', cookie: a.session.cookie, body: { name: 'CI key' } });
  const aliceKey = r.json?.apiKey;
  check('Alice can create an API key', r.status === 201 && aliceKey?.startsWith('urls_live_'), `status ${r.status}`);
  r = await req('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${aliceKey}` }, body: { destination_url: 'https://example.com/via-key' } });
  check("API key creates links in the key's workspace", r.status === 201 && r.json?.link?.workspace_id === aliceWs, `status ${r.status}`);
  const keyLink = r.json?.link;
  r = await req('/api/links', { cookie: b.session.cookie });
  check("Bob can't see links created with Alice's key", !r.json?.links?.some((l: Json) => l.id === keyLink?.id));
  r = await req('/api/links', { method: 'POST', headers: { Authorization: 'Bearer urls_live_9f830d12a67e20b348f9' }, body: { destination_url: 'https://example.com' } });
  check('old hard-coded demo key is rejected', r.status === 401, `status ${r.status}`);
  r = await req('/api/api-keys', { cookie: a.session.cookie });
  const aliceKeyId = r.json?.keys?.[0]?.id;
  check('key list never includes hashes', r.json?.keys?.length >= 1 && !('key_hash' in r.json.keys[0]));
  r = await req(`/api/api-keys?id=${aliceKeyId}`, { method: 'DELETE', cookie: b.session.cookie });
  check("Bob cannot revoke Alice's key", r.status === 404, `status ${r.status}`);
  r = await req('/api/api-keys', { method: 'POST', body: { name: 'anon' } });
  check('anonymous visitors cannot create keys', r.status === 403, `status ${r.status}`);

  // == Logout ==
  r = await req('/api/auth/logout', { method: 'POST', cookie: a.session.cookie });
  r = await req('/api/auth/me', { cookie: a.session.cookie });
  check('session is revoked server-side after logout', r.json?.user === null);
});
