# Dashboard Source Rules

## Source Priority

Use this order for deployed dashboards:

1. Google Sheet Web App
2. Repo JSON index and report files
3. Manual import for the current session

Manual import is not durable by itself. It becomes durable only after an API write to Sheet or a committed JSON file.

## Source Labels

Expose the active source in the UI so the user can tell what is happening:

- `Sheet`: data came from the Apps Script Web App and contains valid rows.
- `JSON fallback`: Sheet fetch failed or returned no usable data, and repo JSON loaded.
- `Manual import`: user pasted JSON in the browser session.
- `Mixed`: use only when the page intentionally merges sources; otherwise avoid it.

## GitHub Pages Behavior

GitHub Pages cannot read files from the user's computer. Relative JSON URLs on a Pages deployment resolve to files in the GitHub repository deployment, not local disk.

When a dashboard works locally but not on Pages, check:

- Is `tw-fund-flow-index.json` committed and pushed?
- Is the new `tw-fund-flow-YYYY-MM-DD.json` committed and pushed?
- Is the Apps Script Web App URL reachable from a browser without local credentials?
- Does the Web App return JSON or CSV in the shape expected by the dashboard?

## Tasks Sheet

Use `Tasks` for fund-flow reports. Prefer one row per report date. Upsert by `date` so reruns replace the same date instead of appending duplicates.

Expected dashboard shape:

- `date`
- `market`
- `risk`
- `foreign`
- `industries`
- `catalysts`
- `moats`
- `shortPlan`
- `midPlan`
- `risksDetail`
- `potentials`

Arrays and objects can be stored as JSON strings in cells and parsed by the dashboard.

## Orders Sheet

Use `Orders` for simulator orders or positions. Prefer one row per order so the user can delete or edit individual records.

Common fields:

- `id`
- `createdAt`
- `stockCode`
- `stockName`
- `side`
- `price`
- `quantity`
- `note`
- `status`

If the UI has a reset button, decide whether it means frontend-only reset or Sheet reset. When the user expects persistence, call the Web App `clear` action and verify the response.
