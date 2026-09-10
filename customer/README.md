# ClearBeam customer app

React Native + Expo (SDK 57, Expo Router) customer-facing app for ClearBeam
AutoCare. Customers browse services and book a mobile mechanic visit — no
account needed. Bookings land in the same backend as the website quote form
(`POST /api/book-slot`) and notify the owner app instantly.

## Run it

```bash
cd customer
npm install
cp .env.example .env      # optional — defaults to production
npm run ios               # or: npm run android
```

`EXPO_PUBLIC_API_BASE_URL` (in `.env`) points the app at the API. Unset = the
production site. To test against a PR's Netlify deploy preview, set it to that
preview URL.

## Build it (App Store / Play Store)

```bash
cd customer
npm install -g eas-cli
eas login            # your Expo account
eas init             # links the project; writes extra.eas.projectId into app.json
eas build -p ios --profile production
eas build -p android --profile production
```

Then `eas submit -p ios` / `eas submit -p android`. Apple needs an Apple
Developer account; Google Play needs a Play developer account. Bundle IDs:

- iOS: `com.clearbeam.autocare.customer`
- Android: `com.clearbeam.autocare.customer`

## Screens

| Route | Screen |
|---|---|
| `/` | Home — hero, services grid, how-it-works, service area, call CTA |
| `/service/[slug]` | Service detail with description, Book + Call actions |
| `/book` | Booking flow: service → day/time → details → review → confirmation |

The booking flow reads live availability from `GET /api/availability` and
reserves with `POST /api/book-slot`. If a slot gets taken mid-flow (409), the
app refreshes availability and sends the customer back to pick another time.
The confirmation screen shows the booking reference (`#id`) returned by the
API.

## Structure

```
src/
  api/        public client (no auth) + booking endpoints
  data/       services, service area, phone (mirrors services.html)
  components/ Screen, Button
  app/        Expo Router routes
```

## Notes

- Service content mirrors `services.html`. If services change on the website,
  update `src/data/services.ts` to match.
- The owner app lives in `mobile/` and is a separate Expo project with its own
  bundle IDs (`com.clearbeam.autocare`).
