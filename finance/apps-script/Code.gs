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
 *        TEAMDESK_ADMIN_PIN <optional – the Team Desk admin PIN>   (to move sponsorship credit between teams from here)
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
  var store = new SheetStore_(), ctx = ctx_();
  /* Speed: requests that only read (or wait on another system) never take the script lock, and the slow outside
     reads of "Fetch new entries" happen before the lock is taken, so nobody else is held up while they run. */
  try {
    if (LOCKFREE_[fn]) return json_({ ok: true, result: FinCore.handle(store, ctx, fn, args) }, body.c === 1);
    if (fn === 'syncSources') { var early = syncPrepare_(store, ctx, args); if (early) return json_({ ok: true, result: early }, body.c === 1); }
  } catch (err0) { return fail_(fn, err0); }
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); }
  catch (err) { return json_({ ok: false, error: 'The Finance Desk is busy. Please try again in a few seconds.' }); }
  try {
    ctx.now = new Date();
    var result;
    if (fn === 'sourceColumns') result = sourceColumns_(store, ctx, args);
    else result = FinCore.handle(store, ctx, fn, args);
    return json_({ ok: true, result: result }, body.c === 1);
  } catch (err) {
    return fail_(fn, err);
  } finally {
    lock.releaseLock();
  }
}

var LOCKFREE_ = { regList: 1, teamDeskInfo: 1, jerseyList: 1, jerseyFinals: 1 };
var SYNC_GAP_MS_ = 120000;   // automatic "fetch new entries" from open pages runs at most once in 2 minutes; the Fetch button always runs

function fail_(fn, err) {
  var msg = err && err.user ? err.message : 'Server error: ' + (err && err.message ? err.message : err);
  if (!(err && err.user)) console.error(fn, err && err.stack ? err.stack : err);
  return json_({ ok: false, error: msg, code: err && err.code ? err.code : '' });
}

/** Before the lock: checks the sign-in, skips an automatic fetch that ran a moment ago, and otherwise reads the outside sources now. */
function syncPrepare_(store, ctx, args) {
  var token = String(args[0] || ''), manual = args[1] === 'manual';
  FinCore.requireSync(store, ctx, token);
  var cache = CacheService.getScriptCache(), last = Number(cache.get('syncAt') || 0), now = Date.now();
  if (!manual && now - last < SYNC_GAP_MS_) {
    return { result: { read: 0, added: 0, updated: 0, autoApproved: 0, skipped: 0, warnings: [], throttled: true }, data: FinCore.handle(store, ctx, 'boot', [token]) };
  }
  cache.put('syncAt', String(now), 600);
  var recs = fetchSources_(FinCore.settingsOf(store));
  ctx.fetchSources = function () { return recs; };
  return null;
}

function json_(o, compact) { return ContentService.createTextOutput(JSON.stringify(compact ? { ok: o.ok, result: compact_(o.result) } : o)).setMimeType(ContentService.MimeType.JSON); }

/** Speed: lists of records that share the same fields are sent as one field list plus value rows (the page rebuilds them), about half the size. */
function compact_(v) {
  if (Array.isArray(v)) {
    if (v.length > 1 && v.every(function (x) { return x && typeof x === 'object' && !Array.isArray(x); })) {
      var keys = Object.keys(v[0]), k0 = keys.join('\u0001');
      if (v.every(function (x) { return Object.keys(x).join('\u0001') === k0; })) return { '\u0001k': keys, '\u0001r': v.map(function (x) { return keys.map(function (k) { return compact_(x[k]); }); }) };
    }
    return v.map(compact_);
  }
  if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = compact_(v[k]); }); return o; }
  return v;
}

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

/* ===================== sheet menu: generate access codes ===================== */
/** Adds the "KNPL Finance" menu to the Finance Ledger sheet (reload the sheet once to see it). */
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('KNPL Finance')
      .addItem('Generate access code for a profile…', 'generateAccessCode')
      .addItem('Generate codes for profiles that have none', 'generateMissingCodes')
      .addToUi();
  } catch (e) {}
}

