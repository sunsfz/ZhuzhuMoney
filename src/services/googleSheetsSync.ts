import { AppData, CashTransaction, SavingsGoal, SavingsSnapshot } from '../types/finance';

/**
 * Google Apps Script Sync Integration
 *
 * This allows syncing data directly to and from a private Google Sheet.
 * The script code below can be pasted into Extensions > Apps Script in Google Sheets.
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * ZhuzhuMoney Google Sheets Backend Sync Script (Two-Way Live Sync)
 * 
 * Instructions:
 * 1. Click 'testAuth' in the toolbar dropdown and click '▶️ Run'.
 * 2. Click 'Review Permissions' -> Choose your account -> Advanced -> Allow.
 * 3. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
 */

function testAuth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Connected to spreadsheet: " + ss.getName());
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (e && e.parameter) {
      // 1. Atomic Add Cash Transaction
      if (e.parameter.action === "add_tx") {
        var girlId = e.parameter.girlId || "girl_1";
        var girlName = e.parameter.girlName || (girlId === "girl_2" ? "Raina" : "Jessie");
        var type = e.parameter.type || "deposit";
        var amount = Number(e.parameter.amount) || 0;
        var category = e.parameter.category || "Allowance";
        var description = e.parameter.description || "";
        var date = e.parameter.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

        var cashSheet = ss.getSheetByName("Cash Ledger");
        if (!cashSheet) {
          cashSheet = ss.insertSheet("Cash Ledger", 0);
          cashSheet.appendRow(["Date", "Girl", "Type", "Amount ($)", "Category", "Item / Description", "Logged At"]);
          cashSheet.getRange(1, 1, 1, 7).setBackground("#FFF1F2").setFontWeight("bold").setFontColor("#9F1239");
        }
        cashSheet.appendRow([
          date,
          girlName,
          type === "deposit" ? "Earned / In (+)" : "Spent / Out (-)",
          type === "deposit" ? amount : -amount,
          category,
          description,
          new Date().toISOString()
        ]);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 2. Atomic Add Savings Snapshot
      if (e.parameter.action === "add_savings") {
        var sGirlName = e.parameter.girlName || (e.parameter.girlId === "girl_2" ? "Raina" : "Jessie");
        var sBalance = Number(e.parameter.balance) || 0;
        var sNote = e.parameter.note || "";
        var sDate = e.parameter.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

        var savSheet = ss.getSheetByName("Custodial Savings");
        if (!savSheet) {
          savSheet = ss.insertSheet("Custodial Savings", 1);
          savSheet.appendRow(["Statement Date", "Girl", "Custodial Balance ($)", "Notes / Statement Memo", "Recorded At"]);
          savSheet.getRange(1, 1, 1, 5).setBackground("#FAF5FF").setFontWeight("bold").setFontColor("#581C87");
        }
        savSheet.appendRow([
          sDate,
          sGirlName,
          sBalance,
          sNote,
          new Date().toISOString()
        ]);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 3. Atomic Add Goal
      if (e.parameter.action === "add_goal") {
        var gGirlName = e.parameter.girlName || (e.parameter.girlId === "girl_2" ? "Raina" : "Jessie");
        var gTitle = e.parameter.title || "";
        var gAmount = Number(e.parameter.targetAmount) || 0;
        var gNotes = e.parameter.notes || "";

        var goalSheet = ss.getSheetByName("Wishlist & Goals");
        if (!goalSheet) {
          goalSheet = ss.insertSheet("Wishlist & Goals", 2);
          goalSheet.appendRow(["Goal / Item", "Girl", "Target Cost ($)", "Status", "Notes / Details"]);
          goalSheet.getRange(1, 1, 1, 5).setBackground("#FEF3C7").setFontWeight("bold").setFontColor("#92400E");
        }
        goalSheet.appendRow([
          gTitle,
          gGirlName,
          gAmount,
          "In Progress ⏳",
          gNotes
        ]);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 4. Batch push if payload is present
      if (e.parameter.action === "push" && e.parameter.payload) {
        return writeSpreadsheetData(ss, e.parameter.payload);
      }
    }

    return readSpreadsheetData(ss);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    return writeSpreadsheetData(ss, contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readSpreadsheetData(ss) {
  var cashSheet = ss.getSheetByName("Cash Ledger");
  var savSheet = ss.getSheetByName("Custodial Savings");
  var goalSheet = ss.getSheetByName("Wishlist & Goals");
  var profileSheet = ss.getSheetByName("Profiles & PIN");

  if (!cashSheet && !savSheet) {
    var syncSheet = ss.getSheetByName("ZhuzhuData");
    if (!syncSheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: "empty" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var raw = syncSheet.getRange(1, 1).getValue();
    return ContentService.createTextOutput(raw || "{}")
      .setMimeType(ContentService.MimeType.JSON);
  }

  var girls = [
    { id: "girl_1", name: "Jessie", avatarEmoji: "👧🏻", themeColor: "pink", birthday: "2016-01-01" },
    { id: "girl_2", name: "Raina", avatarEmoji: "🧒🏻", themeColor: "purple", birthday: "2018-01-01" }
  ];
  var parentPin = "0518";

  if (profileSheet && profileSheet.getLastRow() >= 2) {
    var profData = profileSheet.getDataRange().getValues();
    for (var p = 1; p < profData.length; p++) {
      var row = profData[p];
      if (row[0] === "Parent PIN" && row[1]) {
        parentPin = String(row[1]).trim();
      } else if (row[0] === "girl_1" || row[0] === "Jessie") {
        girls[0].name = String(row[1] || "Jessie").trim();
        girls[0].avatarEmoji = String(row[2] || "👧🏻").trim();
        girls[0].themeColor = String(row[3] || "pink").trim();
      } else if (row[0] === "girl_2" || row[0] === "Raina" || row[0] === "Rains") {
        girls[1].name = String(row[1] || "Raina").trim();
        girls[1].avatarEmoji = String(row[2] || "🧒🏻").trim();
        girls[1].themeColor = String(row[3] || "purple").trim();
      }
    }
  }

  function getGirlId(name) {
    if (!name) return "girl_1";
    var n = String(name).trim().toLowerCase();
    if (n.indexOf(girls[1].name.toLowerCase()) !== -1 || n === "girl_2" || n === "raina" || n === "rains") {
      return "girl_2";
    }
    return "girl_1";
  }

  var transactions = [];
  if (cashSheet && cashSheet.getLastRow() >= 2) {
    var cashRows = cashSheet.getDataRange().getValues();
    for (var i = 1; i < cashRows.length; i++) {
      var r = cashRows[i];
      if (!r[0] && !r[3]) continue;

      var rawDate = r[0];
      var formattedDate = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd")
        : String(rawDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"));

      var girlId = getGirlId(r[1]);
      var typeRaw = String(r[2] || "").toLowerCase();
      var rawAmount = Number(r[3]) || 0;
      var type = typeRaw.indexOf("spent") !== -1 || typeRaw.indexOf("out") !== -1 || rawAmount < 0
        ? "spent"
        : "deposit";
      var amount = Math.abs(rawAmount);

      var rawCat = String(r[4] || "Allowance");
      var catEmoji = "💵";
      var catName = rawCat;
      var emojiMatch = rawCat.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji})/u);
      if (emojiMatch) {
        catEmoji = emojiMatch[0];
        catName = rawCat.replace(catEmoji, "").trim();
      }

      var description = String(r[5] || "");
      var createdAt = r[6] ? String(r[6]) : new Date().toISOString();

      transactions.push({
        id: "tx_" + i + "_" + girlId,
        girlId: girlId,
        type: type,
        amount: amount,
        category: catName || "Allowance",
        categoryEmoji: catEmoji,
        description: description,
        date: formattedDate,
        createdAt: createdAt
      });
    }
  }

  var savingsSnapshots = [];
  if (savSheet && savSheet.getLastRow() >= 2) {
    var savRows = savSheet.getDataRange().getValues();
    for (var j = 1; j < savRows.length; j++) {
      var sr = savRows[j];
      if (!sr[0] && !sr[2]) continue;

      var sDate = sr[0] instanceof Date
        ? Utilities.formatDate(sr[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
        : String(sr[0] || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"));

      var sGirlId = getGirlId(sr[1]);
      var sBalance = Number(sr[2]) || 0;
      var sNote = String(sr[3] || "");
      var sCreatedAt = sr[4] ? String(sr[4]) : new Date().toISOString();

      savingsSnapshots.push({
        id: "sav_" + j + "_" + sGirlId,
        girlId: sGirlId,
        balance: sBalance,
        date: sDate,
        note: sNote,
        createdAt: sCreatedAt
      });
    }
  }

  var goals = [];
  if (goalSheet && goalSheet.getLastRow() >= 2) {
    var goalRows = goalSheet.getDataRange().getValues();
    for (var k = 1; k < goalRows.length; k++) {
      var gr = goalRows[k];
      if (!gr[0]) continue;

      var rawTitle = String(gr[0] || "");
      var gEmoji = "🎯";
      var gTitle = rawTitle;
      var gEmojiMatch = rawTitle.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji})/u);
      if (gEmojiMatch) {
        gEmoji = gEmojiMatch[0];
        gTitle = rawTitle.replace(gEmoji, "").trim();
      }

      var gGirlId = getGirlId(gr[1]);
      var gAmount = Number(gr[2]) || 0;
      var gStatus = String(gr[3] || "").toLowerCase();
      var gCompleted = gStatus.indexOf("achieved") !== -1 || gStatus.indexOf("yes") !== -1 || gStatus.indexOf("done") !== -1;
      var gNotes = String(gr[4] || "");

      goals.push({
        id: "goal_" + k + "_" + gGirlId,
        girlId: gGirlId,
        title: gTitle,
        targetAmount: gAmount,
        emoji: gEmoji,
        completed: gCompleted,
        notes: gNotes
      });
    }
  }

  var resultData = {
    girls: girls,
    transactions: transactions,
    savingsSnapshots: savingsSnapshots,
    goals: goals,
    parentPin: parentPin,
    lastSyncTimestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(resultData))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeSpreadsheetData(ss, rawContents) {
  var parsed = typeof rawContents === "string" ? JSON.parse(rawContents) : rawContents;

  // 1. Raw sync backup
  var syncSheet = ss.getSheetByName("ZhuzhuData");
  if (!syncSheet) {
    syncSheet = ss.insertSheet("ZhuzhuData");
  }
  syncSheet.getRange(1, 1).setValue(typeof rawContents === "string" ? rawContents : JSON.stringify(rawContents));
  syncSheet.getRange(1, 2).setValue(new Date());

  // 2. Update Profiles & PIN Tab
  if (parsed.girls) {
    var profSheet = ss.getSheetByName("Profiles & PIN");
    if (!profSheet) {
      profSheet = ss.insertSheet("Profiles & PIN", 3);
    }
    profSheet.clear();
    profSheet.appendRow(["ID / Setting", "Name / Value", "Avatar Emoji", "Theme Color", "Birthday"]);
    profSheet.getRange(1, 1, 1, 5).setBackground("#F1F5F9").setFontWeight("bold").setFontColor("#334155");

    parsed.girls.forEach(function(g) {
      profSheet.appendRow([g.id, g.name, g.avatarEmoji || "👧🏻", g.themeColor || "pink", g.birthday || ""]);
    });
    profSheet.appendRow(["Parent PIN", parsed.parentPin || "0518", "", "", ""]);
    profSheet.setFrozenRows(1);
    profSheet.autoResizeColumns(1, 5);
  }

  // 3. Format "Cash Ledger" Tab
  if (parsed.transactions && parsed.girls) {
    var girlMap = {};
    parsed.girls.forEach(function(g) { girlMap[g.id] = g.name; });

    var cashSheet = ss.getSheetByName("Cash Ledger");
    if (!cashSheet) {
      cashSheet = ss.insertSheet("Cash Ledger", 0);
    }
    cashSheet.clear();
    
    cashSheet.appendRow(["Date", "Girl", "Type", "Amount ($)", "Category", "Item / Description", "Logged At"]);
    cashSheet.getRange(1, 1, 1, 7).setBackground("#FFF1F2").setFontWeight("bold").setFontColor("#9F1239");

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

  // 4. Format "Custodial Savings" Tab
  if (parsed.savingsSnapshots && parsed.girls) {
    var girlMap = {};
    parsed.girls.forEach(function(g) { girlMap[g.id] = g.name; });

    var savSheet = ss.getSheetByName("Custodial Savings");
    if (!savSheet) {
      savSheet = ss.insertSheet("Custodial Savings", 1);
    }
    savSheet.clear();
    
    savSheet.appendRow(["Statement Date", "Girl", "Custodial Balance ($)", "Notes / Statement Memo", "Recorded At"]);
    savSheet.getRange(1, 1, 1, 5).setBackground("#FAF5FF").setFontWeight("bold").setFontColor("#581C87");

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

  // 5. Format "Wishlist & Goals" Tab
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
}
`.trim();

export async function fetchFromGoogleSheet(scriptUrl: string): Promise<AppData | null> {
  try {
    const cacheBusterUrl = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const response = await fetch(cacheBusterUrl);

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
    return false;
  }
}

export async function pushTransactionToGoogle(
  scriptUrl: string,
  tx: CashTransaction,
  girlName: string
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      action: 'add_tx',
      girlId: tx.girlId,
      girlName: girlName,
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.categoryEmoji ? `${tx.categoryEmoji} ${tx.category}` : tx.category,
      description: tx.description || '',
      date: tx.date,
      _t: Date.now().toString(),
    });
    const url = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    await fetch(url, { method: 'GET', cache: 'no-store' });
    return true;
  } catch (err) {
    console.error('Failed to append transaction to Google Sheet:', err);
    return false;
  }
}

export async function pushSavingsToGoogle(
  scriptUrl: string,
  snap: SavingsSnapshot,
  girlName: string
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      action: 'add_savings',
      girlId: snap.girlId,
      girlName: girlName,
      balance: snap.balance.toString(),
      note: snap.note || '',
      date: snap.date,
      _t: Date.now().toString(),
    });
    const url = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    await fetch(url, { method: 'GET', cache: 'no-store' });
    return true;
  } catch (err) {
    console.error('Failed to append savings to Google Sheet:', err);
    return false;
  }
}

export async function pushGoalToGoogle(
  scriptUrl: string,
  goal: SavingsGoal,
  girlName: string
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      action: 'add_goal',
      girlId: goal.girlId,
      girlName: girlName,
      title: goal.emoji ? `${goal.emoji} ${goal.title}` : goal.title,
      targetAmount: goal.targetAmount.toString(),
      notes: goal.notes || '',
      _t: Date.now().toString(),
    });
    const url = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    await fetch(url, { method: 'GET', cache: 'no-store' });
    return true;
  } catch (err) {
    console.error('Failed to append goal to Google Sheet:', err);
    return false;
  }
}
