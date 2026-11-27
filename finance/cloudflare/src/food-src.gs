/* KNPL-7 Food Arrangement: ground allotment. Plain JS so it can be pasted into Apps Script and run in the browser. */
var FOOD_MEALS = { B: { name: 'Breakfast', from: 0 }, L: { name: 'Lunch', from: 270 }, T: { name: 'Tea', from: 450 } }; // minutes after the 7:30 day start
var FOOD_WINDOW = 90;
/* matches: [{day,start,end,ground,a,b,status}] ; teams: [{id, w}] w = Yes count for this meal (0 = not eating) */
function foodAllot(matches, teams, day, meal) {
  var ws = FOOD_MEALS[meal].from, we = ws + FOOD_WINDOW, out = {}, tot = [0, 0], idle = [];
  teams.forEach(function (t) {
    if (!(t.w > 0)) return;
    var mine = matches.filter(function (m) { return m.day === day && (m.a === t.id || m.b === t.id); });
    if (!mine.length) { idle.push(t); return; }
    var over = mine.filter(function (m) { return m.start < we && m.end > ws; }).sort(function (x, y) { return x.start - y.start; })[0];
    if (over) { out[t.id] = { ground: over.ground, basis: 'match' }; tot[over.ground] += t.w; return; }
    var best = null, bd = 1e9;
    mine.forEach(function (m) {
      var d = m.end <= ws ? ws - m.end : m.start - we;
      if (d < bd || (d === bd && best && m.start > best.start)) { bd = d; best = m; }
    });
    out[t.id] = { ground: best.ground, basis: 'nearest' }; tot[best.ground] += t.w;
  });
  idle.sort(function (x, y) { return y.w - x.w || (x.id < y.id ? -1 : 1); }).forEach(function (t) {
    var g = tot[0] <= tot[1] ? 0 : 1; out[t.id] = { ground: g, basis: 'balance' }; tot[g] += t.w;
  });
  return { teams: out, totals: tot };
}
/* ============================================================================
   KNPL-7 FOOD ARRANGEMENT - backend (Google Apps Script web app)
   SETUP (once):
   1. Create a new Google Sheet "KNPL-7 Food". Extensions > Apps Script. Paste this whole file (replace Code.gs).
   2. Project Settings > Script properties: add  ADMIN_CODE (committee code),  PIN_0 (FISAT counter PIN),  PIN_1 (Boundary counter PIN).
      For a dry run before 5 Feb also add  OPEN_NOW = 1  (remove it afterwards).
   3. Run  setupTriggers  once (authorise). It creates the one-minute timer that generates the allotment at 7:30, 12:00 and 3:00.
   4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the /exec URL into team/food/config.js.
   ============================================================================ */
var FOOD = {
  FIXTURE_API: 'https://script.google.com/macros/s/AKfycbxvyXD362KXSxkqIzbbUaX2sFqxehrpQoWhw7K6THLVC5FuQzN_LoIdctAQsXJY6cr-yg/exec',
  FINANCE_API: 'https://knpl7-finance-api.sobhapremierleague2020.workers.dev',
  TEAMDESK_API: 'https://script.google.com/macros/s/AKfycbxX7MQ9VkfZo7USkdxQzldaOVKIkE8hFiwe-xZsJl_ynAKcGBu8wRX6OmwMBTb22ARg/exec',
  OPEN: '2027-02-05T00:00:00+05:30', CLOSE: '2027-02-09T18:30:00+05:30',
  NAMES: { B: 'Breakfast', L: 'Lunch', T: 'Tea' }
};
var SCHEMA = {
  Teams: ['teamId', 'teamName', 'code', 'consentBy', 'consentAt'],
  RSVP: ['teamId', 'playerKey', 'player', 'day', 'meal', 'yes', 'ts'],
  Audit: ['ts', 'who', 'action', 'detail'],
  YesAdj: ['teamId', 'day', 'meal', 'yes', 'by', 'ts'],
  Alloc: ['day', 'meal', 'teamId', 'ground', 'basis', 'yes', 'ts'],
  MealMeta: ['day', 'meal', 'totalYes', 'buffer', 'lockedAt', 'by'],
  Serve: ['id', 'ts', 'day', 'meal', 'counter', 'teamId', 'kind', 'qty', 'by', 'undone', 'test']
};
var SP = PropertiesService.getScriptProperties();

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function fail_(en, ml) { throw new Error(en + (ml ? '\n' + ml : '')); }
function doGet() { return out_({ ok: true, service: 'KNPL-7 food' }); }
function doPost(e) {
  MEMO_ = {};
  try {
    var b = JSON.parse(e.postData.contents), H = HANDLERS_[b.fn];
    if (!H) fail_('Unknown request.');
    return out_({ ok: true, result: H(b.args || {}) });
  } catch (err) { return out_({ ok: false, error: String((err && err.message) || err) }); }
}

