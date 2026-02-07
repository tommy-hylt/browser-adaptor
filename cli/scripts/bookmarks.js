#!/usr/bin/env node
import { bookmarksTree } from '../lib/bridge.js';

// Usage: bookmarks.js
const tree = await bookmarksTree();
console.log(JSON.stringify({ bookmarks: tree }, null, 2));
