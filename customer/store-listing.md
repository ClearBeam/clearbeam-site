# Store listing — ClearBeam AutoCare (customer app)

Bundle IDs: iOS `com.clearbeam.autocare.customer` · Android `com.clearbeam.autocare.customer`

## App Store (iOS)

- **Name:** ClearBeam AutoCare (30 char limit — fits)
- **Subtitle:** Mobile mechanic at your door (30 char limit — fits)
- **Category:** Business (primary) · Utilities (secondary)
- **Age rating:** 4+ — no objectionable content, no user-generated content, no gambling
- **Privacy Policy URL:** https://clearbeamandautocare.com/privacy.html
- **Support URL:** https://clearbeamandautocare.com
- **Support email:** khaled@clearbeamandautocare.com

**Keywords** (100 chars max, comma-separated, no spaces):
```
mobile mechanic,katy,auto repair,headlight restoration,oil change,brakes,battery,car service
```
(97 chars — fits)

**Description:**
```
ClearBeam AutoCare brings the mechanic to you. Book oil changes, brake work,
batteries, diagnostics, and our specialty — headlight restoration — right from
your phone. We serve Katy, Richmond, West Houston, and the Energy Corridor.

HOW IT WORKS
1. Pick a service and grab an open time slot — mornings to evenings.
2. A certified mobile mechanic arrives at your home or office with everything needed.
3. You approve the work before anything is charged. No surprises.

WHY CLEARBEAM
• Real-time availability — see actual open slots, not a callback request
• Upfront confirmation — final quote agreed before work begins
• Headlight restoration specialists — cloudy lenses buffed clear again
• Licensed & insured mobile technician

Book in under a minute. We'll text you to confirm your appointment.
```

**Screenshots needed** (capture from a production build on iPhone 6.9" and 6.5" sizes):
1. Home screen (hero + services)
2. Service detail
3. Booking — day/time picker
4. Booking — confirmation with reference number

**App Review notes:**
> This is a service-booking app for a real local business (ClearBeam AutoCare,
> Katy TX). Booking requires no login and no payment in-app; the customer pays
> the technician after the job. Test booking flow: open the app → Book a service
> → pick any service, day, and time → enter any name/phone/ZIP → confirm.

## Google Play (Android)

Same name, description, and URLs as above.

- **Category:** Business
- **Content rating questionnaire:** 4+ equivalent (Everyone) — no objectionable content
- **Data safety form:**
  - Collects: name, phone number, ZIP/postal code, user-provided vehicle notes
  - Purpose: app functionality (booking a service)
  - Sharing: not shared with third parties
  - Encryption in transit: yes (HTTPS); data deletion: available on request
    (khaled@clearbeamandautocare.com)
- **Feature graphic:** 1024 × 500 (design once, reuse for both stores)

## Before submitting

- [ ] Production builds from `eas build --profile production`
- [ ] Screenshots captured on required device sizes
- [ ] Privacy policy live at /privacy.html (this repo)
- [ ] Apple Developer ($99/yr) and Google Play ($25 one-time) accounts ready
- [ ] `eas submit -p ios` / `eas submit -p android`
