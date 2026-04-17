import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Make package.json version available to the app at build time, so the
// About section can show what's currently shipped without manual sync.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// IMPORTANT: change `base` to match your GitHub repo name.
// If your repo is "petal-and-stem", base should be "/petal-and-stem/"
// If you use a custom domain, set base to "/"
export default defineConfig({
  plugins: [react()],
  base: '/petal-and-stem/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist',
  },
});
