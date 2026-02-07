#!/usr/bin/env node
import { tabsList } from '../lib/bridge.js';

// Usage: tabs_list.js
// Uses chrome.tabs via the extension (non-CDP relay).

const tabs = await tabsList();
console.log(JSON.stringify({ tabs }, null, 2));
