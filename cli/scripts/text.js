#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: text.js [selector]
// Prints innerText of the selected element (defaults to document.body).
const selector = process.argv[2] ?? null;

const expr = selector
  ? `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return (el.innerText ?? '').toString();
    })()`
  : `(() => (document.body?.innerText ?? '').toString())()`;

const r = await cdp('Runtime.evaluate', {
  expression: expr,
  returnByValue: true,
  awaitPromise: false
});

const v = r?.result?.value;
if (v == null) {
  console.error(selector ? `Selector not found: ${selector}` : 'No text');
  process.exit(2);
}

process.stdout.write(String(v));
