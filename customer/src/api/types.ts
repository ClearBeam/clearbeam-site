/** Shapes returned by the public booking endpoints. */

export type Slot = { hour: number; label: string };

export type AvailabilityDay = {
  date: string; // YYYY-MM-DD
  label: string; // "Thu, Sep 10"
  slots: Slot[];
};

export type AvailabilityResponse = {
  timezone: string;
  days: AvailabilityDay[];
};

export type BookingRequest = {
  date: string;
  hour: number;
  name: string;
  phone: string;
  zip: string;
  service?: string;
  notes?: string;
};

export type BookingResult = {
  id: number;
  appointment: string; // human description, e.g. "Thu, Sep 10 · 8:00 AM – 9:00 AM"
};
