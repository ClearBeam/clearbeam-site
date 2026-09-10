import { apiFetch } from "./client";
import type {
  AvailabilityResponse,
  BookingRequest,
  BookingResult,
} from "./types";

/** GET /api/availability — open days and hourly slots. */
export function getAvailability(signal?: AbortSignal): Promise<AvailabilityResponse> {
  return apiFetch<AvailabilityResponse>("/api/availability", { signal });
}

/** POST /api/book-slot — reserve a slot. 201 on success, 409 if taken. */
export function bookSlot(request: BookingRequest): Promise<BookingResult> {
  return apiFetch<BookingResult>("/api/book-slot", {
    method: "POST",
    body: request,
  });
}