/* ---------- sheet helpers ---------- */
function sh_(name) { var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(name); if (!s) { s = ss.insertSheet(name); s.appendRow(SCHEMA[name]); s.setFrozenRows(1); } return s; }
var MEMO_ = {};
function rows_(name) { if (MEMO_[name]) return MEMO_[name]; var v = sh_(name).getDataRange().getValues(), h = v[0], r = []; for (var i = 1; i < v.length; i++) { var o = { _row: i + 1 }; for (var j = 0; j < h.length; j++) o[h[j]] = v[i][j]; r.push(o); } return (MEMO_[name] = r); }
function add_(name, obj) { MEMO_ = {}; sh_(name).appendRow(SCHEMA[name].map(function (k) { return obj[k] === undefined ? '' : obj[k]; })); }
function setCell_(name, row, col, val) { MEMO_ = {}; sh_(name).getRange(row, SCHEMA[name].indexOf(col) + 1).setValue(val); }
function delRows_(name, rowNums) { MEMO_ = {}; var s = sh_(name); rowNums.sort(function (a, b) { return b - a; }).forEach(function (r) { s.deleteRow(r); }); }
function locked_(f) { var l = LockService.getScriptLock(); l.waitLock(20000); try { return f(); } finally { l.releaseLock(); } }
function iso_() { return new Date().toISOString(); }

/* ---------- tokens ---------- */
function tok_(kind, data) { var t = Utilities.getUuid(); data.kind = kind; CacheService.getScriptCache().put('t_' + t, JSON.stringify(data), 21600); return t; }
function auth_(t, kind) {
  var v = t && CacheService.getScriptCache().get('t_' + t);
  if (!v) fail_('Please log in again.', 'ദയവായി വീണ്ടും Login ചെയ്യുക.');
  var o = JSON.parse(v); if (o.kind !== kind) fail_('Not allowed.', 'അനുവാദമില്ല.'); o.token = t; return o;
}

/* ---------- time ---------- */
function toMs_(s) { return new Date(s).getTime(); }
function isOpen_() { return SP.getProperty('OPEN_NOW') === '1' || Date.now() >= toMs_(FOOD.OPEN); }
function isClosed_() { return SP.getProperty('CLOSE_NOW') === '1' || Date.now() > toMs_(FOOD.CLOSE); }
function hm_(s) { var p = String(s || '07:30').split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function mealStartMs_(fx, day, meal) {
  var m = hm_(fx.startTime) + FOOD_MEALS[meal].from, d = fx.dates[day];
  return toMs_(d + 'T' + ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2) + ':00+05:30');
}
function istDate_() { return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); }
function todayDay_(fx) { var t = istDate_(), r = 0; Object.keys(fx.dates).forEach(function (d) { if (fx.dates[d] === t) r = Number(d); }); return r; }
function currentMeal_(fx, day) {
  if (!day) return 'B'; var now = Date.now(), pick = 'B';
  ['B', 'L', 'T'].forEach(function (m) { if (now >= mealStartMs_(fx, day, m) - 30 * 60000) pick = m; });
  return pick;
}

/* ---------- fixture data (compact, cached 60 s) ---------- */
function fx_() {
  var c = CacheService.getScriptCache(), k = c.get('fx'); if (k) return JSON.parse(k);
  var r = UrlFetchApp.fetch(FOOD.FIXTURE_API, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'getPublic' }), muteHttpExceptions: true, followRedirects: true });
  var j = JSON.parse(r.getContentText());
  if (!j.ok || !j.state) fail_('The fixture is not available right now.', 'ഫിക്സ്ചർ ഇപ്പോൾ ലഭ്യമല്ല.');
  var st = j.state, s = st.settings || {}, dur = s.matchMinsDay || {};
  var d = {
    dates: s.dates || {}, startTime: s.startTime || '07:30', grounds: s.grounds || ['FISAT', 'Boundary Grounds'],
    teams: (st.teams || []).map(function (t) { return { id: t.id, name: t.name }; }),
    matches: (st.matches || []).map(function (m) { return { day: m.day, start: m.start, end: m.start + (dur[m.day] || s.matchMins || 85), ground: m.ground, a: m.a, b: m.b }; })
  };
  c.put('fx', JSON.stringify(d), 600); SP.setProperty('DATES', JSON.stringify(d.dates)); return d;
}
function nrm_(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, '').replace(/H/g, '').replace(/D/g, 'T'); }
function teamByName_(fx, name) { var n = nrm_(name), r = null; fx.teams.forEach(function (t) { if (!r && (nrm_(t.name) === n || nrm_(t.id) === n)) r = t; }); return r; }
function teamById_(fx, id) { var r = null; fx.teams.forEach(function (t) { if (t.id === id) r = t; }); return r; }

