#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

// Usage: ax-tree.js
// Dumps the full accessibility tree.
const parsed = extractClientTabId(process.argv.slice(2));
const options = cdpTargetOptions(parsed.clientTabId);

try {
  await cdp('Accessibility.enable', {}, options);
} catch {
  // ignore
}

const r = await cdp('Accessibility.getFullAXTree', {}, options);
console.log(JSON.stringify(r, null, 2));
