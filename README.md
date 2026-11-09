# Eqosy iPhone (3 apps)

Builds the original `../Eqosy/Frontend` code (same UI, same logic) into iPhone apps with Capacitor.
Nothing inside the `Eqosy` folder is modified.

| Command | App | Bundle ID | Opens at |
|---|---|---|---|
| `npm run user` | Eqosy (Food + Taxi user) | com.eqosy.user | `/` |
| `npm run driver` | Eqosy Driver | com.eqosy.driver | `/taxi/driver/login` |
| `npm run partner` | Eqosy Partner (restaurant) | com.eqosy.partner | `/food/restaurant` |
| `npm run all` | all three | | |

Change names / bundle IDs / start pages in `apps.json`.

## One-time setup
1. `copy .env.ios.example .env.ios` and set your LIVE https backend URL.
2. Backend CORS must allow origin `capacitor://localhost` (and Socket.IO CORS too).
3. Google Maps key: allow `capacitor://localhost` or remove the HTTP-referrer restriction.
4. Firebase console: add an iOS app for each bundle ID, download `GoogleService-Info.plist`,
   put it in `apps/<app>/ios/App/App/` and add it to the Xcode target.
5. Firebase console > Project settings > Cloud Messaging: upload your APNs Auth Key (.p8) from Apple Developer.

## Build (every time you change the website code)
```
npm run user        (or driver / partner)
```
This builds the web app, creates the iOS project the first time, adds permissions, and syncs.

## Open in Xcode (needs a Mac, or a cloud Mac such as Codemagic)
```
cd apps/user
npx cap sync ios
npx cap open ios
```
In Xcode, for each app: Signing & Capabilities > add **Push Notifications** and **Background Modes**
(Remote notifications, Audio). Driver: also Location updates. Then Run on iPhone or Product > Archive > upload to TestFlight.

## Ringtone / sound
- App open: the existing web code plays its own sounds as before.
- App in background: iOS plays the push's sound. The sound file must be inside the app and be .caf/.wav/.aiff (not mp3), max 30 s.
  On the Mac convert once: `afconvert ride-request-alert.mp3 ride-request-alert.caf -d ima4 -f caff`,
  drag the .caf into Xcode (target membership ON).
  Then in backend `pushNotificationService.js` change `sound: 'ride-request-alert.mp3'` to `'ride-request-alert.caf'`.

## Notes
- Driver ride-request ringing while the phone is locked is limited by iOS to the push sound (30 s). A continuous full-screen call-style ring needs CallKit (separate native work).
- Continuous background GPS for drivers needs the Location background mode plus Apple review justification.
- Apple may reject apps that look like a plain website (guideline 4.2); native push, location and the bundled build help.
