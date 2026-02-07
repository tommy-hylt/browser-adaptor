#!/usr/bin/env node
import { cdp, writeFileBase64 } from '../lib/bridge.js';

const outPath = process.argv[2] ?? 'screenshot.png';

const r = await cdp('Page.captureScreenshot', { format: 'png' });
if (!r?.data) throw new Error('No data returned');
writeFileBase64(outPath, r.data);
console.log(outPath);
