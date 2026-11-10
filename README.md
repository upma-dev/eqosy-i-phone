# Eqosy – React Native (Expo)

Native apps (iOS + Android) for Eqosy. Everything lives in this repo:

| Folder | What |
|---|---|
| `mobile/` | The React Native (Expo) app |
| `Eqosy/Frontend` | Original web UI. Reference only while screens are ported to React Native |
| `Eqosy/Backend` | Backend (Node/Express/Socket.IO) |

## Port status (web screen -> React Native)

| App | Status |
|---|---|
| Taxi User: login, OTP, signup, home, activity, wallet, profile | done (phase 1) |
| Taxi User: ride booking (location, vehicle, search, tracking, chat, complete) | done, bundles OK, not yet tested on a device |
| Taxi User: parcel, intercity, rental, bus, pooling, support | todo |
| Taxi Driver (~53 screens) | phase 1 done: login+OTP, home (online/offline, live location, ride request accept/decline), active trip (arrived, OTP start, complete), wallet (view), profile. Todo: registration, earnings, incentives, settings, QR payment, parcel proof, maps |
| Delivery (~56 screens) | phase 1 done: login+OTP, home (online/offline, live location, new order offer), active order (reached pickup, confirm order id, reached drop, drop OTP), pocket (view), profile. Todo: signup, history, performance, payout, support, bill photo, QR payment, maps |
| Food user | done: home, restaurant, cart, search, offers, wallet, favorites, dining, grocery |
| Restaurant partner | phase 1 done: login+OTP, orders (accept with prep time, reject with reason, mark ready, live via socket), accepting-orders toggle, profile+finance summary. Todo: onboarding, menu, timings, coupons, ratings, payouts, support |

## Run
```
cd mobile
npm install
npx expo start
```
Scan the QR with the Expo Go app (iPhone/Android). No Android SDK is needed for this.

## Build an APK in the cloud
GitHub -> Actions -> **Build native Android (React Native)** -> Run workflow.
Download the APK from the run's Artifacts.

Optional secrets: `API_ORIGIN` (default https://eqosy.com), `GOOGLE_MAPS_API_KEY`.
