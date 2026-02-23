---
name: chrome-trace-listener
description: Attach read-only Chrome DevTools trace listeners on desktop or Android Chrome pages and collect detailed interaction timelines (tap/click, focus, selection, hash/navigation, deep-link class changes, and relevant Supabase write requests). Use when debugging why a user action did or did not navigate, highlight, focus the editor, open the keyboard, or overwrite content, especially when comparing mobile vs desktop behavior.
---

# Chrome Trace Listener

## Choose Target

1. Read user intent and set `mode` to `mobile` or `desktop`.
2. Use only the matching MCP namespace:
- `desktop`: `mcp__chrome-devtools__*`
- `mobile`: `mcp__chrome-devtools-phone__*`
3. Treat this skill as read-only unless the user explicitly asks for interaction.

## Attach To Existing Page

1. List pages in the selected namespace.
2. Select the already-open target page by URL/title; do not open a new page unless asked.
3. Confirm selected page URL back to the user before tracing.

If `mobile` pages are unavailable, ask the user to run `$android-debug` (or `adb connect` + `adb forward tcp:9222 localabstract:chrome_devtools_remote`) and retry.

## Install Listener

1. Load `references/trace_listener.js`.
2. Run it via `evaluate_script` as a function body so it installs `window.__ltTrace`.
3. If already installed, reuse it and call `window.__ltTrace.clear()` before each new experiment.

Expected API after install:
- `window.__ltTrace.status()`
- `window.__ltTrace.get({ limit })`
- `window.__ltTrace.clear()`
- `window.__ltTrace.uninstall()`

## Trace Workflow

1. Clear logs.
2. Tell user exactly what single action to do (for example: "tap `Link to running log` once and stop").
3. After user says done, pull:
- `window.__ltTrace.status()`
- `window.__ltTrace.get({ limit: 250 })`
4. Summarize timeline in plain language, including:
- whether pointer/touch/click fired
- whether hash/url changed
- whether deep-link class appeared
- where focus moved (and whether keyboard-triggering focus is likely)
- whether `PATCH/POST/PUT` writes fired and which page id was targeted

## Interpretation Rules

- Missing `hashchange` + no navigation event: link handler likely did not complete.
- Hash changed but no deep-link class event: anchor resolution/highlight path failed.
- Focus moved to `contenteditable` or input immediately after tap: keyboard opening is expected.
- Write request to wrong `page_id`: stale page context/race likely.

## Cleanup

- Keep listener installed while iterating.
- Call `window.__ltTrace.uninstall()` only when debugging session is complete or user asks.
