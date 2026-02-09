#!/usr/bin/env node

import fs from 'fs';

const BASE = process.env.BROWSER_ADAPTOR_URL ?? 'http://127.0.0.1:8789';

async function j(method, path, body) {
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

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case 'prepare': {
      await import('./prepare.js');
      return;
    }
    case 'health': {
      const res = await j('GET', '/health');
      console.log(await res.text());
      return;
    }
    case 'url': {
      const { default: run } = await import('./scripts/url.js');
      return;
    }
    case 'navigate': {
      // delegate to scripts/navigate.js
      const url = args[0];
      if (!url) throw new Error('Usage: navigate <url>');
      const { default: run } = await import('./scripts/navigate.js');
      return;
    }
    case 'click': {
      const { default: run } = await import('./scripts/click.js');
      return;
    }
    case 'screenshot': {
      const { default: run } = await import('./scripts/screenshot.js');
      return;
    }
    case 'cdp': {
      const method = args[0];
      const paramsJson = args[1] ?? '{}';
      if (!method) throw new Error('Usage: cdp <Method.Name> [paramsJson]');
      const params = JSON.parse(paramsJson);
      const res = await j('POST', '/cdp', { method, params });
      console.log(JSON.stringify(await res.json(), null, 2));
      return;
    }
    default: {
      console.error('Commands:');
      console.error('  prepare');
      console.error('  health');
      console.error('  url');
      console.error('  navigate <url>');
      console.error('  click <x> <y> | click --selector "CSS"');
      console.error('  screenshot [out.png]');
      console.error('  cdp <Method.Name> [paramsJson]');
      console.error('');
      console.error('Relay mode note: server+extension only forward CDP; functionality lives in cli/scripts/*.js');
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
  process.exit(1);
});
