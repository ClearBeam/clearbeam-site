# Owner auth — environment setup

The companion app logs in as a single owner. Three variables must be set in the
Netlify project (**Project configuration → Environment variables**, all scopes,
same value in all deploy contexts):

| Variable | What it is |
|---|---|
| `OWNER_EMAIL` | The email the owner logs in with. Already set. |
| `OWNER_PASSWORD_HASH` | A **bcrypt** hash of the owner password. |
| `JWT_SECRET` | Random secret used to sign/verify session tokens. **Not set yet.** |

## Before this ships

### 1. Replace `OWNER_PASSWORD_HASH`

The value currently in the project is the bcrypt example hash from the
`bcryptjs` docs — it is the hash of the literal string `password`. Replace it:

```bash
node scripts/hash-password.mjs
```

Enter a real password (hidden input), copy the printed hash into
`OWNER_PASSWORD_HASH`. The plaintext is never stored.

### 2. Add `JWT_SECRET`

Generate a long random value and add it as a new variable:

```bash
openssl rand -base64 48
```

Rotating this value later immediately invalidates every issued app token
(forces a re-login) — useful if a device is lost.

## Notes

- `POST /api/login` returns `{ token, email }`. The app sends the token back as
  `Authorization: Bearer <token>` on every protected request.
- Tokens are valid for 30 days (the app keeps the owner signed in).
- Failed logins return a generic `401 invalid_credentials` — the endpoint does
  not reveal whether the email or the password was wrong.
- There is no server-side rate limiting on `/api/login` yet. Netlify's platform
  rate limiting can be enabled on the `/api/login` path if brute-force attempts
  become a concern.
