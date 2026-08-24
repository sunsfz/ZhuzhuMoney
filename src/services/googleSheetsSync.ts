import { AppData } from '../types/finance';

/**
 * Google Apps Script Sync Integration
 *
 * This allows syncing data directly to and from a private Google Sheet.
 * The script code below can be pasted into Extensions > Apps Script in Google Sheets.
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * ZhuzhuMoney Google Sheets Backend Sync Script
 * 
 * Automatically syncs and formats your financial data into clean spreadsheet tabs:
 * 1. "Cash Ledger" (All pocket money transactions)
 * 2. "Custodial Savings" (Bank balance snapshots)
 * 3. "ZhuzhuData" (Raw sync storage)
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ZhuzhuData");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: "empty" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getRange(1, 1).getValue();
  return ContentService.createTextOutput(data || "{}")
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var parsed = JSON.parse(contents);

    // 1. Save Raw Sync Payload
    var syncSheet = ss.getSheetByName("ZhuzhuData");
    if (!syncSheet) {
      syncSheet = ss.insertSheet("ZhuzhuData");
    }
    syncSheet.getRange(1, 1).setValue(contents);
    syncSheet.getRange(1, 2).setValue(new Date());

    // 2. Format Pretty Human-Readable "Cash Ledger" Tab
    if (parsed.transactions && parsed.girls) {
      var girlMap = {};
      parsed.girls.forEach(function(g) { girlMap[g.id] = g.name; });

      var cashSheet = ss.getSheetByName("Cash Ledger");
      if (!cashSheet) {
        cashSheet = ss.insertSheet("Cash Ledger", 0);
      }
      cashSheet.clear();
      
      // Header
      cashSheet.appendRow(["Date", "Girl", "Type", "Amount ($)", "Category", "Item / Description", "Logged At"]);
      var headerRange = cashSheet.getRange(1, 1, 1, 7);
      headerRange.setBackground("#FFF1F2").setFontWeight("bold").setFontColor("#9F1239");

      parsed.transactions.forEach(function(tx) {
        cashSheet.appendRow([
          tx.date,
          girlMap[tx.girlId] || tx.girlId,
          tx.type === "deposit" ? "Earned / In (+)" : "Spent / Out (-)",
          tx.type === "deposit" ? tx.amount : -tx.amount,
          (tx.categoryEmoji || "") + " " + tx.category,
          tx.description || "",
          tx.createdAt || ""
        ]);
      });
      cashSheet.setFrozenRows(1);
      cashSheet.autoResizeColumns(1, 7);
    }

    // 3. Format Pretty Human-Readable "Custodial Savings" Tab
    if (parsed.savingsSnapshots && parsed.girls) {
      var girlMap = {};
      parsed.girls.forEach(function(g) { girlMap[g.id] = g.name; });

      var savSheet = ss.getSheetByName("Custodial Savings");
      if (!savSheet) {
        savSheet = ss.insertSheet("Custodial Savings", 1);
      }
      savSheet.clear();
      
      // Header
      savSheet.appendRow(["Statement Date", "Girl", "Custodial Balance ($)", "Notes / Statement Memo", "Recorded At"]);
      var savHeader = savSheet.getRange(1, 1, 1, 5);
      savHeader.setBackground("#FAF5FF").setFontWeight("bold").setFontColor("#581C87");

      parsed.savingsSnapshots.forEach(function(s) {
        savSheet.appendRow([
          s.date,
          girlMap[s.girlId] || s.girlId,
          s.balance,
          s.note || "",
          s.createdAt || ""
        ]);
      });
      savSheet.setFrozenRows(1);
      savSheet.autoResizeColumns(1, 5);
    }

    // 4. Format Pretty Human-Readable "Wishlist & Goals" Tab
    if (parsed.goals && parsed.girls) {
      var girlMap = {};
      parsed.girls.forEach(function(g) { girlMap[g.id] = g.name; });

      var goalSheet = ss.getSheetByName("Wishlist & Goals");
      if (!goalSheet) {
        goalSheet = ss.insertSheet("Wishlist & Goals", 2);
      }
      goalSheet.clear();
      
      goalSheet.appendRow(["Goal / Item", "Girl", "Target Cost ($)", "Status", "Notes / Details"]);
      var goalHeader = goalSheet.getRange(1, 1, 1, 5);
      goalHeader.setBackground("#FEF3C7").setFontWeight("bold").setFontColor("#92400E");

      parsed.goals.forEach(function(g) {
        goalSheet.appendRow([
          (g.emoji || "") + " " + g.title,
          girlMap[g.girlId] || g.girlId,
          g.targetAmount,
          g.completed ? "Achieved! 🎉" : "In Progress ⏳",
          g.notes || ""
        ]);
      });
      goalSheet.setFrozenRows(1);
      goalSheet.autoResizeColumns(1, 5);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", timestamp: new Date() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`.trim();

export async function fetchFromGoogleSheet(scriptUrl: string): Promise<AppData | null> {
  try {
    const response = await fetch(scriptUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text === '{}' || text === '{"status":"empty"}') {
      return null;
    }

    const parsed = JSON.parse(text);
    if (parsed && parsed.girls && Array.isArray(parsed.girls)) {
      return parsed as AppData;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    throw error;
  }
}

export async function pushToGoogleSheet(scriptUrl: string, data: AppData): Promise<boolean> {
  try {
    const payload = JSON.stringify(data);
    
    // Google Apps Script redirects POST to a secondary googleusercontent URL.
    // Using mode: 'no-cors' guarantees reliable delivery from any web browser without CORS blocks.
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
    });

    return true;
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error);
    throw error;
  }
}
