#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { cdp } from '../lib/bridge.js';

// Usage:
//   eval.js "<js expression>"
//   eval.js --file <path.js>
//
// Prints JSON of the Runtime.evaluate result.

const args = process.argv.slice(2);
let expression = null;

if (args[0] === '--file') {
  const p = args[1];
  if (!p) {
    console.error('Usage: eval.js --file <path.js>');
    process.exit(1);
  }
  expression = fs.readFileSync(path.resolve(p), 'utf8');
} else {
  expression = args[0];
}

if (!expression) {
  console.error('Usage: eval.js "<js expression>"');
  process.exit(1);
}

const r = await cdp('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: false
});

console.log(JSON.stringify(r, null, 2));
