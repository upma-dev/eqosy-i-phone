// Usage: node scripts/ios.mjs <user|driver|partner>
// build web -> create iOS project (first time) -> patch Info.plist -> cap sync
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
const platform = process.argv[3] === 'android' ? 'android' : 'ios';
const apps = JSON.parse(fs.readFileSync(path.join(root, 'apps.json'), 'utf8'));
const app = apps[id];
if (!app) {
  console.error(`Use: ${Object.keys(apps).join(' | ')}`);
  process.exit(1);
}

const run = (cmd, args, cwd, env = {}) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) {
    console.error(`\nFAILED: ${cmd} ${args.join(' ')}`);
    process.exit(r.status || 1);
  }
};

// 1) env (live backend URL)
const envFile = path.join(root, '.env.ios');
if (!fs.existsSync(envFile)) {
  console.error('Create .env.ios first (copy .env.ios.example and set your live API URL).');
  process.exit(1);
}
const envVars = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

// 2) build the web app from ../Eqosy/Frontend (original code, untouched)
const frontend = path.resolve(root, '../Eqosy/Frontend');
run(
  'node',
  [`"${path.join(frontend, 'node_modules/vite/bin/vite.js')}"`, 'build', '--config', `"${path.join(root, 'vite.config.mjs')}"`],
  frontend,
  { ...envVars, IOS_APP: id },
);

// 3) capacitor project for this app
const dir = path.join(root, 'apps', id);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  path.join(dir, 'capacitor.config.json'),
  JSON.stringify(
    {
      appId: app.appId,
      appName: app.name,
      webDir: `../../www/${id}`,
      server: { iosScheme: 'capacitor' },
      ios: { contentInset: 'always', backgroundColor: '#18181B' },
      plugins: {
        // App open: the web app shows its own toast/ring. Background/killed: iOS shows the push + its sound.
        FirebaseMessaging: { presentationOptions: [] },
        SplashScreen: { launchAutoHide: true, backgroundColor: '#18181B' },
      },
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(dir, 'package.json'),
  JSON.stringify(
    {
      name: `eqosy-ios-${id}`,
      private: true,
      dependencies: {
        '@capacitor/core': '*',
        '@capacitor/ios': '*',
        '@capacitor/android': '*',
        '@capacitor-firebase/messaging': '*',
        '@capacitor/splash-screen': '*',
        '@capacitor/haptics': '*',
        '@capacitor/camera': '*',
        '@capacitor/keyboard': '*',
      },
    },
    null,
    2,
  ),
);

if (!fs.existsSync(path.join(dir, platform))) run('npx', ['cap', 'add', platform], dir);

// 4) Info.plist permissions + background modes
const plist = path.join(dir, 'ios/App/App/Info.plist');
if (platform === 'ios' && fs.existsSync(plist)) {
  let x = fs.readFileSync(plist, 'utf8');
  const s = (t) => `<string>${t}</string>`;
  const add = (key, xml) => {
    if (!x.includes(`<key>${key}</key>`)) {
      x = x.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${key}</key>\n\t${xml}\n</dict>\n</plist>\n`);
    }
  };
  add('NSLocationWhenInUseUsageDescription', s('Eqosy needs your location to show nearby services and track rides/orders.'));
  add('NSLocationAlwaysAndWhenInUseUsageDescription', s('Eqosy needs your location to track rides/orders.'));
  add('NSCameraUsageDescription', s('Eqosy needs the camera to upload photos and documents.'));
  add('NSPhotoLibraryUsageDescription', s('Eqosy needs photo access to upload images.'));
  add('NSMicrophoneUsageDescription', s('Eqosy needs the microphone for calls and voice features.'));
  add('UIBackgroundModes', `<array>${app.background.map((m) => s(m)).join('')}</array>`);
  fs.writeFileSync(plist, x);
}

// 5) sync web build + plugins into the iOS project
run('npx', ['cap', 'sync', platform], dir);
console.log(`\nDONE: ${app.name} -> apps/${id}/${platform}`);
