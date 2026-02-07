#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

const url = process.argv[2];
if (!url) {
  console.error('Usage: navigate.js <url>');
  process.exit(1);
}

const r = await cdp('Page.navigate', { url });
console.log(JSON.stringify(r, null, 2));
