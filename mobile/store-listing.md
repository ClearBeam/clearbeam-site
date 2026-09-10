# Distribution — ClearBeam owner app (mobile/)

Bundle IDs: iOS `com.clearbeam.autocare` · Android `com.clearbeam.autocare`

## Recommendation: do NOT publish publicly

The owner app is an internal business tool — it shows customer names, phone
numbers, and booking details. It should never be on the public App Store or
Play Store. Distribute it privately instead:

### iOS — TestFlight (internal testers)

```bash
cd mobile
eas build -p ios --profile production
eas submit -p ios   # then add yourself as an internal tester in App Store Connect
```

Internal TestFlight testers (up to 100) install without App Review. No public
listing, no screenshots, no review wait.

### Android — Play internal track

```bash
cd mobile
eas build -p android --profile production
eas submit -p android
```

Upload to the **internal testing track** in the Play Console and add your Gmail
as a tester. The app never appears in public search.

## What the listing would say (kept here for reference only)

- **Name:** ClearBeam Owner
- **Description:** Internal companion app for ClearBeam AutoCare. View live
  appointments booked on the website, call or text customers, mark jobs
  complete, and get a push notification the moment a new booking lands.
  Owner login required — not for public use.

## Checklist

- [ ] Apple Developer and Google Play developer accounts ready
- [ ] `eas init` run in `mobile/` (writes the EAS project ID for push tokens)
- [ ] Owner signed in on a real device once, so the push token registers
      (`POST /api/register-push-token`)
- [ ] Test booking from the customer app or website → owner gets the push
