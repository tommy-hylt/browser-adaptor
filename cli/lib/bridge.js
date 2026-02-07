import fs from 'fs';

export const BASE = process.env.BROWSER_ADAPTOR_URL ?? 'http://127.0.0.1:8789';

export async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return res;
}

export async function cdp(method, params = {}) {
  const res = await http('POST', '/cdp', { method, params });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'CDP call failed');
  return json.result;
}

export async function tabsList() {
  const res = await http('GET', '/tabs');
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'tabs list failed');
  return json.tabs;
}

export async function tabsActivate(tabId) {
  const res = await http('POST', '/tabs/activate', { tabId });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'tabs activate failed');
  return json.result;
}

export async function bookmarksTree() {
  const res = await http('GET', '/bookmarks');
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? 'bookmarks tree failed');
  return json.bookmarks;
}

export function writeFileBase64(path, b64) {
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(path, buf);
}
