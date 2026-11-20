/**
 * React bindings for EpixFrame, the page side of the EpixNet wrapper bridge.
 * This file originates from `create-react-epixnet-app`.
 *
 *   const { connected, siteInfo, serverInfo } = useEpixFrame();
 *   const frame = getEpixFrame();          // frame.cmd('dbQuery', [...]) etc.
 *   const route = useHashRoute();          // '/' for #/, '/about' for #/about
 *
 * A xite runs inside the wrapper's iframe, often in an opaque (sandboxed)
 * origin. Nothing here touches localStorage, cookies or the network: use
 * getStorage()/setStorage() for data that should survive a reload.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { EpixFrame } from './epixframe.esm.js';

let frame = null;
let state = {
  embedded: typeof window !== 'undefined' && window.parent !== window,
  connected: false,
  siteInfo: null,
  serverInfo: null,
  error: null,
};
const subscribers = new Set();

function update(patch) {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn());
}

class ReactEpixFrame extends EpixFrame {
  onOpenWebsocket() {
    super.onOpenWebsocket();
    Promise.all([this.cmd('siteInfo'), this.cmd('serverInfo')])
      .then(([siteInfo, serverInfo]) => update({ connected: true, siteInfo, serverInfo, error: null }))
      .catch((err) => update({ error: (err && err.error) || String(err) }));
    forwardDeepLink(this);
  }

  onCloseWebsocket() {
    super.onCloseWebsocket();
    update({ connected: false });
  }

  onRequest(cmd, message) {
    if (cmd === 'setSiteInfo') {
      // Pushed on every change to this xite (new peers, files, a signed
      // update). Events of merged xites carry a different address.
      const info = message.params;
      if (!state.siteInfo || info.address === state.siteInfo.address) {
        update({ siteInfo: info });
      }
    } else if (cmd === 'setServerInfo') {
      update({ serverInfo: message.params });
    } else if (cmd === 'wrapperPopState') {
      // The wrapper's back/forward buttons: nothing to do for hash routes,
      // the browser already moved the frame's own history.
    } else {
      super.onRequest(cmd, message);
    }
  }
}

/** The single EpixFrame instance of this page, created on first use. */
export function getEpixFrame() {
  if (!frame) {
    frame = new ReactEpixFrame();
    if (!state.embedded) {
      update({ error: 'This page is not running inside the EpixNet wrapper.' });
    }
  }
  return frame;
}

function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function snapshot() {
  return state;
}

/** Connection state, siteInfo and serverInfo, kept current by the wrapper. */
export function useEpixFrame() {
  getEpixFrame();
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Shorthand for useEpixFrame().siteInfo. */
export function useSiteInfo() {
  return useEpixFrame().siteInfo;
}

/**
 * Per-xite storage kept by the wrapper (the replacement for localStorage,
 * which throws in the sandboxed frame). Resolves to null when nothing is
 * stored yet.
 */
export function getStorage() {
  return getEpixFrame().cmd('wrapperGetLocalStorage');
}

/** Replace the stored value (any JSON value) for this xite and identity. */
export function setStorage(value) {
  return getEpixFrame().cmd('wrapperSetLocalStorage', value);
}

// ---------------------------------------------------------------------------
// Hash routing
// ---------------------------------------------------------------------------

// The wrapper owns the address bar. It only hands its #fragment to the frame
// when the page reports wrapperInnerLoaded, so a link such as
// http://127.0.0.1:42222/<address>/#/about opens the right route. A frame
// that already has a fragment was navigated there, so it is not asked again.
let deepLinkForwarded = false;
function forwardDeepLink(epixFrame) {
  if (deepLinkForwarded) return;
  deepLinkForwarded = true;
  const hash = window.location.hash;
  if (!hash || hash === '#') {
    epixFrame.innerLoaded();
  }
}

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '/' + hash;
}

function subscribeHash(fn) {
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
}

/**
 * The current hash route ('/' for no fragment). Links are plain anchors:
 * <a href="#/about">. The route is mirrored into the wrapper's address bar
 * so it can be bookmarked and shared.
 */
export function useHashRoute() {
  const route = useSyncExternalStore(subscribeHash, currentRoute, () => '/');
  useEffect(() => {
    if (state.embedded && window.location.hash) {
      getEpixFrame().cmd('wrapperReplaceState', [null, null, window.location.hash]);
    }
  }, [route]);
  return route;
}
