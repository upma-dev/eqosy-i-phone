import { io } from 'socket.io-client';
import { SOCKET_ORIGIN } from '../config';
import { useAuth } from '../store/auth';

let socket = null;
let currentToken = null;

// One shared connection for the signed-in user.
export const getSocket = () => {
  const token = useAuth.getState().token;
  if (!token) return null;

  if (socket && currentToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  if (socket) socket.disconnect();
  currentToken = token;
  socket = io(SOCKET_ORIGIN, {
    auth: { token },
    transports: ['polling', 'websocket'],
    upgrade: true,
    reconnection: true,
    reconnectionDelay: 750,
    reconnectionDelayMax: 2500,
    timeout: 10000,
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
  currentToken = null;
};

// Subscribe to many events at once; returns an unsubscribe function.
export const subscribe = (handlers) => {
  const s = getSocket();
  if (!s) return () => {};
  Object.entries(handlers).forEach(([event, fn]) => s.on(event, fn));
  return () => Object.entries(handlers).forEach(([event, fn]) => s.off(event, fn));
};

export const emit = (event, payload) => getSocket()?.emit(event, payload);