/** Pick a profile, confirm, and a new access code is shown once on screen. The old code of that profile stops at once. */
function generateAccessCode() {
  var ui = SpreadsheetApp.getUi(), store = new SheetStore_();
  var users = store.get('Users').filter(function (u) { return String(u.active).toUpperCase() !== 'FALSE' && u.active !== false; });
  if (!users.length) { ui.alert('KNPL Finance', 'No access profiles found. Run setup() first.', ui.ButtonSet.OK); return; }
  var pick = ui.prompt('Generate access code', 'Type the number of the profile:\n\n' + users.map(function (u, i) { return (i + 1) + '.  ' + u.name; }).join('\n'), ui.ButtonSet.OK_CANCEL);
  if (pick.getSelectedButton() !== ui.Button.OK) return;
  var n = parseInt(String(pick.getResponseText()).trim(), 10), u = users[n - 1];
  if (!u) { ui.alert('KNPL Finance', 'That number is not in the list. Nothing was changed.', ui.ButtonSet.OK); return; }
  var ok = ui.alert('Replace the code of "' + u.name + '"?', 'A new code will be made. The old code of this profile stops working at once and anyone signed in with it is signed out.', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  var code = FinCore.issueCode(store, ctx_(), u.id);
  CacheService.getScriptCache().remove('fail:codes');
  ui.alert('New access code – ' + u.name, code + '\n\nCopy it now and share it only with the people who do this work. It is not stored anywhere readable; if it is lost, generate a new one.', ui.ButtonSet.OK);
}

/** Makes a code for every active profile that has none yet and shows them once. */
function generateMissingCodes() {
  var ui = SpreadsheetApp.getUi(), list = FinCore.ensureProfiles(new SheetStore_(), ctx_());
  if (!list || !list.length) { ui.alert('KNPL Finance', 'Every profile already has an access code. Use "Generate access code for a profile…" to replace one.', ui.ButtonSet.OK); return; }
  ui.alert('New access codes', list.map(function (x) { return x.profile + ':  ' + x.code; }).join('\n') + '\n\nCopy them now – they are not stored anywhere readable.', ui.ButtonSet.OK);
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
    fetchSources: fetchSources_,
    teamDeskDecide: teamDeskDecide_,
    sponsorDecide: sponsorDecide_,
    regList: regList_,
    teamDesk: function (fn, args, admin) { return teamDeskCall_(fn, args, admin); },
    jersey: function (fn, args) { return jerseyCall_(fn, args); },
    teamDeskAdminPin: !!PropertiesService.getScriptProperties().getProperty('TEAMDESK_ADMIN_PIN')
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
/* Speed: one read per sheet (the header comes with the data), and a save writes only the rows that changed. */
/* Speed: each table is also kept in the script cache (refreshed on every save, dropped when someone edits the sheet by hand). */
var TCACHE_TTL_ = 7200, TCACHE_CHUNK_ = 30000;
function tcacheGet_(name) {
  try {
    var c = CacheService.getScriptCache(), n = Number(c.get('T:' + name + ':n') || 0);
    if (!n) return null;
    var keys = []; for (var i = 0; i < n; i++) keys.push('T:' + name + ':' + i);
    var got = c.getAll(keys), txt = '';
    for (var j = 0; j < n; j++) { if (got[keys[j]] == null) return null; txt += got[keys[j]]; }
    return JSON.parse(txt);
  } catch (e) { return null; }
}
function tcachePut_(name, head, rows) {
  try {
    var c = CacheService.getScriptCache(), txt = JSON.stringify({ head: head, rows: rows }), n = Math.ceil(txt.length / TCACHE_CHUNK_), o = {};
    c.remove('T:' + name + ':n');
    for (var i = 0; i < n; i++) o['T:' + name + ':' + i] = txt.substr(i * TCACHE_CHUNK_, TCACHE_CHUNK_);
    o['T:' + name + ':n'] = String(n);
    c.putAll(o, TCACHE_TTL_);
  } catch (e) { try { CacheService.getScriptCache().remove('T:' + name + ':n'); } catch (e2) {} }
}
/** Simple trigger: a hand edit in the Finance sheet drops that table from the cache so the page shows it straight away. */
function onEdit(e) { try { CacheService.getScriptCache().remove('T:' + e.range.getSheet().getName() + ':n'); } catch (x) {} }

SheetStore_.prototype.get = function (name) {
  var cached = tcacheGet_(name);
  if (cached) {
    this.snap = this.snap || {};
    this.snap[name] = { head: cached.head, rows: cached.rows };
    return cached.rows.map(function (r) { var o = {}, any = false; for (var j = 0; j < cached.head.length; j++) { if (!cached.head[j]) continue; var v = r[j]; o[cached.head[j]] = v; if (v !== '') any = true; } return any ? o : null; }).filter(Boolean);
  }
  var sh = this.ss.getSheetByName(name);
  if (!sh) sh = this.sheet_(name);
  var vals = sh.getDataRange().getValues();
  var fields = FinCore.FIELDS[name].map(function (f) { return f.name; });
  var head0 = (vals[0] || []).map(String);
  if (head0.filter(String).length === 0 || fields.some(function (f) { return head0.indexOf(f) < 0; })) { this.sheet_(name); vals = sh.getDataRange().getValues(); }
  this.snap = this.snap || {};
  this.snap[name] = { head: vals[0].map(String), rows: vals.slice(1).map(function (r) { return r.map(function (v) { return v instanceof Date ? '\u0000d' : String(v); }); }) };
  tcachePut_(name, this.snap[name].head, vals.slice(1).map(function (r) { return r.map(function (v) { return v instanceof Date ? Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd') : String(v); }); }));
  if (vals.length < 2) return [];
  var head = vals[0].map(String), out = [];
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i], o = {}, any = false;
    for (var j = 0; j < head.length; j++) { if (!head[j]) continue; var v = r[j]; if (v instanceof Date) v = Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd'); o[head[j]] = v; if (v !== '' && v != null) any = true; }
    if (any) out.push(o);
  }
  return out;
};
SheetStore_.prototype.put = function (name, rows) {
  var sh = this.ss.getSheetByName(name) || this.sheet_(name), snap = this.snap && this.snap[name], width, head;
  if (snap) { head = snap.head; width = head.length; }
  else { width = sh.getLastColumn(); head = sh.getRange(1, 1, 1, width).getValues()[0].map(String); }
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
  var prev = snap ? snap.rows : null, old = prev ? prev.length + 1 : sh.getLastRow();
  var runs = [];
  if (prev) {                                              // rows that differ from what was read (or are new), as runs of neighbouring rows
    for (var i = 0; i < data.length; i++) {
      var same = i < prev.length && prev[i].length === width;
      for (var j = 0; same && j < width; j++) if (prev[i][j] !== data[i][j]) same = false;
      if (same) continue;
      if (runs.length && runs[runs.length - 1][1] === i) runs[runs.length - 1][1] = i + 1; else runs.push([i, i + 1]);
    }
  }
  if (!prev || runs.length > 8) { if (data.length) { var rg = sh.getRange(2, 1, data.length, width); rg.setNumberFormat('@'); rg.setValues(data); } }
  else runs.forEach(function (r) { var rg = sh.getRange(r[0] + 2, 1, r[1] - r[0], width); rg.setNumberFormat('@'); rg.setValues(data.slice(r[0], r[1])); });
  if (old > data.length + 1) sh.getRange(data.length + 2, 1, old - data.length - 1, width).clearContent();
  if (snap) snap.rows = data;
  tcachePut_(name, head, data);
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
      else if (s.type === 'registration') out = out.concat(regSource_(s));
      else if (s.type === 'sheet' && s.id !== 'SPONSOR') out = out.concat(sheetSource_(s, errors));   // SPONSOR: now read below
    } catch (e) { errors.push(s.label + ': ' + (e && e.message ? e.message : e)); }
  });
  (settings.sponsorCats || []).forEach(function (c) {
    if (!c.enabled || !c.sheetId) return;
    try { out = out.concat(sponsorSource_(c)); } catch (e) { errors.push(c.cat + ' register: ' + (e && e.message ? e.message : e)); }
  });
  out.errors = errors;
  return out;
}

/* admin = true: use TEAMDESK_ADMIN_PIN (the Team Desk committee admin PIN) when it is set – needed for sponsorship credit moves. */
function teamDeskCall_(fn, args, admin) {
  var props = PropertiesService.getScriptProperties(), url = props.getProperty('TEAMDESK_API') || TEAMDESK_API_DEFAULT;
  var pin = (admin && props.getProperty('TEAMDESK_ADMIN_PIN')) || props.getProperty('TEAMDESK_PIN');
  if (!pin) { var e0 = new Error('Team Desk: set the script property TEAMDESK_PIN (the Finance PIN of the Team Desk).'); e0.user = true; throw e0; }
  var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain;charset=utf-8', payload: JSON.stringify({ fn: fn, args: [pin].concat(args || []) }), muteHttpExceptions: true, followRedirects: true });
  var j; try { j = JSON.parse(res.getContentText() || '{}'); } catch (err) { j = { ok: false, error: 'unexpected reply' }; }
  if (!j.ok) { var e = new Error('Team Desk: ' + String(j.error || 'request failed').split('\n')[0]); e.user = true; throw e; }
  return j.result;
}
/** Jersey designs (Admin tab): calls the Team Desk jersey admin functions with the script property JERSEY_ADMIN_PIN (the PIN of the Jersey Admin page, e.g. JA7-XXXX-XXXX). */
function jerseyCall_(fn, args) {
  var props = PropertiesService.getScriptProperties(), url = props.getProperty('TEAMDESK_API') || TEAMDESK_API_DEFAULT, pin = props.getProperty('JERSEY_ADMIN_PIN');
  if (!pin) { var e0 = new Error('Jersey: set the script property JERSEY_ADMIN_PIN (the Jersey Admin page PIN).'); e0.user = true; throw e0; }
  var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain;charset=utf-8', payload: JSON.stringify({ fn: fn, args: [pin].concat(args || []) }), muteHttpExceptions: true, followRedirects: true });
  var j; try { j = JSON.parse(res.getContentText() || '{}'); } catch (err) { j = { ok: false, error: 'unexpected reply' }; }
  if (!j.ok) { var e = new Error('Jersey: ' + String(j.error || 'request failed').split('\n')[0]); e.user = true; throw e; }
  return j.result;
}
/** Writes an approve / reject decision to the Team Desk (same as the Approve / Reject buttons there) and returns the payment's new state. */
/** Run from the editor: shows what the Finance Desk can reach on the Team Desk with the PIN(s) set. */
function checkTeamDesk() {
  var a = teamDeskCall_('teamDeskAdmin', []);
  console.log('TEAMDESK_PIN → Team Desk role: ' + a.role + ' · teams ' + (a.teams || []).length + ' · payments ' + (a.payments || []).length + ' · jersey fees ' + Object.keys(a.fees || {}).length + ' · credit moves ' + (a.splits ? a.splits.length : 'not shown'));
  if (PropertiesService.getScriptProperties().getProperty('TEAMDESK_ADMIN_PIN')) { var b = teamDeskCall_('teamDeskAdmin', [], true); console.log('TEAMDESK_ADMIN_PIN → Team Desk role: ' + b.role); }
  else console.log('TEAMDESK_ADMIN_PIN is not set (needed only if the Team Desk allows credit moves to its admin alone).');
}
function teamDeskDecide_(paymentId, dec, remarks) {
  var d = teamDeskCall_('teamDeskAdminDecide', [paymentId, dec, remarks || '']);
  var p = ((d && d.payments) || []).filter(function (x) { return String(x.id) === String(paymentId); })[0];
  if (!p) { var e = new Error('Team Desk: payment ' + paymentId + ' not found after the decision.'); e.user = true; throw e; }
  return { status: p.status, receiptNo: p.receiptNo || '', remarks: p.remarks || '' };
}
function teamDesk_(s, errors) {
  var result;
  try { result = teamDeskCall_('teamDeskAdmin', []); } catch (e) { errors.push(e.message); return []; }
  var j = { result: result };
  var owners = {}; (result.teams || []).forEach(function (t) { owners[t.team] = t.owner || {}; });
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
      srcStatus: st === 'APPROVED' ? 'APPROVED' : st === 'REJECTED' ? 'REJECTED' : 'PENDING', srcReceipt: p.receiptNo || '', trust: !!s.trust, approver: 'Team Desk (Finance)',
      srcType: p.type || '', contactName: (owners[p.team] || {}).name || '', contactPhone: String((owners[p.team] || {}).wa || '').replace(/\D/g, '')
    });
  });
  return rows;
}

