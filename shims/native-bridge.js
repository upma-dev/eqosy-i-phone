// Native iPhone side of the bridge the Eqosy web app already speaks (see window.flutter_inappwebview usage).
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Keyboard } from '@capacitor/keyboard';

if (Capacitor.isNativePlatform()) init();

function init() {
  // ---------- FCM token (APNs -> FCM) ----------
  let fcmToken = '';
  let pending = null;
  const getFcmToken = () => {
    if (fcmToken) return Promise.resolve(fcmToken);
    if (!pending) {
      pending = (async () => {
        try {
          const perm = await FirebaseMessaging.requestPermissions();
          if (perm.receive !== 'granted') return '';
          const { token } = await FirebaseMessaging.getToken();
          fcmToken = token || '';
          return fcmToken;
        } catch (e) {
          console.warn('[ios-bridge] FCM token failed', e);
          return '';
        } finally {
          setTimeout(() => { pending = null; }, 0);
        }
      })();
    }
    return pending;
  };

  // ---------- Ring sound + vibration (app in foreground) ----------
  let ringAudio = null;
  const playRing = () => {
    try {
      if (!ringAudio) {
        ringAudio = new Audio('/ride-request-alert.mp3');
        ringAudio.volume = 1;
      }
      ringAudio.currentTime = 0;
      ringAudio.play().catch(() => {});
    } catch (e) { /* ignore */ }
  };
  const buzz = () => { Haptics.notification({ type: NotificationType.Warning }).catch(() => {}); };

  const feedback = async (payload) => {
    if (payload && payload.action === 'stop') return true;
    buzz();
    // Taxi driver screen plays its own looping ring; for every other app (restaurant/delivery) we ring here.
    if (!payload || payload.type !== 'driver_incoming_order_alert') playRing();
    return true;
  };

  // ---------- Handlers the web app calls ----------
  const tokenHandler = async () => getFcmToken();
  const handlers = {
    getFcmToken: tokenHandler,
    getFCMToken: tokenHandler,
    getPushToken: tokenHandler,
    getFirebaseToken: tokenHandler,
    playNotificationSound: feedback,
    triggerNotificationFeedback: feedback,
    onPushNotification: feedback,
    driverOrderAlert: feedback,
    hideKeyboard: async () => { await Keyboard.hide().catch(() => {}); return true; },
    openCamera: async (args) => {
      try {
        const q = args && args.quality ? Math.round(args.quality * 100) : 80;
        const photo = await Camera.getPhoto({
          quality: q, resultType: CameraResultType.Base64, source: CameraSource.Camera, correctOrientation: true,
        });
        const fmt = photo.format || 'jpeg';
        return { success: true, base64: photo.base64String, mimeType: `image/${fmt}`, fileName: `camera-photo.${fmt}` };
      } catch (e) {
        return { success: false, error: String((e && e.message) || e) };
      }
    },
  };

  window.__eqosyNativeResolve?.((name, args) => {
    const fn = handlers[name];
    return fn ? fn(args) : Promise.resolve(null);
  });

  // ---------- Push events -> web app ----------
  // App open: hand the push to the web app (it shows toast / plays its own ring, same as on Android wrapper).
  FirebaseMessaging.addListener('notificationReceived', (event) => {
    const n = (event && event.notification) || {};
    const payload = {
      notification: { title: n.title, body: n.body, image: n.image },
      data: n.data || {},
      messageId: n.id,
    };
    window.dispatchEvent(new CustomEvent('native-push-notification', { detail: payload }));
  }).catch(() => {});

  // Tap on a notification -> open the related page
  FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
    const data = (event && event.notification && event.notification.data) || {};
    let link = data.targetUrl || data.link || data.url || data.route;
    if (typeof link !== 'string' || !link.startsWith('/')) return;
    if (link.startsWith('/restaurant')) link = `/food${link}`;
    window.history.pushState({}, '', link);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }).catch(() => {});

  // ---------- Taxi: register this device as a 'mobile' token ----------
  // TaxiApp exposes window.__saveNativeFcmToken(token, role, platform) and handles login/pending retries itself.
  const synced = new WeakSet();
  FirebaseMessaging.addListener('tokenReceived', (e) => { if (e && e.token) fcmToken = e.token; }).catch(() => {});
  setInterval(() => {
    const save = window.__saveNativeFcmToken;
    if (typeof save === 'function' && fcmToken && !synced.has(save)) {
      synced.add(save);
      Promise.resolve(save(fcmToken, '', 'mobile')).catch(() => {});
    }
  }, 2000);

  // Ask for permission + get the token right away (needed by Taxi; Food/delivery ask again at login, instantly resolved).
  getFcmToken();

  // Clear the badge / old notifications when the app is opened
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') FirebaseMessaging.removeAllDeliveredNotifications().catch(() => {});
  });
}
