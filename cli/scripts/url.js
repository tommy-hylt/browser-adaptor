#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

const r = await cdp('Runtime.evaluate', {
  expression: 'location.href',
  returnByValue: true,
  awaitPromise: false
});

console.log(r?.result?.value ?? '');
