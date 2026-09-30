/**
 * Types for data the dashboard receives, derived from the repository so the
 * UI can't drift from the database. Everything is in its JSON form
 * (dates as ISO strings). Type-only imports: nothing server-side is bundled.
 */
import type { db, PublicApiKey, PublicLink } from '@/lib/db';
import type { Jsonified } from '@/lib/serialize';

type Result<F extends (...args: never[]) => unknown> = NonNullable<Awaited<ReturnType<F>>>;

export type ClientLink = Jsonified<PublicLink>;
export type ClientApiKey = Jsonified<PublicApiKey>;
export type ClientBioPage = Jsonified<Result<typeof db.getBioPageByWorkspace>>;
export type ClientBioLink = ClientBioPage['links'][number];

export type AnalyticsOverview = Jsonified<Result<typeof db.getAnalyticsOverview>>;
export type LinkAnalytics = Omit<Jsonified<Result<typeof db.getLinkAnalytics>>, 'link'> & { link: ClientLink };
export type ClickRow = LinkAnalytics['clicks'][number];

/** What the analytics page shows: the workspace overview, or one link with its recent clicks. */
export type AnalyticsView = Omit<AnalyticsOverview, 'totalLinks' | 'totalBioViews'> &
  Partial<Pick<AnalyticsOverview, 'totalLinks' | 'totalBioViews'>> &
  Partial<Pick<LinkAnalytics, 'link' | 'clicks'>>;
