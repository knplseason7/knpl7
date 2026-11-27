/**
 * KNPL-7 Finance Desk — Google Apps Script backend
 * -----------------------------------------------------------------------------
 * Files in this Apps Script project:
 *   Code.gs         – this file (Google Sheets / Drive / Cache adapter + web endpoint)
 *   FinanceCore.gs  – an exact copy of finance/fin-core.js (all business rules)
 *
 * Setup (see finance/README.md for the full guide):
 *   1. Create a new Google Sheet "KNPL-7 Finance Ledger" in the KNPL account.
 *   2. Extensions ▸ Apps Script ▸ add the two files.
 *   3. Project Settings ▸ Script properties:
 *        TEAMDESK_PIN    <the Team Desk Finance PIN>        (to read franchise payments)
 *        TEAMDESK_API    <optional – Team Desk web app URL; defaults to the one below>
 *   4. Run setup() once and read the ACCESS CODES of the 5 profiles in the execution log.
 *   5. Deploy ▸ New deployment ▸ Web app · Execute as: Me · Who has access: Anyone.
 *   6. Put the web app URL in finance/config.js (API_URL).
 */

var TEAMDESK_API_DEFAULT = 'https://script.google.com/macros/s/AKfycbxX7MQ9VkfZo7USkdxQzldaOVKIkE8hFiwe-xZsJl_ynAKcGBu8wRX6OmwMBTb22ARg/exec';
var FILE_FOLDER = 'KNPL-7 Finance Desk – Bills & Proofs';

/* ============================== web endpoint ============================== */
function doGet() {
  return json_({ ok: true, result: { service: 'KNPL-7 Finance Desk', version: FinCore.VERSION } });
}

function doPost(e) {
  var body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Bad request.' }); }
  var fn = String(body.fn || ''), args = Array.isArray(body.args) ? body.args : [];
  if (fn === 'ping') return json_({ ok: true, result: FinCore.handle(null, ctx_(), 'ping', []) });
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); }
  catch (err) { return json_({ ok: false, error: 'The Finance Desk is busy. Please try again in a few seconds.' }); }
  try {
    var store = new SheetStore_(), ctx = ctx_(), result;
    if (fn === 'sourceColumns') result = sourceColumns_(store, ctx, args);
    else result = FinCore.handle(store, ctx, fn, args);
    return json_({ ok: true, result: result });
  } catch (err) {
    var msg = err && err.user ? err.message : 'Server error: ' + (err && err.message ? err.message : err);
    if (!(err && err.user)) console.error(fn, err && err.stack ? err.stack : err);
    return json_({ ok: false, error: msg, code: err && err.code ? err.code : '' });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ============================== one-time setup ============================ */
function setup() {
  var store = new SheetStore_();
  Object.keys(FinCore.FIELDS).forEach(function (t) { store.sheet_(t); });
  var r = FinCore.ensureSetup(store, ctx_(), {});
  var def = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && SpreadsheetApp.getActiveSpreadsheet().getSheets().length > 1) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(def);
  folder_();
  logCodes_(r.profiles);
  if (r.heads) console.log(r.heads + ' default budget heads created – review the amounts in the Budget tab.');
}

/** Creates any missing access profile and issues codes to profiles that have none (safe to run again). */
function issueProfileCodes() { logCodes_(FinCore.ensureProfiles(new SheetStore_(), ctx_())); }

/** KNPL-7 duty split: Admin (Krishnadas M N) · Franchise fees (Unnikrishnan S) · Finance = other income + expense approval
 *  + payments & bank (Vineeth Kannath) · Expense creation (any committee member) · Viewer / Auditor. Switches off any other
 *  profile and logs the code of every newly created profile. Safe to run again. */
function applyDuties() {
  var r = FinCore.applyDuties(new SheetStore_(), ctx_());
  if (r.switchedOff.length) console.log('Switched off (old codes no longer work): ' + r.switchedOff.join(', '));
  logCodes_(r.created);
}