/* ======================= player registration fee ======================= */
var REG_DEFAULT_ = { sheetId: '1yLTJPg-2sh2xjuF8jVH6imyHxF99tVRmd8RvdStvZpw', tab: 'Registrations', fixedAmount: 1000 };
function regRows_(s) {
  var sh = SpreadsheetApp.openById(s.sheetId || REG_DEFAULT_.sheetId).getSheetByName(s.tab || REG_DEFAULT_.tab);
  if (!sh) { var e = new Error('Registration sheet: tab "' + (s.tab || REG_DEFAULT_.tab) + '" not found.'); e.user = true; throw e; }
  var vals = sh.getDataRange().getValues(), head = vals[0].map(function (x) { return String(x).trim(); });
  function col(n) { return head.indexOf(n); }
  var ix = { ts: col('Timestamp'), id: col('Reg ID'), name: col('Player Name'), wa: col('WhatsApp'), feeR: col('Fee Receipt'), feeV: col('Fee Verified'), code: col('Code Type'), owner: col('Owner Franchise'),
    joinedOn: col('Auction Joined On'), joined: col('Auction Joined'), pool: col('Pool'), cat: col('Category'), status: col('Status') };
  if (ix.id < 0 || ix.name < 0) { var e2 = new Error('Registration sheet: "Reg ID" / "Player Name" columns not found.'); e2.user = true; throw e2; }
  function v(r, k) { var i = ix[k]; if (i < 0) return ''; var x = r[i]; return x instanceof Date ? Utilities.formatDate(x, 'Asia/Kolkata', 'yyyy-MM-dd') : String(x == null ? '' : x).trim(); }
  var out = [];
  for (var n = 1; n < vals.length; n++) {
    var r = vals[n], id = v(r, 'id'); if (!id) continue;
    var owner = v(r, 'code').toUpperCase() === 'OWNER' || /waived/i.test(v(r, 'feeR'));
    out.push({ id: id, name: v(r, 'name'), wa: v(r, 'wa').replace(/\D/g, '').slice(-10), receipt: /^https?:/.test(v(r, 'feeR')) ? v(r, 'feeR') : '', feeVerified: v(r, 'feeV'),
      owner: owner, ownerTeam: v(r, 'owner'), joinedOn: v(r, 'joinedOn'), phase2: v(r, 'status') === 'Approved' && v(r, 'joined').toUpperCase() === 'YES', regStatus: v(r, 'status'), date: v(r, 'joinedOn') || v(r, 'ts').slice(0, 10), pool: v(r, 'pool'), category: v(r, 'cat') });
  }
  return out;
}
function regSource_(s) {
  var fee = Number(s.fixedAmount) || REG_DEFAULT_.fixedAmount;
  return regRows_(s).filter(function (p) { return p.phase2 && !p.owner; }).map(function (p) {   // 16 owners exempted; rejected / not joined left out
    return { source: 'REG', sourceRef: 'REG:' + p.id, head: s.head || 'INC-REG', party: p.name, team: '', description: 'Player registration fee – ' + p.id,
      amount: fee, mode: 'UPI', utr: '', paidOn: FinCore.parseDateAny(p.date) || '', proof: p.receipt, srcStatus: 'APPROVED', srcReceipt: '', trust: true,
      approver: 'Registration committee (fee verified)', srcType: 'REG', contactName: p.name, contactPhone: p.wa,
      note: p.receipt ? '' : 'Fee receipt not uploaded – marked verified by the committee (27 Nov 2026)' };
  });
}
function regList_(s) { return regRows_(s).map(function (p) { return { id: p.id, name: p.name, owner: p.owner, phase2: p.phase2, regStatus: p.regStatus, ownerTeam: p.ownerTeam, receipt: !!p.receipt, pool: p.pool, category: p.category, date: p.date }; }); }

