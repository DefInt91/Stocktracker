# Apps Script Pattern

## Deployment Checklist

When a Google Sheet-backed dashboard cannot write data, check these first:

1. Web App is deployed after the latest script edit.
2. Execute as is set to the script owner.
3. Access allows the intended users.
4. `SPREADSHEET_ID` points to the target spreadsheet.
5. `SHEET_NAME` matches the exact tab name, for example `Tasks` or `Orders`.
6. The frontend posts the action and payload shape the script expects.
7. The API response is inspected, not ignored.

## Browser-Safe POST

For simple Apps Script Web Apps, prefer a no-preflight request from browser JavaScript:

```js
fetch(webAppUrl, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(payload)
});
```

Apps Script can parse the JSON from `e.postData.contents`.

## Action Shape

Use explicit action names. Keep report and order behavior separate.

```json
{ "action": "list" }
{ "action": "upsert", "data": { "date": "2026-06-01" } }
{ "action": "create", "data": { "id": "order-001" } }
{ "action": "update", "id": "order-001", "data": { "status": "closed" } }
{ "action": "delete", "id": "order-001" }
{ "action": "clear" }
```

## Response Shape

Return a small, inspectable JSON response:

```json
{ "ok": true, "action": "upsert", "data": {} }
```

On errors, return:

```json
{ "ok": false, "error": "message" }
```

The dashboard should surface failed writes to the user and keep local state consistent with persistence.

## Common Failure Modes

- The page updates locally but Sheet does not change: frontend state changed without awaiting the API response.
- The script looks correct but behavior is old: Apps Script was not redeployed.
- `reset` does not clear Sheet: the button clears only local arrays and never calls `clear`.
- A created order overwrites the previous order: data is stored as one JSON blob instead of one row per order.
- Delete cannot target one order: rows do not have stable `id` values.
- Sheet read works but write fails from browser: request caused CORS preflight; use `text/plain` POST.
