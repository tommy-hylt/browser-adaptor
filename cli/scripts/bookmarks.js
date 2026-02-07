#!/usr/bin/env node
import { bookmarksTree } from '../lib/bridge.js';

// Usage:
//   bookmarks.js            # flat list (default)
//   bookmarks.js --all      # full tree

const all = process.argv.includes('--all');

function walk(node, path, out) {
  const title = (node.title ?? '').toString();
  const nextPath = title ? [...path, title] : path;

  if (node.url) {
    out.push({
      title,
      url: node.url,
      path: path.join(' / ')
    });
  }

  if (Array.isArray(node.children)) {
    for (const ch of node.children) walk(ch, nextPath, out);
  }
}

const tree = await bookmarksTree();

if (all) {
  console.log(JSON.stringify({ bookmarks: tree }, null, 2));
} else {
  const out = [];
  for (const root of tree ?? []) walk(root, [], out);
  out.sort((a, b) => (a.path + a.title).localeCompare(b.path + b.title));
  console.log(JSON.stringify({ items: out }, null, 2));
}
