/**
 * Booking rules for ClearBeam AutoCare.
 *
 * Shared by the availability endpoint and the booking endpoint so both agree on
 * which slots exist — the browser is never trusted to decide what is bookable.
 */

/** Everything is scheduled in the shop's local time, not the visitor's. */
export const TIMEZONE = "America/Chicago";

/** How far ahead visitors may book. */
export const BOOKING_WINDOW_DAYS = 21;

/** A slot must start at least this many hours from now — no surprise same-hour jobs. */
export const MIN_LEAD_HOURS = 2;

/** Jobs are one hour long and one technician runs the van, so one booking per slot. */
export const SLOT_LENGTH_HOURS = 1;

/**
 * Open hours as [first slot start, last slot end) per weekday (0 = Sunday).
 * Matches the hours published on the quote page. Sunday is emergency calls
 * only, which is a phone conversation rather than something to self-book.
 */
const OPEN_HOURS: Record<number, [number, number] | undefined> = {
  0: undefined,
  1: [7, 19],
  2: [7, 19],
  3: [7, 19],
  4: [7, 19],
  5: [7, 19],
  6: [8, 17],
};

/** Slot start hours for a weekday, earliest first. Empty when closed. */
export function slotHoursForWeekday(weekday: number): number[] {
  const open = OPEN_HOURS[weekday];
  if (!open) return [];

  const [from, until] = open;
  const hours: number[] = [];
  for (let hour = from; hour + SLOT_LENGTH_HOURS <= until; hour += SLOT_LENGTH_HOURS) {
    hours.push(hour);
  }
  return hours;
}

export type LocalNow = {
  /** Current local calendar date as YYYY-MM-DD. */
  date: string;
  /** Current local hour, 0-23. */
  hour: number;
  /** Current local minute, 0-59. */
  minute: number;
};

/** Reads the current wall-clock time in the shop's timezone. */
export function localNow(at: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/**
 * Calendar arithmetic on YYYY-MM-DD strings, anchored at midday UTC so that
 * adding whole days never lands on a DST discontinuity.
 */
function toUtcNoon(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toDateString(at: Date): string {
  return at.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const shifted = toUtcNoon(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return toDateString(shifted);
}

export function weekdayOf(date: string): number {
  return toUtcNoon(date).getUTCDay();
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(date: unknown): date is string {
  if (typeof date !== "string" || !ISO_DATE.test(date)) return false;
  return toDateString(toUtcNoon(date)) === date;
}

/** "7:00 AM", "6:00 PM" — used for both labels and the ends of a slot range. */
export function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${suffix}`;
}

/** "7:00 AM – 8:00 AM" */
export function formatSlotRange(hour: number): string {
  return `${formatHour(hour)} – ${formatHour(hour + SLOT_LENGTH_HOURS)}`;
}

/** "Tue, Sep 8" and "Tuesday, September 8, 2026" style labels. */
export function formatDayLabel(date: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: style === "short" ? "short" : "long",
    month: style === "short" ? "short" : "long",
    day: "numeric",
    ...(style === "long" ? { year: "numeric" } : {}),
  }).format(toUtcNoon(date));
}

/** The inclusive date range visitors may book, in local time. */
export function bookingWindow(now: LocalNow = localNow()): { first: string; last: string } {
  return { first: now.date, last: addDays(now.date, BOOKING_WINDOW_DAYS - 1) };
}

/**
 * True when a slot is far enough in the future to be offered. Past slots and
 * slots inside the lead-time buffer are not bookable.
 */
export function meetsLeadTime(date: string, hour: number, now: LocalNow = localNow()): boolean {
  if (date > now.date) return true;
  if (date < now.date) return false;
  return hour >= now.hour + MIN_LEAD_HOURS + (now.minute > 0 ? 1 : 0);
}

/** True when the date/hour pair is a real slot inside the bookable window. */
export function isBookableSlot(date: string, hour: number, now: LocalNow = localNow()): boolean {
  if (!isValidDateString(date) || !Number.isInteger(hour)) return false;

  const { first, last } = bookingWindow(now);
  if (date < first || date > last) return false;
  if (!slotHoursForWeekday(weekdayOf(date)).includes(hour)) return false;

  return meetsLeadTime(date, hour, now);
}

export type AvailableDay = {
  date: string;
  label: string;
  slots: { hour: number; label: string }[];
};

/**
 * Every open slot in the booking window that is not already taken, grouped by
 * day. Days with nothing left are omitted so the picker only offers real choices.
 *
 * A slot only counts as taken while its booking is live. Cancelled rows are
 * ignored here so a freed slot becomes bookable again — callers may either
 * filter `status = 'cancelled'` out in their query or pass the rows through and
 * let this function drop them.
 */
export function buildAvailability(
  takenSlots: { slotDate: string; slotHour: number; status?: string }[],
  now: LocalNow = localNow(),
): AvailableDay[] {
  const taken = new Set(
    takenSlots
      .filter((slot) => slot.status !== "cancelled")
      .map((slot) => `${slot.slotDate}T${slot.slotHour}`),
  );
  const days: AvailableDay[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const date = addDays(now.date, offset);
    const slots = slotHoursForWeekday(weekdayOf(date))
      .filter((hour) => meetsLeadTime(date, hour, now))
      .filter((hour) => !taken.has(`${date}T${hour}`))
      .map((hour) => ({ hour, label: formatSlotRange(hour) }));

    if (slots.length > 0) {
      days.push({ date, label: formatDayLabel(date), slots });
    }
  }

  return days;
}

/** Human-readable appointment summary stored alongside the form submission. */
export function describeSlot(date: string, hour: number): string {
  return `${formatDayLabel(date, "long")} · ${formatSlotRange(hour)}`;
}
