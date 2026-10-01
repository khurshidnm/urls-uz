CREATE TYPE "public"."link_event_action" AS ENUM('created', 'updated', 'archived', 'unarchived');--> statement-breakpoint
CREATE TABLE "folders" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_events" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"user_id" text,
	"action" "link_event_action" NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Hand-edited: convert the old comma-separated tags ("Fintech, Ilova") into arrays
ALTER TABLE "links" ALTER COLUMN "tags" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "links" ALTER COLUMN "tags" SET DATA TYPE text[] USING (
	CASE WHEN btrim("tags", ' ,') = '' THEN '{}'::text[]
	ELSE regexp_split_to_array(btrim("tags", ' ,'), '\s*,\s*') END
);--> statement-breakpoint
UPDATE "links" SET "tags" = array_remove("tags", '');--> statement-breakpoint
ALTER TABLE "links" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "folder_id" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "qr_config" jsonb;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_events" ADD CONSTRAINT "link_events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_events" ADD CONSTRAINT "link_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "folders_workspace_name" ON "folders" USING btree ("workspace_id",lower("name"));--> statement-breakpoint
CREATE INDEX "link_events_link_time" ON "link_events" USING btree ("link_id","created_at");--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "links_folder" ON "links" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "links_tags" ON "links" USING gin ("tags");