import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import {
  apiKeys,
  bioPages,
  folders,
  linkEvents,
  links,
  memberships,
  qrCodes,
  userIdentities,
  users,
  workspaces,
} from '@/db/schema';
import { db, newId, type AuthProvider, type Executor, type UserRecord } from '@/lib/db';
import { roleFor } from '@/lib/auth';

/**
 * Accounts and their login methods. A person has one account; Google,
 * Telegram and a phone number are ways into it (user_identities). Logging
 * in with a method nobody has used creates an account; connecting a method
 * from settings adds it to the current account, merging in the account that
 * method belonged to before.
 */

export interface LoginProfile {
  provider: AuthProvider;
  /** Google `sub`, Telegram user id, or the phone number's digits. */
  providerId: string;
  name: string;
  /** Shown in settings: the Google email, the Telegram name, the phone number. */
  label: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export type IdentityRecord = typeof userIdentities.$inferSelect;

export type SignInResult =
  | { ok: true; user: UserRecord; outcome: 'signed-in' | 'created' | 'connected' | 'already-connected' | 'merged' }
  | { ok: false; code: string; error: string };

type Tx = Parameters<Parameters<typeof pg.transaction>[0]>[0];

/**
 * Logs in with a verified login method. With `connectTo`, the method is
 * added to that (already logged-in) account instead.
 */
export async function signIn(profile: LoginProfile, { connectTo }: { connectTo?: string | null } = {}): Promise<SignInResult> {
  const result = await pg.transaction(async (tx): Promise<SignInResult> => {
    const [existing] = await tx
      .select()
      .from(userIdentities)
      .where(and(eq(userIdentities.provider, profile.provider), eq(userIdentities.provider_id, profile.providerId)))
      .for('update');

    if (connectTo) {
      if (existing?.user_id === connectTo) {
        await touchIdentity(tx, profile);
        return { ok: true, user: (await getUser(tx, connectTo))!, outcome: 'already-connected' };
      }
      if (existing) {
        const failure = await mergeAccounts(tx, existing.user_id, connectTo);
        if (failure) return failure;
        await touchIdentity(tx, profile);
        await fillProfile(tx, connectTo, profile);
        return { ok: true, user: (await getUser(tx, connectTo))!, outcome: 'merged' };
      }
      await insertIdentity(tx, connectTo, profile);
      await fillProfile(tx, connectTo, profile);
      return { ok: true, user: (await getUser(tx, connectTo))!, outcome: 'connected' };
    }

    if (existing) {
      await touchIdentity(tx, profile);
      await fillProfile(tx, existing.user_id, profile);
      return { ok: true, user: (await getUser(tx, existing.user_id))!, outcome: 'signed-in' };
    }

    const [user] = await tx
      .insert(users)
      .values({
        id: newId('usr'),
        provider: profile.provider,
        provider_id: profile.providerId,
        email: profile.email ?? null,
        phone: profile.phone ?? null,
        name: profile.name,
        avatar_url: profile.avatarUrl ?? null,
        last_login_at: new Date(),
      })
      .returning();
    await insertIdentity(tx, user.id, profile);
    return { ok: true, user, outcome: 'created' };
  });

  if (!result.ok) return result;
  // Admin rights follow from any of the account's login methods
  const user = await refreshRole(result.user);
  await db.ensurePersonalWorkspace(user);
  return { ...result, user };
}

export async function listIdentities(userId: string): Promise<IdentityRecord[]> {
  return pg.select().from(userIdentities).where(eq(userIdentities.user_id, userId)).orderBy(asc(userIdentities.created_at));
}

/** Removes a login method, keeping at least one so the account stays reachable. */
export async function disconnectIdentity(userId: string, provider: AuthProvider, providerId: string): Promise<SignInResult> {
  return pg.transaction(async (tx): Promise<SignInResult> => {
    const own = await tx.select().from(userIdentities).where(eq(userIdentities.user_id, userId)).for('update');
    if (!own.some((i) => i.provider === provider && i.provider_id === providerId)) {
      return { ok: false, code: 'NOT_FOUND', error: 'Kirish usuli topilmadi' };
    }
    if (own.length <= 1) {
      return { ok: false, code: 'LAST_LOGIN_METHOD', error: 'Oxirgi kirish usulini uzib bo‘lmaydi: akkauntga kira olmay qolasiz.' };
    }
    await tx
      .delete(userIdentities)
      .where(and(eq(userIdentities.provider, provider), eq(userIdentities.provider_id, providerId), eq(userIdentities.user_id, userId)));
    return { ok: true, user: (await getUser(tx, userId))!, outcome: 'signed-in' };
  });
}

async function getUser(exec: Executor, id: string): Promise<UserRecord | undefined> {
  const [user] = await exec.select().from(users).where(eq(users.id, id));
  return user;
}

async function insertIdentity(tx: Tx, userId: string, profile: LoginProfile) {
  await tx.insert(userIdentities).values({
    provider: profile.provider,
    provider_id: profile.providerId,
    user_id: userId,
    label: profile.label,
    last_login_at: new Date(),
  });
}

async function touchIdentity(tx: Tx, profile: LoginProfile) {
  await tx
    .update(userIdentities)
    .set({ label: profile.label, last_login_at: new Date() })
    .where(and(eq(userIdentities.provider, profile.provider), eq(userIdentities.provider_id, profile.providerId)));
}

/** Fills in contact details the account doesn't have yet; never overwrites what the user has. */
async function fillProfile(tx: Tx, userId: string, profile: LoginProfile) {
  await tx
    .update(users)
    .set({
      email: sql`coalesce(${users.email}, ${profile.email ?? null})`,
      phone: sql`coalesce(${users.phone}, ${profile.phone ?? null})`,
      avatar_url: sql`coalesce(${users.avatar_url}, ${profile.avatarUrl ?? null})`,
      last_login_at: new Date(),
    })
    .where(eq(users.id, userId));
}

async function refreshRole(user: UserRecord): Promise<UserRecord> {
  const identities = await listIdentities(user.id);
  const admin =
    roleFor({ email: user.email }) === 'superadmin' ||
    identities.some(
      (i) =>
        roleFor({
          email: i.provider === 'google' ? i.label : null,
          telegramId: i.provider === 'telegram' ? i.provider_id : null,
        }) === 'superadmin'
    );
  const role = admin ? 'superadmin' : 'user';
  if (role === user.role) return user;
  const [updated] = await pg.update(users).set({ role }).where(eq(users.id, user.id)).returning();
  return updated;
}

/**
 * Moves everything of account `fromId` into account `intoId` and deletes it.
 * Workspaces `fromId` owned alone are folded into `intoId`'s personal
 * workspace (links, folders, QR codes, API keys, bio page); shared
 * workspaces keep `intoId` as a member instead.
 */
async function mergeAccounts(tx: Tx, fromId: string, intoId: string): Promise<SignInResult | null> {
  const [target] = await tx
    .select({ id: memberships.workspace_id })
    .from(memberships)
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspace_id))
    .where(and(eq(memberships.user_id, intoId), eq(memberships.role, 'owner'), eq(workspaces.is_demo, false)))
    .orderBy(asc(memberships.created_at))
    .limit(1);
  if (!target) return { ok: false, code: 'NO_WORKSPACE', error: 'Akkauntingiz ish maydoni topilmadi' };

  const fromMemberships = await tx.select().from(memberships).where(eq(memberships.user_id, fromId));
  const memberCounts = fromMemberships.length
    ? await tx
        .select({ id: memberships.workspace_id, count: sql<number>`count(*)::int` })
        .from(memberships)
        .where(inArray(memberships.workspace_id, fromMemberships.map((m) => m.workspace_id)))
        .groupBy(memberships.workspace_id)
    : [];
  const soleOwned = fromMemberships
    .filter((m) => m.role === 'owner' && memberCounts.find((c) => c.id === m.workspace_id)?.count === 1)
    .map((m) => m.workspace_id)
    .filter((id) => id !== target.id);

  // One bio page per workspace: two can't be combined automatically
  if (soleOwned.length > 0) {
    const pages = await tx
      .select({ workspace_id: bioPages.workspace_id })
      .from(bioPages)
      .where(inArray(bioPages.workspace_id, [target.id, ...soleOwned]));
    if (new Set(pages.map((p) => p.workspace_id)).size > 1) {
      return {
        ok: false,
        code: 'MERGE_CONFLICT_BIO',
        error: 'Ikkala akkauntda ham bio sahifa bor. Ulardan birini o‘chiring va qayta ulang.',
      };
    }
  }

  for (const wsId of soleOwned) {
    // Folder names are unique per workspace
    await tx.execute(sql`
      update ${folders} set name = ${folders.name} || ' (2)'
      where ${folders.workspace_id} = ${wsId}
        and lower(${folders.name}) in (select lower(name) from folders where workspace_id = ${target.id})`);
    for (const table of [links, folders, qrCodes, apiKeys, bioPages]) {
      await tx.update(table).set({ workspace_id: target.id }).where(eq(table.workspace_id, wsId));
    }
    // Keep the better plan
    await tx.execute(sql`
      update ${workspaces} set plan = greatest(${workspaces.plan}, (select plan from workspaces where id = ${wsId}))
      where ${workspaces.id} = ${target.id}`);
    await tx.delete(workspaces).where(eq(workspaces.id, wsId));
  }

  for (const m of fromMemberships.filter((m) => !soleOwned.includes(m.workspace_id))) {
    await tx.insert(memberships).values({ workspace_id: m.workspace_id, user_id: intoId, role: m.role }).onConflictDoNothing();
  }

  await tx.update(links).set({ created_by: intoId }).where(eq(links.created_by, fromId));
  await tx.update(qrCodes).set({ created_by: intoId }).where(eq(qrCodes.created_by, fromId));
  await tx.update(apiKeys).set({ created_by: intoId }).where(eq(apiKeys.created_by, fromId));
  await tx.update(linkEvents).set({ user_id: intoId }).where(eq(linkEvents.user_id, fromId));
  await tx.update(userIdentities).set({ user_id: intoId }).where(eq(userIdentities.user_id, fromId));
  // Sessions and memberships go with the account
  await tx.delete(users).where(eq(users.id, fromId));
  return null;
}
