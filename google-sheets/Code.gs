/**
 * PAICONS Self-Development — waitlist → Google Sheet.
 *
 * Paste this into the sheet: Extensions → Apps Script. Replace SECRET below with a long random
 * value, then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Put the Web app URL and the same SECRET into Vercel as SHEETS_WEBHOOK_URL and SHEETS_SECRET.
 * Full steps: README.md, section "Waitlist in Google Sheets".
 *
 * "Anyone" only means the website can reach this script. Without the SECRET it does nothing,
 * and the sheet itself stays private.
 */

const SECRET = 'CHANGE-ME-to-a-long-random-value';
const SHEET_NAME = 'Waitlist';
const HEADERS = ['Joined at', 'Name', 'Email', 'WhatsApp', 'Country', 'Consent', 'Source', 'Key', 'Price shown'];

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'bad_request' }); }
  if (!d || d.secret !== SECRET) return out({ ok: false, error: 'unauthorized' });

  const email = String(d.email || '').trim().toLowerCase();
  const whatsapp = String(d.whatsapp || '').trim();
  if (!d.name || (!email && !whatsapp)) return out({ ok: false, error: 'invalid' });
  const key = email ? 'email:' + email : 'phone:' + whatsapp.replace(/\D/g, '');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheet();
    const rows = sh.getLastRow() - 1;
    if (rows > 0 && sh.getRange(2, 8, rows, 1).getValues().some(r => r[0] === key)) {
      return out({ ok: true, added: false, count: rows });   // already on the list
    }
    sh.appendRow([
      d.consentAt ? new Date(d.consentAt) : new Date(),
      text(d.name), text(email), text(whatsapp), text(d.country), 'Yes', text(d.source), key, text(d.offer),
    ]);
    return out({ ok: true, added: true, count: rows + 1 });
  } finally {
    lock.releaseLock();
  }
}

/** GET ?secret=…  →  {count}. Used for the "N people have joined" line on the page. */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.secret !== SECRET) return out({ ok: false });
  return out({ ok: true, count: Math.max(0, sheet().getLastRow() - 1) });
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.getRange('B:I').setNumberFormat('@');   // keep +92… numbers as text
    sh.hideColumns(8);                          // Key is only used to avoid duplicates
  } else if (sh.getRange(1, 9).getValue() === '') {
    sh.getRange(1, 9).setValue('Price shown').setFontWeight('bold');   // sheets made by an older version
  }
  return sh;
}

// Stop text like "=HYPERLINK(...)" being run as a formula, and keep "+92…" as text.
function text(v) {
  const s = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
