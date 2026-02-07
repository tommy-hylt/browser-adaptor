#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: ax-tree.js
// Dumps the full accessibility tree.

try {
  await cdp('Accessibility.enable', {});
} catch {
  // ignore
}

const r = await cdp('Accessibility.getFullAXTree', {});
console.log(JSON.stringify(r, null, 2));
