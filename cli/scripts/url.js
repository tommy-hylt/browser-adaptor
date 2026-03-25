#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

const parsed = extractClientTabId(process.argv.slice(2));

const r = await cdp('Runtime.evaluate', {
  expression: 'location.href',
  returnByValue: true,
  awaitPromise: false
}, cdpTargetOptions(parsed.clientTabId));

console.log(r?.result?.value ?? '');
