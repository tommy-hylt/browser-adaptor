#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

// Usage: mouse_move.js <x> <y>
const parsed = extractClientTabId(process.argv.slice(2));
const x = Number(parsed.args[0]);
const y = Number(parsed.args[1]);
if (!Number.isFinite(x) || !Number.isFinite(y)) {
  console.error('Usage: mouse_move.js <x> <y>');
  process.exit(1);
}

await cdp('Input.dispatchMouseEvent', {
  type: 'mouseMoved',
  x,
  y,
  button: 'none',
  buttons: 0,
  clickCount: 0
}, cdpTargetOptions(parsed.clientTabId));

console.log('OK');