/* ---------- Yes counts, buffer, allotment ---------- */
function yes_() {
  var m = {}; rows_('RSVP').forEach(function (r) { if (Number(r.yes) === 1) { var k = r.teamId + '|' + r.day + '|' + r.meal; m[k] = (m[k] || 0) + 1; } });
  rows_('YesAdj').forEach(function (r) { m[r.teamId + '|' + r.day + '|' + r.meal] = Number(r.yes); });
  return m;
}
function ceil5_(n) { return Math.ceil(n / 5) * 5; }
/* Suggested BUFFER per counter, from the total Yes count of the meal (see the simulation): days 1-2 -> 5% (min 10); days 3-4 -> 12% (min 15) */
function bufferFor_(day, total) { return day <= 2 ? Math.max(10, ceil5_(total * 0.05)) : Math.max(15, ceil5_(total * 0.12)); }
function meta_(day, meal) { var r = null; rows_('MealMeta').forEach(function (x) { if (Number(x.day) === day && x.meal === meal) r = x; }); return r; }
function generate_(day, meal, by) {
  var fx = fx_(), y = yes_(), teams = fx.teams.map(function (t) { return { id: t.id, w: y[t.id + '|' + day + '|' + meal] || 0 }; }), total = 0;
  teams.forEach(function (t) { total += t.w; });
  var res = foodAllot(fx.matches, teams, day, meal);
  var old = rows_('Alloc').filter(function (r) { return Number(r.day) === day && r.meal === meal; }).map(function (r) { return r._row; });
  var om = rows_('MealMeta').filter(function (r) { return Number(r.day) === day && r.meal === meal; }).map(function (r) { return r._row; });
  var keepBuf = null; var mm = meta_(day, meal); if (mm && by === 'regenerate') keepBuf = mm.buffer;
  delRows_('Alloc', old); delRows_('MealMeta', om);
  Object.keys(res.teams).forEach(function (id) { add_('Alloc', { day: day, meal: meal, teamId: id, ground: res.teams[id].ground, basis: res.teams[id].basis, yes: y[id + '|' + day + '|' + meal] || 0, ts: iso_() }); });
  add_('MealMeta', { day: day, meal: meal, totalYes: total, buffer: keepBuf == null ? bufferFor_(day, total) : keepBuf, lockedAt: iso_(), by: by || 'timer' });
  return meta_(day, meal);
}
function ensure_(day, meal) {
  var fx = fx_(); if (!fx.dates[day]) return null;
  if (!meta_(day, meal) && Date.now() >= mealStartMs_(fx, day, meal)) locked_(function () { if (!meta_(day, meal)) generate_(day, meal, 'timer'); });
  return meta_(day, meal);
}
/* One-minute timer: at 7:30, 12:00 and 3:00 on the tournament days the allotment is generated and locked. */
function tick() {
  var d = SP.getProperty('DATES'), dates = d ? JSON.parse(d) : fx_().dates, t = istDate_(), today = 0;
  Object.keys(dates).forEach(function (k) { if (dates[k] === t) today = Number(k); });
  if (!today) return;
  ['B', 'L', 'T'].forEach(function (m) { ensure_(today, m); });
}
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'tick') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('tick').timeBased().everyMinutes(1).create();
}

