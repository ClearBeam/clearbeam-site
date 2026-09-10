# ClearBeam owner app

React Native + Expo (SDK 57, Expo Router) companion app for the business owner.
Shows appointments booked on the website, live, and pushes a notification to the
owner the moment a new booking lands. Owner-only — there is no customer-facing
part.

## Run it (Expo Go / simulator)

```bash
cd mobile
npm install
cp .env.example .env      # optional — defaults to production
npm run ios               # or: npm run android
```

`EXPO_PUBLIC_API_BASE_URL` (in `.env`) points the app at the API. Unset = the
production site. To test against a PR's Netlify deploy preview, set it to that
preview URL.

## Build it (real phone / TestFlight)

Push notifications and a real install need an EAS build. One-time setup:

```bash
cd mobile
npm install -g eas-cli
eas login            # your Expo account
eas init             # links the project; writes extra.eas.projectId into app.json
```

Then:

```bash
eas build -p ios --profile preview       # internal build for your own iPhone
eas build -p ios --profile production    # TestFlight / App Store build
eas build -p android --profile production
```

Apple submissions need an Apple Developer account; `eas submit -p ios` walks
through it. Note: push tokens only register on real devices — simulators get no
token and the app simply skips registration there.

## Screens

| Route | Screen |
|---|---|
| `/login` | Owner email + password → `POST /api/login`; token stored in `expo-secure-store`, kept across restarts |
| `/(app)/(tabs)` | Today / Upcoming — appointments grouped by day, soonest first, pull-to-refresh |
| `/(app)/appointment/[id]` | Detail — call / text the customer, Mark complete, Cancel |
| `/(app)/(tabs)/settings` | Static business hours, Log out |

All data comes from the protected endpoints (`/api/appointments*`). No mock
data. A `401` from any request clears the session and returns to Login.

Push: after login the app registers its Expo push token with
`POST /api/register-push-token`. When a customer books through the website,
`POST /api/book-slot` fires `notifyOwner` and the owner gets a booking alert;
tapping it deep-links to `/appointment/[id]`. Registration degrades quietly
when permission is denied or the device can't receive push (simulators).

## Structure

```
src/
  api/        client (base URL, bearer token, 401 handling) + typed endpoints
  auth/       session context, secure-store persistence
  components/ Screen, Button, StatusPill, AsyncBoundary
  lib/        day-grouping, useAsync, push registration
  app/        Expo Router routes
```
