// Vite plugin for EpixNet xites. This file originates from
// `create-react-epixnet-app`.
//
// - Turns the built index.html's <script type="module"> into a classic
//   deferred <script> and drops `crossorigin`. In the wrapper's opaque
//   (sandboxed) frame every CORS-mode request carries `Origin: null`, which
//   the node can refuse; a classic script and a plain stylesheet link load
//   without CORS. vite.config.js builds the app as one IIFE for this.
// - After every build (each rebuild under `npm start`), copies dist/ into the
//   xite folder with scripts/sync-xite.sh, unless EPIX_NO_SYNC=1 or no
//   EPIX_XITE_DIR is configured.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const syncScript = fileURLToPath(new URL('./sync-xite.sh', import.meta.url));

export default function epixnetXite() {
  let env = {};
  let failed = false;
  return {
    name: 'epixnet-xite',
    apply: 'build',
    configResolved(config) {
      env = loadEnv(config.mode, config.envDir || config.root, 'EPIX_');
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html
          .replace(/\s+crossorigin(=("[^"]*"|'[^']*'|[^\s>]+))?(?=[\s>])/g, '')
          .replace(/<script type="module"(?=[^>]*\ssrc=)/g, '<script defer');
      },
    },
    buildStart() {
      failed = false;
    },
    buildEnd(error) {
      if (error) failed = true;
    },
    closeBundle() {
      if (failed) return;
      if (process.env.EPIX_NO_SYNC === '1') return;
      if (!env.EPIX_XITE_DIR) {
        this.warn('EPIX_XITE_DIR is not set (see .env.local), so the build stays in dist/');
        return;
      }
      const result = spawnSync('bash', [syncScript, env.EPIX_XITE_DIR], { stdio: 'inherit' });
      if (result.status !== 0) {
        this.error('copying the build into the xite folder failed');
      }
    },
  };
}
