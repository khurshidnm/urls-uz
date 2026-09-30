CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window" integer NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limits_key_window_pk" PRIMARY KEY("key","window")
);
--> statement-breakpoint
CREATE INDEX "rate_limits_expiry" ON "rate_limits" USING btree ("expires_at");