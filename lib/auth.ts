/**
 * Owner authentication for the ClearBeam companion app.
 *
 * The public site endpoints (`/api/availability`, `/api/book-slot`) stay open —
 * customers are never logged in. Everything the app adds on top returns customer
 * contact details, so those endpoints sit behind a single owner login:
 *
 *   1. `POST /api/login` checks the submitted email/password against
 *      `OWNER_EMAIL` + `OWNER_PASSWORD_HASH` (a bcrypt hash — the plaintext
 *      password is never stored) and returns a signed JWT.
 *   2. Every protected endpoint calls `requireOwner(req)` / wraps itself in
 *      `withOwner(...)`, which verifies that JWT from the `Authorization` header.
 *
 * Required environment variables (set in the Netlify project, all deploy
 * contexts): `OWNER_EMAIL`, `OWNER_PASSWORD_HASH`, `JWT_SECRET`.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import type { Context } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";

/** How long an issued token stays valid. The app keeps the owner logged in, so
 * this is deliberately long; rotating `JWT_SECRET` invalidates every token. */
const TOKEN_TTL = "30d";
const JWT_ISSUER = "clearbeam-app";
const JWT_AUDIENCE = "clearbeam-owner";

export type Owner = { email: string };

/** Thrown when a required environment variable is missing, so callers can
 * answer 500 (server misconfigured) rather than 401 (bad credentials). */
export class EnvError extends Error {
  constructor(public readonly variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.name = "EnvError";
  }
}

/** A `Response` thrown to unwind out of `requireOwner`; `withOwner` returns it. */
export class AuthError extends Error {
  readonly response: Response;
  constructor(status = 401, code = "unauthorized", message = "Authentication required.") {
    super(message);
    this.name = "AuthError";
    this.response = Response.json({ error: code, message }, { status });
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new EnvError(name);
  return value;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getRequiredEnv("JWT_SECRET"));
}

/** Constant-time string comparison that tolerates differing lengths. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** bcrypt-compare a plaintext password against a stored `$2b$` hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Produce a bcrypt hash for a new owner password (used by scripts/hash-password.mjs). */
export function hashPassword(plain: string, cost = 12): Promise<string> {
  return bcrypt.hash(plain, cost);
}

export async function signToken(email: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

/** Verify a token's signature/claims and return its subject. Throws on any problem. */
export async function verifyToken(token: string): Promise<Owner> {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new joseErrors.JWTInvalid("token has no subject");
  }
  return { email: payload.sub };
}

/**
 * Require a valid owner token on `req`. Returns the owner, or throws:
 *  - `AuthError` (→ 401) for a missing/malformed/invalid/expired token, or a
 *    token whose subject no longer matches `OWNER_EMAIL`;
 *  - `EnvError` (→ let the caller answer 500) if auth isn't configured.
 */
export async function requireOwner(req: Request): Promise<Owner> {
  const header = req.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer[ \t]+(.+)$/i.exec(header);
  if (!match) throw new AuthError();

  let owner: Owner;
  try {
    owner = await verifyToken(match[1].trim());
  } catch (err) {
    if (err instanceof EnvError) throw err;
    throw new AuthError();
  }

  const ownerEmail = getRequiredEnv("OWNER_EMAIL");
  if (!safeEqual(owner.email.toLowerCase(), ownerEmail.toLowerCase())) {
    throw new AuthError();
  }
  return { email: ownerEmail };
}

/**
 * Wrap a Netlify Functions v2 handler so it only runs for an authenticated
 * owner. The wrapped handler receives the verified `owner` as its third
 * argument; auth failures short-circuit with the right status.
 */
export function withOwner(
  handler: (req: Request, context: Context, owner: Owner) => Response | Promise<Response>,
): (req: Request, context: Context) => Promise<Response> {
  return async (req, context) => {
    let owner: Owner;
    try {
      owner = await requireOwner(req);
    } catch (err) {
      if (err instanceof AuthError) return err.response;
      if (err instanceof EnvError) {
        console.error(`auth: ${err.message}`);
        return Response.json(
          { error: "server_misconfigured", message: "Authentication is not configured." },
          { status: 500 },
        );
      }
      throw err;
    }
    return handler(req, context, owner);
  };
}
