import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

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
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique("appointments_slot_unique").on(table.slotDate, table.slotHour)],
);
