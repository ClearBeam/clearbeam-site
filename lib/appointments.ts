/**
 * Serialization for the owner-facing appointment endpoints.
 *
 * The database stores a slot as a raw local date + start hour and nothing
 * human-readable (`describeSlot`'s string is computed, never persisted). The app
 * must not re-implement that formatting or it will drift from the website, so
 * every date/time label here comes straight from `lib/schedule.ts`.
 */
import { describeSlot, formatDayLabel, formatSlotRange } from "./schedule.js";
import type { appointments } from "../db/schema.js";

type AppointmentRow = typeof appointments.$inferSelect;

/** Every status a row can hold. */
export const APPOINTMENT_STATUSES = ["confirmed", "completed", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses the owner may set via `PATCH /api/appointments/:id`. */
export const PATCHABLE_STATUSES = ["completed", "cancelled"] as const;
export type PatchableStatus = (typeof PATCHABLE_STATUSES)[number];

export function isPatchableStatus(value: unknown): value is PatchableStatus {
  return typeof value === "string" && (PATCHABLE_STATUSES as readonly string[]).includes(value);
}

export type AppointmentDTO = {
  id: number;
  status: string;
  /** Raw local calendar date, "YYYY-MM-DD" — for grouping/sorting in the app. */
  slotDate: string;
  /** Raw start hour, 0-23. */
  slotHour: number;
  name: string;
  phone: string;
  zip: string;
  service: string | null;
  notes: string | null;
  /** ISO 8601, or null for the handful of rows created before the column had a default. */
  createdAt: string | null;
  /** "Tue, Sep 8" */
  dayLabel: string;
  /** "Tuesday, September 8, 2026" */
  dayLabelLong: string;
  /** "9:00 AM – 10:00 AM" */
  timeLabel: string;
  /** "Tuesday, September 8, 2026 · 9:00 AM – 10:00 AM" — same string the booking confirmation uses. */
  slotLabel: string;
};

export function toAppointmentDTO(row: AppointmentRow): AppointmentDTO {
  return {
    id: row.id,
    status: row.status,
    slotDate: row.slotDate,
    slotHour: row.slotHour,
    name: row.name,
    phone: row.phone,
    zip: row.zip,
    service: row.service ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    dayLabel: formatDayLabel(row.slotDate, "short"),
    dayLabelLong: formatDayLabel(row.slotDate, "long"),
    timeLabel: formatSlotRange(row.slotHour),
    slotLabel: describeSlot(row.slotDate, row.slotHour),
  };
}
