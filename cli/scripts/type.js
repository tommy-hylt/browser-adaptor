#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage:
//   type.js "text to insert"
//
// Inserts text using CDP Input.insertText.
// Note: this does NOT focus an element; pair with click.js --selector "..." first.

const text = process.argv.slice(2).join(' ');
if (!text) {
  console.error('Usage: type.js "text to insert"');
  process.exit(1);
}

await cdp('Input.insertText', { text });
console.log(JSON.stringify({ ok: true, textLength: text.length }, null, 2));