/* ---------- owner (Team Desk) ---------- */
function ownerLogin_(a) {
  var code = String(a.code || '').trim(); if (!code) fail_('Enter your Team Desk code.', 'Team Desk കോഡ് നൽകുക.');
  var cc = CacheService.getScriptCache(), ck = 'tdl_' + code, nm = cc.get(ck), j;
  if (nm) j = { ok: true, result: { team: nm } };                     // a recognised Team Desk code is remembered for 6 hours (saves a slow call to the Team Desk)
  else {
    var r = UrlFetchApp.fetch(FOOD.TEAMDESK_API, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ fn: 'teamDeskLogin', args: [code] }), muteHttpExceptions: true, followRedirects: true });
    j = JSON.parse(r.getContentText()); if (!j.ok) fail_(j.error || 'Team code not recognised.');
    cc.put(ck, j.result.team, 21600);
  }
  var fx = fx_(), t = teamByName_(fx, j.result.team);
  if (!t) fail_('Your team is not in the fixture yet.', 'നിങ്ങളുടെ ടീം ഫിക്സ്ചറിൽ ഇതുവരെ ഇല്ല.');
  return { token: tok_('owner', { teamId: t.id, team: t.name }), team: t.name };
}
function teamRow_(id) { var r = null; rows_('Teams').forEach(function (x) { if (x.teamId === id) r = x; }); return r; }
function newCode_() { var used = {}; rows_('Teams').forEach(function (r) { used[String(r.code)] = 1; }); var c; do { c = String(10000 + Math.floor(Math.random() * 90000)); } while (used[c]); return c; }
function plan_(fx, teamId, y, test) {
  var sv = rows_('Serve').filter(function (r) { return !Number(r.undone) && !!Number(r.test) === !!test && r.teamId === teamId; }), al = rows_('Alloc'), metas = rows_('MealMeta'), out = [];
  [1, 2, 3, 4].forEach(function (d) { ['B', 'L', 'T'].forEach(function (m) {
    var a = al.filter(function (r) { return Number(r.day) === d && r.meal === m && r.teamId === teamId; })[0], mt = metas.filter(function (r) { return Number(r.day) === d && r.meal === m; })[0];
    var s = sv.filter(function (r) { return Number(r.day) === d && r.meal === m; }), ok = 0, bf = 0; s.forEach(function (r) { if (r.kind === 'A') ok += Number(r.qty); else bf += Number(r.qty); });
    out.push({ day: d, date: fx.dates[d] || '', meal: m, yes: (mt && a) ? Number(a.yes) : (y[teamId + '|' + d + '|' + m] || 0), locked: !!mt, ground: a ? fx.grounds[Number(a.ground)] : null, basis: a ? a.basis : null, served: ok, buffer: bf, startsAt: fx.dates[d] ? new Date(mealStartMs_(fx, d, m)).toISOString() : null });
  }); });
  return out;
}
function ownerState_(a) {
  var o = auth_(a.token, 'owner'), fx = fx_(), base = { team: o.team, open: isOpen_(), opens: FOOD.OPEN, closed: isClosed_(), closes: FOOD.CLOSE, grounds: fx.grounds };
  if (!base.open) return base;
  var tr = teamRow_(o.teamId); base.consent = tr && tr.consentBy ? { by: tr.consentBy, at: tr.consentAt } : null;
  if (!base.consent) return base;
  ['B', 'L', 'T'].forEach(function (m) { var d = todayDay_(fx); if (d) ensure_(d, m); });
  base.code = String(tr.code);
  base.plan = plan_(fx, o.teamId, yes_(), false);
  base.players = {};
  rows_('RSVP').filter(function (r) { return r.teamId === o.teamId; }).forEach(function (r) { var p = base.players[r.playerKey] || (base.players[r.playerKey] = { name: r.player, a: {} }); p.a[r.day + r.meal] = Number(r.yes); });
  base.players = Object.keys(base.players).map(function (k) { return base.players[k]; });
  return base;
}
function ownerConsent_(a) {
  var o = auth_(a.token, 'owner'); if (!isOpen_()) fail_('The Food Arrangement tab opens on 5 Feb 2027.', 'Food Arrangement ടാബ് 2027 ഫെബ്രുവരി 5-ന് തുറക്കും.');
  var name = String(a.name || '').trim(); if (name.length < 2) fail_('Enter the owner name to accept.', 'അംഗീകരിക്കാൻ ഉടമയുടെ പേര് നൽകുക.');
  return locked_(function () {
    var tr = teamRow_(o.teamId);
    if (!tr) add_('Teams', { teamId: o.teamId, teamName: o.team, code: newCode_(), consentBy: name, consentAt: iso_() });
    else if (!tr.consentBy) { setCell_('Teams', tr._row, 'consentBy', name); setCell_('Teams', tr._row, 'consentAt', iso_()); }
    return { ok: true };
  });
}

