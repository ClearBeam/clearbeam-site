ALTER TABLE "appointments" DROP CONSTRAINT "appointments_slot_unique";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "status" text DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_slot_unique" ON "appointments" ("slot_date","slot_hour") WHERE "status" <> 'cancelled';