#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage:
//   text.js
//   text.js <selector>
//   text.js --backendNodeId <id>

const args = process.argv.slice(2);

if (args[0] === '--backendNodeId') {
  const backendNodeId = Number(args[1]);
  if (!Number.isFinite(backendNodeId)) {
    console.error('Usage: text.js --backendNodeId <id>');
    process.exit(1);
  }

  const pushed = await cdp('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds: [backendNodeId] });
  const nodeId = pushed?.nodeIds?.[0];
  if (!nodeId) throw new Error(`Failed to push backendNodeId=${backendNodeId} to frontend`);

  const resolved = await cdp('DOM.resolveNode', { nodeId });
  const objectId = resolved?.object?.objectId;
  if (!objectId) throw new Error('Failed to resolve node to objectId');

  const r = await cdp('Runtime.callFunctionOn', {
    objectId,
    functionDeclaration: 'function() { return (this.innerText ?? "").toString(); }',
    returnByValue: true
  });

  process.stdout.write(String(r?.result?.value ?? ''));
  process.exit(0);
}

const selector = args[0] ?? null;

const expr = selector
  ? `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return (el.innerText ?? '').toString();
    })()`
  : `(() => (document.body?.innerText ?? '').toString())()`;

const r = await cdp('Runtime.evaluate', {
  expression: expr,
  returnByValue: true,
  awaitPromise: false
});

const v = r?.result?.value;
if (v == null) {
  console.error(selector ? `Selector not found: ${selector}` : 'No text');
  process.exit(2);
}

process.stdout.write(String(v));