/* ---------- RSVP (public, by food code) ---------- */
function teamByCode_(code) { var c = String(code || '').trim(), r = null; rows_('Teams').forEach(function (x) { if (String(x.code) === c && x.consentBy) r = x; }); return r; }
function rsvpInfo_(a) {
  var t = teamByCode_(a.code); if (!t) fail_('This link is not valid. Please ask your team owner for the link.', 'ഈ ലിങ്ക് ശരിയല്ല. ടീം ഉടമയിൽ നിന്ന് ലിങ്ക് വാങ്ങുക.');
  var fx = fx_(); return { team: t.teamName, open: isOpen_(), closed: isClosed_(), closes: FOOD.CLOSE, days: [1, 2, 3, 4].map(function (d) { return { day: d, date: fx.dates[d] || '' }; }) };
}
function rsvpSubmit_(a) {
  var t = teamByCode_(a.code); if (!t) fail_('This link is not valid.', 'ഈ ലിങ്ക് ശരിയല്ല.');
  if (isClosed_()) fail_('The Yes/No window has closed. Please contact your team owner.', 'Yes/No സമയം അവസാനിച്ചു. ടീം ഉടമയെ ബന്ധപ്പെടുക.');
  if (!isOpen_()) fail_('The Yes/No window is not open yet.', 'Yes/No ഇതുവരെ തുറന്നിട്ടില്ല.');
  var name = String(a.name || '').trim().replace(/\s+/g, ' ').slice(0, 40); if (name.length < 2) fail_('Enter your name.', 'നിങ്ങളുടെ പേര് നൽകുക.');
  var l4 = String(a.last4 || '').replace(/\D/g, '').slice(-4); if (l4.length !== 4) fail_('Enter the last 4 digits of your mobile number.', 'മൊബൈൽ നമ്പറിന്റെ അവസാന 4 അക്കം നൽകുക.');
  var ans = a.answers || {}, key = nrm_(name) + '-' + l4, combos = [];
  [1, 2, 3, 4].forEach(function (d) { ['B', 'L', 'T'].forEach(function (m) { combos.push(d + m); }); });
  combos.forEach(function (c) { if (ans[c] !== 0 && ans[c] !== 1) fail_('Please answer Yes or No for every meal.', 'എല്ലാ നേരത്തിനും Yes അല്ലെങ്കിൽ No നൽകുക.'); });
  return locked_(function () {
    var ex = rows_('RSVP').filter(function (r) { return r.teamId === t.teamId && r.playerKey === key; }), byk = {}; ex.forEach(function (r) { byk[r.day + r.meal] = r; });
    combos.forEach(function (c) { var d = Number(c[0]), m = c[1], v = ans[c];
      if (byk[c]) { setCell_('RSVP', byk[c]._row, 'yes', v); setCell_('RSVP', byk[c]._row, 'ts', iso_()); }
      else add_('RSVP', { teamId: t.teamId, playerKey: key, player: name, day: d, meal: m, yes: v, ts: iso_() }); });
    return { ok: true, updated: ex.length > 0 };
  });
}

