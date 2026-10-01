CREATE TYPE "public"."qr_type" AS ENUM('url', 'text', 'vcard', 'location', 'wifi', 'event');--> statement-breakpoint
ALTER TYPE "public"."link_source" ADD VALUE 'qr';--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"type" "qr_type" NOT NULL,
	"content" jsonb NOT NULL,
	"design" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"link_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qr_codes_workspace" ON "qr_codes" USING btree ("workspace_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_codes_link" ON "qr_codes" USING btree ("link_id");