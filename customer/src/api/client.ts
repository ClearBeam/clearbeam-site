/**
 * Thin fetch wrapper for the ClearBeam public API.
 *
 * The customer app needs no login: /api/availability and /api/book-slot are
 * public. Base URL comes from EXPO_PUBLIC_API_BASE_URL (defaults to production).
 */
import Constants from "expo-constants";

const FALLBACK_BASE_URL = "https://clearbeamandautocare.com";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  FALLBACK_BASE_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "network_error", "Couldn't reach the server. Check your connection.");
  }

  const raw = await response.text();
  const data = raw ? safeParse(raw) : null;

  if (!response.ok) {
    const message = fieldString(data, "message") ?? `Request failed (${response.status}).`;
    const code = fieldString(data, "error") ?? "http_error";
    const error = new ApiError(response.status, code, message);
    // 409s from book-slot carry a refreshed availability payload.
    (error as ApiError & { days?: unknown }).days = (data as { days?: unknown } | null)?.days;
    throw error;
  }

  return data as T;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fieldString(data: unknown, key: string): string | null {
  if (data && typeof data === "object" && key in data) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
    if (value != null) return String(value);
  }
  return null;
}
