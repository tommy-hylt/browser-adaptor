let WS_URL = 'ws://127.0.0.1:8789/ws';

let ws = null;
let attachedTabId = null;
const TAB_MAP_KEY = 'tabIdToClientTabIdV1';
const tabIdToClientTabId = new Map();
const clientTabIdToTabId = new Map();
let tabMapReadyPromise = null;

function log(...args) {
  console.log('[browser-adaptor]', ...args);
}

function uuidV7() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let ts = Date.now();
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts & 0xff;
    ts = Math.floor(ts / 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function getStorageArea() {
  return chrome.storage?.session ?? chrome.storage?.local ?? null;
}

async function persistTabMap() {
  const area = getStorageArea();
  if (!area) return;
  const obj = {};
  for (const [tabId, clientTabId] of tabIdToClientTabId.entries()) {
    obj[String(tabId)] = clientTabId;
  }
  await area.set({ [TAB_MAP_KEY]: obj });
}

function removeMappingByTabId(tabId) {
  const clientTabId = tabIdToClientTabId.get(tabId);
  if (!clientTabId) return false;
  tabIdToClientTabId.delete(tabId);
  clientTabIdToTabId.delete(clientTabId);
  return true;
}

function setMapping(tabId, clientTabId) {
  const prevTabId = clientTabIdToTabId.get(clientTabId);
  if (prevTabId != null && prevTabId !== tabId) {
    tabIdToClientTabId.delete(prevTabId);
  }
  const prevClientTabId = tabIdToClientTabId.get(tabId);
  if (prevClientTabId && prevClientTabId !== clientTabId) {
    clientTabIdToTabId.delete(prevClientTabId);
  }
  tabIdToClientTabId.set(tabId, clientTabId);
  clientTabIdToTabId.set(clientTabId, tabId);
}

function ensureMappingForTabIdSync(tabId) {
  const existing = tabIdToClientTabId.get(tabId);
  if (existing) return existing;
  let clientTabId;
  do {
    clientTabId = uuidV7();
  } while (clientTabIdToTabId.has(clientTabId));
  setMapping(tabId, clientTabId);
  return clientTabId;
}

async function ensureTabMapReady() {
  if (!tabMapReadyPromise) {
    tabMapReadyPromise = (async () => {
      const area = getStorageArea();
      const loaded = area ? await area.get(TAB_MAP_KEY) : {};
      const raw = loaded?.[TAB_MAP_KEY] ?? {};
      const tabs = await chrome.tabs.query({});
      const liveTabIds = new Set(tabs.map((t) => t.id).filter((id) => typeof id === 'number'));

      for (const [tabIdRaw, clientTabId] of Object.entries(raw)) {
        const tabId = Number(tabIdRaw);
        if (!Number.isFinite(tabId)) continue;
        if (!liveTabIds.has(tabId)) continue;
        if (typeof clientTabId !== 'string' || !clientTabId) continue;
        setMapping(tabId, clientTabId);
      }

      let changed = false;
      for (const tabId of liveTabIds) {
        if (!tabIdToClientTabId.has(tabId)) {
          ensureMappingForTabIdSync(tabId);
          changed = true;
        }
      }
      if (changed || Object.keys(raw).length !== tabIdToClientTabId.size) {
        await persistTabMap();
      }
    })().catch((e) => {
      log('failed to hydrate tab map', String(e?.message ?? e));
      tabMapReadyPromise = null;
    });
  }
  await tabMapReadyPromise;
}

async function ensureMappingForTabId(tabId) {
  await ensureTabMapReady();
  const clientTabId = ensureMappingForTabIdSync(tabId);
  await persistTabMap();
  return clientTabId;
}

async function resolveTabIdFromClientTabId(clientTabId) {
  await ensureTabMapReady();
  const tabId = clientTabIdToTabId.get(clientTabId);
  if (tabId == null) return null;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.id) return null;
    return tab.id;
  } catch {
    removeMappingByTabId(tabId);
    await persistTabMap();
    return null;
  }
}

async function getBestTabId() {
  await ensureTabMapReady();
  const tabs = await chrome.tabs.query({ lastFocusedWindow: true });
  if (!tabs || tabs.length === 0) throw new Error('No tabs');

  const active = tabs.find((t) => t.active);
  const activeUrl = (active?.url ?? '').toString();
  if (active?.id && /^https?:/i.test(activeUrl)) return active.id;

  // If the active tab is chrome:// (extensions/settings/etc), fall back to the first http(s) tab.
  const httpTab = tabs.find((t) => t.id && /^https?:/i.test((t.url ?? '').toString()));
  if (httpTab?.id) return httpTab.id;

  if (active?.id) throw new Error(`Active tab is not http(s): ${activeUrl}`);
  throw new Error('No suitable http(s) tab found');
}

