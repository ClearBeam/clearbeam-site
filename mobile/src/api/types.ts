/** Shapes returned by the ClearBeam API (see netlify/functions). */

export type AppointmentStatus = "confirmed" | "completed" | "cancelled";

/** One appointment as serialized by `lib/appointments.ts` on the server.
 *  Display strings (`*Label`) are produced server-side from `lib/schedule.ts`
 *  so the app and the website never format a slot differently. */
export type Appointment = {
  id: number;
  status: AppointmentStatus;
  slotDate: string; // "YYYY-MM-DD", shop-local
  slotHour: number; // 0-23, start of a 1-hour window
  name: string;
  phone: string;
  zip: string;
  service: string | null;
  notes: string | null;
  createdAt: string | null; // ISO 8601
  dayLabel: string; // "Tue, Sep 8"
  dayLabelLong: string; // "Tuesday, September 8, 2026"
  timeLabel: string; // "9:00 AM – 10:00 AM"
  slotLabel: string; // "Tuesday, September 8, 2026 · 9:00 AM – 10:00 AM"
};

export type LoginResponse = { token: string; email: string };
export type AppointmentsResponse = { appointments: Appointment[] };
export type AppointmentResponse = { appointment: Appointment };
