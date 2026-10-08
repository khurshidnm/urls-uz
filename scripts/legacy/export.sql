-- Run against the OLD urls.uz database (table ur_short_link). Writes the links
-- that still work to a CSV, in the table's own column order, for
-- scripts/legacy/import.sql.
--
--   psql "<old database url>" -v out=legacy-links.csv -f scripts/legacy/export.sql
--
-- Final top-up after the DNS switch (only rows created since the first export):
--   psql "<old database url>" -v out=legacy-delta.csv -v since='2026-10-10 09:00' -f scripts/legacy/export.sql
--
-- The same CSV can also be made from DataGrip: run the SELECT below, right-click
-- the result → Export Data → CSV, "Add column header" on. The import script
-- accepts the file with or without the header line.

\set ON_ERROR_STOP on
\if :{?out}
\else
  \echo 'Usage: psql <old db> -v out=legacy-links.csv [-v since=...] -f scripts/legacy/export.sql'
  \quit
\endif
\if :{?since}
\else
  \set since '1970-01-01'
\endif

-- COPY ... TO STDOUT is written to the file opened with \o (psql variables don't work inside \copy)
\o :out
COPY (
  SELECT id, created_at, is_deleted, updated_at, expire_at, open_count, short_id, state, type, url, version, note, note_2
  FROM ur_short_link
  WHERE is_deleted = false
    AND state = 'ACTIVE'
    AND (type = 'FOREVER' OR expire_at > now())
    AND created_at >= :'since'::timestamp
  ORDER BY created_at
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o
