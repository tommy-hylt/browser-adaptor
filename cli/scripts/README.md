# cli/scripts

Each capability is a small Node script.

## Current scripts

### Navigation / tabs

- `url.js`
  - prints current `location.href`

- `navigate.js <url>`
  - `Page.navigate`

- `new-tab.js <url>`
  - opens a new tab via `window.open(url, '_blank')`

- `tabs-list.js`
  - list tabs (via extension `chrome.tabs.query`)

- `tab-switch.js <tabId>`
  - switch active tab by id (via extension `chrome.tabs.update`)

- `tab-switch.js --url <substring>`
  - switch active tab by finding a tab whose URL contains the substring

### Mouse

- `click.js <x> <y>`
  - click by coordinates (viewport CSS pixels)

- `click.js --selector "CSS"`
  - compute element center by selector → click

- `click.js --backendNodeId <id>`
  - compute element center from AXTree/DOM backend node id → click

- `mouse-move.js <x> <y>`
- `mouse-down.js <x> <y> [left|middle|right]`
- `mouse-up.js <x> <y> [left|middle|right]`

### Keyboard

- `type.js "text"`
  - insert text via CDP `Input.insertText` (preferred over DOM value assignment)

- `key-down.js <key>`
- `key-up.js <key>`
- `key-press.js <key>`

### Content

- `text.js`
  - body innerText

- `text.js <selector>`
  - innerText for selector

- `text.js --backendNodeId <id>`
  - innerText for AXTree/DOM backend node id

- `html.js`
  - document outerHTML

- `html.js <selector>`
  - outerHTML for selector

- `html.js --backendNodeId <id>`
  - outerHTML for AXTree/DOM backend node id

- `ax-tree.js`
  - dump full accessibility tree (`Accessibility.getFullAXTree`)

### Utilities

- `eval.js` (REMOVED)
  - intentionally not shipped to discourage DOM-eval fallbacks
  - use `click.js`, `type.js`, `key-press.js`, etc. instead

### Bookmarks

- `bookmarks.js`
  - default: flat list `[{title,url,path}]`

- `bookmarks.js --all`
  - full bookmarks tree
