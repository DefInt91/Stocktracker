const SPREADSHEET_ID = "14SOy9cYWMA9u0F-f2co5nEEDJvF94CAuXNx9ETLR3no";
const SHEET_NAME = "Orders";
const DEFAULT_ACCOUNT_ID = "default";

const HEADERS = [
  "account_id",
  "cash",
  "realized",
  "positions",
  "trades",
  "updated_at"
];

function doGet(event) {
  try {
    const sheet = getOrderSheet();
    const accountId = getParam(event, "account_id") || DEFAULT_ACCOUNT_ID;
    return jsonOutput({
      ok: true,
      account: readAccount(sheet, accountId),
      accounts: readAccounts(sheet)
    });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const sheet = getOrderSheet();

    if (payload.action === "upsert_account") {
      const account = normalizeAccount(payload.account);
      upsertAccount(sheet, account);
      return jsonOutput({
        ok: true,
        account: readAccount(sheet, account.account_id)
      });
    }

    if (payload.action === "delete_account") {
      if (payload.confirm !== "DELETE") {
        throw new Error("Delete requires confirm=DELETE.");
      }

      const accountId = String(payload.account_id || DEFAULT_ACCOUNT_ID);
      const deleted = deleteAccount(sheet, accountId);
      return jsonOutput({ ok: true, account: deleted });
    }

    throw new Error("Unsupported action.");
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}

function getOrderSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat("@");
}

function readAccounts(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues()
    .map((row) => rowToAccount(row))
    .filter((account) => account.account_id);
}

function readAccount(sheet, accountId) {
  const targetId = String(accountId || DEFAULT_ACCOUNT_ID);
  const accounts = readAccounts(sheet);
  return accounts.find((account) => account.account_id === targetId) || null;
}

function upsertAccount(sheet, account) {
  const rowIndex = findAccountRow(sheet, account.account_id);
  const row = HEADERS.map((header) => account[header]);

  if (rowIndex === -1) {
    sheet.appendRow(row);
    return;
  }

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
}

function deleteAccount(sheet, accountId) {
  const rowIndex = findAccountRow(sheet, accountId);

  if (rowIndex === -1) {
    throw new Error("Account not found.");
  }

  const deleted = rowToAccount(sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]);
  sheet.deleteRow(rowIndex);
  return deleted;
}

function findAccountRow(sheet, accountId) {
  const targetId = String(accountId || DEFAULT_ACCOUNT_ID);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return -1;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let index = 0; index < ids.length; index++) {
    if (String(ids[index][0]) === targetId) {
      return index + 2;
    }
  }

  return -1;
}

function rowToAccount(row) {
  return {
    account_id: String(row[0] || DEFAULT_ACCOUNT_ID),
    cash: Number(row[1]) || 0,
    realized: Number(row[2]) || 0,
    positions: parseJsonCell(row[3], {}),
    trades: parseJsonCell(row[4], []),
    updated_at: String(row[5] || "")
  };
}

function normalizeAccount(rawAccount) {
  const now = new Date().toISOString();
  const account = rawAccount && typeof rawAccount === "object" ? rawAccount : {};

  return {
    account_id: String(account.account_id || DEFAULT_ACCOUNT_ID),
    cash: Number(account.cash) || 0,
    realized: Number(account.realized) || 0,
    positions: account.positions && typeof account.positions === "object" ? account.positions : {},
    trades: Array.isArray(account.trades) ? account.trades : [],
    updated_at: now
  };
}

function parseJsonCell(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(String(value));
    return parsed || fallback;
  } catch (error) {
    return fallback;
  }
}

function getParam(event, name) {
  return event && event.parameter ? event.parameter[name] : "";
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
