#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: mouse_move.js <x> <y>
const x = Number(process.argv[2]);
const y = Number(process.argv[3]);
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
});

console.log('OK');