async function ensureAttached(target) {
  let tabId;
  if (target?.clientTabId) {
    tabId = await resolveTabIdFromClientTabId(target.clientTabId);
    if (tabId == null) throw new Error(`Unknown clientTabId: ${target.clientTabId}`);
  } else {
    tabId = await getBestTabId();
  }

  if (attachedTabId === tabId) return;

  // Detach previous if any
  if (attachedTabId != null) {
    try { await chrome.debugger.detach({ tabId: attachedTabId }); } catch {}
    attachedTabId = null;
  }

  await chrome.debugger.attach({ tabId }, '1.3');
  attachedTabId = tabId;

  // Runtime is useful for url() and console events.
  try { await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable', {}); } catch {}
}

async function cdp(method, params = {}, target) {
  await ensureAttached(target);
  return chrome.debugger.sendCommand({ tabId: attachedTabId }, method, params);
}

async function doUrl() {
  // Avoid tabs.get(url) because chrome:// / restricted pages; CDP evaluate matches page context.
  const r = await cdp('Runtime.evaluate', {
    expression: 'location.href',
    returnByValue: true,
    awaitPromise: false
  });
  return { url: r?.result?.value ?? null };
}

async function doNavigate(url) {
  return cdp('Page.navigate', { url });
}

function buttonToCdp(button) {
  if (button === 'middle') return 'middle';
  if (button === 'right') return 'right';
  return 'left';
}

async function doClick({ x, y, selector, ref, button = 'left' }) {
  const cdpButton = buttonToCdp(button);

  let cx = x;
  let cy = y;

  const chosenSelector = ref ?? selector;

  if ((typeof cx !== 'number' || typeof cy !== 'number') && chosenSelector) {
    // Compute a viewport point for the element.
    // Using Runtime.evaluate is the simplest minimal bridge (no DOM domain plumbing).
    const expr = `(() => {
      const el = document.querySelector(${JSON.stringify(chosenSelector)});
      if (!el) return null;
      el.scrollIntoView({block:'center', inline:'center'});
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    })()`;

    const r = await cdp('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: false
    });

    const pt = r?.result?.value;
    if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') {
      throw new Error(`Selector not found or not measurable: ${chosenSelector}`);
    }

    cx = pt.x;
    cy = pt.y;
  }

  if (typeof cx !== 'number' || typeof cy !== 'number') {
    throw new Error('doClick requires either x/y or selector');
  }

  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy, button: cdpButton, clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: cdpButton, clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: cdpButton, clickCount: 1 });
  return { ok: true, x: cx, y: cy };
}

async function doScreenshot() {
  const r = await cdp('Page.captureScreenshot', { format: 'png' });
  return { data: r?.data };
}

async function doSnapshot() {
  // Minimal “ref” layer: produce a list of clickable-ish elements with a ref=selector.
  // This is *not* a full AX tree like BrowserMCP, but it enables click({ref}).
  const expr = `(() => {
    const MAX = 60;

    function cssEscapeIdent(s){
      // basic escape for ids/classes
      return s.replace(/[^a-zA-Z0-9_-]/g, (c)=>'\\'+c);
    }

    function selectorFor(el) {
      if (!el || el.nodeType !== 1) return null;
      if (el.id) return '#' + cssEscapeIdent(el.id);

      const parts = [];
      let cur = el;
      for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
        let part = cur.tagName.toLowerCase();
        const cls = (cur.className && typeof cur.className === 'string')
          ? cur.className.split(/\s+/).filter(Boolean).slice(0,2)
          : [];
        if (cls.length) part += '.' + cls.map(cssEscapeIdent).join('.');

        // nth-of-type
        const parent = cur.parentElement;
        if (parent) {
          const same = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
          if (same.length > 1) {
            const idx = same.indexOf(cur) + 1;
            part += ':nth-of-type(' + idx + ')';
          }
        }

        parts.unshift(part);
        if (parent && parent.id) {
          parts.unshift('#' + cssEscapeIdent(parent.id));
          break;
        }
        cur = parent;
      }
      return parts.join(' > ');
    }

    function isVisible(el){
      const r = el.getClientRects();
      if (!r || r.length === 0) return false;
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    }

    function label(el){
      const a = el.getAttribute('aria-label');
      if (a) return a;
      const t = (el.innerText || el.textContent || '').trim();
      if (t) return t.slice(0, 120);
      const v = (el.value || '').toString().trim();
      if (v) return v.slice(0, 120);
      return '';
    }

    const candidates = Array.from(document.querySelectorAll('a,button,input,select,textarea,[role="button"],[role="link"]'))
      .filter(isVisible)
      .slice(0, MAX);

    const items = candidates.map((el) => {
      const sel = selectorFor(el);
      const r = el.getBoundingClientRect();
      return {
        ref: sel,
        selector: sel,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || null,
        name: label(el),
        rect: { x: r.x, y: r.y, width: r.width, height: r.height }
      };
    });

    return { url: location.href, items };
  })()`;

  const r = await cdp('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: false
  });

  return r?.result?.value ?? null;
}

