CREATE TYPE "public"."auth_provider" AS ENUM('google', 'telegram', 'phone');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('user', 'superadmin');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by" text,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "bio_links" (
	"id" text PRIMARY KEY NOT NULL,
	"bio_page_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"icon" text DEFAULT 'link' NOT NULL,
	"style" text DEFAULT 'glass' NOT NULL,
	"animation" text DEFAULT 'none' NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bio_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"handle" text NOT NULL,
	"title" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"theme" text DEFAULT 'midnight' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"ip_hash" text,
	"referer" text DEFAULT 'Direct' NOT NULL,
	"country" text DEFAULT 'Unknown' NOT NULL,
	"region" text DEFAULT 'Unknown' NOT NULL,
	"city" text DEFAULT 'Unknown' NOT NULL,
	"device_type" text DEFAULT 'Unknown' NOT NULL,
	"os" text DEFAULT 'Unknown' NOT NULL,
	"browser" text DEFAULT 'Unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by" text,
	"title" text NOT NULL,
	"destination_url" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"password" text,
	"expires_at" timestamp with time zone,
	"click_limit" integer,
	"click_count" integer DEFAULT 0 NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"ios_url" text,
	"android_url" text,
	"huawei_url" text,
	"desktop_url" text,
	"open_in_app" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_id" text NOT NULL,
	"email" text,
	"phone" text,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" "platform_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bio_links" ADD CONSTRAINT "bio_links_bio_page_id_bio_pages_id_fk" FOREIGN KEY ("bio_page_id") REFERENCES "public"."bio_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bio_pages" ADD CONSTRAINT "bio_pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_workspace" ON "api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "bio_links_page" ON "bio_links" USING btree ("bio_page_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "bio_pages_handle" ON "bio_pages" USING btree (lower("handle"));--> statement-breakpoint
CREATE INDEX "bio_pages_workspace" ON "bio_pages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "clicks_link_time" ON "clicks" USING btree ("link_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_time" ON "clicks" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "links_slug" ON "links" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "links_workspace" ON "links" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "memberships_user" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_provider_identity" ON "users" USING btree ("provider","provider_id");