import fs from 'fs';

export const BASE = process.env.BROWSER_ADAPTOR_URL ?? 'http://127.0.0.1:8789';
const DEFAULT_TIMEOUT_MS = Number(process.env.BROWSER_ADAPTOR_TIMEOUT_MS ?? 30_000);
const DEFAULT_SCRIPT_TIMEOUT_MS = Number(process.env.BROWSER_ADAPTOR_SCRIPT_TIMEOUT_MS ?? 600_000);
const DEFAULT_CLIENT_TAB_ID = (process.env.BROWSER_ADAPTOR_CLIENT_TAB_ID ?? '').trim() || undefined;

export async function http(method, path, body, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
    }
    return res;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`${method} ${path} -> timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function cdpDefaultTimeout(method, params) {
  if (
    (method === 'Runtime.evaluate' || method === 'Runtime.callFunctionOn') &&
    params?.awaitPromise === true
  ) {
    return DEFAULT_SCRIPT_TIMEOUT_MS;
  }
  return DEFAULT_TIMEOUT_MS;
}

export async function cdp(method, params = {}, options = {}) {
  const timeoutMs = options.timeoutMs ?? cdpDefaultTimeout(method, params);
  const clientTabId = options.clientTabId ?? DEFAULT_CLIENT_TAB_ID;
  const body = { method, params, timeoutMs };
  if (clientTabId) body.clientTabId = clientTabId;
  const res = await http('POST', '/cdp', body, { timeoutMs });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'CDP call failed');
  return json.result;
}

export async function tabsList(options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const res = await http('GET', `/tabs?timeoutMs=${encodeURIComponent(timeoutMs)}`, undefined, { timeoutMs });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'tabs list failed');
  return json.tabs;
}

export async function tabsActive(options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const res = await http('GET', `/tabs/active?timeoutMs=${encodeURIComponent(timeoutMs)}`, undefined, { timeoutMs });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'tabs active failed');
  return json.tab;
}

export async function tabsActivate(tabId, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const res = await http('POST', '/tabs/activate', { tabId, timeoutMs }, { timeoutMs });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'tabs activate failed');
  return json.result;
}

export async function bookmarksTree(options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const res = await http('GET', `/bookmarks?timeoutMs=${encodeURIComponent(timeoutMs)}`, undefined, { timeoutMs });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'bookmarks tree failed');
  return json.bookmarks;
}

export function writeFileBase64(path, b64) {
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(path, buf);
}