async function handleRequest(msg) {
  const { id, type } = msg;
  try {
    let result;
    if (type === 'cdp') {
      result = await cdp(msg.method, msg.params ?? {}, { clientTabId: msg.clientTabId ?? null });
    } else if (type === 'tabs_list') {
      await ensureTabMapReady();
      const tabs = await chrome.tabs.query({});
      result = tabs.map((t) => ({
        id: t.id,
        clientTabId: typeof t.id === 'number' ? ensureMappingForTabIdSync(t.id) : null,
        windowId: t.windowId,
        active: t.active,
        title: t.title,
        url: t.url
      }));
      await persistTabMap();
    } else if (type === 'tabs_active') {
      await ensureTabMapReady();
      const tabId = await getBestTabId();
      const tab = await chrome.tabs.get(tabId);
      result = {
        id: tab.id,
        clientTabId: await ensureMappingForTabId(tabId),
        windowId: tab.windowId,
        active: tab.active,
        title: tab.title,
        url: tab.url
      };
    } else if (type === 'tabs_activate') {
      const tabId = msg.tabId;
      if (typeof tabId !== 'number') throw new Error('tabs_activate requires tabId (number)');
      const tab = await chrome.tabs.get(tabId);
      if (tab?.windowId != null) {
        try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
      }
      const updated = await chrome.tabs.update(tabId, { active: true });
      result = {
        id: updated.id,
        clientTabId: typeof updated.id === 'number' ? await ensureMappingForTabId(updated.id) : null,
        windowId: updated.windowId,
        active: updated.active,
        title: updated.title,
        url: updated.url
      };
    } else if (type === 'bookmarks_tree') {
      result = await chrome.bookmarks.getTree();
    } else {
      throw new Error(`Unknown request type: ${type}`);
    }

    ws?.send(JSON.stringify({ type: 'response', id, result }));
  } catch (e) {
    ws?.send(JSON.stringify({ type: 'response', id, error: String(e?.message ?? e) }));
  }
}

function connect() {
  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    log('ws ctor failed', e);
    ws = null;
    return;
  }

  ws.addEventListener('open', () => log('ws open', WS_URL));
  ws.addEventListener('close', () => {
    log('ws close');
    ws = null;
  });
  ws.addEventListener('error', (e) => log('ws error', e));
  ws.addEventListener('message', (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (!msg?.id) return;
    handleRequest(msg);
  });
}

function ensureConnected() {
  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    connect();
  }
}

function init() {
  ensureTabMapReady().catch((e) => log('tab map init failed', String(e?.message ?? e)));

  // Attempt immediately when the worker runs.
  ensureConnected();

  // MV3 workers can be suspended; use alarms to periodically wake and reconnect.
  try {
    chrome.alarms.create('keepalive', { periodInMinutes: 1 });
  } catch {}
}

chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm?.name === 'keepalive') ensureConnected();
});

// Event triggers that will wake the MV3 service worker.
chrome.runtime.onStartup.addListener(() => init());
chrome.runtime.onInstalled.addListener(() => init());
chrome.action?.onClicked?.addListener(() => init());

// These fire frequently in normal browsing, so they reliably wake the worker.
chrome.tabs.onActivated.addListener(() => ensureConnected());
chrome.tabs.onUpdated.addListener(() => ensureConnected());
chrome.windows.onFocusChanged.addListener(() => ensureConnected());

chrome.tabs.onCreated.addListener((tab) => {
  const tabId = tab?.id;
  if (typeof tabId !== 'number') return;
  ensureMappingForTabId(tabId).catch((e) => log('onCreated mapping failed', String(e?.message ?? e)));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (typeof tabId !== 'number') return;
  if (removeMappingByTabId(tabId)) {
    persistTabMap().catch((e) => log('onRemoved persist failed', String(e?.message ?? e)));
  }
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  ensureTabMapReady().then(async () => {
    const existing = tabIdToClientTabId.get(removedTabId);
    if (existing) {
      removeMappingByTabId(removedTabId);
      setMapping(addedTabId, existing);
      await persistTabMap();
      return;
    }
    await ensureMappingForTabId(addedTabId);
  }).catch((e) => log('onReplaced mapping failed', String(e?.message ?? e)));
});

// Also run when loaded by any event.
init();
