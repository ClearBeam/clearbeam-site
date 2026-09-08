CREATE TABLE "push_tokens" (
	"id" serial PRIMARY KEY,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now()
);
