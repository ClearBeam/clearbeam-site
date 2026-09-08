import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { pushTokens } from "../../db/schema.js";
import { withOwner } from "../../lib/auth.js";
import { isExpoPushToken } from "../../lib/push.js";

/**
 * `POST /api/register-push-token` — store the Expo push token for the owner's
 * device so `book-slot` can notify it. Idempotent: re-registering the same token
 * is a no-op.
 */
export default withOwner(async (req: Request) => {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_request", message: "Expected a JSON body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!isExpoPushToken(token)) {
    return Response.json(
      { error: "invalid_token", message: "Expected an ExponentPushToken[...] value." },
      { status: 400 },
    );
  }

  await db.insert(pushTokens).values({ token }).onConflictDoNothing({ target: pushTokens.token });

  return Response.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
});

export const config: Config = {
  path: "/api/register-push-token",
  method: "POST",
};
