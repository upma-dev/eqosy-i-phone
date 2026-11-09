// `virtual:pwa-register` is imported by the app entry at startup, so we use it to boot the native bridge.
// (There is no service worker / PWA on iPhone.)
import './native-bridge.js';

export function registerSW() {
  return () => Promise.resolve();
}
