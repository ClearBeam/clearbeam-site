import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * A booked appointment slot.
 *
 * Slots are stored as a local calendar date plus a start hour in the shop's
 * timezone (America/Chicago) rather than a UTC instant. The technician thinks
 * in local time, business hours are local, and this keeps DST changeovers from
 * shifting an already-booked 9am job to 8am or 10am.
 */
export const appointments = pgTable(
  "appointments",
  {
    id: serial().primaryKey(),
    slotDate: text("slot_date").notNull(),
    slotHour: integer("slot_hour").notNull(),
    name: text().notNull(),
    phone: text().notNull(),
    zip: text().notNull(),
    service: text(),
    notes: text(),
    /**
     * Lifecycle of the booking. New rows are always "confirmed"; the owner app
     * moves a row to "completed" once the job is done or "cancelled" to free the
     * slot. Cancelled rows are kept for history rather than deleted.
     */
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // One live booking per slot. Cancelled rows are excluded from the constraint
    // so a freed slot can be booked again (and so cancel/rebook history for the
    // same slot can accumulate as multiple rows).
    uniqueIndex("appointments_slot_unique")
      .on(table.slotDate, table.slotHour)
      .where(sql`${table.status} <> 'cancelled'`),
  ],
);
