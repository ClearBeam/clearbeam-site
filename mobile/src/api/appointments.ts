import { apiFetch } from "./client";
import type {
  Appointment,
  AppointmentResponse,
  AppointmentsResponse,
  AppointmentStatus,
} from "./types";

/** GET /api/appointments — every appointment, past and future. */
export async function getAppointments(signal?: AbortSignal): Promise<Appointment[]> {
  const data = await apiFetch<AppointmentsResponse>("/api/appointments", { signal });
  return data.appointments;
}

/** GET /api/appointments/:id */
export async function getAppointment(id: number, signal?: AbortSignal): Promise<Appointment> {
  const data = await apiFetch<AppointmentResponse>(`/api/appointments/${id}`, { signal });
  return data.appointment;
}

/** PATCH /api/appointments/:id — set status to "completed" or "cancelled". */
export async function updateAppointmentStatus(
  id: number,
  status: Extract<AppointmentStatus, "completed" | "cancelled">,
): Promise<Appointment> {
  const data = await apiFetch<AppointmentResponse>(`/api/appointments/${id}`, {
    method: "PATCH",
    body: { status },
  });
  return data.appointment;
}
