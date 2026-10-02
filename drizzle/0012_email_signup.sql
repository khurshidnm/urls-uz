CREATE TYPE "public"."email_code_purpose" AS ENUM('signup', 'reset', 'connect');--> statement-breakpoint
ALTER TYPE "public"."auth_provider" ADD VALUE 'email';--> statement-breakpoint
CREATE TABLE "email_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"purpose" "email_code_purpose" NOT NULL,
	"code_hash" text NOT NULL,
	"user_id" text,
	"name" text,
	"password_hash" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_codes_lookup" ON "email_codes" USING btree ("email","purpose","created_at");