/** Emergency: new code for the Admin profile (the old Admin code stops working at once). */
function newAdminCode() {
  console.log('New ADMIN access code: ' + FinCore.issueCode(new SheetStore_(), ctx_(), 'ADMIN'));
  CacheService.getScriptCache().remove('fail:codes');
}

function logCodes_(list) {
  if (!list || !list.length) { console.log('Every profile already has an access code. Use "New code" in Settings ▸ Access profiles to replace one.'); return; }
  console.log('ACCESS CODES – share each only with the people who do that work:\n' + list.map(function (x) { return '  ' + x.profile + ': ' + x.code; }).join('\n'));
}

/* ============================== context =================================== */
function ctx_() {
  var cache = CacheService.getScriptCache();
  return {
    now: new Date(),
    cache: { get: function (k) { return cache.get(k); }, put: function (k, v, s) { cache.put(k, String(v), Math.min(21600, s || 600)); }, remove: function (k) { cache.remove(k); } },
    uuid: function () { return Utilities.getUuid(); },
    saveFile: saveFile_,
    fetchSources: fetchSources_
  };
}

/* ============================== sheet store =============================== */
function SheetStore_() { this.ss = SpreadsheetApp.getActiveSpreadsheet(); }
SheetStore_.prototype.sheet_ = function (name) {
  var sh = this.ss.getSheetByName(name), fields = FinCore.FIELDS[name].map(function (f) { return f.name; });
  if (!sh) {
    sh = this.ss.insertSheet(name);
    sh.getRange(1, 1, 1, fields.length).setValues([fields]).setFontWeight('bold').setBackground('#0b1a38').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), fields.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, fields.length).setNumberFormat('General');
  } else {
    var have = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
    var missing = fields.filter(function (f) { return have.indexOf(f) < 0; });
    if (missing.length) sh.getRange(1, have.filter(String).length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
  return sh;
};
SheetStore_.prototype.get = function (name) {
  var sh = this.sheet_(name), last = sh.getLastRow(), width = sh.getLastColumn();
  if (last < 2) return [];
  var vals = sh.getRange(1, 1, last, width).getValues(), head = vals[0].map(String), out = [];
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i], o = {}, any = false;
    for (var j = 0; j < head.length; j++) { if (!head[j]) continue; var v = r[j]; if (v instanceof Date) v = Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd'); o[head[j]] = v; if (v !== '' && v != null) any = true; }
    if (any) out.push(o);
  }
  return out;
};
SheetStore_.prototype.put = function (name, rows) {
  var sh = this.sheet_(name), width = sh.getLastColumn(), head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  var types = {}; FinCore.FIELDS[name].forEach(function (f) { types[f.name] = f.type; });
  var data = rows.map(function (r) {
    return head.map(function (h) {
      var v = r[h], t = types[h];
      if (v == null) return '';
      if (t === 'j') return JSON.stringify(v);
      if (t === 'b') return v ? 'TRUE' : 'FALSE';
      return String(v);
    });
  });
  var old = sh.getLastRow();
  if (data.length) { var rg = sh.getRange(2, 1, data.length, width); rg.setNumberFormat('@'); rg.setValues(data); }
  if (old > data.length + 1) sh.getRange(data.length + 2, 1, old - data.length - 1, width).clearContent();
};

