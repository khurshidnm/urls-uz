import type { WorkspaceRecord } from '@/lib/db';

/**
 * What each plan allows. Enforced on the server when links, bio pages and
 * keys are created; the UI reads the same numbers to show usage.
 */
export interface PlanLimits {
  /** Active (non-archived) short links. Bio-page blocks don't count. */
  activeLinks: number;
  /** Links that open in the native app (Telegram, Instagram, ...). */
  deepLinks: number;
  /** Links with per-device destinations (iOS / Android / Huawei / desktop). */
  deviceTargeting: number;
  /** Buttons on the bio page. */
  bioLinks: number;
  /** Bio page themes; null = all themes. */
  bioThemes: string[] | null;
  /**
   * Days raw clicks (the per-visit log) are kept. Daily totals by region,
   * source, device, ... are kept forever, so charts and totals don't shrink.
   */
  rawClickRetentionDays: number;
  /** REST API keys (creating keys and calling the API with them). */
  apiAccess: boolean;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Record<WorkspaceRecord['plan'], PlanLimits> = {
  free: {
    activeLinks: 10,
    deepLinks: 1,
    deviceTargeting: 1,
    bioLinks: 4,
    bioThemes: ['midnight', 'emerald', 'clean-light'],
    rawClickRetentionDays: 30,
    apiAccess: false,
  },
  pro: {
    activeLinks: UNLIMITED,
    deepLinks: UNLIMITED,
    deviceTargeting: UNLIMITED,
    bioLinks: 50,
    bioThemes: null,
    rawClickRetentionDays: 365,
    apiAccess: true,
  },
  enterprise: {
    activeLinks: UNLIMITED,
    deepLinks: UNLIMITED,
    deviceTargeting: UNLIMITED,
    bioLinks: 50,
    bioThemes: null,
    rawClickRetentionDays: 730,
    apiAccess: true,
  },
};

/** Platform admins curate the demo and aren't limited. */
export function limitsFor(workspace: Pick<WorkspaceRecord, 'plan'>, isAdmin = false): PlanLimits {
  if (isAdmin) return PLAN_LIMITS.enterprise;
  return PLAN_LIMITS[workspace.plan];
}

/** JSON can't carry Infinity; the API reports unlimited as null. */
export function toJsonLimit(n: number): number | null {
  return Number.isFinite(n) ? n : null;
}
