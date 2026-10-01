ALTER TYPE "public"."auth_provider" ADD VALUE 'password';--> statement-breakpoint
ALTER TABLE "user_identities" ADD COLUMN "password_hash" text;