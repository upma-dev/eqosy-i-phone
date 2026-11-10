import { BACKEND_ORIGIN } from '../config';

// Mobile version of web normalizeImageUrl: fixes slashes and points localhost URLs at the real backend.
export const normalizeImageUrl = (value) => {
  if (typeof value !== 'string') return '';
  let url = value.trim();
  if (!url || /^data:/i.test(url)) return url;
  url = url
    .replace(/\\/g, '/')
    .replace(/^(https?):\/(?!\/)/i, '$1://')
    .replace(/^(https?:\/\/)(https?:\/\/)/i, '$1');
  if (/^\/\//.test(url)) url = `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, BACKEND_ORIGIN);
  return `${BACKEND_ORIGIN}/${url.replace(/^\/+/, '')}`;
};
