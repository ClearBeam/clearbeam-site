import type { Config, Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";
import { withOwner } from "../../lib/auth.js";
import { isPatchableStatus, toAppointmentDTO } from "../../lib/appointments.js";

function jsonError(status: number, error: string, message: string) {
  return Response.json({ error, message }, { status });
}

/** Path param `:id` → a positive integer, or null if it isn't one. */
function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * `GET /api/appointments/:id`   — one appointment, full detail.
 * `PATCH /api/appointments/:id` — set `status` to "completed" or "cancelled".
 *
 * Cancelling frees the slot for rebooking (the partial unique index from the
 * status migration stops a cancelled row occupying its (date, hour) pair).
 */
export default withOwner(async (req: Request, context: Context) => {
  const id = parseId(context.params.id);
  if (id === null) {
    return jsonError(400, "invalid_id", "Appointment id must be a positive integer.");
  }

  if (req.method === "GET") {
    const [row] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (!row) return jsonError(404, "not_found", "No appointment with that id.");
    return Response.json(
      { appointment: toAppointmentDTO(row) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // PATCH
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "invalid_request", "Expected a JSON body.");
  }
  if (!isPatchableStatus(body.status)) {
    return jsonError(400, "invalid_status", 'status must be "completed" or "cancelled".');
  }

  const [row] = await db
    .update(appointments)
    .set({ status: body.status })
    .where(eq(appointments.id, id))
    .returning();
  if (!row) return jsonError(404, "not_found", "No appointment with that id.");

  return Response.json(
    { appointment: toAppointmentDTO(row) },
    { headers: { "Cache-Control": "no-store" } },
  );
});

export const config: Config = {
  path: "/api/appointments/:id",
  method: ["GET", "PATCH"],
};
