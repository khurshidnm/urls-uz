CREATE TYPE "public"."stat_dimension" AS ENUM('total', 'region', 'country', 'referer', 'device', 'os', 'browser');--> statement-breakpoint
CREATE TABLE "link_stats_daily" (
	"link_id" text NOT NULL,
	"day" date NOT NULL,
	"dimension" "stat_dimension" NOT NULL,
	"value" text NOT NULL,
	"clicks" integer NOT NULL,
	CONSTRAINT "link_stats_daily_link_id_day_dimension_value_pk" PRIMARY KEY("link_id","day","dimension","value")
);
--> statement-breakpoint
ALTER TABLE "link_stats_daily" ADD CONSTRAINT "link_stats_daily_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Totals for the clicks recorded so far
INSERT INTO "link_stats_daily" ("link_id", "day", "dimension", "value", "clicks")
SELECT link_id, (created_at AT TIME ZONE 'Asia/Tashkent')::date, d.dimension::stat_dimension, d.value, count(*)::int
FROM "clicks"
CROSS JOIN LATERAL (VALUES
  ('total', ''),
  ('region', CASE WHEN country = 'UZ' THEN region END),
  ('country', country),
  ('referer', referer),
  ('device', device_type),
  ('os', os),
  ('browser', browser)
) AS d(dimension, value)
WHERE d.value IS NOT NULL
GROUP BY 1, 2, 3, 4;
