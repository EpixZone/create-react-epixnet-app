import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import epixnetXite from './scripts/epixnet-vite-plugin.js';

// A xite is served from http://127.0.0.1:42222/<address>/ (or its own
// content host), inside the wrapper's iframe, often by peers without
// clearnet access. Keep every path relative and every asset local.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), epixnetXite()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The wrapper's sandboxed (opaque origin) frame can only load what it
    // requests without CORS: a classic <script> and a plain stylesheet link.
    // A module script or a lazily loaded chunk is a CORS request with
    // `Origin: null`, which the node refuses on a plain-HTTP LAN or gateway
    // address. So the app is built as one classic script and one stylesheet
    // (scripts/epixnet-vite-plugin.js turns the module tag into a classic one).
    // Do not use dynamic import() for code splitting.
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true },
    },
    sourcemap: false,
    minify: mode !== 'development',
  },
}));
