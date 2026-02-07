#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: html.js [selector]
// Prints outerHTML of the selected element (defaults to document.documentElement).
const selector = process.argv[2] ?? null;

const expr = selector
  ? `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return el.outerHTML;
    })()`
  : `(() => document.documentElement?.outerHTML ?? '')()`;

const r = await cdp('Runtime.evaluate', {
  expression: expr,
  returnByValue: true,
  awaitPromise: false
});

const v = r?.result?.value;
if (v == null) {
  console.error(selector ? `Selector not found: ${selector}` : 'No html');
  process.exit(2);
}

process.stdout.write(String(v));
