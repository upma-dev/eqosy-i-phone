// Runs first (inline, before the app). The Eqosy web app already supports native wrappers through a
// `window.flutter_inappwebview.callHandler(...)` bridge (FCM token, ring sound, camera, keyboard).
// We provide that same bridge for iOS; the real implementation lives in shims/native-bridge.js and
// is attached as soon as it loads. Calls made before that simply wait.
(function () {
  var cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  var ready = new Promise(function (resolve) { window.__eqosyNativeResolve = resolve; });
  window.flutter_inappwebview = {
    callHandler: function (name, args) {
      return ready.then(function (handler) { return handler(name, args); });
    }
  };
})();
