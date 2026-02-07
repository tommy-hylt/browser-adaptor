# cli

CLI entrypoint and helper library.

## Design

- CLI scripts contain the functionality.
- Server/extension are kept as thin relays.

## Run

All scripts use `BROWSER_ADAPTOR_URL` (default `http://127.0.0.1:8789`).

Examples:

```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\cli"
node scripts\url.js
node scripts\navigate.js https://example.com
node scripts\click.js --selector "a"
node scripts\screenshot.js out.png
```
