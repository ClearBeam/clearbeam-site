# ClearBeam owner app

React Native + Expo (SDK 57, Expo Router) companion app for the business owner.
Shows appointments booked on the website, live. Owner-only — there is no
customer-facing part.

## Run it

```bash
cd mobile
npm install
cp .env.example .env      # optional — defaults to production
npm run ios               # or: npm run android
```

`EXPO_PUBLIC_API_BASE_URL` (in `.env`) points the app at the API. Unset = the
production site. To test against a PR's Netlify deploy preview, set it to that
preview URL.

## Screens

| Route | Screen |
|---|---|
| `/login` | Owner email + password → `POST /api/login`; token stored in `expo-secure-store`, kept across restarts |
| `/(app)/(tabs)` | Today / Upcoming — appointments grouped by day, soonest first, pull-to-refresh |
| `/(app)/appointment/[id]` | Detail — call / text the customer, Mark complete, Cancel |
| `/(app)/(tabs)/settings` | Static business hours, Log out |

All data comes from the Step 3 endpoints (`/api/appointments*`). No mock data.
A `401` from any request clears the session and returns to Login.

## Structure

```
src/
  api/        client (base URL, bearer token, 401 handling) + typed endpoints
  auth/       session context, secure-store persistence
  components/ Screen, Button, StatusPill, AsyncBoundary
  lib/        day-grouping, useAsync
  app/        Expo Router routes
```

## Not yet wired

Push notifications (`expo-notifications`, `POST /api/register-push-token`, deep
link to `/appointment/[id]`) land in Step 5.
