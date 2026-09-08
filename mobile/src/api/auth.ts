import { apiFetch } from "./client";
import type { LoginResponse } from "./types";

/** POST /api/login — exchange owner email + password for a session token. */
export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/login", {
    method: "POST",
    auth: false,
    body: { email: email.trim(), password },
  });
}
