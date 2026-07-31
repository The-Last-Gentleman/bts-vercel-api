# BTS Environment Management System — Vercel API

Backend API that sits between the ESP32 devices, Firebase, and the SMSPoP
bulk SMS gateway. The ESP32 never talks to SMSPoP directly and never holds
any SMS credentials — it only knows the station ID and the API URL.

## Project structure

```
app/
  api/
    sms/
      route.ts        <- POST /api/sms (intrusion alert endpoint)
  layout.tsx
  page.tsx
lib/
  firebase.ts          <- Firebase Admin init + station config lookup
  smspop.ts             <- SMSPoP HTTP calls
  validation.ts         <- request validation helpers
  responses.ts           <- standardised JSON response helpers
types/
  sms.ts                <- shared TypeScript types
esp32-example/
  esp32_intrusion_alert.ino  <- example Arduino sketch for the ESP32
.env.local.example      <- copy to .env.local and fill in real values
```

## How it works

1. ESP32 detects an intrusion and sends:
   ```json
   { "stationId": "station001" }
   ```
   to `POST /api/sms`.
2. The API validates the request.
3. It reads that station's config from Firestore (`stations/station001`):
   ```json
   {
     "stationName": "BTS Station 001",
     "location": "Bindura",
     "emergencyPhoneNumber": "263771234567",
     "alertsEnabled": true
   }
   ```
4. It builds a message and sends it through SMSPoP.
5. It returns a simple `{ success, message }` response to the ESP32.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your real values:
   ```bash
   cp .env.local.example .env.local
   ```
   You need:
   - `SMSPOP_TOKEN` and `SMSPOP_SENDER_ID` from your SMSPoP dashboard
     (sender ID must be pre-approved by SMSPoP for your account).
   - Firebase Admin credentials (`FIREBASE_PROJECT_ID`,
     `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) from a Firebase
     service account JSON (Firebase Console → Project Settings →
     Service Accounts → Generate new private key).
   - Optionally, `DEVICE_SHARED_SECRET` — a random string the ESP32 must
     send back so random internet requests can't trigger SMS sends.

3. Create a Firestore collection called `stations`, with one document per
   station (document ID = your `stationId`, e.g. `station001`), containing
   the fields shown above.

4. Run locally:
   ```bash
   npm run dev
   ```
   Test with curl:
   ```bash
   curl -X POST http://localhost:3000/api/sms \
     -H "Content-Type: application/json" \
     -d '{"stationId":"bts001"}'
   ```

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import it into Vercel (vercel.com → New Project).
3. In Vercel → Project → Settings → Environment Variables, add the same
   variables from `.env.local` (do this for Production **and** Preview).
4. Deploy. Your endpoint will be live at:
   ```
   https://your-project.vercel.app/api/sms
   ```
5. Update `API_URL` in `esp32-example/esp32_intrusion_alert.ino` to match.

## Notes on speed

- Cold starts on Vercel's free tier typically add a few hundred ms to
  ~1.5s on the first request after idle. Once warm, responses are fast.
- SMSPoP's own delivery time to Econet/NetOne is the biggest variable
  (usually a few seconds). This is normal for an alert system — it does
  not need to be sub-second.
- If cold starts become a concern later, a simple keep-alive cron ping
  (e.g. via Vercel Cron or an external uptime pinger) can be added
  without changing the API logic.

## Extending

Because responsibilities are isolated into separate modules:

- To change SMS providers, only `lib/smspop.ts` needs to change.
- To add email/WhatsApp/Telegram alerts, add a new module under `lib/`
  and call it alongside `sendSms` in `app/api/sms/route.ts`.
- To support multiple recipients per station, change
  `emergencyPhoneNumber` to an array and pass a comma-separated list to
  `manual_contacts`.
