-- Imports the old urls.uz links (ur_short_link rows exported as CSV) into the
-- new `links` table, in the member-less "Legacy links" workspace, so every old
-- short link keeps redirecting.
--
--   psql "$DATABASE_URL" -f scripts/legacy/import.sql < legacy-links.csv
--
-- The CSV holds ur_short_link rows in the table's column order
-- (id, created_at, is_deleted, updated_at, expire_at, open_count, short_id,
-- state, type, url, version, note, note_2), with or without a header line.
-- Deleted, disabled and expired rows in the file are skipped, so a full
-- table export works too.
--
-- Optional: -v tz=Asia/Tashkent  time zone of the old `timestamp` columns
--           (they carry no zone; default Asia/Tashkent).
--
-- Safe to re-run, and the same command loads the delta CSV after the DNS
-- switch: links already imported (same id) are skipped. A short code that is
-- already taken by a link created in the new system is not imported; those
-- are listed at the end (legacy_conflicts table) to resolve by hand.

\set ON_ERROR_STOP on
\if :{?tz}
\else
  \set tz 'Asia/Tashkent'
\endif
SELECT set_config('legacy.tz', :'tz', false);

-- 1. The CSV goes into a staging table as text (unlogged: fast, and dropped at the end)
DROP TABLE IF EXISTS legacy_import;
CREATE UNLOGGED TABLE legacy_import (
  n bigint GENERATED ALWAYS AS IDENTITY,
  old_id text, created_at text, is_deleted text, updated_at text, expire_at text,
  open_count text, short_id text, state text, type text, url text, version text, note text, note_2 text
);
\copy legacy_import (old_id, created_at, is_deleted, updated_at, expire_at, open_count, short_id, state, type, url, version, note, note_2) FROM pstdin WITH (FORMAT csv)
DELETE FROM legacy_import WHERE old_id = 'id';  -- the header line, if the file has one
SELECT count(*) AS rows_in_csv FROM legacy_import \gset
\echo 'Rows in CSV:' :rows_in_csv

-- 2. The workspace that owns links nobody can log in to (the old service was anonymous)
INSERT INTO workspaces (id, name, slug) VALUES ('ws_legacy', 'Legacy links', 'legacy') ON CONFLICT DO NOTHING;

-- 3. Codes already used by a link created in the new system: reported, not overwritten
DROP TABLE IF EXISTS legacy_conflicts;
CREATE TABLE legacy_conflicts AS
SELECT i.short_id, i.url AS legacy_url, l.id AS link_id, l.workspace_id, l.destination_url
FROM legacy_import i
JOIN links l ON l.slug = i.short_id
WHERE l.id <> 'lnk_' || replace(i.old_id, '-', '');

-- 4. Insert in batches of 200k, committing each, so progress is visible and a
--    failure halfway keeps what is done (a re-run continues from there)
DO $$
DECLARE
  batch constant bigint := 200000;
  total bigint;
  done bigint := 0;
  added bigint;
  added_total bigint := 0;
  tz text := current_setting('legacy.tz');
BEGIN
  SELECT max(n) INTO total FROM legacy_import;
  WHILE done < coalesce(total, 0) LOOP
    INSERT INTO links (id, workspace_id, title, destination_url, slug, expires_at, click_count, source, created_at, updated_at)
    SELECT
      'lnk_' || replace(i.old_id, '-', ''),
      'ws_legacy',
      coalesce(substring(i.url from '^https?://([^/?#]+)'), i.short_id),
      i.url,
      i.short_id,
      CASE WHEN i.type = 'EXPIRE' THEN i.expire_at::timestamp AT TIME ZONE tz END,
      greatest(coalesce(i.open_count::integer, 0), 0),
      'api',
      coalesce(i.created_at::timestamp AT TIME ZONE tz, now()),
      coalesce(i.updated_at::timestamp AT TIME ZONE tz, i.created_at::timestamp AT TIME ZONE tz, now())
    FROM legacy_import i
    WHERE i.n > done AND i.n <= done + batch
      -- only links that still work (a full table export may hold the dead ones too)
      AND NOT coalesce(i.is_deleted::boolean, false)
      AND i.state = 'ACTIVE'
      AND (i.type = 'FOREVER' OR i.expire_at::timestamp AT TIME ZONE tz > now())
      AND i.url ~ '^https?://'
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS added = ROW_COUNT;
    added_total := added_total + added;
    done := done + batch;
    COMMIT;
    RAISE NOTICE 'processed % / %, inserted %', least(done, total), total, added_total;
  END LOOP;
END $$;

ANALYZE links;
DROP TABLE legacy_import;

SELECT count(*) AS legacy_links_total FROM links WHERE workspace_id = 'ws_legacy';
SELECT count(*) AS conflicts FROM legacy_conflicts;
\echo 'Conflicting codes (if any): SELECT * FROM legacy_conflicts;'
