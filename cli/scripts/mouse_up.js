#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: mouse_up.js <x> <y> [left|middle|right]
const x = Number(process.argv[2]);
const y = Number(process.argv[3]);
const button = process.argv[4] ?? 'left';
if (!Number.isFinite(x) || !Number.isFinite(y)) {
  console.error('Usage: mouse_up.js <x> <y> [left|middle|right]');
  process.exit(1);
}

await cdp('Input.dispatchMouseEvent', {
  type: 'mouseReleased',
  x,
  y,
  button,
  clickCount: 1
});

console.log('OK');
