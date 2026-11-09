// Builds the ORIGINAL Frontend source for iPhone without modifying it.
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(here, '../Eqosy/Frontend');
const appId = process.env.IOS_APP || 'user';
const apps = JSON.parse(fs.readFileSync(path.join(here, 'apps.json'), 'utf8'));
const app = apps[appId];
if (!app) throw new Error(`Unknown app "${appId}". Use: ${Object.keys(apps).join(', ')}`);

// non-literal import => loaded natively from Frontend (so its own node_modules resolve)
const frontendConfigUrl = pathToFileURL(path.join(FRONTEND, 'vite.config.js')).href;
const base = (await import(/* @vite-ignore */ frontendConfigUrl)).default;

const bootstrap = fs.readFileSync(path.join(here, 'shims/native-bootstrap.js'), 'utf8');
const iosHtml = {
  name: 'eqosy-ios-html',
  transformIndexHtml() {
    const start =
      `if(location.pathname==='/'&&${JSON.stringify(app.startPath)}!=='/'){history.replaceState(null,'',${JSON.stringify(app.startPath)});}`;
    return [{ tag: 'script', children: bootstrap + start, injectTo: 'head-prepend' }];
  },
};

const flat = (p) => (Array.isArray(p) ? p.flat(Infinity) : [p]);
const plugins = flat(base.plugins).filter((p) => p && !String(p.name || '').startsWith('vite-plugin-pwa'));

export default {
  ...base,
  root: FRONTEND,
  base: '/',
  plugins: [...plugins, iosHtml],
  resolve: {
    ...base.resolve,
    alias: {
      'virtual:pwa-register': path.join(here, 'shims/pwa-register.js'),
      'firebase/messaging': path.join(here, 'shims/firebase-messaging.js'),
      ...base.resolve.alias,
    },
  },
  build: { ...base.build, outDir: path.join(here, 'www', appId), emptyOutDir: true },
  server: undefined,
};
