/**
 * Thin fetch wrapper for the ClearBeam API.
 *
 * - Base URL comes from EXPO_PUBLIC_API_BASE_URL (defaults to production).
 * - The bearer token is held here and attached to authed requests; the auth
 *   layer calls `setAuthToken()` on login/logout/restore.
 * - A 401 on an authed request triggers `onUnauthorized` (registered by the
 *   auth context) so the app drops the stale token and returns to Login.
 */
import Constants from "expo-constants";

const FALLBACK_BASE_URL = "https://clearbeamandautocare.com";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  FALLBACK_BASE_URL
).replace(/\/+$/, "");

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

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

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Attach the bearer token (default true). Login sets this false. */
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

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

  if (response.status === 401 && auth) {
    onUnauthorized?.();
  }

  const raw = await response.text();
  const data = raw ? safeParse(raw) : null;

  if (!response.ok) {
    const message = fieldString(data, "message") ?? `Request failed (${response.status}).`;
    const code = fieldString(data, "error") ?? "http_error";
    throw new ApiError(response.status, code, message);
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