/* ============================== files ===================================== */
function folder_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('FILE_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder(FILE_FOLDER);
  props.setProperty('FILE_FOLDER_ID', f.getId());
  return f;
}
function saveFile_(file, label) {
  var bytes = Utilities.base64Decode(file.data);
  var stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd-HHmmss');
  var name = stamp + ' ' + String(label || 'file').replace(/[^\w \-]/g, '') + ' – ' + String(file.name || 'upload').replace(/[\\\/:*?"<>|]/g, '_').slice(0, 80);
  var f = folder_().createFile(Utilities.newBlob(bytes, file.mime, name));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/file/d/' + f.getId() + '/view';
}

/* ============================== income sources ============================ */
function fetchSources_(settings) {
  var out = [], errors = [];
  (settings.sources || []).forEach(function (s) {
    if (!s.enabled) return;
    try {
      if (s.type === 'teamdesk') out = out.concat(teamDesk_(s, errors));
      else if (s.type === 'sheet') out = out.concat(sheetSource_(s, errors));
    } catch (e) { errors.push(s.label + ': ' + (e && e.message ? e.message : e)); }
  });
  out.errors = errors;
  return out;
}

function teamDesk_(s, errors) {
  var props = PropertiesService.getScriptProperties(), pin = props.getProperty('TEAMDESK_PIN'), url = props.getProperty('TEAMDESK_API') || TEAMDESK_API_DEFAULT;
  if (!pin) { errors.push('Team Desk: set the script property TEAMDESK_PIN (the Finance PIN of the Team Desk).'); return []; }
  var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain;charset=utf-8', payload: JSON.stringify({ fn: 'teamDeskAdmin', args: [pin] }), muteHttpExceptions: true, followRedirects: true });
  var j = JSON.parse(res.getContentText() || '{}');
  if (!j.ok) { errors.push('Team Desk: ' + String(j.error || 'request failed').split('\n')[0]); return []; }
  var map = s.map || {}, rows = [];
  (j.result.payments || []).forEach(function (p) {
    if (p.type === 'REPL') return;                                   // replacement requests carry no money
    var grp = String(p.type || '').replace(/\d+$/, '');              // CD1..CD5 → CD, OWN1 → OWN, DR1/DR2 → DR, JER
    var head = map[grp];
    if (!head) { errors.push('Team Desk: no head mapped for payment type ' + p.type + ' (' + p.id + ')'); return; }
    var st = String(p.status || '').toUpperCase();
    rows.push({
      source: 'TEAMDESK', sourceRef: 'TD:' + p.id, head: head, party: title_(p.team), team: title_(p.team), description: p.kind || p.type,
      amount: Number(p.amount) || 0, mode: modeOf_(p.mode), utr: p.utr || '', paidOn: String(p.paidOn || '').slice(0, 10), proof: p.proof || '',
      srcStatus: st === 'APPROVED' ? 'APPROVED' : st === 'REJECTED' ? 'REJECTED' : 'PENDING', srcReceipt: p.receiptNo || '', trust: !!s.trust, approver: 'Team Desk (Finance)'
    });
  });
  return rows;
}

function sheetSource_(s, errors) {
  if (!s.sheetId) { errors.push(s.label + ': Google Sheet ID is not set.'); return []; }
  var ss = SpreadsheetApp.openById(s.sheetId), sh = s.tab ? ss.getSheetByName(s.tab) : ss.getSheets()[0];
  if (!sh) { errors.push(s.label + ': tab "' + s.tab + '" not found.'); return []; }
  var vals = sh.getDataRange().getValues(); if (vals.length < 2) return [];
  var head = vals[0].map(function (h) { return String(h).trim().toLowerCase(); }), cols = s.cols || {}, ix = {};
  Object.keys(cols).forEach(function (k) { if (cols[k]) { var i = head.indexOf(String(cols[k]).trim().toLowerCase()); if (i < 0) errors.push(s.label + ': column "' + cols[k] + '" not found.'); ix[k] = i; } });
  if (!(ix.key >= 0) || !(ix.party >= 0)) { errors.push(s.label + ': set the Unique ID and Name columns.'); return []; }
  if (!(s.fixedAmount > 0) && !(ix.amount >= 0)) { errors.push(s.label + ': set the Amount column or a fixed amount.'); return []; }
  var okVals = String(s.approved || '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(String);
  var noVals = String(s.rejected || '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(String);
  var amtIsTotal = ix.amount >= 0 && /total/i.test(head[ix.amount]);
  var by = {}, order = [];
  function cell(r, k) { var i = ix[k]; if (!(i >= 0)) return ''; var v = r[i]; return v instanceof Date ? Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd') : v; }
  for (var n = 1; n < vals.length; n++) {
    var r = vals[n], key = String(cell(r, 'key')).trim(); if (!key) continue;
    var stRaw = String(cell(r, 'status')).trim().toLowerCase();
    var st = !(ix.status >= 0) ? 'APPROVED' : okVals.indexOf(stRaw) >= 0 ? 'APPROVED' : noVals.indexOf(stRaw) >= 0 ? 'REJECTED' : 'PENDING';
    var amount = s.fixedAmount > 0 ? Number(s.fixedAmount) : FinCore.parseAmount(cell(r, 'amount')) || 0;
    var rec = by[key];
    if (rec && s.group) {
      var d = String(cell(r, 'desc') || '').trim(); if (d && rec.description.split(' + ').indexOf(d) < 0) rec.description += ' + ' + d;
      if (!amtIsTotal && !(s.fixedAmount > 0)) rec.amount += amount;
      if (st === 'REJECTED') rec.srcStatus = 'REJECTED'; else if (st === 'PENDING' && rec.srcStatus === 'APPROVED') rec.srcStatus = 'PENDING';
      continue;
    }
    if (rec) { errors.push(s.label + ': ID ' + key + ' appears more than once (turn on "combine rows" if that is expected).'); continue; }
    var dt = cell(r, 'date');
    by[key] = rec = {
      source: s.id, sourceRef: s.id + ':' + key, head: s.head, party: String(cell(r, 'party') || '').trim(), team: title_(cell(r, 'team')), description: String(cell(r, 'desc') || '').trim(),
      amount: amount, mode: modeOf_(cell(r, 'mode')), utr: String(cell(r, 'utr') || '').trim(), paidOn: FinCore.parseDateAny(dt), proof: String(cell(r, 'proof') || '').trim(),
      srcStatus: st, srcReceipt: s.id === 'SPONSOR' ? key : '', trust: !!s.trust, approver: s.label
    };
    order.push(key);
  }
  return order.map(function (k) { return by[k]; });
}

/** Admin helper for Settings ▸ "Show the sheet columns". */
function sourceColumns_(store, ctx, args) {
  var me = FinCore.handle(store, ctx, 'boot', [args[0]]).me;
  if (me.role !== 'ADMIN') { var e = new Error('Only an Admin can read source sheets.'); e.user = true; throw e; }
  var ss;
  try { ss = SpreadsheetApp.openById(String(args[1] || '')); }
  catch (err) { var e2 = new Error('The sheet could not be opened. Check the ID and that this Google account can open it.'); e2.user = true; throw e2; }
  var sh = args[2] ? ss.getSheetByName(String(args[2])) : ss.getSheets()[0];
  if (!sh) { var e3 = new Error('Tab "' + args[2] + '" not found.'); e3.user = true; throw e3; }
  var w = Math.max(1, sh.getLastColumn());
  return { tab: sh.getName(), headers: sh.getRange(1, 1, 1, w).getValues()[0].map(String).filter(String), tabs: ss.getSheets().map(function (x) { return x.getName(); }) };
}

function title_(t) { return String(t || '').toLowerCase().replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }).replace(/\bOf\b/g, 'of').trim(); }
function modeOf_(m) {
  var s = String(m || '').toLowerCase();
  if (/upi|gpay|google|phonepe|paytm|bhim/.test(s)) return 'UPI';
  if (/neft/.test(s)) return 'NEFT'; if (/imps/.test(s)) return 'IMPS'; if (/rtgs/.test(s)) return 'RTGS';
  if (/cheque|check|chq|dd/.test(s)) return 'Cheque'; if (/cash/.test(s)) return 'Cash';
  if (/bank|transfer|net\s*banking/.test(s)) return 'NEFT';
  return s ? 'UPI' : '';
}
