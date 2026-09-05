import type { Config } from "@netlify/functions";
import { and, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";
import { bookingWindow, buildAvailability, localNow, TIMEZONE } from "../../lib/schedule.js";

/** Open appointment slots for the next few weeks, minus everything already booked. */
export default async () => {
  const now = localNow();
  const { first, last } = bookingWindow(now);

  const taken = await db
    .select({ slotDate: appointments.slotDate, slotHour: appointments.slotHour })
    .from(appointments)
    .where(and(gte(appointments.slotDate, first), lte(appointments.slotDate, last)));

  return Response.json(
    { timezone: TIMEZONE, days: buildAvailability(taken, now) },
    { headers: { "Cache-Control": "no-store" } },
  );
};

export const config: Config = {
  path: "/api/availability",
  method: "GET",
};
