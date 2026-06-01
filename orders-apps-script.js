const SPREADSHEET_ID = "1DQXQAMkoQ5GsoIjBxS1PZPM4ajIYAHLheBSBph6jL-Y";
const SHEET_NAME = "Orders";

const HEADERS = [
  "order_id",
  "time",
  "side",
  "code",
  "name",
  "shares",
  "price",
  "fee",
  "tax",
  "note",
  "created_at",
  "updated_at"
];

const ALLOWED_SIDES = ["buy", "sell"];

function doGet() {
  try {
    const sheet = getOrderSheet();
    return jsonOutput({
      ok: true,
      orders: readOrders(sheet)
    });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const sheet = getOrderSheet();

    if (payload.action === "create_order") {
      const order = normalizeOrder(payload.order);
      sheet.appendRow(HEADERS.map((header) => order[header]));
      return jsonOutput({ ok: true, order });
    }

    if (payload.action === "update_order") {
      const order = normalizeOrder(payload.order);
      updateOrder(sheet, order);
      return jsonOutput({ ok: true, order });
    }

    if (payload.action === "delete_order") {
      if (payload.confirm !== "DELETE") {
        throw new Error("Delete requires confirm=DELETE.");
      }

      const deleted = deleteOrder(sheet, payload.order_id);
      return jsonOutput({ ok: true, order: deleted, orders: readOrders(sheet) });
    }

    if (payload.action === "clear_orders") {
      if (payload.confirm !== "DELETE") {
        throw new Error("Clear requires confirm=DELETE.");
      }

      clearOrders(sheet);
      return jsonOutput({ ok: true, orders: [] });
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

function readOrders(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues()
    .map((row) => rowToOrder(row))
    .filter((order) => order.order_id && ALLOWED_SIDES.includes(order.side))
    .sort((firstOrder, secondOrder) => String(secondOrder.created_at).localeCompare(String(firstOrder.created_at)));
}

function rowToOrder(row) {
  const order = {};
  HEADERS.forEach((header, index) => {
    order[header] = row[index];
  });

  order.order_id = String(order.order_id || "");
  order.side = String(order.side || "");
  order.code = String(order.code || "");
  order.name = String(order.name || "");
  order.shares = Math.floor(Number(order.shares) || 0);
  order.price = Number(order.price) || 0;
  order.fee = Math.round(Number(order.fee) || 0);
  order.tax = Math.round(Number(order.tax) || 0);
  order.note = String(order.note || "");
  order.time = String(order.time || "");
  order.created_at = String(order.created_at || "");
  order.updated_at = String(order.updated_at || "");

  return order;
}

function normalizeOrder(rawOrder) {
  const now = new Date().toISOString();
  const order = rawOrder && typeof rawOrder === "object" ? rawOrder : {};
  const side = String(order.side || "").trim();
  const code = String(order.code || "").trim();
  const shares = Math.floor(Number(order.shares) || 0);
  const price = Number(order.price) || 0;

  if (!ALLOWED_SIDES.includes(side)) {
    throw new Error("Invalid order side.");
  }

  if (!/^\d{4,5}$/.test(code)) {
    throw new Error("Invalid stock code.");
  }

  if (shares <= 0) {
    throw new Error("Shares must be greater than zero.");
  }

  if (price <= 0) {
    throw new Error("Price must be greater than zero.");
  }

  return {
    order_id: String(order.order_id || Utilities.getUuid()),
    time: String(order.time || new Date().toLocaleString("zh-TW")),
    side,
    code,
    name: String(order.name || ""),
    shares,
    price,
    fee: Math.round(Number(order.fee) || 0),
    tax: Math.round(Number(order.tax) || 0),
    note: String(order.note || ""),
    created_at: String(order.created_at || now),
    updated_at: now
  };
}

function updateOrder(sheet, order) {
  const rowNumber = findOrderRow(sheet, order.order_id);

  if (!rowNumber) {
    throw new Error("Order not found.");
  }

  sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues([HEADERS.map((header) => order[header])]);
}

function deleteOrder(sheet, orderId) {
  const rowNumber = findOrderRow(sheet, orderId);

  if (!rowNumber) {
    throw new Error("Order not found.");
  }

  const deleted = rowToOrder(sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0]);
  sheet.deleteRow(rowNumber);
  return deleted;
}

function clearOrders(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  sheet.deleteRows(2, lastRow - 1);
}

function findOrderRow(sheet, orderId) {
  const id = String(orderId || "");

  if (!id) {
    return 0;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return 0;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let index = 0; index < ids.length; index += 1) {
    if (String(ids[index][0]) === id) {
      return index + 2;
    }
  }

  return 0;
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
