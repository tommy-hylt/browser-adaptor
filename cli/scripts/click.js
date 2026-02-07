#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage:
//   click.js <x> <y>
//   click.js --selector "CSS"

function buttonToCdp(button) {
  if (button === 'middle') return 'middle';
  if (button === 'right') return 'right';
  return 'left';
}

const args = process.argv.slice(2);
let x, y;
let selector = null;

if (args[0] === '--selector') {
  selector = args[1];
  if (!selector) {
    console.error('Usage: click.js --selector "CSS"');
    process.exit(1);
  }

  const expr = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({block:'center', inline:'center'});
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  })()`;

  const r = await cdp('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: false
  });

  const pt = r?.result?.value;
  if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') {
    throw new Error(`Selector not found or not measurable: ${selector}`);
  }

  x = pt.x;
  y = pt.y;
} else {
  x = Number(args[0]);
  y = Number(args[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.error('Usage: click.js <x> <y>');
    process.exit(1);
  }
}

const button = buttonToCdp('left');
await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button, clickCount: 1 });
await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount: 1 });
await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount: 1 });

console.log(JSON.stringify({ ok: true, x, y }, null, 2));