/** One-off (27 Nov 2026): Registration Fee budget = 232 paying players × ₹1,000; 16 owners exempted. Kept in the audit trail. */
function setRegistrationBudget() {
  var r = FinCore.runAsAdmin(new SheetStore_(), ctx_(), 'headSave', [{ code: 'INC-REG', name: 'Player Registration Fee', kind: 'INCOME', budget: 232000, note: '232 players × ₹1,000 (248 completed Phase 2; 16 franchise owners exempted)', active: true }]);
  console.log('Registration fee budget set to ₹2,32,000');
}

/* ======================= sponsorship registers (portal sheets) ======================= */
var SP_COLS_ = { ts: 'Timestamp', no: 'Receipt No', status: 'Status', code: 'Item Code', item: 'Sponsorship', qty: 'Qty', amount: 'Amount (Rs)', total: 'Receipt Total (Rs)',
  sponsor: 'Sponsor / Company Name', display: 'Name to Advertise', contact: 'Contact Person', mobile: 'Mobile', email: 'Email', team: 'Promoter Team', mode: 'Payment Mode',
  utr: 'Transaction Ref / UTR', payDate: 'Payment Date', proof: 'Payment Proof URL', logo: 'Logo URL', jersey: 'Jersey Team', at: 'Approved / Rejected At', by: 'Approved / Rejected By' };