/* ---------- counter ---------- */
function counterLogin_(a) {
  var g = Number(a.ground), fx = fx_(), pin = SP.getProperty('PIN_' + g);
  if (!pin || String(a.pin || '') !== pin) fail_('Wrong PIN.', 'PIN തെറ്റാണ്.');
  var td = todayDay_(fx);
  return { token: tok_('counter', { ground: g, id: Utilities.getUuid().slice(0, 6) }), ground: g, groundName: fx.grounds[g], day: td, meal: currentMeal_(fx, td), practice: !td, names: fx.grounds };
}
function sums_(day, meal, test) {
  var s = { A: {}, B: {} }; rows_('Serve').forEach(function (r) { if (Number(r.undone) || !!Number(r.test) !== !!test || Number(r.day) !== day || r.meal !== meal) return; var k = r.kind === 'A' ? s.A : s.B, key = r.kind === 'A' ? r.teamId + '|' + r.counter : String(r.counter); k[key] = (k[key] || 0) + Number(r.qty); });
  return s;
}
function check_(c, a) {
  var fx = fx_(), day = Number(a.day), meal = a.meal, test = !!a.test; if (!fx.dates[day] || !FOOD.NAMES[meal]) fail_('Choose the day and meal.', 'ദിവസവും നേരവും തിരഞ്ഞെടുക്കുക.');
  var kk = 'bad_' + c.token, bad = Number(CacheService.getScriptCache().get(kk) || 0);
  if (bad >= 5) fail_('Too many wrong codes. Please wait one minute.', 'തെറ്റായ കോഡ് കൂടുതൽ തവണ നൽകി. ഒരു മിനിറ്റ് കാത്തിരിക്കുക.');
  var t = teamByCode_(a.code);
  if (!t) { CacheService.getScriptCache().put(kk, String(bad + 1), 60); return { status: 'bad' }; }
  CacheService.getScriptCache().remove(kk);
  var mt = test ? meta_(day, meal) : ensure_(day, meal), al = null, yes = 0, prov = false;
  if (mt) { rows_('Alloc').forEach(function (r) { if (Number(r.day) === day && r.meal === meal && r.teamId === t.teamId) al = r; }); yes = al ? Number(al.yes) : 0; }
  else if (test) { prov = true; var y = yes_(), teams = fx.teams.map(function (x) { return { id: x.id, w: y[x.id + '|' + day + '|' + meal] || 0 }; }), res = foodAllot(fx.matches, teams, day, meal); if (res.teams[t.teamId]) { al = { ground: res.teams[t.teamId].ground }; yes = y[t.teamId + '|' + day + '|' + meal] || 0; } }
  else return { status: 'notopen', team: t.teamName, opensAt: new Date(mealStartMs_(fx, day, meal)).toISOString() };
  var sm = sums_(day, meal, test), total = mt ? Number(mt.totalYes) : 0, bufSize = mt ? Number(mt.buffer) : bufferFor_(day, total);
  var bufLeft = Math.max(0, bufSize - (sm.B[String(c.ground)] || 0)), served = al ? (sm.A[t.teamId + '|' + c.ground] || 0) : 0;
  var r = { team: t.teamName, teamId: t.teamId, yes: yes, served: served, bufferLeft: bufLeft, bufferSize: bufSize, provisional: prov, allotted: al ? fx.grounds[Number(al.ground)] : null, here: !!al && Number(al.ground) === c.ground && yes > 0 };
  if (r.here && yes - served > 0) { r.status = 'allotted'; r.remaining = yes - served; r.kind = 'A'; r.canServe = true; }
  else if (bufLeft > 0) { r.status = r.here ? 'quota' : (al && yes > 0 ? 'other' : 'noyes'); r.kind = 'B'; r.canServe = true; r.remaining = bufLeft; }
  else { r.status = 'full'; r.canServe = false; r.remaining = 0; }
  return r;
}
function counterCheck_(a) { var c = auth_(a.token, 'counter'); return check_(c, a); }
function counterServe_(a) {
  var c = auth_(a.token, 'counter'), n = Math.max(1, Math.min(10, Number(a.n) || 1));
  return locked_(function () {
    var r = check_(c, a); if (r.status === 'bad') fail_('Code not recognised.', 'കോഡ് തിരിച്ചറിഞ്ഞില്ല.');
    if (!r.canServe) fail_('Buffer is finished. Please send to the other counter.', 'Buffer തീർന്നു. മറ്റേ കൗണ്ടറിലേക്ക് അയക്കുക.');
    if (n > r.remaining) fail_('Only ' + r.remaining + ' left for this entry.', 'ഇതിൽ ' + r.remaining + ' മാത്രം ബാക്കി.');
    add_('Serve', { id: Utilities.getUuid().slice(0, 8), ts: iso_(), day: Number(a.day), meal: a.meal, counter: c.ground, teamId: r.teamId, kind: r.kind, qty: n, by: c.id, undone: 0, test: a.test ? 1 : 0 });
    var r2 = check_(c, a); r2.justServed = n; r2.kindServed = r.kind; return r2;
  });
}
function counterUndo_(a) {
  var c = auth_(a.token, 'counter');
  return locked_(function () {
    var last = null; rows_('Serve').forEach(function (r) { if (r.by === c.id && !Number(r.undone) && !!Number(r.test) === !!a.test) last = r; });
    if (!last) fail_('Nothing to undo.', 'റദ്ദാക്കാൻ ഒന്നുമില്ല.');
    setCell_('Serve', last._row, 'undone', 1); return { ok: true, undone: { teamId: last.teamId, qty: Number(last.qty), kind: last.kind } };
  });
}
function counterRecent_(a) {
  var c = auth_(a.token, 'counter'), fx = fx_(), out = [];
  rows_('Serve').forEach(function (r) { if (r.by === c.id && !Number(r.undone) && !!Number(r.test) === !!a.test) out.push({ team: (teamById_(fx, r.teamId) || {}).name || r.teamId, qty: Number(r.qty), kind: r.kind, ts: r.ts }); });
  return out.slice(-6).reverse();
}
function counterStats_(a) {
  var c = auth_(a.token, 'counter'), day = Number(a.day), meal = a.meal, sm = sums_(day, meal, !!a.test), mt = meta_(day, meal), tA = 0;
  Object.keys(sm.A).forEach(function (k) { if (k.split('|')[1] === String(c.ground)) tA += sm.A[k]; });
  return { allotted: tA, buffer: sm.B[String(c.ground)] || 0, bufferSize: mt ? Number(mt.buffer) : null };
}

