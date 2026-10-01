import type { ClientLink } from '@/lib/client-types';

/**
 * Form state shared by "create link" and the link settings tab. Everything is
 * a string/boolean as edited in inputs; payload builders turn it into API
 * requests.
 */
export interface LinkFormValues {
  destination_url: string;
  title: string;
  slug: string;
  tags: string[];
  folder_id: string;
  open_in_app: boolean;
  device_targeting: boolean;
  ios_url: string;
  android_url: string;
  huawei_url: string;
  desktop_url: string;
  /** New password; empty = keep current (edit) / none (create). */
  password: string;
  /** Edit only: remove the existing password. */
  remove_password: boolean;
  /** `datetime-local` value (local time, no zone). */
  expires_at: string;
  click_limit: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

export const EMPTY_LINK_FORM: LinkFormValues = {
  destination_url: '',
  title: '',
  slug: '',
  tags: [],
  folder_id: '',
  open_in_app: false,
  device_targeting: false,
  ios_url: '',
  android_url: '',
  huawei_url: '',
  desktop_url: '',
  password: '',
  remove_password: false,
  expires_at: '',
  click_limit: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_term: '',
  utm_content: '',
};

/** ISO timestamp -> `datetime-local` value in the browser's time zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` value -> ISO timestamp (the user's local time as an absolute instant). */
function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function formFromLink(link: ClientLink): LinkFormValues {
  return {
    destination_url: link.destination_url,
    title: link.title,
    slug: link.slug,
    tags: link.tags,
    folder_id: link.folder_id ?? '',
    open_in_app: link.open_in_app,
    device_targeting: Boolean(link.ios_url || link.android_url || link.huawei_url || link.desktop_url),
    ios_url: link.ios_url ?? '',
    android_url: link.android_url ?? '',
    huawei_url: link.huawei_url ?? '',
    desktop_url: link.desktop_url ?? '',
    password: '',
    remove_password: false,
    expires_at: toLocalInput(link.expires_at),
    click_limit: link.click_limit ? String(link.click_limit) : '',
    utm_source: link.utm_source ?? '',
    utm_medium: link.utm_medium ?? '',
    utm_campaign: link.utm_campaign ?? '',
    utm_term: link.utm_term ?? '',
    utm_content: link.utm_content ?? '',
  };
}

const deviceField = (v: LinkFormValues, key: 'ios_url' | 'android_url' | 'huawei_url' | 'desktop_url') =>
  v.device_targeting ? v[key].trim() : '';

/** Body for POST /api/links. Empty fields are omitted. */
export function createPayload(v: LinkFormValues, source: 'dashboard' | 'landing' = 'dashboard') {
  const optional = (value: string) => value.trim() || undefined;
  return {
    source,
    destination_url: v.destination_url.trim(),
    title: optional(v.title),
    slug: optional(v.slug),
    tags: v.tags.length ? v.tags : undefined,
    folder_id: optional(v.folder_id),
    open_in_app: v.open_in_app,
    ios_url: optional(deviceField(v, 'ios_url')),
    android_url: optional(deviceField(v, 'android_url')),
    huawei_url: optional(deviceField(v, 'huawei_url')),
    desktop_url: optional(deviceField(v, 'desktop_url')),
    password: optional(v.password),
    expires_at: fromLocalInput(v.expires_at) ?? undefined,
    click_limit: optional(v.click_limit),
    utm_source: optional(v.utm_source),
    utm_medium: optional(v.utm_medium),
    utm_campaign: optional(v.utm_campaign),
    utm_term: optional(v.utm_term),
    utm_content: optional(v.utm_content),
  };
}

/** Body for PATCH /api/links/[id]: only fields that changed; cleared fields become null. */
export function updatePayload(v: LinkFormValues, original: LinkFormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const nullable = (value: string) => value.trim() || null;

  if (v.destination_url.trim() !== original.destination_url) out.destination_url = v.destination_url.trim();
  if (v.title.trim() !== original.title && v.title.trim()) out.title = v.title.trim();
  if (v.slug.trim() !== original.slug) out.slug = v.slug.trim();
  if (JSON.stringify(v.tags) !== JSON.stringify(original.tags)) out.tags = v.tags;
  if (v.folder_id !== original.folder_id) out.folder_id = v.folder_id || null;
  if (v.open_in_app !== original.open_in_app) out.open_in_app = v.open_in_app;

  for (const key of ['ios_url', 'android_url', 'huawei_url', 'desktop_url'] as const) {
    const next = deviceField(v, key);
    if (next !== original[key]) out[key] = next || null;
  }

  if (v.remove_password) out.password = null;
  else if (v.password) out.password = v.password;

  if (v.expires_at !== original.expires_at) out.expires_at = fromLocalInput(v.expires_at);
  if (v.click_limit.trim() !== original.click_limit) out.click_limit = nullable(v.click_limit);

  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
    if (v[key].trim() !== original[key]) out[key] = nullable(v[key]);
  }
  return out;
}
