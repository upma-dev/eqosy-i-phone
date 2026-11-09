// Web FCM is NOT used on iPhone. Push goes through the native bridge (shims/native-bridge.js),
// which the app already supports. Reporting "unsupported" makes every web-push code path skip itself
// so tokens are never registered twice (once as 'web', once as 'mobile').
export const isSupported = async () => false;
export const getMessaging = () => ({});
export const getToken = async () => {
  throw new Error('Web push is not available in the iPhone app');
};
export const deleteToken = async () => true;
export const onMessage = () => () => {};
