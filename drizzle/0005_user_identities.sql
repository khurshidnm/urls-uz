CREATE TABLE "user_identities" (
	"provider" "auth_provider" NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "user_identities_provider_provider_id_pk" PRIMARY KEY("provider","provider_id")
);
--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_identities_user" ON "user_identities" USING btree ("user_id");--> statement-breakpoint
-- Every existing account keeps the login method it was created with
INSERT INTO "user_identities" ("provider", "provider_id", "user_id", "label", "created_at", "last_login_at")
SELECT "provider", "provider_id", "id", coalesce("email", "phone", "name"), "created_at", "last_login_at" FROM "users";
