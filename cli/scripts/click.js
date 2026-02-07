#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage:
//   click.js <x> <y>
//   click.js --selector "CSS"
//   click.js --backendNodeId <id>

function buttonToCdp(button) {
  if (button === 'middle') return 'middle';
  if (button === 'right') return 'right';
  return 'left';
}

async function clickAt(x, y) {
  const button = buttonToCdp('left');
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button, clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount: 1 });
  console.log(JSON.stringify({ ok: true, x, y }, null, 2));
}

const args = process.argv.slice(2);

if (args[0] === '--selector') {
  const selector = args[1];
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

  await clickAt(pt.x, pt.y);
  process.exit(0);
}

if (args[0] === '--backendNodeId') {
  const backendNodeId = Number(args[1]);
  if (!Number.isFinite(backendNodeId)) {
    console.error('Usage: click.js --backendNodeId <id>');
    process.exit(1);
  }

  const pushed = await cdp('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds: [backendNodeId] });
  const nodeId = pushed?.nodeIds?.[0];
  if (!nodeId) throw new Error(`Failed to push backendNodeId=${backendNodeId} to frontend`);

  const box = await cdp('DOM.getBoxModel', { nodeId });
  const quad = box?.model?.content;
  if (!Array.isArray(quad) || quad.length < 8) throw new Error('No box model quad');

  // quad: [x1,y1,x2,y2,x3,y3,x4,y4]
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;

  await clickAt(x, y);
  process.exit(0);
}

// coordinate mode
const x = Number(args[0]);
const y = Number(args[1]);
if (!Number.isFinite(x) || !Number.isFinite(y)) {
  console.error('Usage: click.js <x> <y>');
  process.exit(1);
}

await clickAt(x, y);
