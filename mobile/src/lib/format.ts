import type { Appointment } from "@/api/types";

/** Device-local calendar date as YYYY-MM-DD (slot dates are shop-local, which for
 *  a single Katy TX operator is the same zone). */
function localToday(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type DaySection = {
  /** slotDate key, e.g. "2026-09-10" */
  date: string;
  /** "Today", "Tomorrow", or the server's `dayLabel` ("Tue, Sep 8"). */
  title: string;
  data: Appointment[];
};

/**
 * Group appointments by day, earliest first, with slots inside a day ordered by
 * hour. `dayLabel` for the header comes from the server; only the Today/Tomorrow
 * relabelling happens here.
 */
export function groupByDay(appointments: Appointment[]): DaySection[] {
  const today = localToday(0);
  const tomorrow = localToday(1);

  const byDate = new Map<string, Appointment[]>();
  for (const appt of appointments) {
    const list = byDate.get(appt.slotDate) ?? [];
    list.push(appt);
    byDate.set(appt.slotDate, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      title: date === today ? "Today" : date === tomorrow ? "Tomorrow" : data[0].dayLabel,
      data: [...data].sort((a, b) => a.slotHour - b.slotHour),
    }));
}

/** Upcoming = not in the past and not cancelled. Used by the default list view. */
export function isUpcoming(appt: Appointment): boolean {
  return appt.status !== "cancelled" && appt.slotDate >= localToday(0);
}

/** A `tel:` / `sms:` friendly version of a free-text phone number. */
export function dialablePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^\d]/g, "");
}
