#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: tab_activate.js <targetId>
const targetId = process.argv[2];
if (!targetId) {
  console.error('Usage: tab_activate.js <targetId>');
  process.exit(1);
}

const r = await cdp('Target.activateTarget', { targetId });
console.log(JSON.stringify(r, null, 2));
