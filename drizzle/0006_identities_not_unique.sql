DROP INDEX "users_provider_identity";--> statement-breakpoint
CREATE INDEX "users_provider_identity" ON "users" USING btree ("provider","provider_id");