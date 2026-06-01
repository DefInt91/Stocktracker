const SPREADSHEET_ID = "ID";
const SHEET_NAME = "Orders";
const DEFAULT_ID = "default";

const HEADERS = [
  "id",
  "cash",
  "realized",
  "positions",
  "trades",
  "updatedAt"
];

const JSON_FIELDS = new Set([
  "positions",
  "trades"
]);

function doGet(e) {
  try {
    const action = getParam(e, "action") || "get";

    if (action === "list") {
      return jsonResponse({
        ok: true,
        action,
        data: listRecords()
      });
    }

    if (action === "get") {
      const id = getParam(e, "id") || DEFAULT_ID;
      return jsonResponse({
        ok: true,
        action,
        data: getRecord(id)
      });
    }

    return jsonResponse({
      ok: false,
      error: "Unsupported GET action"
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err.message
    });
  }
}

function doPost(e) {
  try {
    const body = parseBody(e);
    const action = body.action;

    if (!action) {
      throw new Error("Missing action");
    }

    if (action === "create") {
      return jsonResponse({
        ok: true,
        action,
        data: createRecord(body.data)
      });
    }

    if (action === "update") {
      return jsonResponse({
        ok: true,
        action,
        data: updateRecord(body.data)
      });
    }

    if (action === "upsert") {
      return jsonResponse({
        ok: true,
        action,
        data: upsertRecord(body.data)
      });
    }

    if (action === "delete") {
      if (body.confirm !== "DELETE") {
        throw new Error("Delete requires confirm=DELETE");
      }

      return jsonResponse({
        ok: true,
        action,
        data: deleteRecord(body.id || DEFAULT_ID)
      });
    }

    throw new Error("Unsupported POST action");
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err.message
    });
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const values = range.getValues()[0];
  const hasHeader = HEADERS.every((header, index) => values[index] === header);

  if (!hasHeader) {
    range.setValues([HEADERS]);
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat("@");
}

function listRecords() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  return values.slice(1)
    .filter(row => row.some(cell => cell !== ""))
    .map(rowToRecord);
}

function getRecord(id) {
  const rowIndex = findRowIndexById(id);

  if (rowIndex === -1) {
    return null;
  }

  const sheet = getSheet();
  const row = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];

  return rowToRecord(row);
}

function createRecord(record) {
  const normalized = normalizeRecord(record);
  const existingRow = findRowIndexById(normalized.id);

  if (existingRow !== -1) {
    throw new Error("Record already exists");
  }

  const sheet = getSheet();
  sheet.appendRow(recordToRow(normalized));

  return getRecord(normalized.id);
}

function updateRecord(record) {
  const normalized = normalizeRecord(record);
  const rowIndex = findRowIndexById(normalized.id);

  if (rowIndex === -1) {
    throw new Error("Record not found");
  }

  const sheet = getSheet();
  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([recordToRow(normalized)]);

  return getRecord(normalized.id);
}

function upsertRecord(record) {
  const normalized = normalizeRecord(record);
  const rowIndex = findRowIndexById(normalized.id);

  if (rowIndex === -1) {
    return createRecord(normalized);
  }

  return updateRecord(normalized);
}

function deleteRecord(id) {
  const rowIndex = findRowIndexById(id);

  if (rowIndex === -1) {
    throw new Error("Record not found");
  }

  const sheet = getSheet();
  const deleted = getRecord(id);
  sheet.deleteRow(rowIndex);

  return deleted;
}

function findRowIndexById(id) {
  const targetId = String(id || DEFAULT_ID);
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return -1;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === targetId) {
      return i + 2;
    }
  }

  return -1;
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") {
    throw new Error("Missing data");
  }

  return {
    id: String(record.id || DEFAULT_ID),
    cash: parseNumber(record.cash, 1000000),
    realized: parseNumber(record.realized, 0),
    positions: record.positions && typeof record.positions === "object" ? record.positions : {},
    trades: Array.isArray(record.trades) ? record.trades : [],
    updatedAt: new Date().toISOString()
  };
}

function recordToRow(record) {
  return HEADERS.map(header => {
    const value = record[header];

    if (JSON_FIELDS.has(header)) {
      return JSON.stringify(value || (header === "trades" ? [] : {}));
    }

    if (value === null || value === undefined) {
      return "";
    }

    return value;
  });
}

function rowToRecord(row) {
  const record = {};

  HEADERS.forEach((header, index) => {
    const value = row[index];

    if (JSON_FIELDS.has(header)) {
      record[header] = parseJsonCell(value, header === "trades" ? [] : {});
    } else if (header === "cash" || header === "realized") {
      record[header] = parseNumber(value, 0);
    } else {
      record[header] = value === null || value === undefined ? "" : String(value);
    }
  });

  return record;
}

function parseJsonCell(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(String(value));
  } catch (err) {
    return fallback;
  }
}

function parseNumber(value, fallback) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const numberValue = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body");
  }

  return JSON.parse(e.postData.contents);
}

function getParam(e, name) {
  return e && e.parameter ? e.parameter[name] : "";
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
