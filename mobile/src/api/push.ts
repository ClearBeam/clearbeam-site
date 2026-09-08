import { apiFetch } from "./client";

/** POST /api/register-push-token — store this device's Expo token for the owner. */
export function registerPushToken(token: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/api/register-push-token", {
    method: "POST",
    body: { token },
  });
}
