import { checkUrlSafety } from '@/lib/anti-phishing';
import { toJsonLimit, type PlanLimits } from '@/lib/plans';

/** Business rules shared by link creation and editing. */

export type RuleFailure = {
  ok: false;
  status: 400 | 403 | 404 | 409 | 429;
  code: string;
  error: string;
  details?: Record<string, unknown>;
};

export const fail = (
  status: RuleFailure['status'],
  code: string,
  error: string,
  details?: Record<string, unknown>
): RuleFailure => ({ ok: false, status, code, error, details });

const PRO_SOON = 'Cheksiz imkoniyatlar Pro tarifda tez kunda ishga tushadi!';

/** Every URL a visitor can be sent to goes through the phishing filter, not just the main one. */
export function checkRedirectTargets(urls: (string | null | undefined)[]): RuleFailure | null {
  for (const url of urls) {
    if (!url) continue;
    const safety = checkUrlSafety(url);
    if (!safety.isSafe) {
      return fail(400, 'PHISHING_SUSPECTED', safety.reason || 'Fishing xavfi: Ushbu havola xavfsizlik filtri tomonidan bloklandi.');
    }
  }
  return null;
}

/** What a single link contributes to plan usage. */
export interface LinkFootprint {
  active: boolean;
  deepLink: boolean;
  deviceTargeting: boolean;
}

export function footprintOf(link: {
  is_archived?: boolean;
  source?: string;
  open_in_app?: boolean | null;
  ios_url?: string | null;
  android_url?: string | null;
  huawei_url?: string | null;
  desktop_url?: string | null;
}): LinkFootprint {
  // Archived links and bio-page blocks don't count toward limits
  const counts = !link.is_archived && link.source !== 'bio';
  return {
    active: counts,
    deepLink: counts && Boolean(link.open_in_app),
    deviceTargeting: counts && Boolean(link.ios_url || link.android_url || link.huawei_url || link.desktop_url),
  };
}

/**
 * Rejects a create or edit only where it *adds* usage beyond the plan.
 * `others` is the workspace's usage excluding this link, so edits that don't
 * increase usage (e.g. renaming a link after a plan downgrade) always pass.
 */
export function checkQuota(
  limits: PlanLimits,
  others: { activeLinks: number; deepLinks: number; deviceTargeting: number },
  before: LinkFootprint,
  after: LinkFootprint
): RuleFailure | null {
  if (after.active && !before.active && others.activeLinks + 1 > limits.activeLinks) {
    return fail(
      403,
      'FREE_LIMIT_REACHED',
      `Tarifingizda ko‘pi bilan ${limits.activeLinks} ta faol havola bo‘lishi mumkin (${others.activeLinks}/${limits.activeLinks}). Yangi havola uchun eskilarini arxivlang yoki o‘chiring. ${PRO_SOON}`,
      { limit: toJsonLimit(limits.activeLinks), currentCount: others.activeLinks }
    );
  }
  if (after.deepLink && !before.deepLink && others.deepLinks + 1 > limits.deepLinks) {
    return fail(
      403,
      'DEEP_LINK_LIMIT_REACHED',
      `Tarifingizda ${limits.deepLinks} ta Smart Deep Link bo‘lishi mumkin (${others.deepLinks}/${limits.deepLinks} ishlatilgan). Mavjud deep linkni o‘chiring yoki oddiy havola sifatida saqlang. ${PRO_SOON}`,
      { maxLimit: toJsonLimit(limits.deepLinks), currentCount: others.deepLinks }
    );
  }
  if (after.deviceTargeting && !before.deviceTargeting && others.deviceTargeting + 1 > limits.deviceTargeting) {
    return fail(
      403,
      'DEVICE_TARGETING_LIMIT_REACHED',
      `Tarifingizda ${limits.deviceTargeting} ta qurilmalar bo‘yicha yo‘naltiruvchi havola bo‘lishi mumkin (${others.deviceTargeting}/${limits.deviceTargeting} ishlatilgan). ${PRO_SOON}`,
      { maxLimit: toJsonLimit(limits.deviceTargeting), currentCount: others.deviceTargeting }
    );
  }
  return null;
}

export const NO_FOOTPRINT: LinkFootprint = { active: false, deepLink: false, deviceTargeting: false };
