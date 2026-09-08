import type { Config } from "@netlify/functions";
import { asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";
import { withOwner } from "../../lib/auth.js";
import { toAppointmentDTO } from "../../lib/appointments.js";

/**
 * `GET /api/appointments` — every appointment, past and future, for the owner's
 * app (list + history).
 *
 * Deliberately NOT filtered by `bookingWindow()`: that helper covers only the
 * next 21 days for customer-facing availability. The owner needs the whole
 * record, including completed and cancelled jobs, so this query has no date
 * bound. Ordered chronologically by slot; the app groups and filters.
 */
export default withOwner(async () => {
  const rows = await db
    .select()
    .from(appointments)
    .orderBy(asc(appointments.slotDate), asc(appointments.slotHour));

  return Response.json(
    { appointments: rows.map(toAppointmentDTO) },
    { headers: { "Cache-Control": "no-store" } },
  );
});

export const config: Config = {
  path: "/api/appointments",
  method: "GET",
};
