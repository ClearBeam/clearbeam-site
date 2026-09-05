CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY,
	"slot_date" text NOT NULL,
	"slot_hour" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"zip" text NOT NULL,
	"service" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "appointments_slot_unique" UNIQUE("slot_date","slot_hour")
);
