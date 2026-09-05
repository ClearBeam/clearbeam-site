import type { Config } from "@netlify/functions";
import { and, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";
import {
  bookingWindow,
  buildAvailability,
  describeSlot,
  isBookableSlot,
  localNow,
} from "../../lib/schedule.js";

const MAX_LENGTHS = { name: 120, phone: 40, zip: 12, service: 120, notes: 2000 };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Re-reads availability so a rejected request can tell the visitor what is still open. */
async function currentAvailability() {
  const now = localNow();
  const { first, last } = bookingWindow(now);
  const taken = await db
    .select({ slotDate: appointments.slotDate, slotHour: appointments.slotHour })
    .from(appointments)
    .where(and(gte(appointments.slotDate, first), lte(appointments.slotDate, last)));

  return buildAvailability(taken, now);
}

/**
 * Reserves one appointment slot. The visitor's chosen slot is validated against
 * the same rules the availability endpoint uses, and the unique constraint on
 * (slot_date, slot_hour) settles any race between two people picking the same
 * hour — the loser gets a 409 and a refreshed list of open slots.
 */
export default async (req: Request) => {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_request", message: "Expected a JSON body." }, { status: 400 });
  }

  const date = typeof body.date === "string" ? body.date : "";
  const hour = Number(body.hour);
  const name = text(body.name, MAX_LENGTHS.name);
  const phone = text(body.phone, MAX_LENGTHS.phone);
  const zip = text(body.zip, MAX_LENGTHS.zip);

  if (!name || !phone || !zip) {
    return Response.json(
      { error: "missing_contact", message: "Name, phone and ZIP code are required." },
      { status: 400 },
    );
  }

  if (!isBookableSlot(date, hour)) {
    return Response.json(
      {
        error: "slot_unavailable",
        message: "That time is no longer open. Please pick another one.",
        days: await currentAvailability(),
      },
      { status: 409 },
    );
  }

  const [booked] = await db
    .insert(appointments)
    .values({
      slotDate: date,
      slotHour: hour,
      name,
      phone,
      zip,
      service: text(body.service, MAX_LENGTHS.service) || null,
      notes: text(body.notes, MAX_LENGTHS.notes) || null,
    })
    .onConflictDoNothing({ target: [appointments.slotDate, appointments.slotHour] })
    .returning({ id: appointments.id });

  if (!booked) {
    return Response.json(
      {
        error: "slot_taken",
        message: "Someone just took that time. Please pick another one.",
        days: await currentAvailability(),
      },
      { status: 409 },
    );
  }

  return Response.json({ id: booked.id, appointment: describeSlot(date, hour) }, { status: 201 });
};

export const config: Config = {
  path: "/api/book-slot",
  method: "POST",
};
