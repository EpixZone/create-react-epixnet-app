# EpixNet React App

This project was created with [create-react-epixnet-app](https://github.com/EpixZone/create-react-epixnet-app).
It is a React app built with Vite into an EpixNet xite.

## Workflow

```bash
npm start        # development build, rebuilt and copied into the xite on every change
npm run build    # production build, copied into the xite
npm run sync     # copy the current dist/ into the xite again
```

Each build is copied into the xite folder named by `EPIX_XITE_DIR` in
`.env.local` (ignored by git). Open the xite in EpixNet to see it:

    http://127.0.0.1:42222/<xite address>/

The node uses port 42222 unless it was busy; the port it chose is in the
`ui_port` file of its data folder. Reload the page after a rebuild.

When it looks right, run `npm run build` (so you do not publish a development
build), open the sidebar on the xite and choose **Sign & Publish**.

### What the copy never touches

`scripts/sync-xite.sh` copies only the build. It never overwrites or deletes:

- `content.json`, at any depth (the signed manifest and its includes)
- `.sign-cache.json` (the signer's cache)
- `data/` (user content and anything else you keep there)

Every other file in the xite folder that is not part of the build is removed,
so use a xite that belongs to this project only. Files the xite needs that are
not built (for example `data/users/content.json` with the rules for user
content) belong directly in the xite folder. A `dbschema.json` can live in
`public/` and is copied like any other file.

## Writing a xite

The page runs inside the EpixNet wrapper's iframe, often in a sandbox with an
opaque origin, and many peers have no clearnet access. So:

- **Everything is local.** No CDN scripts, no Google Fonts, no remote images.
  Put files in `public/` or import them. Paths stay relative (`base: './'`).
- **Hash routes.** The wrapper serves one `index.html`; use `#/page` links.
  `useHashRoute()` in `src/epixnet/useEpixFrame.js` returns the current route
  and mirrors it into the wrapper's address bar so it can be bookmarked. With
  react-router, use `HashRouter`, never `BrowserRouter`.
- **No localStorage, cookies, IndexedDB or service worker.** They throw in the
  sandbox. Use `getStorage()` / `setStorage()`, which the wrapper keeps per
  xite and identity. Never touch `localStorage` at module top level, where an
  exception stops the whole app.
- **One script, one stylesheet.** `vite.config.js` builds a single classic
  script, because a module script or a lazily loaded chunk is a CORS request
  that the sandbox can refuse. Do not use `import()` for code splitting.
- **Your own files:** `fetch()` of the xite's own files needs the wrapper's
  ajax key in the sandbox. Read them with `getEpixFrame().cmd('fileGet', { inner_path: 'file.json' })`
  instead.

## Talking to EpixNet

`src/epixnet/epixframe.esm.js` is the EpixFrame library (the bridge to the
wrapper). `src/epixnet/useEpixFrame.js` wraps it for React:

```javascript
import { getEpixFrame, useEpixFrame, useSiteInfo, getStorage, setStorage } from './epixnet/useEpixFrame.js';

function Title() {
  const siteInfo = useSiteInfo();      // kept current by the wrapper (setSiteInfo)
  return <h1>{siteInfo?.content.title}</h1>;
}

function Status() {
  const { connected, serverInfo } = useEpixFrame();
  return <p>{connected ? `EpixNet ${serverInfo?.version}` : 'Connecting...'}</p>;
}

// Anywhere, also outside components:
const rows = await getEpixFrame().cmd('dbQuery', ['SELECT * FROM json LIMIT 5']);
await getEpixFrame().cmd('certXid');   // let the user choose an xID identity
const prefs = (await getStorage()) || {};
await setStorage({ ...prefs, theme: 'dark' });
```

The example components in `src/components/` show user status, xite
statistics and a few API calls.

## Sharing the source

```bash
git init
git add .
git commit -m "Initial commit"
```

`.env.local` (your local xite path) is ignored by git.
