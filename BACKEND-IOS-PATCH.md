# Backend changes needed for iPhone sound (2 small edits)

I did not touch the `Eqosy` folder. Without these, iPhone gets banners but **no sound** for Food/Delivery/Restaurant pushes.

## 1. Food / Restaurant / Delivery pushes
File: `Eqosy/Backend/src/core/notifications/firebase.service.js`, function `buildMessagePayload`.
Add this right after the `message.webpush = { ... };` block (before `return message;`):

```js
    // iOS (APNs): without this block iOS plays no sound at all.
    message.apns = {
        headers: { 'apns-priority': '10' },
        payload: {
            aps: {
                ...(ring ? { sound: 'ride-request-alert.caf' } : (isChat ? { sound: 'default' } : {})),
                badge: 1,
            },
        },
    };
```
(Status updates stay silent, ring events use the ringtone, chat uses the default chime - same rules as Android/web.)

## 2. Taxi pushes
File: `Eqosy/Backend/src/modules/taxi/services/pushNotificationService.js` (around line 235).
Change:
```js
sound: isRing ? 'ride-request-alert.mp3' : 'default',
```
to:
```js
sound: isRing ? 'ride-request-alert.caf' : 'default',
```

## 3. The sound file
iPhone cannot play mp3 for notifications. Convert once (any Mac, or an online mp3 -> caf/wav converter), keep it under 30 seconds:
```
afconvert ride-request-alert.mp3 ride-request-alert.caf -d ima4 -f caff
```
Add `ride-request-alert.caf` to the Xcode project (drag into the App folder, tick the app target), for each of the 3 apps.
Source mp3: `Eqosy/Frontend/public/ride-request-alert.mp3`.

## 4. Other server settings
- CORS (HTTP + Socket.IO): allow origin `capacitor://localhost`.
- Google Maps key: allow `capacitor://localhost` (or remove the HTTP-referrer restriction).
