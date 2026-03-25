#!/usr/bin/env node
import { cdp, writeFileBase64 } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

const parsed = extractClientTabId(process.argv.slice(2));
const outPath = parsed.args[0] ?? 'screenshot.png';

const r = await cdp('Page.captureScreenshot', { format: 'png' }, cdpTargetOptions(parsed.clientTabId));
if (!r?.data) throw new Error('No data returned');
writeFileBase64(outPath, r.data);
console.log(outPath);
