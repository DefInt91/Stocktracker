---
name: google-sheet-dashboard-source
description: Use when a stock dashboard, GitHub Pages app, HTML/JS dashboard, or Apps Script integration needs Google Sheets as the primary data source with local/repo JSON fallback. Trigger for tasks involving Sheet-backed fund-flow reports, Tasks sheet upserts, Orders sheet persistence, manual JSON imports, source labels, Apps Script Web App POST/GET APIs, CORS-safe writes, or debugging why dashboard data writes do not persist.
---

# Google Sheet Dashboard Source

## Core Rule

Treat Google Sheets as the persisted source when the user wants data to survive page reloads and deployments. Treat JSON files in the repo as the fallback/bootstrap source for GitHub Pages and offline development.

Use this priority:

1. Load from Google Sheet Web App when configured and reachable.
2. If Sheet data is empty or unavailable, load repo JSON through `tw-fund-flow-index.json`.
3. If the user manually pastes JSON, show it immediately, but persist it only if the flow also writes it to Sheet or commits a repo JSON file.

## Project Conventions

- Fund-flow reports live in the `Tasks` sheet.
- Simulator orders live in the `Orders` sheet.
- Repo report files use `tw-fund-flow-YYYY-MM-DD.json`.
- Repo index file is `tw-fund-flow-index.json`; newest report must be first in `files`.
- Apps Script constants should use English identifiers, for example `SPREADSHEET_ID` and `SHEET_NAME`.
- GitHub Pages never reads the user's local files. It reads deployed repo files and remote Sheet/Web App data.
- Always display a visible source label in the dashboard, such as `Sheet`, `JSON fallback`, or `Manual import`.

## Workflow

1. Identify the data surface.
   - For reports, inspect `Tasks` read/write behavior.
   - For simulator positions/orders, inspect `Orders` read/write behavior.
   - For dashboard load order, inspect the HTML/JS source loader and any source label UI.

2. Confirm persistence requirements.
   - If data must remain after reopening the page, persist to Sheet or commit JSON.
   - If data is only for quick inspection, manual paste can remain session-only.

3. Implement Sheet-first loading.
   - Fetch the Apps Script Web App URL.
   - Normalize returned rows into the dashboard's existing JSON shape.
   - If zero valid rows or fetch fails, fall back to repo JSON index.
   - Set the source label from the actual branch taken.

4. Implement writes with explicit actions.
   - Use `upsert` for reports keyed by `date`.
   - Use row-level `create`, `update`, `delete`, and `clear` for Orders when the UI supports per-order history.
   - Do not reset only frontend state when the user expects Sheet persistence.

5. Verify end to end.
   - Browser action updates UI.
   - Web App response returns `ok: true`.
   - Sheet contains the expected row(s).
   - Reloading the GitHub Pages page loads the persisted data.
   - JSON fallback still works when Sheet data is unavailable.

## Read References When Needed

- Read [dashboard-source-rules.md](references/dashboard-source-rules.md) when deciding source order, persistence behavior, or user-facing labels.
- Read [apps-script-pattern.md](references/apps-script-pattern.md) when creating or debugging Apps Script Web App read/write APIs.

## Guardrails

- Do not delete Sheet rows or files unless the user explicitly approves the exact items.
- Do not expose Sheet IDs, Web App URLs, Telegram tokens, or other credentials in public code unless the user has already chosen that public configuration.
- Do not silently replace Sheet data with JSON fallback data. Show which source was used.
- Do not assume a successful frontend update means Sheet persistence succeeded; check the API response.
- For Apps Script changes, remind the user that a new deployment version may be required before the public Web App behavior changes.
