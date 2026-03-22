# BrowserAdaptor — Failure Modes

Last updated: 2026-02-18

This document is meant to be “interview-grade”: what breaks first, how you detect it, and what you do.

## 1) Extension not connected to server
**Symptoms**
- health check fails
- server shows no WS client

**Detection**
- `node cli/scripts/health.js` reports disconnected
- server logs show WS disconnects

**Likely causes**
- server not running / port change
- extension unloaded / disabled
- Chrome closed

**Mitigation**
- restart server
- reopen Chrome
- reload extension
- re-run `prepare.js`

## 2) CDP attach fails
**Symptoms**
- errors when sending CDP commands

**Likely causes**
- tab URL is restricted (`chrome://*`, Web Store)
- another debugger attached (CDP is exclusive per tab in many cases)

**Mitigation**
- switch active tab to a normal HTTPS page
- close/detach other debugging sessions

## 3) Script flakiness due to dynamic pages
**Symptoms**
- click misses
- element not found intermittently

**Root causes**
- layout shifts, hydration timing
- reactive rerenders

**Mitigation**
- use deterministic waits (element exists + stable)
- prefer selectors over coordinates
- add retry with backoff only when safe

## 4) Server endpoint/API drift
**Symptoms**
- CLI script expects a response shape that changed

**Mitigation**
- version the server API (even a simple `apiVersion` field)
- add contract tests for critical endpoints

## 5) Port conflicts / local environment issues
**Symptoms**
- server won’t start

**Mitigation**
- detect port availability on boot
- allow configurable port via env var

## 6) “Works on my machine” profile coupling
**Symptoms**
- automation depends on a specific Chrome profile state

**Mitigation**
- document prerequisites explicitly
- add a `prepare` step that verifies assumptions (logged in? correct tab?)

## 7) Security / trust boundary violations
**Risk**
- exposing localhost endpoints too widely

**Mitigation**
- bind only to 127.0.0.1
- do not add remote access unless authenticated
- keep extension permissions minimal