/* ---------- admin ---------- */
function audit_(adm, action, detail) { try { add_('Audit', { ts: iso_(), who: adm.person || 'committee code', action: action, detail: detail || '' }); } catch (e) {} }
/* Committee sign-in: either the Finance Desk session (Food management profile or Admin) or, for the stand-alone page, the ADMIN_CODE script property. */
function adminLogin_(a) {
  if (a.financeToken) {
    var c = CacheService.getScriptCache(), ck = 'fa_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(a.financeToken))), who = c.get(ck), p;
    if (who) p = JSON.parse(who);
    else {
      var r = UrlFetchApp.fetch(FOOD.FINANCE_API, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ fn: 'foodAuth', args: [String(a.financeToken)] }), muteHttpExceptions: true, followRedirects: true });
      var j; try { j = JSON.parse(r.getContentText()); } catch (e) { fail_('Could not verify the Finance Desk sign-in. Try again.', 'Finance Desk sign-in പരിശോധിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.'); }
      if (!j.ok) fail_(j.error || 'Finance Desk sign-in not accepted.', 'Finance Desk sign-in സ്വീകരിച്ചില്ല.');
      p = { person: j.result.person, role: j.result.role }; c.put(ck, JSON.stringify(p), 300);
    }
    audit_({ person: p.person }, 'login', p.role);
    var t = tok_('admin', { person: p.person, role: p.role });
    var out = { token: t, person: p.person };
    if (a.withSummary) out.summary = adminSummary_({ token: t });
    return out;
  }
  var code = SP.getProperty('ADMIN_CODE'); if (!code || String(a.code || '') !== code) fail_('Wrong code.', 'കോഡ് തെറ്റാണ്.'); return { token: tok_('admin', {}) };
}
function adminAudit_(a) { auth_(a.token, 'admin'); return rows_('Audit').slice(-200).reverse(); }
function adminSummary_(a) {
  var adm = auth_(a.token, 'admin'); var fx = fx_(), y = yes_(), out = { grounds: fx.grounds, meals: [], teams: [] }, tr = rows_('Teams'), al = rows_('Alloc'), mm = rows_('MealMeta');
  var rv = rows_('RSVP'), by = {}; rv.forEach(function (x) { var o = by[x.teamId] = by[x.teamId] || { p: {}, y: 0 }; o.p[x.playerKey] = 1; if (Number(x.yes)) o.y++; });
  out.teams = fx.teams.map(function (t) { var r = tr.filter(function (x) { return x.teamId === t.id; })[0], b = by[t.id] || { p: {}, y: 0 }; return { id: t.id, name: t.name, code: r ? String(r.code) : null, consent: r && r.consentBy ? r.consentBy : null, players: Object.keys(b.p).length, yesMeals: b.y }; });
  out.person = adm.person || ''; out.role = adm.role || '';
  [1, 2, 3, 4].forEach(function (d) { ['B', 'L', 'T'].forEach(function (m) {
    var mt = mm.filter(function (x) { return Number(x.day) === d && x.meal === m; })[0], teams = fx.teams.map(function (t) { return { id: t.id, w: y[t.id + '|' + d + '|' + m] || 0 }; }), total = 0; teams.forEach(function (t) { total += t.w; });
    var rowsT = [], tot = [0, 0];
    if (mt) { al.filter(function (x) { return Number(x.day) === d && x.meal === m; }).forEach(function (x) { rowsT.push({ id: x.teamId, yes: Number(x.yes), ground: Number(x.ground), basis: x.basis }); tot[Number(x.ground)] += Number(x.yes); }); total = Number(mt.totalYes); }
    else { var res = foodAllot(fx.matches, teams, d, m); tot = res.totals; Object.keys(res.teams).forEach(function (id) { rowsT.push({ id: id, yes: y[id + '|' + d + '|' + m] || 0, ground: res.teams[id].ground, basis: res.teams[id].basis }); }); }
    out.meals.push({ day: d, meal: m, locked: !!mt, totalYes: total, totals: tot, suggestedBuffer: bufferFor_(d, total), buffer: mt ? Number(mt.buffer) : null, teams: rowsT });
  }); });
  return out;
}
function adminOverride_(a) {
  var adm = auth_(a.token, 'admin'), day = Number(a.day), g = Number(a.ground);
  return locked_(function () {
    audit_(adm, 'ground', a.teamId + ' day ' + day + ' ' + a.meal + ' → ' + g);
    if (!meta_(day, a.meal)) fail_('The allotment is not generated yet. Use Generate first.', 'Allotment ഇതുവരെ ഉണ്ടാക്കിയിട്ടില്ല. ആദ്യം Generate ചെയ്യുക.');
    var ex = rows_('Alloc').filter(function (r) { return Number(r.day) === day && r.meal === a.meal && r.teamId === a.teamId; })[0], y = yes_()[a.teamId + '|' + day + '|' + a.meal] || 0;
    if (ex) { setCell_('Alloc', ex._row, 'ground', g); setCell_('Alloc', ex._row, 'basis', 'admin'); } else add_('Alloc', { day: day, meal: a.meal, teamId: a.teamId, ground: g, basis: 'admin', yes: y, ts: iso_() });
    return { ok: true };
  });
}
function adminSetYes_(a) {
  var adm = auth_(a.token, 'admin'), day = Number(a.day), v = Math.max(0, Math.floor(Number(a.yes)));
  return locked_(function () {
    audit_(adm, 'yes', a.teamId + ' day ' + day + ' ' + a.meal + ' = ' + v);
    var ex = rows_('YesAdj').filter(function (r) { return r.teamId === a.teamId && Number(r.day) === day && r.meal === a.meal; })[0];
    if (ex) { setCell_('YesAdj', ex._row, 'yes', v); setCell_('YesAdj', ex._row, 'ts', iso_()); } else add_('YesAdj', { teamId: a.teamId, day: day, meal: a.meal, yes: v, by: 'admin', ts: iso_() });
    var al = rows_('Alloc').filter(function (r) { return Number(r.day) === day && r.meal === a.meal && r.teamId === a.teamId; })[0];
    if (al) setCell_('Alloc', al._row, 'yes', v);
    return { ok: true };
  });
}
function adminBuffer_(a) {
  var adm = auth_(a.token, 'admin'), mt = meta_(Number(a.day), a.meal); if (!mt) fail_('Not generated yet.', 'ഇതുവരെ ഉണ്ടാക്കിയിട്ടില്ല.');
  audit_(adm, 'buffer', 'day ' + a.day + ' ' + a.meal + ' = ' + a.size);
  setCell_('MealMeta', mt._row, 'buffer', Math.max(0, Math.floor(Number(a.size)))); return { ok: true };
}
function adminGenerate_(a) { var adm = auth_(a.token, 'admin'); return locked_(function () { audit_(adm, 'generate', 'day ' + a.day + ' ' + a.meal); return generate_(Number(a.day), a.meal, 'regenerate'); }); }
function adminReport_(a) {
  auth_(a.token, 'admin'); var fx = fx_(), day = Number(a.day), test = !!a.test, out = [];
  ['B', 'L', 'T'].forEach(function (m) { var mt = meta_(day, m); if (!mt) return; var sm = sums_(day, m, test);
    var rowsT = rows_('Alloc').filter(function (r) { return Number(r.day) === day && r.meal === m; }).map(function (r) { var ok = sm.A[r.teamId + '|' + r.ground] || 0; return { team: (teamById_(fx, r.teamId) || {}).name || r.teamId, ground: fx.grounds[Number(r.ground)], yes: Number(r.yes), served: ok }; });
    out.push({ meal: m, totalYes: Number(mt.totalYes), buffer: Number(mt.buffer), bufferUsed: [sm.B['0'] || 0, sm.B['1'] || 0], teams: rowsT }); });
  return out;
}
function adminClearTest_(a) { var adm = auth_(a.token, 'admin'); return locked_(function () { audit_(adm, 'clear-practice', ''); var r = rows_('Serve').filter(function (x) { return Number(x.test); }).map(function (x) { return x._row; }); delRows_('Serve', r); return { cleared: r.length }; }); }

var HANDLERS_ = {
  ownerLogin: ownerLogin_, ownerState: ownerState_, ownerConsent: ownerConsent_, rsvpInfo: rsvpInfo_, rsvpSubmit: rsvpSubmit_,
  counterLogin: counterLogin_, counterCheck: counterCheck_, counterServe: counterServe_, counterUndo: counterUndo_, counterRecent: counterRecent_, counterStats: counterStats_,
  adminLogin: adminLogin_, adminAudit: adminAudit_, adminSummary: adminSummary_, adminOverride: adminOverride_, adminSetYes: adminSetYes_, adminBuffer: adminBuffer_, adminGenerate: adminGenerate_, adminReport: adminReport_, adminClearTest: adminClearTest_
};