function sponsorSheet_(c) {
  var ss; try { ss = SpreadsheetApp.openById(c.sheetId); } catch (e) { var e1 = new Error('cannot open the register sheet – share it with ' + Session.getEffectiveUser().getEmail() + ' as Editor.'); e1.user = true; throw e1; }
  var sh = ss.getSheetByName(c.tab || 'Sponsorships'); if (!sh) { var e2 = new Error('tab "' + (c.tab || 'Sponsorships') + '" not found in the register.'); e2.user = true; throw e2; }
  var vals = sh.getDataRange().getValues(), head = (vals[0] || []).map(function (x) { return String(x).trim(); }), ix = {};
  Object.keys(SP_COLS_).forEach(function (k) { ix[k] = head.indexOf(SP_COLS_[k]); });
  if (ix.no < 0 || ix.status < 0) { var e3 = new Error('the register has no "Receipt No" / "Status" columns.'); e3.user = true; throw e3; }
  return { sh: sh, vals: vals, ix: ix };
}
function sponsorRows_(c) {
  var S = sponsorSheet_(c), out = [];
  for (var n = 1; n < S.vals.length; n++) {
    var r = S.vals[n], o = { row: n + 1 };
    Object.keys(SP_COLS_).forEach(function (k) { var i = S.ix[k], v = i >= 0 ? r[i] : ''; o[k] = v instanceof Date ? Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd') : String(v == null ? '' : v).replace(/^'/, '').trim(); });
    if (o.no) out.push(o);
  }
  return out;
}
function sponsorSource_(c) {
  var by = {}, order = [];
  sponsorRows_(c).forEach(function (o) {
    var st = o.status === 'Confirmed' ? 'APPROVED' : o.status === 'Rejected' ? 'REJECTED' : 'PENDING', line = o.item + (o.jersey ? ' – ' + o.jersey : '') + (Number(o.qty) > 1 ? ' × ' + o.qty : '');
    var rec = by[o.no];
    if (rec) { rec.description += ' + ' + line; if (st === 'REJECTED') rec.srcStatus = 'REJECTED'; else if (st === 'PENDING' && rec.srcStatus === 'APPROVED') rec.srcStatus = 'PENDING'; return; }
    var ph = String(o.mobile).replace(/\D/g, ''); if (ph.length > 10) ph = ph.slice(-10);
    by[o.no] = { source: c.id, sourceRef: c.id + ':' + o.no, head: 'INC-SPONS', party: o.display || o.sponsor, team: title_(o.team), description: c.cat + ': ' + line,
      amount: FinCore.parseAmount(o.total) || FinCore.parseAmount(o.amount) || 0, mode: modeOf_(o.mode), utr: o.utr, paidOn: FinCore.parseDateAny(o.payDate) || String(o.ts).slice(0, 10),
      proof: o.proof, srcStatus: st, srcReceipt: o.no, trust: false, approver: c.cat + ' register', srcType: c.code, contactName: o.contact, contactPhone: ph };
    order.push(o.no);
  });
  return order.map(function (k) { return by[k]; });
}
/** Writes Confirmed / Rejected for every row of one request (same as KNPL Admin ▸ Approve / Reject in the register). */
function sponsorDecide_(c, receiptNo, newStatus, byName) {
  var S = sponsorSheet_(c), ix = S.ix, rows = [];
  for (var n = 1; n < S.vals.length; n++) if (String(S.vals[n][ix.no]).trim() === String(receiptNo)) rows.push(n);
  if (!rows.length) { var e = new Error(receiptNo + ' is not in the ' + c.cat + ' register any more.'); e.user = true; throw e; }
  if (newStatus === 'Confirmed') rows.forEach(function (n) {
    var r = S.vals[n]; if (String(r[ix.status]) !== 'Rejected' || ix.code < 0) return;
    var clash = S.vals.some(function (x, j) { return j > 0 && j !== n && String(x[ix.no]) !== String(receiptNo) && x[ix.code] === r[ix.code] && String(x[ix.status]) !== 'Rejected' && ix.jersey >= 0 && String(x[ix.jersey]) && String(x[ix.jersey]) === String(r[ix.jersey]); });
    if (clash) { var e2 = new Error(receiptNo + ' was rejected earlier and its slot is now taken by another sponsor.'); e2.user = true; throw e2; }
  });
  var now = new Date();
  rows.forEach(function (n) {
    S.sh.getRange(n + 1, ix.status + 1).setValue(newStatus);
    if (ix.at >= 0) S.sh.getRange(n + 1, ix.at + 1).setValue(now);
    if (ix.by >= 0) S.sh.getRange(n + 1, ix.by + 1).setValue(byName + ' (Finance Desk)');
  });
  SpreadsheetApp.flush();
  return { status: newStatus };
}
/** Run from the editor: checks every sponsorship register set in Settings. */
function checkSponsorRegisters() {
  var cats = FinCore.DEFAULT_SETTINGS.sponsorCats;
  new SheetStore_().get('Settings').forEach(function (r) { if (r.key === 'sponsorCats' && r.value) { try { cats = typeof r.value === 'string' ? JSON.parse(r.value) : r.value; } catch (e) {} } });
  cats.forEach(function (c) {
    if (!c.sheetId) { console.log(c.cat + ': register sheet not set'); return; }
    try { var r = sponsorRows_(c); console.log(c.cat + ': ' + r.length + ' rows · ' + sponsorSource_(c).length + ' requests'); } catch (e) { console.log(c.cat + ': ' + e.message); }
  });
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
