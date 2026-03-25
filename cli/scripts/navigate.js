#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

const parsed = extractClientTabId(process.argv.slice(2));
const url = parsed.args[0];
if (!url) {
  console.error('Usage: navigate.js <url>');
  process.exit(1);
}

const r = await cdp('Page.navigate', { url }, cdpTargetOptions(parsed.clientTabId));
console.log(JSON.stringify(r, null, 2));
