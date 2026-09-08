import type { Config } from "@netlify/functions";
import { EnvError, getRequiredEnv, safeEqual, signToken, verifyPassword } from "../../lib/auth.js";

function fail(status: number, error: string, message: string) {
  return Response.json({ error, message }, { status });
}

/**
 * Owner login. Checks the submitted credentials against `OWNER_EMAIL` and the
 * bcrypt hash in `OWNER_PASSWORD_HASH`, and on success returns a signed JWT the
 * app stores and sends back on every protected request.
 *
 * The response never says whether it was the email or the password that was
 * wrong, and the bcrypt comparison runs even when the email doesn't match, so
 * the endpoint doesn't leak which owner emails exist by timing or message.
 */
export default async (req: Request) => {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "invalid_request", "Expected a JSON body.");
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return fail(400, "missing_credentials", "Email and password are required.");
  }

  let ownerEmail: string;
  let ownerHash: string;
  try {
    ownerEmail = getRequiredEnv("OWNER_EMAIL");
    ownerHash = getRequiredEnv("OWNER_PASSWORD_HASH");
    getRequiredEnv("JWT_SECRET"); // fail fast here rather than after a "success"
  } catch (err) {
    if (err instanceof EnvError) {
      console.error(`login: ${err.message}`);
      return fail(500, "server_misconfigured", "Login is not configured.");
    }
    throw err;
  }

  const emailOk = safeEqual(email.toLowerCase(), ownerEmail.toLowerCase());
  const passwordOk = await verifyPassword(password, ownerHash);
  if (!emailOk || !passwordOk) {
    return fail(401, "invalid_credentials", "Email or password is incorrect.");
  }

  const token = await signToken(ownerEmail);
  return Response.json({ token, email: ownerEmail }, { headers: { "Cache-Control": "no-store" } });
};

export const config: Config = {
  path: "/api/login",
  method: "POST",
};
