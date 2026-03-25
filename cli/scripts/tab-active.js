#!/usr/bin/env node
import { tabsActive } from '../lib/bridge.js';

// Usage:
//   tab-active.js
//
// Prints the currently active http(s) tab with its clientTabId.

const tab = await tabsActive();
console.log(JSON.stringify(tab ?? null, null, 2));
