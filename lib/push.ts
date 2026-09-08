/**
 * Owner push notifications via Expo's push service.
 *
 * `notifyOwner` is fire-and-forget: it reads every stored device token, sends
 * one Expo push request, prunes tokens Expo reports as unregistered, and never
 * throws. Whatever triggered it (a new booking) must not fail because a
 * notification couldn't be delivered.
 */
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { pushTokens } from "../db/schema.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]` */
export function isExpoPushToken(value: unknown): value is string {
  return typeof value === "string" && /^ExponentPushToken\[[^\]]+\]$/.test(value.trim());
}

export type OwnerNotification = {
  title: string;
  body: string;
  /** Delivered to the app; used to deep-link the notification tap. */
  data?: Record<string, unknown>;
};

type ExpoTicket = { status: "ok" | "error"; details?: { error?: string } };

/**
 * POST one batch of messages to Expo. Returns the tokens Expo rejected as
 * `DeviceNotRegistered` (safe to delete). Throws only on a total transport
 * failure; `notifyOwner` is the caller that guarantees no throw escapes.
 */
export async function sendExpoPush(
  tokens: string[],
  notification: OwnerNotification,
): Promise<{ unregistered: string[] }> {
  if (tokens.length === 0) return { unregistered: [] };

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {},
        sound: "default",
        priority: "high",
        channelId: "default",
      })),
    ),
  });

  if (!response.ok) {
    console.error(`push: Expo API responded ${response.status}`);
    return { unregistered: [] };
  }

  const payload = (await response.json()) as { data?: ExpoTicket[] };
  const unregistered: string[] = [];
  (payload.data ?? []).forEach((ticket, i) => {
    if (ticket.status !== "error") return;
    console.error(`push: ticket error for ${tokens[i]}: ${ticket.details?.error ?? "unknown"}`);
    if (ticket.details?.error === "DeviceNotRegistered" && tokens[i]) {
      unregistered.push(tokens[i]);
    }
  });
  return { unregistered };
}

export async function notifyOwner(notification: OwnerNotification): Promise<void> {
  try {
    const rows = await db.select({ token: pushTokens.token }).from(pushTokens);
    const { unregistered } = await sendExpoPush(
      rows.map((row) => row.token),
      notification,
    );
    for (const token of unregistered) {
      await db.delete(pushTokens).where(eq(pushTokens.token, token));
    }
  } catch (err) {
    console.error("push: notifyOwner failed", err);
  }
}
