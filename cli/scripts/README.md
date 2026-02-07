# cli/scripts

Each capability is a small Node script.

## Current scripts

- `url.js` – print current `location.href`
- `navigate.js <url>` – `Page.navigate`
- `new_tab.js <url>` – `window.open(url, '_blank')`
- `click.js <x> <y>` / `click.js --selector "CSS"` – click by coordinate or selector→rect→coordinate
- `mouse_move.js <x> <y>`
- `mouse_down.js <x> <y> [button]`
- `mouse_up.js <x> <y> [button]`
- `key_down.js <key>`
- `key_up.js <key>`
- `key_press.js <key>`
- `text.js [selector]` – `innerText` of element/body
- `html.js [selector]` – `outerHTML` of element/document
- `eval.js "<js>"` / `eval.js --file path.js` – explicit `Runtime.evaluate`
- `tabs_list.js` – list tabs (via extension chrome.tabs)
- `bookmarks.js` – bookmarks tree (via extension chrome.bookmarks)
- `bookmarks_flat.js` – flattened bookmarks list
