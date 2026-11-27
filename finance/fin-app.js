/* KNPL-7 Finance Desk – page logic. Uses FinCore (shared rules), FinDocs (documents) and KNPLOCR (bill reader). */
(function () {
  'use strict';
  var CFG = window.FIN_CONFIG || {};
  var DEMO = !CFG.API_URL || /[?&]demo=1/.test(location.search);
  var TEAMS = ['Kombans of Pataleeputhra', 'Madhura Mavericks', 'Mighty Mithilas', 'Kalinga United', 'Varahas of Vijayanagara', 'Kaaliyanz of Dwaraka', 'Guardians of Kamboja', 'Ayodhya Warriors',
    'Jaguars of Jhansi', 'Gandhara Giants', 'Devils of Chithrakoot', 'Kurukshetra Yodhas', 'Vamos Vrindavan', 'Knights of Kanchi', 'Spartans of Nalanda', 'Panchaala Panthers'];
  var TOKEN = null, D = null, TAB = 'overview';
  var UI = { inc: null, incSrc: '', incQ: '', exp: null, expQ: '', bank: 'OPEN', bankQ: '', ledQ: '', ledHead: '', audQ: '' };
  try { TOKEN = sessionStorage.getItem('knplfin_tok'); } catch (e) {}
  var inr = FinCore.inr, dmy = FinDocs.dmy;

  /* ------------------------------------------------------------ helpers */
  function $(id) { return document.getElementById(id); }
  function h(tag, a) {
    var e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    if (a) Object.keys(a).forEach(function (k) {
      var v = a[k]; if (v == null || v === false) return;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'style') e.style.cssText = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else if (k === 'value') e.value = v; else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected' || k === 'readOnly' || k === 'multiple') e[k] = !!v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) { list.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) add(c); else e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); }); })(kids);
    return e;
  }
  function pill(text, cls) { return h('span', { class: 'pill ' + (cls || '') }, text); }
  function money(v) { return inr(v); }
  function headName(code) { var x = (D.heads || []).filter(function (k) { return k.code === code; })[0]; return x ? x.name : code; }
  function nameOf(id) { return (D.names || {})[id] || (id === 'SYNC' ? 'Source sync' : id); }
  function role() { return D.me.role; }
  function is() { return Array.prototype.indexOf.call(arguments, role()) >= 0; }
  function can(k) { return !!(D && D.me.can && D.me.can[k]); }
  function inScope(i) { return FinCore.incomeScope(role(), D.settings, i); }
  function samePerson(a) { return String(a || '').split(' · ')[0].toLowerCase() === String(D.me.person || '').toLowerCase(); }
  function today() { return FinCore.isoDate(new Date()); }
  function toast(msg, err) { var t = h('div', { class: 'toast' + (err ? ' err' : '') }, msg); document.body.appendChild(t); setTimeout(function () { t.remove(); }, err ? 6000 : 3200); }
  function field(label, input, req, hint) { var id = input.id || ('f' + Math.random().toString(36).slice(2, 8)); input.id = id; return h('div', null, h('label', { class: 'fl', for: id }, label, req ? h('span', { class: 'req' }, ' *') : null), input, hint ? h('div', { class: 'small muted' }, hint) : null); }
  function inp(a) { return h('input', Object.assign({ type: 'text' }, a || {})); }
  function sel(opts, val, a) { var s = h('select', a || null); opts.forEach(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; s.appendChild(h('option', { value: v, selected: String(v) === String(val) }, t)); }); return s; }
  function copyBtn(text) { return h('button', { class: 'copy', type: 'button', title: 'Copy', onclick: function (ev) { ev.preventDefault(); copy(text); ev.target.textContent = 'Copied'; setTimeout(function () { ev.target.textContent = 'Copy'; }, 1500); } }, 'Copy'); }
  function copy(t) { if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {}); else { var x = h('textarea', { value: t }); document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); } }
  function link(url, text) { return url ? h('a', { href: url, target: '_blank', rel: 'noopener' }, text || 'Open ↗') : h('span', { class: 'muted' }, '–'); }
  function busy(btn, on) { if (!btn) return; if (on) { btn.dataset.t = btn.textContent; btn.disabled = true; btn.textContent = ''; btn.appendChild(h('span', { class: 'spin' })); btn.appendChild(document.createTextNode(' Please wait')); } else { btn.disabled = false; btn.textContent = btn.dataset.t || btn.textContent; } }
  var ST = {
    PENDING: ['Awaiting approval', 'warn'], SOURCE_PENDING: ['Awaiting source approval', 'info'], APPROVED: ['Approved', 'ok'], REJECTED: ['Rejected', 'bad'], CANCELLED: ['Cancelled', ''], REVERSED: ['Reversed', 'bad'],
    SUBMITTED: ['Awaiting verification', 'warn'], QUERY: ['Query – with creator', 'sf'], AWAITING_ADMIN: ['Awaiting Admin approval', 'warn'], PAID: ['Paid', 'ok']
  };
  function stPill(s, kind) { var x = ST[s] || [s, '']; if (kind === 'exp' && s === 'APPROVED') x = ['Approved – to pay', 'info']; return pill(x[0], x[1]); }

  /* ------------------------------------------------------------- server */
  function api(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (DEMO) return window.FinDemo.api(fn, args).catch(function (e) { throw e; });
    return fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }), redirect: 'follow' })
      .catch(function () { throw new Error('Could not reach the Finance Desk server. Check your internet connection and try again.'); })
      .then(function (r) { return r.json().catch(function () { throw new Error('The server sent an unexpected reply. Try again in a minute.'); }); })
      .then(function (j) { if (!j.ok) { var e = new Error(j.error || 'Request failed.'); e.code = j.code; throw e; } return j.result; });
  }
  function act(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return api.apply(null, [fn, TOKEN].concat(args)).then(function (r) { D = r.data; render(); return r.result; })
      .catch(function (e) { if (e.code === 'SESSION') { signOut(e.message); } throw e; });
  }
  function run(btn, msgEl, promiseFn, okText) {
    if (msgEl) { msgEl.className = 'msg'; msgEl.textContent = ''; }
    busy(btn, true);
    return Promise.resolve().then(promiseFn).then(function (r) { busy(btn, false); if (okText) toast(typeof okText === 'function' ? okText(r) : okText); return r; })
      .catch(function (e) { busy(btn, false); if (msgEl && document.body.contains(msgEl)) { msgEl.className = 'msg err'; msgEl.textContent = e.message || String(e); msgEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } else toast(e.message || String(e), true); throw e; });
  }
  function quiet(p) { return p.catch(function () {}); }

  /* --------------------------------------------------------------- files */
  function readFile(file, maxMb) {
    maxMb = maxMb || 7;
    function b64(blob) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1]); }; fr.onerror = function () { rej(new Error('The file could not be read.')); }; fr.readAsDataURL(blob); }); }
    if (file.type === 'application/pdf') {
      if (file.size > maxMb * 1048576) return Promise.reject(new Error('The PDF is larger than ' + maxMb + ' MB. Upload a photo / screenshot instead.'));
      return b64(file).then(function (d) { return { name: file.name, mime: file.type, data: d, size: file.size }; });
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return Promise.reject(new Error('Upload a JPG, PNG, WEBP image or a PDF.'));
    var url = URL.createObjectURL(file);
    return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('The image could not be opened.')); }; i.src = url; }).then(function (img) {
      var k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.8); });
    }).then(function (blob) {
      URL.revokeObjectURL(url);
      var use = blob && blob.size < file.size ? blob : file;
      if (use.size > maxMb * 1048576) throw new Error('The file is too large.');
      return b64(use).then(function (d) { return { name: file.name.replace(/\.\w+$/, '') + (use === blob ? '.jpg' : ''), mime: use === blob ? 'image/jpeg' : file.type, data: d, size: use.size }; });
    });
  }
  function readText(file) {
    if (!window.KNPLOCR) return Promise.resolve({ ok: false, error: 'reader not loaded' });
    return window.KNPLOCR.read(file);
  }

  /* --------------------------------------------------------------- modal */
  var modalStack = [];
  function modal(title, body, wide) {
    var box = h('div', { class: 'box' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('button', { class: 'x', 'aria-label': 'Close', onclick: function () { close(); } }, '×'), h('h2', null, title), body);
    var m = h('div', { class: 'modal', onclick: function (ev) { if (ev.target === m) close(); } }, box);
    function close() { m.remove(); modalStack = modalStack.filter(function (x) { return x !== close; }); document.body.style.overflow = modalStack.length ? 'hidden' : ''; }
    $('modalRoot').appendChild(m); modalStack.push(close); document.body.style.overflow = 'hidden';
    var f = box.querySelector('input,select,textarea'); if (f && !('ontouchstart' in window)) setTimeout(function () { f.focus(); }, 30);
    return close;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modalStack.length) modalStack[modalStack.length - 1](); });
  function docPreview(title, html, fileName) {
    var fr = h('iframe', { title: title }); fr.srcdoc = html;
    var close = modal(title, h('div', null,
      h('div', { class: 'row', style: 'margin-bottom:10px' },
        h('button', { class: 'btn sf', onclick: function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Printing is blocked here. Use Download and open the file.', true); } } }, 'Print / Save as PDF'),
        h('button', { class: 'btn ghost', onclick: function () { download(fileName + '.html', html.replace('../team/a/knpl.png', new URL('../team/a/knpl.png', location.href).href), 'text/html'); } }, 'Download'),
        h('span', { class: 'small muted' }, 'In the print window choose "Save as PDF" for a PDF copy.')), fr), true);
    return close;
  }
  function download(name, content, type) { var a = h('a', { download: name }); a.href = URL.createObjectURL(new Blob([content], { type: type || 'text/plain' })); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }

  /* ------------------------------------------------------------- session */
  function showGate(msg) {
    $('app').hidden = true; $('who').hidden = true; $('gate').hidden = false; $('gMsg').textContent = msg || '';
    if (DEMO) { var b = $('demoLogins'); b.hidden = false; b.replaceChildren(h('b', null, 'Demo sign-ins'), h('br'));
      window.FinDemo.logins.forEach(function (l) { b.appendChild(h('div', null, h('button', { class: 'btn link', onclick: function () { $('gCode').value = l[1]; if (!$('gName').value) $('gName').value = 'Demo user'; signIn(); } }, l[0]), ' – code ' + l[1])); }); }
    try { if (!$('gName').value) $('gName').value = localStorage.getItem('knplfin_name') || ''; } catch (e) {}
  }
  function signIn() {
    var b = $('gGo');
    try { localStorage.setItem('knplfin_name', $('gName').value.trim()); } catch (e) {}
    run(b, $('gMsg'), function () { return api('login', $('gCode').value, $('gName').value); }).then(function (r) {
      TOKEN = r.token; try { sessionStorage.setItem('knplfin_tok', TOKEN); } catch (e) {}
      $('gCode').value = ''; return load();
    }).catch(function () {});
  }
  function signOut(msg) { if (TOKEN) quiet(api('logout', TOKEN)); TOKEN = null; D = null; TAB = 'overview'; UI = { inc: null, incSrc: '', incQ: '', exp: null, expQ: '', bank: 'OPEN', bankQ: '', ledQ: '', ledHead: '', audQ: '' }; try { sessionStorage.removeItem('knplfin_tok'); } catch (e) {} showGate(msg); }
  function load() {
    return api('boot', TOKEN).then(function (d) {
      D = d; $('gate').hidden = true; $('who').hidden = false;
      $('whoName').replaceChildren(h('b', null, D.me.person), ' · ' + D.me.profile);
      $('app').hidden = false;
      if (!UI.inc) UI.inc = can('decideIncome') ? 'PENDING' : 'ALL';
      if (!UI.exp) UI.exp = is('EXP_CREATE') ? 'MINE' : (can('decideExpense') || can('pay')) ? 'ACTION' : 'ALL';
      render();
    }).catch(function (e) { if (e.code === 'SESSION' || /session/i.test(e.message)) signOut(); else showGate(e.message); });
  }
  $('outBtn').onclick = function () { signOut(); };
  $('gGo').onclick = signIn;
  $('gCode').addEventListener('keydown', function (e) { if (e.key === 'Enter') signIn(); });
  if (DEMO) { $('demoBar').hidden = false; $('demoReset').onclick = function () { if (confirm('Reset all demo data to the sample set?')) { window.FinDemo.reset(); signOut('Demo data reset. Sign in again.'); } }; }

  /* --------------------------------------------------------------- tabs */
  function counts() {
    var me = D.me, c = {};
    c.income = can('decideIncome') ? D.income.filter(function (i) { return i.status === 'PENDING' && i.createdBy !== me.id && inScope(i); }).length : 0;
    c.expenses = actionExpenses().length;
    c.bank = can('bank') && D.recon ? D.recon.bankOpen : 0;
    return c;
  }
  function actionExpenses() {
    var me = D.me;
    return D.expenses.filter(function (x) {
      if (can('decideExpense') && x.createdBy !== me.id && x.status === 'SUBMITTED') return true;
      if (is('ADMIN') && x.status === 'AWAITING_ADMIN' && x.createdBy !== me.id && !samePerson(x.approvedBy)) return true;
      if (can('pay') && x.status === 'APPROVED') return true;
      if (x.createdBy === me.id && x.status === 'QUERY') return true;
      return false;
    });
  }
  function tabs() {
    var t = [['overview', 'Overview'], ['income', 'Income'], ['expenses', 'Expenses'], ['budget', 'Budget']];
    if (can('viewAll')) t.push(['bank', 'Bank & Reconcile'], ['reports', 'Ledger & Statements'], ['audit', 'Audit trail']);
    if (can('admin')) t.push(['settings', 'Settings']);
    return t;
  }
  function render() {
    if (!D) return;
    var c = counts(), nav = $('tabs'); nav.replaceChildren();
    var list = tabs(); if (!list.some(function (x) { return x[0] === TAB; })) TAB = 'overview';
    list.forEach(function (x) { nav.appendChild(h('button', { role: 'tab', 'aria-selected': TAB === x[0] ? 'true' : 'false', onclick: function () { TAB = x[0]; render(); window.scrollTo({ top: 0 }); } }, x[1], c[x[0]] ? h('span', { class: 'cnt' }, c[x[0]]) : null)); });
    if (CFG.TEAM_DESK_ADMIN && is('ADMIN', 'FEES')) nav.appendChild(h('a', { class: 'btn ghost sm', style: 'margin:auto 0 6px auto', href: CFG.TEAM_DESK_ADMIN, target: '_blank', rel: 'noopener' }, 'Team Desk approvals ↗'));
    var v = $('view'), keep = window.scrollY; v.replaceChildren();
    ({ overview: vOverview, income: vIncome, expenses: vExpenses, budget: vBudget, bank: vBank, reports: vReports, audit: vAudit, settings: vSettings })[TAB](v);
    window.scrollTo({ top: keep });
  }
  function go(tab, patch) { TAB = tab; Object.assign(UI, patch || {}); render(); window.scrollTo({ top: 0 }); }

  /* ------------------------------------------------------------- overview */
  function kpi(l, v, s, warn) { return h('div', { class: 'kpi' }, h('div', { class: 'l' }, l), h('div', { class: 'v', style: warn ? 'color:var(--red)' : '' }, v), s ? h('div', { class: 's' }, s) : null); }
  function meter(actual, committed, budget, label) {
    var over = budget > 0 ? actual + committed > budget + 0.004 : actual + committed > 0, tot = Math.max(budget, actual + committed, 1);
    var m = h('div', { class: 'meter' + (over ? ' over' : ''), role: 'img', 'aria-label': label || '' }, h('i', { style: 'width:' + Math.min(100, actual / tot * 100) + '%' }), h('i', { class: 'c', style: 'left:' + Math.min(100, actual / tot * 100) + '%;width:' + Math.min(100, committed / tot * 100) + '%' }));
    m.title = (label ? label + ': ' : '') + 'spent ' + money(actual) + (committed ? ' + committed ' + money(committed) : '') + ' of ' + money(budget);
    return m;
  }
  function vOverview(v) {
    var T = D.summary.totals, R = D.recon, me = D.me;
    v.appendChild(h('div', { class: 'grid g4', style: 'margin-bottom:12px' },
      kpi('Income received', money(T.incReceived), 'Target ' + money(T.incTarget) + ' · gap ' + money(T.incTarget - T.incReceived)),
      kpi('Expenses paid', money(T.expActual), 'Budget ' + money(T.expBudget) + ' · committed ' + money(T.expCommitted)),
      kpi('Balance in books', R ? money(R.bookBalance) : money(T.netOperating + T.depHeld), R ? (R.bankBalance == null ? 'No bank statement yet' : 'Bank ' + money(R.bankBalance) + (R.difference ? ' · difference ' + money(R.difference) : R.complete ? ' · fully reconciled' : ' · reconciles after open items')) : 'Income − expenses + deposits'),
      kpi('Deposits held (refundable)', money(T.depHeld), 'Sponsorship caution deposit')));
    var todo = [];
    if (can('decideIncome')) {
      var pi = D.income.filter(function (i) { return i.status === 'PENDING' && i.createdBy !== me.id && inScope(i); });
      if (pi.length) todo.push([pi.length + ' income entr' + (pi.length > 1 ? 'ies' : 'y') + ' to approve (' + money(sum(pi)) + ')', function () { go('income', { inc: 'PENDING' }); }]);
    }
    if (can('decideExpense')) {
      var sv = D.expenses.filter(function (x) { return x.status === 'SUBMITTED' && x.createdBy !== me.id; });
      if (sv.length) todo.push([sv.length + ' expense order(s) to verify (' + money(sum(sv)) + ')' + (sv.some(function (x) { return x.expKind; }) ? ' – some need explanation review' : ''), function () { go('expenses', { exp: 'SUBMITTED' }); }]);
    }
    if (can('pay')) {
      var tp = D.expenses.filter(function (x) { return x.status === 'APPROVED'; });
      if (tp.length) todo.push([tp.length + ' approved order(s) to pay (' + money(sum(tp)) + ')', function () { go('expenses', { exp: 'APPROVED' }); }]);
    }
    if (can('bank') && R) {
      if (R.bankOpen) todo.push([R.bankOpen + ' bank line(s) to reconcile', function () { go('bank', { bank: 'OPEN' }); }]);
      if (R.unreconciled) todo.push([R.unreconciled + ' ledger entr' + (R.unreconciled > 1 ? 'ies' : 'y') + ' not yet seen in the bank', function () { go('bank'); }]);
    }
    if (is('ADMIN')) { var aw = D.expenses.filter(function (x) { return x.status === 'AWAITING_ADMIN' && x.createdBy !== me.id && !samePerson(x.approvedBy); }); if (aw.length) todo.push([aw.length + ' order(s) need your Admin approval (' + money(sum(aw)) + ')', function () { go('expenses', { exp: 'AWAITING_ADMIN' }); }]); }
    var q = D.expenses.filter(function (x) { return x.createdBy === me.id && x.status === 'QUERY'; });
    if (q.length) todo.push([q.length + ' of your orders were sent back with a query', function () { go('expenses', { exp: 'QUERY' }); }]);
    v.appendChild(h('div', { class: 'card' }, h('h3', null, 'Needs your action'), todo.length ? h('div', null, todo.map(function (t) { return h('div', { class: 'row', style: 'padding:6px 0;border-bottom:1px solid var(--line)' }, h('span', { class: 'grow' }, '• ' + t[0]), h('button', { class: 'btn sm', onclick: t[1] }, 'Open')); })) : h('p', { class: 'muted', style: 'margin:0' }, 'Nothing is waiting for you.'),
      h('div', { class: 'row', style: 'margin-top:10px' }, can('createExpense') ? h('button', { class: 'btn sf', onclick: function () { expenseForm(); } }, '+ New expense order') : null, can('createIncome') ? h('button', { class: 'btn ghost', onclick: function () { incomeForm(); } }, '+ Outbound income') : null)));
    // budget gap
    var gap = h('div', { class: 'card' }, h('div', { class: 'row sp-b' }, h('h3', null, 'Budget gap'), h('button', { class: 'btn ghost sm', onclick: function () { go('budget'); } }, 'Full budget →')),
      h('div', { class: 'grid g3' },
        kpi('Planned surplus', money(T.projectedSurplus), 'Income target − expense budget · target ' + money(D.settings.targetSurplus), T.projectedSurplus < D.settings.targetSurplus),
        kpi('Actual surplus so far', money(T.netOperating), 'Income received − expenses paid'),
        kpi('Still to collect', money(Math.max(0, T.incTarget - T.incReceived)), money(T.incPending) + ' awaiting approval')));
    var tb = h('table', { class: 't' }, h('tr', null, h('th', null, 'Expense head'), h('th', { class: 'num' }, 'Budget'), h('th', { class: 'num' }, 'Spent'), h('th', { class: 'num' }, 'Committed'), h('th', { style: 'min-width:140px' }, 'Utilisation'), h('th', { class: 'num' }, 'Available')));
    D.summary.heads.filter(function (r) { return r.kind === 'EXPENSE' && (r.budget || r.actual || r.committed); }).forEach(function (r) {
      tb.appendChild(h('tr', null, h('td', null, r.name), h('td', { class: 'num' }, money(r.budget)), h('td', { class: 'num' }, money(r.actual)), h('td', { class: 'num' }, money(r.committed)),
        h('td', null, meter(r.actual, r.committed, r.budget, r.name), h('div', { class: 'meterlbl' }, r.util == null ? 'Not budgeted' : r.util + '%')), h('td', { class: 'num', style: r.available < 0 ? 'color:var(--red);font-weight:700' : '' }, money(r.available))));
    });
    gap.appendChild(h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:var(--bar)' }), 'Spent'), h('span', null, h('i', { style: 'background:var(--bar2)' }), 'Committed (approved / awaiting)'), h('span', null, h('i', { style: 'background:var(--red)' }), 'Over budget')));
    gap.appendChild(h('div', { class: 'tw' }, tb));
    v.appendChild(gap);
    if (D.ledger.length) {
      var lt = h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Entry'), h('th', null, 'Head'), h('th', null, 'Party'), h('th', { class: 'num' }, 'Receipt'), h('th', { class: 'num' }, 'Payment'), h('th', null, 'Bank')));
      D.ledger.slice(-8).reverse().forEach(function (l) { lt.appendChild(ledRow(l)); });
      v.appendChild(h('div', { class: 'card' }, h('div', { class: 'row sp-b' }, h('h3', null, 'Latest ledger entries'), h('button', { class: 'btn ghost sm', onclick: function () { go('reports'); } }, 'Ledger →')), h('div', { class: 'tw' }, lt)));
    }
  }
  function sum(list) { var t = 0; list.forEach(function (x) { t += x.amount; }); return FinCore.r2(t); }
  function ledRow(l) {
    return h('tr', null, h('td', { class: 'nowrap' }, dmy(l.date)), h('td', { class: 'mono' }, l.no), h('td', null, headName(l.head)), h('td', null, l.party, l.reversalOf ? h('div', { class: 'small muted' }, l.description) : null),
      h('td', { class: 'num' }, l.dir === 'IN' ? money(l.amount) : ''), h('td', { class: 'num' }, l.dir === 'OUT' ? money(l.amount) : ''),
      h('td', null, l.reversedBy ? pill('Reversed', 'bad') : l.reversalOf ? pill('Reversal', 'bad') : l.reconType === 'BANK' ? pill('✓ ' + l.bankId, 'ok') : l.reconType === 'CASH' ? pill('Cash', 'info') : pill('Open', 'warn')));
  }

  /* --------------------------------------------------------------- income */
  function vIncome(v) {
    var c = h('div', { class: 'card' });
    var top = h('div', { class: 'row sp-b' }, h('h2', { style: 'margin:0' }, 'Income'), h('div', { class: 'row' },
      can('sync') ? h('button', { class: 'btn', id: 'syncBtn', onclick: function (ev) { syncNow(ev.currentTarget); } }, '⟳ Fetch from sources') : null,
      can('createIncome') ? h('button', { class: 'btn sf', onclick: function () { incomeForm(); } }, '+ Add outbound income') : null));
    c.appendChild(top);
    if (D.lastSync) c.appendChild(h('div', { class: 'small muted' }, 'Last fetch ' + dmy(D.lastSync.at) + ' by ' + D.lastSync.by + ' – ' + D.lastSync.result.read + ' read, ' + D.lastSync.result.added + ' new, ' + D.lastSync.result.autoApproved + ' auto-approved' + (D.lastSync.result.warnings && D.lastSync.result.warnings.length ? ' · ' + D.lastSync.result.warnings.length + ' warning(s)' : '')));
    c.appendChild(h('p', { class: 'small muted' }, 'Every income needs an approval before it enters the ledger. Team Desk payments approved by Finance on the Team Desk come in already approved; sponsorship, registration and outbound income are approved here. Franchise fees are approved with the Franchise fees code, all other income with the Other income code. An entry is never approved with the same code that added it.'));
    var F = [['PENDING', 'Awaiting approval'], ['SOURCE_PENDING', 'Awaiting at source'], ['APPROVED', 'Approved'], ['CLOSED', 'Rejected / cancelled'], ['ALL', 'All']];
    c.appendChild(h('div', { class: 'chips' }, F.map(function (f) { var n = D.income.filter(function (i) { return incMatch(i, f[0]); }).length; return h('button', { 'aria-pressed': UI.inc === f[0] ? 'true' : 'false', onclick: function () { UI.inc = f[0]; render(); } }, f[1] + ' (' + n + ')'); })));
    var srcs = {}; D.income.forEach(function (i) { srcs[i.source] = 1; });
    var q = inp({ placeholder: 'Search name, team, reference, receipt no…', value: UI.incQ, oninput: function () { UI.incQ = q.value; draw(); } });
    c.appendChild(h('div', { class: 'row' }, h('div', { class: 'grow' }, q), sel([['', 'All sources']].concat(Object.keys(srcs).sort().map(function (s) { return [s, srcLabel(s)]; })), UI.incSrc, { style: 'width:auto', onchange: function (ev) { UI.incSrc = ev.target.value; draw(); } })));
    var box = h('div', { style: 'margin-top:10px' }); c.appendChild(box); v.appendChild(c);
    function draw() {
      box.replaceChildren();
      var qq = UI.incQ.toLowerCase(), list = D.income.filter(function (i) { return incMatch(i, UI.inc) && (!UI.incSrc || i.source === UI.incSrc) && (!qq || [i.id, i.party, i.team, i.utr, i.receiptNo, i.description, headName(i.head)].join(' ').toLowerCase().indexOf(qq) >= 0); }).slice().reverse();
      if (!list.length) { box.appendChild(h('div', { class: 'empty' }, 'Nothing here.')); return; }
      var shown = list.slice(0, 200); shown.forEach(function (i) { box.appendChild(incomeItem(i)); });
      if (list.length > shown.length) box.appendChild(h('p', { class: 'small muted' }, 'Showing 200 of ' + list.length + '. Use search to narrow down.'));
      box.appendChild(h('p', { class: 'small muted right' }, list.length + ' entr' + (list.length > 1 ? 'ies' : 'y') + ' · ' + money(sum(list))));
    }
    draw();
  }
  function incMatch(i, f) { return f === 'ALL' || (f === 'CLOSED' ? ['REJECTED', 'CANCELLED', 'REVERSED'].indexOf(i.status) >= 0 : i.status === f); }
  function srcLabel(s) { return { TEAMDESK: 'Team Desk', SPONSOR: 'Sponsorship portal', REG: 'Registration', MANUAL: 'Outbound (manual)', BANK: 'From bank statement' }[s] || s; }
  function incomeItem(i) {
    var mine = i.createdBy === D.me.id, canD = can('decideIncome') && i.status === 'PENDING' && !mine && inScope(i);
    var it = h('div', { class: 'item' + (canD ? ' hl' : '') },
      h('div', null, h('div', { class: 't1' }, i.party), h('div', null, headName(i.head) + (i.description && i.description !== headName(i.head) ? ' – ' + i.description : '') + (i.team && i.team !== i.party ? ' · ' + i.team : '')),
        h('div', { class: 'd' }, [i.id, srcLabel(i.source), i.mode, i.utr ? 'Ref ' + i.utr : 'No transaction ref', 'paid ' + dmy(i.paidOn), i.srcReceipt ? 'source receipt ' + i.srcReceipt : ''].filter(Boolean).join(' · ')),
        i.note ? h('div', { class: 'd' }, 'Note: ' + i.note) : null, i.remarks ? h('div', { class: 'd' }, 'Remarks: ' + i.remarks) : null,
        i.status === 'APPROVED' ? h('div', { class: 'd' }, 'Approved by ' + i.decidedBy + ' · ' + dmy(i.decidedAt) + ' · ' + i.receiptNo + ' · ' + i.ledgerNo) : h('div', { class: 'd' }, 'Added by ' + nameOf(i.createdBy) + ' · ' + dmy(i.createdAt))),
      h('div', { class: 'right' }, h('div', { class: 'amt' }, money(i.amount)), stPill(i.status), i.outbound ? h('div', null, pill('Outbound', 'sf')) : null));
    var acts = h('div', { class: 'acts' });
    if (i.proof) acts.appendChild(link(i.proof, 'Payment proof ↗'));
    if (canD) {
      var rm = inp({ placeholder: 'Reason (needed to reject)' }), msg = h('div', { class: 'msg' });
      acts.appendChild(rm);
      acts.appendChild(h('button', { class: 'btn ok sm', onclick: function (ev) { if (!confirm('Approve ' + i.id + ' – ' + money(i.amount) + ' from ' + i.party + '? It will be posted to the ledger and a receipt number issued.')) return; quiet(run(ev.currentTarget, msg, function () { return act('incomeDecide', i.id, 'APPROVED', ''); }, i.id + ' approved')); } }, 'Approve'));
      acts.appendChild(h('button', { class: 'btn no sm', onclick: function (ev) { quiet(run(ev.currentTarget, msg, function () { return act('incomeDecide', i.id, 'REJECTED', rm.value); }, i.id + ' rejected')); } }, 'Reject'));
      it.appendChild(acts); it.appendChild(h('div', { style: 'grid-column:1/-1' }, msg)); return it;
    }
    if (i.status === 'PENDING' && mine && can('decideIncome')) acts.appendChild(h('span', { class: 'small muted' }, 'Added with this profile – approve it with another profile.'));
    else if (i.status === 'PENDING' && can('decideIncome') && !inScope(i)) acts.appendChild(h('span', { class: 'small muted' }, 'Approved with the ' + (role() === 'FEES' ? 'Finance (other income)' : 'Franchise fees') + ' code.'));
    if (i.status === 'SOURCE_PENDING') acts.appendChild(h('span', { class: 'small muted' }, i.source === 'TEAMDESK' ? 'Approve it on the Team Desk; the next fetch brings it in.' : 'Waiting for confirmation in the source sheet.'));
    if (i.status === 'APPROVED') acts.appendChild(h('button', { class: 'btn ghost sm', onclick: function () { docPreview('Receipt ' + i.receiptNo, FinDocs.receipt(D, i), 'Receipt ' + i.receiptNo.replace(/\//g, '-')); } }, 'Receipt'));
    if (acts.childNodes.length) it.appendChild(acts);
    return it;
  }
  function syncNow(btn) {
    quiet(run(btn, null, function () { return act('syncSources'); }, function (r) { return r.read + ' read · ' + r.added + ' new · ' + r.updated + ' updated · ' + r.autoApproved + ' auto-approved' + (r.warnings.length ? ' · ' + r.warnings.length + ' warning(s)' : ''); })
      .then(function (r) { if (r.warnings.length) modal('Fetch warnings', h('div', null, r.warnings.map(function (w) { return h('div', { class: 'note warn' }, w); }))); }));
  }
  function incomeForm(prefill) {
    prefill = prefill || {};
    var heads = D.heads.filter(function (x) { return x.active && x.kind !== 'EXPENSE'; });
    var f = {
      head: sel(heads.map(function (x) { return [x.code, x.name + (x.kind === 'DEPOSIT' ? ' (deposit)' : '')]; }), prefill.head || 'INC-OTHER'),
      party: inp({ placeholder: 'Person / company who paid', value: prefill.party || '' }), team: inp({ list: 'teamList', placeholder: 'optional', value: prefill.team || '' }),
      description: inp({ placeholder: 'e.g. Donation, Lunch sponsor, Ticket sales', value: prefill.description || '' }),
      amount: inp({ type: 'number', min: '1', step: '0.01', value: prefill.amount || '', readOnly: !!prefill.bankId }),
      mode: sel(D.payModes, prefill.mode || 'UPI'), utr: inp({ placeholder: 'UTR / UPI ref (leave blank if the receipt has none)', value: prefill.utr || '' }),
      paidOn: inp({ type: 'date', max: today(), value: prefill.paidOn || today() }), note: h('textarea', { placeholder: 'What is this income for and how was it received? (shown to the approver)' }),
      proof: h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf' })
    };
    var msg = h('div', { class: 'msg' }), readMsg = h('div', { class: 'small muted' });
    f.proof.onchange = function () {
      var file = f.proof.files[0]; if (!file) return; readMsg.textContent = 'Reading the receipt…';
      readText(file).then(function (r) {
        if (!r.ok) { readMsg.textContent = 'Could not read the receipt automatically – fill in the details.'; return; }
        var got = [];
        if (r.utr && !f.utr.value) { f.utr.value = r.utr; got.push('reference ' + r.utr); }
        if (r.amount && !f.amount.value) { f.amount.value = r.amount; got.push('amount ' + money(r.amount)); }
        if (r.date && r.date <= today()) { f.paidOn.value = r.date; got.push('date ' + dmy(r.date)); }
        if (r.mode && D.payModes.indexOf(r.mode) >= 0) f.mode.value = r.mode; else if (r.mode === 'Bank transfer') f.mode.value = 'NEFT';
        readMsg.textContent = got.length ? 'Read from the receipt: ' + got.join(', ') + '. Please check.' : 'No reference found on the receipt – fill in the details.';
      });
    };
    var dl = h('datalist', { id: 'teamList' }, TEAMS.map(function (t) { return h('option', { value: t }); }));
    var body = h('div', null, dl,
      prefill.bankId ? h('div', { class: 'note info' }, 'Creating income for bank line ' + prefill.bankId + ' (' + (prefill.narration || '') + '). It is matched to the bank automatically when approved.') : null,
      h('div', { class: 'grid g2' }, field('Income head', f.head, true), field('Received from', f.party, true), field('Description', f.description), field('Franchise / team', f.team),
        field('Amount (₹)', f.amount, true), field('Payment mode', f.mode, true), field('Transaction reference', f.utr, false, 'Without a reference, the entry is reconciled manually with the bank statement.'), field('Payment date', f.paidOn, true)),
      field('Payment proof / receipt', f.proof, !prefill.bankId, 'Screenshot or PDF of the payment. Not needed for cash.'), readMsg,
      field('Note for the approver', f.note, true),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn sf', onclick: function (ev) {
        var btn = ev.currentTarget;
        quiet(run(btn, msg, function () {
          var file = f.proof.files[0];
          return (file ? readFile(file) : Promise.resolve(null)).then(function (pf) {
            return act('incomeCreate', { head: f.head.value, party: f.party.value, team: f.team.value, description: f.description.value, amount: f.amount.value, mode: f.mode.value, utr: f.utr.value, paidOn: f.paidOn.value, note: f.note.value, proof: pf, bankId: prefill.bankId || '' });
          });
        }, function (r) { return r.id + ' added – waiting for approval'; }).then(function () { close(); }));
      } }, 'Submit for approval')), msg);
    var close = modal('Add outbound income', body);
  }

  /* ------------------------------------------------------------- expenses */
  var EF = [['ACTION', 'Needs my action'], ['MINE', 'My orders'], ['SUBMITTED', 'Awaiting verification'], ['AWAITING_ADMIN', 'Awaiting Admin'], ['QUERY', 'Query'], ['APPROVED', 'Approved – to pay'], ['PAID', 'Paid'], ['CLOSED', 'Rejected / cancelled'], ['ALL', 'All']];
  function expMatch(x, f) {
    if (f === 'ALL') return true; if (f === 'MINE') return x.createdBy === D.me.id; if (f === 'ACTION') return actionExpenses().indexOf(x) >= 0;
    if (f === 'CLOSED') return ['REJECTED', 'CANCELLED', 'REVERSED'].indexOf(x.status) >= 0; return x.status === f;
  }
  function vExpenses(v) {
    var c = h('div', { class: 'card' });
    c.appendChild(h('div', { class: 'row sp-b' }, h('h2', { style: 'margin:0' }, 'Expense orders'), can('createExpense') ? h('button', { class: 'btn sf', onclick: function () { expenseForm(); } }, '+ New expense order') : null));
    c.appendChild(h('p', { class: 'small muted' }, 'A committee member raises the order with the bill (Expense creation code) → Finance verifies it against the budget and reviews the explanation if it is over budget or not budgeted → Admin gives a second approval for large or outbound orders → Finance pays and records the transaction.'));
    var F = EF.filter(function (f) { return !(f[0] === 'ACTION' && !(can('decideExpense') || can('pay') || is('ADMIN', 'EXP_CREATE'))) && !(f[0] === 'MINE' && !can('createExpense')); });
    c.appendChild(h('div', { class: 'chips' }, F.map(function (f) { var n = D.expenses.filter(function (x) { return expMatch(x, f[0]); }).length; return h('button', { 'aria-pressed': UI.exp === f[0] ? 'true' : 'false', onclick: function () { UI.exp = f[0]; render(); } }, f[1] + ' (' + n + ')'); })));
    var q = inp({ placeholder: 'Search payee, title, bill no, voucher…', value: UI.expQ, oninput: function () { UI.expQ = q.value; draw(); } });
    c.appendChild(q);
    var box = h('div', { style: 'margin-top:10px' }); c.appendChild(box); v.appendChild(c);
    function draw() {
      box.replaceChildren();
      var qq = UI.expQ.toLowerCase(), list = D.expenses.filter(function (x) { return expMatch(x, UI.exp) && (!qq || [x.id, x.title, x.payee, x.invoiceNo, x.voucherNo, x.utr, headName(x.head)].join(' ').toLowerCase().indexOf(qq) >= 0); }).slice().reverse();
      if (!list.length) { box.appendChild(h('div', { class: 'empty' }, 'Nothing here.')); return; }
      list.slice(0, 200).forEach(function (x) { box.appendChild(expenseItem(x)); });
      box.appendChild(h('p', { class: 'small muted right' }, list.length + ' order(s) · ' + money(sum(list))));
    }
    draw();
  }
  function expenseItem(x) {
    var hl = actionExpenses().indexOf(x) >= 0;
    return h('div', { class: 'item' + (hl ? ' hl' : '') },
      h('div', null, h('div', { class: 't1' }, x.title), h('div', null, x.payee + ' · ' + headName(x.head)),
        h('div', { class: 'd' }, [x.id, 'Bill ' + x.invoiceNo + ' of ' + dmy(x.invoiceDate), 'raised by ' + nameOf(x.createdBy) + ' · ' + dmy(x.createdAt), x.voucherNo].filter(Boolean).join(' · ')),
        x.status === 'QUERY' || x.status === 'REJECTED' || x.status === 'CANCELLED' ? h('div', { class: 'd', style: 'color:var(--red)' }, 'Remarks: ' + x.remarks) : null),
      h('div', { class: 'right' }, h('div', { class: 'amt' }, money(x.amount)), stPill(x.status, 'exp'), x.expKind ? h('div', null, pill(x.expKind === 'OVER' ? 'Over budget ' + money(x.overBy) : 'Outbound', 'bad')) : null),
      h('div', { class: 'acts' }, h('button', { class: 'btn sm' + (hl ? ' sf' : ''), onclick: function () { expenseView(x.id); } }, hl ? 'Open & act' : 'Open'),
        x.status === 'PAID' ? h('button', { class: 'btn ghost sm', onclick: function () { voucherDoc(x); } }, 'Voucher') : null));
  }
  function voucherDoc(x) { docPreview('Payment voucher ' + x.voucherNo, FinDocs.voucher(D, x), 'Voucher ' + String(x.voucherNo).replace(/\//g, '-')); }
  function liveCheck(head, amount, excludeId) {
    var r = D.summary.heads.filter(function (k) { return k.code === head; })[0], ex = excludeId ? D.expenses.filter(function (e) { return e.id === excludeId; })[0] : null;
    if (!r) return null;
    var OPEN = ['SUBMITTED', 'QUERY', 'AWAITING_ADMIN', 'APPROVED'], committed = r.committed - (ex && OPEN.indexOf(ex.status) >= 0 ? ex.amount : 0);
    if (excludeId) D.expenses.forEach(function (o) { if (o.head === head && o.id > excludeId && OPEN.indexOf(o.status) >= 0) committed -= o.amount; }); // later orders do not count against an earlier one
    var res = { kind: r.kind, budget: r.budget, actual: r.actual, committed: FinCore.r2(committed), amount: FinCore.r2(amount) };
    if (r.kind !== 'EXPENSE') return res;
    res.available = FinCore.r2(r.budget - r.actual - committed); res.after = FinCore.r2(res.available - amount);
    res.expKind = r.budget <= 0 ? 'OUTBOUND' : res.after < -0.004 ? 'OVER' : ''; res.overBy = r.budget <= 0 ? res.amount : Math.max(0, -res.after);
    return res;
  }
  function expenseForm(existing, prefill) {
    var e = existing || prefill || {}, payees = D.payees || [];
    var heads = D.heads.filter(function (x) { return x.active && x.kind !== 'INCOME'; });
    var f = {
      head: sel([['', 'Choose…']].concat(heads.map(function (x) { return [x.code, (x.kind === 'DEPOSIT' ? 'Refund – ' : '') + x.name]; })), e.head || ''),
      title: inp({ placeholder: 'What is it for? e.g. Trophies for KNPL-7 awards', value: e.title || '' }), description: h('textarea', { placeholder: 'Details – quantity, rate, event, who asked for it (optional)', style: 'min-height:64px' }),
      payee: inp({ list: 'payeeList', placeholder: 'Vendor / person to be paid', value: e.payee || '' }), invoiceNo: inp({ placeholder: 'as on the bill', value: e.invoiceNo || '' }),
      invoiceDate: inp({ type: 'date', max: today(), value: e.invoiceDate || '' }), amount: inp({ type: 'number', min: '1', step: '0.01', value: e.amount || '' }),
      file: h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf' }),
      accName: inp({ value: e.accName || '' }), accNo: inp({ inputmode: 'numeric', value: e.accNo || '' }), accNo2: inp({ inputmode: 'numeric', placeholder: 'type the account number again' }), ifsc: inp({ placeholder: 'e.g. SBIN0070123', maxlength: '11', value: e.ifsc || '', style: 'text-transform:uppercase' }),
      bank: inp({ value: e.bank || '' }), branch: inp({ value: e.branch || '' }), upi: inp({ placeholder: 'name@okaxis', value: e.upi || '' }), phone: inp({ inputmode: 'numeric', placeholder: '10-digit GPay / PhonePe number', value: e.phone || '' }),
      explanation: h('textarea', { placeholder: 'Why is this over the budget / not in the budget? What changed, why it could not be avoided, how the amount was arrived at. (English or Malayalam)', style: 'min-height:100px' }),
      reply: inp({ placeholder: 'Your reply to the query (optional)' })
    };
    f.description.value = e.description || ''; f.explanation.value = e.explanation || '';
    var method = e.payMethod || 'BANK', source = e.detailsSource || 'MANUAL';
    var rad = h('div', { class: 'row' }, [['BANK', 'Bank transfer (NEFT / IMPS)'], ['UPI', 'UPI / GPay'], ['CASH', 'Cash (up to ' + money(D.settings.cashLimit) + ')']].map(function (m) {
      return h('label', { class: 'row', style: 'gap:6px;cursor:pointer;border:1.5px solid var(--line);border-radius:9px;padding:7px 11px' }, h('input', { type: 'radio', name: 'pm', value: m[0], checked: method === m[0], onchange: function () { method = m[0]; paint(); } }), m[1]);
    }));
    var bankBox = h('div', { class: 'grid g2' }, field('Account holder name', f.accName, true), field('Account number', f.accNo, true), h('div', { id: 'acc2wrap' }, field('Confirm account number', f.accNo2, true, 'Needed when the number is typed by hand.')), field('IFSC', f.ifsc, true), field('Bank', f.bank), field('Branch', f.branch));
    var ifscMsg = h('div', { class: 'small muted', style: 'grid-column:1/-1' }); bankBox.appendChild(ifscMsg);
    var upiBox = h('div', { class: 'grid g2' }, field('UPI ID', f.upi, false, 'Either the UPI ID or the number is enough.'), field('GPay / PhonePe number', f.phone));
    var srcNote = h('div'), readBox = h('div', { class: 'small muted' }), savedBox = h('div');
    var bc = h('div'), expWrap = h('div', { hidden: true }, field('Explanation note', f.explanation, true), h('div', { id: 'expFb' }));
    var msg = h('div', { class: 'msg' });
    var dl = h('datalist', { id: 'payeeList' }, payees.map(function (p) { return h('option', { value: p.name }); }));
    function setSource(s) { source = s; paint(); }
    ['accNo', 'ifsc', 'accName', 'upi', 'phone'].forEach(function (k) { f[k].addEventListener('input', function () { if (source !== 'MANUAL') setSource('MANUAL'); }); });
    function paint() {
      bankBox.hidden = method !== 'BANK'; upiBox.hidden = method !== 'UPI';
      $('acc2wrap') && ($('acc2wrap').hidden = source !== 'MANUAL');
      srcNote.replaceChildren(method === 'CASH' ? '' : source === 'AUTO' ? h('div', { class: 'note warn' }, 'Payment details were read from the bill automatically. Check them digit by digit against the bill.') : source === 'SAVED' ? h('div', { class: 'note info' }, 'Using the payee details saved from an earlier verified payment.') : h('div', { class: 'note' }, method === 'BANK' ? 'Entered by hand – re-type the account number to confirm.' : 'Entered by hand – check the UPI ID / number carefully.'));
      budget();
    }
    function budget() {
      var r = f.head.value ? liveCheck(f.head.value, Number(f.amount.value) || 0, e.id) : null; bc.replaceChildren();
      if (!r) { bc.appendChild(h('div', { class: 'small muted' }, 'Choose the head and amount to see the budget check.')); expWrap.hidden = true; return; }
      if (r.kind !== 'EXPENSE') { bc.appendChild(h('div', { class: 'note info' }, 'Deposit refund – no budget check. Held for this head: ' + money(r.actual) + '.')); expWrap.hidden = true; return; }
      bc.appendChild(h('div', { class: 'bcheck' }, [['Budget', r.budget], ['Spent', r.actual], ['Committed', r.committed], ['Available', r.available], ['After this order', r.after]].map(function (x) { return h('div', null, h('span', null, x[0]), h('b', { style: x[1] < 0 ? 'color:var(--red)' : '' }, money(x[1]))); })));
      if (r.expKind === 'OUTBOUND') bc.appendChild(h('div', { class: 'note bad' }, h('b', null, 'Outbound expense – this head has no budget. '), 'An explanation note is required; an Admin gives the final approval.'));
      else if (r.expKind === 'OVER') bc.appendChild(h('div', { class: 'note bad' }, h('b', null, 'Over budget by ' + money(r.overBy) + '. '), 'Write a clear explanation for the over-spending; Finance must review and acknowledge it before approving.'));
      else if (f.amount.value) bc.appendChild(h('div', { class: 'note ok' }, 'Within budget.'));
      expWrap.hidden = !r.expKind; if (r.expKind) fb();
    }
    function fb() {
      var box = $('expFb'); if (!box) return; var t = f.explanation.value;
      if (!t.trim()) { box.replaceChildren(h('div', { class: 'small muted' }, 'At least one clear sentence giving the reason.')); return; }
      var ck = FinCore.checkExplanation(t, f.title.value + ' ' + f.description.value);
      box.replaceChildren(ck.ok ? h('div', { class: 'small', style: 'color:var(--ok)' }, '✓ The explanation reads as a clear reason.') : h('div', { class: 'note warn small' }, h('b', null, 'Not acceptable yet: '), ck.issues.join(' '), h('br'), ck.advice));
    }
    f.head.onchange = budget; f.amount.oninput = budget; f.explanation.oninput = fb;
    f.payee.addEventListener('change', function () {
      var p = payees.filter(function (x) { return x.name.toLowerCase() === f.payee.value.trim().toLowerCase(); });
      savedBox.replaceChildren(); if (!p.length) return;
      savedBox.appendChild(h('div', { class: 'note info' }, 'Saved details for ' + p[0].name + ': ', p.map(function (x) {
        return h('button', { class: 'btn sm ghost', style: 'margin:4px', type: 'button', onclick: function () {
          if (x.accNo) { method = 'BANK'; f.accName.value = x.accName; f.accNo.value = x.accNo; f.ifsc.value = x.ifsc; f.bank.value = x.bank; f.branch.value = x.branch; }
          else { method = 'UPI'; f.upi.value = x.upi; f.phone.value = x.phone; }
          rad.querySelectorAll('input').forEach(function (r) { r.checked = r.value === method; }); setSource('SAVED');
        } }, x.accNo ? 'A/c XXXX' + x.accNo.slice(-4) + ' · ' + x.ifsc : 'UPI ' + (x.upi || x.phone));
      })));
    });
    f.ifsc.addEventListener('input', function () { f.ifsc.value = f.ifsc.value.toUpperCase().replace(/\s/g, ''); if (f.ifsc.value.length === 11) ifscLookup(); else ifscMsg.textContent = ''; });
    function ifscLookup() {
      var code = f.ifsc.value;
      if (!FinCore.validIfsc(code)) { ifscMsg.textContent = '⚠ This is not a valid IFSC format.'; ifscMsg.style.color = 'var(--red)'; return; }
      ifscMsg.style.color = ''; ifscMsg.textContent = 'Looking up the branch…';
      fetch('https://ifsc.razorpay.com/' + code).then(function (r) { if (r.status === 404) throw new Error('nf'); if (!r.ok) throw new Error('x'); return r.json(); }).then(function (j) {
        if (j.BANK) f.bank.value = j.BANK; if (j.BRANCH) f.branch.value = j.BRANCH + (j.CITY ? ', ' + j.CITY : '');
        ifscMsg.style.color = 'var(--ok)'; ifscMsg.textContent = '✓ ' + j.BANK + ' – ' + j.BRANCH + (j.CITY ? ', ' + j.CITY : '');
      }).catch(function (er) { ifscMsg.style.color = er.message === 'nf' ? 'var(--red)' : ''; ifscMsg.textContent = er.message === 'nf' ? '⚠ No bank branch has this IFSC – check it.' : 'Branch lookup is not available right now; fill in the bank name.'; });
    }
    f.file.onchange = function () {
      var file = f.file.files[0]; if (!file) return;
      readBox.replaceChildren(h('span', { class: 'spin' }), ' Reading the bill for payment details…');
      readText(file).then(function (r) {
        if (!r.ok) { readBox.replaceChildren(h('div', { class: 'note warn' }, 'The bill could not be read automatically. Enter the payee account / UPI details by hand.')); return; }
        var p = FinCore.parsePayee(r.text), found = [];
        if (p.ifsc && p.accNo) { method = 'BANK'; f.accNo.value = p.accNo; f.ifsc.value = p.ifsc; if (p.accName) f.accName.value = p.accName; else if (!f.accName.value) f.accName.value = f.payee.value; if (p.bank) f.bank.value = p.bank; found.push('A/c ' + p.accNo, 'IFSC ' + p.ifsc); if (p.accName) found.push(p.accName); ifscLookup(); }
        else if (p.upi || p.phone) { method = 'UPI'; f.upi.value = p.upi; f.phone.value = p.phone; if (p.upi) found.push('UPI ' + p.upi); if (p.phone) found.push('GPay ' + p.phone); }
        if (p.invoiceNo && !f.invoiceNo.value) { f.invoiceNo.value = p.invoiceNo; found.push('Bill no ' + p.invoiceNo); }
        if (p.invoiceDate && !f.invoiceDate.value && p.invoiceDate <= today()) { f.invoiceDate.value = p.invoiceDate; found.push('Date ' + dmy(p.invoiceDate)); }
        if (p.amount && !f.amount.value) { f.amount.value = p.amount; found.push('Total ' + money(p.amount)); }
        rad.querySelectorAll('input').forEach(function (x) { x.checked = x.value === method; });
        if (p.accNo || p.upi || p.phone) { readBox.replaceChildren(h('div', { class: 'found' }, h('b', null, 'Found on the bill: '), found.map(function (x) { return pill(x, 'ok'); }))); source = 'AUTO'; }
        else readBox.replaceChildren(h('div', { class: 'note warn' }, 'No bank account or UPI details were found on this bill' + (found.length ? ' (read: ' + found.join(', ') + ')' : '') + '. Enter them by hand below.'));
        paint();
      });
    };
    var body = h('div', { class: 'steps' }, dl,
      e.status === 'QUERY' ? h('div', { class: 'note warn' }, h('b', null, 'Query from ' + (e.history || []).slice(-1).map(function (x) { return x.by; })[0] + ': '), e.remarks) : null,
      h('section', null, h('h3', null, 'Basic details'), h('div', { class: 'grid g2' }, field('Budget head', f.head, true), field('Title', f.title, true), field('Payee', f.payee, true), field('Amount (₹)', f.amount, true), field('Invoice / bill no.', f.invoiceNo, true), field('Invoice / bill date', f.invoiceDate, true)), field('Description', f.description)),
      h('section', null, h('h3', null, 'Invoice / bill'), field(existing ? 'Replace the bill (optional)' : 'Upload the bill', f.file, !existing, 'Photo or PDF. Bank account / IFSC / UPI on the bill are read automatically.'), readBox, existing && e.invoiceFile ? h('div', { class: 'small' }, 'Current bill: ', link(e.invoiceFile, 'open ↗')) : null),
      h('section', null, h('h3', null, 'Payee payment details'), savedBox, rad, srcNote, bankBox, upiBox),
      h('section', null, h('h3', null, 'Budget check'), bc, expWrap),
      existing ? field('Reply to the query', f.reply) : null,
      h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn sf', onclick: function (ev) { submit(ev.currentTarget); } }, existing ? 'Resubmit for approval' : 'Submit for approval'), h('span', { class: 'small muted' }, 'Fields marked * are required.')), msg);
    function submit(btn) {
      quiet(run(btn, msg, function () {
        var file = f.file.files[0];
        return (file ? readFile(file) : Promise.resolve(null)).then(function (pf) {
          var d = { head: f.head.value, title: f.title.value, description: f.description.value, payee: f.payee.value, invoiceNo: f.invoiceNo.value, invoiceDate: f.invoiceDate.value, amount: f.amount.value, payMethod: method,
            accName: f.accName.value, accNo: f.accNo.value, ifsc: f.ifsc.value, bank: f.bank.value, branch: f.branch.value, upi: f.upi.value, phone: f.phone.value, detailsSource: source, explanation: f.explanation.value, invoiceFile: pf, reply: f.reply.value };
          if (method === 'BANK' && source === 'MANUAL') d.accNo2 = f.accNo2.value;
          var r = liveCheck(d.head, Number(d.amount) || 0, e.id);
          if (r && r.expKind) { var ck = FinCore.checkExplanation(d.explanation, d.title + ' ' + d.description); if (!ck.ok) throw new Error('Please mention a clear and valid reason for the ' + (r.expKind === 'OVER' ? 'over-spending' : 'outbound expense') + ': ' + ck.issues.join(' ')); }
          return existing ? act('expenseUpdate', e.id, d) : act('expenseCreate', d);
        });
      }, function (r) { return r.id + (existing ? ' resubmitted' : ' submitted for approval'); }).then(function (r) { close(); expenseView(r.id); }));
    }
    var close = modal(existing ? 'Edit expense order ' + e.id : 'New expense order', body, true);
    paint();
  }
  function expenseView(id) {
    var x = D.expenses.filter(function (k) { return k.id === id; })[0]; if (!x) return;
    var me = D.me, mine = x.createdBy === me.id, msg = h('div', { class: 'msg' });
    var pay = x.payMethod === 'BANK' ? h('dl', { class: 'kv' }, h('dt', null, 'Account name'), h('dd', null, x.accName, copyBtn(x.accName)), h('dt', null, 'Account no.'), h('dd', { class: 'mono' }, x.accNo, copyBtn(x.accNo)), h('dt', null, 'IFSC'), h('dd', { class: 'mono' }, x.ifsc, copyBtn(x.ifsc)), h('dt', null, 'Bank / branch'), h('dd', null, [x.bank, x.branch].filter(Boolean).join(', ') || '–'))
      : x.payMethod === 'UPI' ? h('dl', { class: 'kv' }, x.upi ? [h('dt', null, 'UPI ID'), h('dd', { class: 'mono' }, x.upi, copyBtn(x.upi))] : null, x.phone ? [h('dt', null, 'GPay / PhonePe'), h('dd', { class: 'mono' }, x.phone, copyBtn(x.phone))] : null, h('dt', null, 'Name'), h('dd', null, x.accName || x.payee)) : h('p', null, 'Cash payment');
    var live = liveCheck(x.head, x.amount, x.id);
    var body = h('div', null,
      h('div', { class: 'row sp-b' }, h('div', null, stPill(x.status, 'exp'), ' ', x.expKind ? pill(x.expKind === 'OVER' ? 'Over budget by ' + money(x.overBy) : 'Outbound – not budgeted', 'bad') : pill('Within budget', 'ok')), h('div', { class: 'amt', style: 'font:800 26px var(--display)' }, money(x.amount))),
      h('dl', { class: 'kv', style: 'margin-top:10px' }, h('dt', null, 'Title'), h('dd', null, x.title), x.description ? [h('dt', null, 'Description'), h('dd', null, x.description)] : null, h('dt', null, 'Head'), h('dd', null, headName(x.head)), h('dt', null, 'Payee'), h('dd', null, x.payee),
        h('dt', null, 'Bill'), h('dd', null, x.invoiceNo + ' dated ' + dmy(x.invoiceDate) + ' · ', link(x.invoiceFile, 'Open bill ↗')), h('dt', null, 'Raised by'), h('dd', null, nameOf(x.createdBy) + ' · ' + dmy(x.createdAt)),
        h('dt', null, 'Payment details'), h('dd', null, { AUTO: 'Read from the bill', SAVED: 'Saved payee', MANUAL: 'Entered by hand' }[x.detailsSource] || x.detailsSource),
        x.voucherNo ? [h('dt', null, 'Voucher / ledger'), h('dd', null, x.voucherNo + ' · ' + x.ledgerNo + ' · ' + x.paidMode + (x.utr ? ' · ' + x.utr : '') + ' · ' + dmy(x.paidOn))] : null, x.paidProof ? [h('dt', null, 'Payment proof'), h('dd', null, link(x.paidProof))] : null),
      h('h3', { style: 'margin-top:12px' }, 'Payee details'), pay,
      h('h3', { style: 'margin-top:12px' }, 'Budget vs actual'),
      h('div', { class: 'bcheck' }, [['Budget', x.budget], ['Spent (at submission)', x.actual], ['Committed (at submission)', x.committed], ['This order', x.amount], [live && live.kind === 'EXPENSE' ? 'Available now (excl. this)' : 'Deposit held', live ? (live.kind === 'EXPENSE' ? live.available : live.actual) : 0]].map(function (k) { return h('div', null, h('span', null, k[0]), h('b', { style: k[1] < 0 ? 'color:var(--red)' : '' }, money(k[1]))); })),
      x.expKind ? h('div', { class: 'note bad' }, h('b', null, (x.expKind === 'OVER' ? 'Explanation for over-spending (' + money(x.overBy) + ')' : 'Explanation for this outbound expense') + ':'), h('div', { style: 'white-space:pre-wrap;margin-top:4px;color:var(--ink)' }, x.explanation),
        x.ackBy ? h('div', { class: 'small', style: 'margin-top:6px;color:var(--ok)' }, '✓ Acknowledged by ' + x.ackBy + ' on ' + dmy(x.ackAt)) : null) : null,
      h('h3', { style: 'margin-top:12px' }, 'Trail'), h('ul', { class: 'timeline' }, (x.history || []).map(function (k) { return h('li', null, h('b', null, k.action), ' – ' + k.by + ' · ' + dmy(k.at), k.note ? h('div', { class: 'small muted' }, k.note) : null); })));
    var acts = h('div', { style: 'border-top:2px solid var(--line);margin-top:12px;padding-top:10px' });
    var stage = x.status === 'SUBMITTED' && can('decideExpense') && !mine ? 'FIN' : x.status === 'AWAITING_ADMIN' && is('ADMIN') && !mine && !samePerson(x.approvedBy) ? 'ADM' : '';
    if (stage) {
      var nowOver = live && live.kind === 'EXPENSE' && live.expKind && !x.expKind;
      var ack = h('input', { type: 'checkbox', id: 'ackBox' }), rm = inp({ placeholder: stage === 'FIN' ? 'Remarks (needed to send back or reject)' : 'Remarks' });
      var ok = h('button', { class: 'btn ok', disabled: !!x.expKind || nowOver }, stage === 'FIN' ? (FinCore.needsAdmin(D.settings, x) ? 'Verify & send for Admin approval' : 'Verify & approve for payment') : 'Give Admin approval');
      ack.onchange = function () { ok.disabled = !ack.checked || nowOver; };
      acts.appendChild(h('h3', null, stage === 'FIN' ? 'Verify this order' : 'Second approval (Admin)'));
      acts.appendChild(h('div', { class: 'small muted' }, 'Check the bill, payee details and amount. ' + (stage === 'FIN' ? 'Budget is re-checked now against the latest position.' : '')));
      if (nowOver) acts.appendChild(h('div', { class: 'note bad' }, 'Since this order was raised, the head has gone ' + (live.expKind === 'OVER' ? 'over the budget by ' + money(live.overBy) : 'out of budget') + '. Send it back with a query so the creator adds an explanation note.'));
      if (x.expKind) acts.appendChild(h('label', { class: 'note warn', style: 'display:flex;gap:10px;align-items:flex-start;cursor:pointer', for: 'ackBox' }, ack, h('span', null, 'I have read the explanation note for the ' + (x.expKind === 'OVER' ? 'over-spending' : 'outbound expense') + ' and accept it as a valid reason.')));
      ok.onclick = function () { quiet(run(ok, msg, function () { return act('expenseDecide', x.id, 'APPROVE', rm.value, !!ack.checked); }, x.id + ' approved').then(function () { closeV(); expenseView(x.id); })); };
      acts.appendChild(rm);
      acts.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, ok,
        h('button', { class: 'btn', onclick: function (ev) { quiet(run(ev.currentTarget, msg, function () { return act('expenseDecide', x.id, 'QUERY', rm.value, false); }, x.id + ' sent back').then(function () { closeV(); })); } }, 'Send back with query'),
        h('button', { class: 'btn no', onclick: function (ev) { if (!confirm('Reject ' + x.id + '? This cannot be undone; the creator must raise a new order.')) return; quiet(run(ev.currentTarget, msg, function () { return act('expenseDecide', x.id, 'REJECT', rm.value, false); }, x.id + ' rejected').then(function () { closeV(); })); } }, 'Reject')));
    } else if (x.status === 'SUBMITTED' && mine && can('decideExpense')) acts.appendChild(h('p', { class: 'small muted' }, 'This order was raised with this profile, so it is verified with the Expense approval code.'));
    else if (x.status === 'AWAITING_ADMIN' && is('ADMIN') && (mine || samePerson(x.approvedBy))) acts.appendChild(h('p', { class: 'small muted' }, 'The Admin approval must come from a different person than the one who verified it.'));
    if (x.status === 'APPROVED' && can('pay')) acts.appendChild(payPanel(x, msg));
    if (mine && (x.status === 'SUBMITTED' || x.status === 'QUERY')) acts.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn sf', onclick: function () { closeV(); expenseForm(x); } }, x.status === 'QUERY' ? 'Answer the query & resubmit' : 'Edit')));
    if ((mine || can('admin')) && ['SUBMITTED', 'QUERY', 'AWAITING_ADMIN', 'APPROVED'].indexOf(x.status) >= 0) acts.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn ghost sm', onclick: function (ev) { var r = prompt('Reason for cancelling ' + x.id + '?'); if (r == null) return; quiet(run(ev.currentTarget, msg, function () { return act('expenseCancel', x.id, r); }, x.id + ' cancelled').then(function () { closeV(); })); } }, 'Cancel this order')));
    if (x.status === 'PAID') { var l = D.ledger.filter(function (k) { return k.no === x.ledgerNo; })[0];
      acts.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn sf', onclick: function () { voucherDoc(x); } }, 'Payment voucher'),
        can('admin') && l && !l.reversedBy && l.reconType !== 'BANK' ? h('button', { class: 'btn ghost sm', onclick: function (ev) { var r = prompt('Reason for reversing payment ' + x.voucherNo + ' (e.g. payment failed / returned)?'); if (r == null) return; quiet(run(ev.currentTarget, msg, function () { return act('ledgerReverse', x.ledgerNo, r); }, 'Payment reversed').then(function () { closeV(); })); } }, 'Reverse payment') : null)); }
    acts.appendChild(msg); body.appendChild(acts);
    var closeV = modal(x.id + ' · ' + x.title, body, true);
  }
  function payPanel(x, msg) {
    var mode = sel(D.payModes, x.payMethod === 'UPI' ? 'UPI' : x.payMethod === 'CASH' ? 'Cash' : 'NEFT'), date = inp({ type: 'date', max: today(), value: today() }), utr = inp({ placeholder: 'UTR / UPI ref / cheque no.' }), proof = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf' });
    var readMsg = h('div', { class: 'small muted' });
    proof.onchange = function () { var file = proof.files[0]; if (!file) return; readMsg.textContent = 'Reading the payment screenshot…'; readText(file).then(function (r) { if (r.ok && r.utr && !utr.value) { utr.value = r.utr; readMsg.textContent = 'Reference read: ' + r.utr + (r.amount && Math.abs(r.amount - x.amount) > 0.01 ? ' · ⚠ amount on the screenshot is ' + money(r.amount) : '') + '. Please check.'; } else readMsg.textContent = r.ok ? 'No reference found – type it in.' : ''; }); };
    var upiLink = x.payMethod === 'UPI' && x.upi ? 'upi://pay?pa=' + encodeURIComponent(x.upi) + '&pn=' + encodeURIComponent(x.accName || x.payee) + '&am=' + x.amount.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent('KNPL-7 ' + x.id) : '';
    var btn = h('button', { class: 'btn ok' }, 'Record payment');
    btn.onclick = function () {
      if (!confirm('Record payment of ' + money(x.amount) + ' to ' + x.payee + '? A voucher number is issued and the ledger is updated.')) return;
      quiet(run(btn, msg, function () { var file = proof.files[0]; return (file ? readFile(file) : Promise.resolve(null)).then(function (pf) { return act('expensePay', x.id, { mode: mode.value, date: date.value, utr: utr.value, amount: x.amount, proof: pf }); }); }, 'Payment recorded').then(function (r) { if (modalStack.length) modalStack[modalStack.length - 1](); voucherDoc(r); }));
    };
    return h('div', null, h('h3', null, 'Make the payment'),
      h('div', { class: 'note info' }, 'Pay ' + money(x.amount) + ' to ' + x.payee + ' using the payee details above' + (x.payMethod === 'UPI' && x.phone && !x.upi ? ' (GPay / PhonePe number ' + x.phone + ')' : '') + ', then record the transaction here.'),
      upiLink ? h('a', { class: 'btn sf', href: upiLink, style: 'margin-bottom:8px' }, 'Open UPI app to pay ' + money(x.amount)) : null,
      upiLink ? h('div', { class: 'small muted' }, 'The UPI button works on a phone with a UPI app.') : null,
      h('div', { class: 'grid g3' }, field('Mode', mode, true), field('Paid on', date, true), field('Transaction reference', utr, true)), field('Payment proof (optional)', proof), readMsg,
      h('div', { class: 'row', style: 'margin-top:8px' }, btn));
  }

  /* --------------------------------------------------------------- budget */
  function vBudget(v) {
    var T = D.summary.totals, S = D.settings;
    v.appendChild(h('div', { class: 'grid g4', style: 'margin-bottom:12px' },
      kpi('Income target', money(T.incTarget), 'Received ' + money(T.incReceived) + ' · gap ' + money(T.incTarget - T.incReceived)),
      kpi('Expense budget', money(T.expBudget), 'Spent ' + money(T.expActual) + ' · committed ' + money(T.expCommitted)),
      kpi('Budget still free', money(T.expBudget - T.expActual - T.expCommitted), 'Budget − spent − committed', T.expBudget - T.expActual - T.expCommitted < 0),
      kpi('Planned surplus', money(T.projectedSurplus), 'Target ' + money(S.targetSurplus) + ' · ' + (T.projectedSurplus >= S.targetSurplus ? 'on plan' : 'short by ' + money(S.targetSurplus - T.projectedSurplus)), T.projectedSurplus < S.targetSurplus)));
    [['INCOME', 'Income heads – target vs received'], ['EXPENSE', 'Expense heads – budget vs actual'], ['DEPOSIT', 'Deposits (refundable)']].forEach(function (k) {
      var rows = D.summary.heads.filter(function (r) { return r.kind === k[0]; }); if (!rows.length) return;
      var t = h('table', { class: 't' }), hd = h('tr', null, h('th', null, 'Code'), h('th', null, 'Head'));
      if (k[0] === 'INCOME') ['Target', 'Received', 'Awaiting approval', 'Gap'].forEach(function (x) { hd.appendChild(h('th', { class: 'num' }, x)); });
      else if (k[0] === 'EXPENSE') { ['Budget', 'Spent', 'Committed'].forEach(function (x) { hd.appendChild(h('th', { class: 'num' }, x)); }); hd.appendChild(h('th', { style: 'min-width:130px' }, 'Utilisation')); hd.appendChild(h('th', { class: 'num' }, 'Available')); }
      else ['Expected', 'Received', 'Refunded', 'Held'].forEach(function (x) { hd.appendChild(h('th', { class: 'num' }, x)); });
      if (can('admin')) hd.appendChild(h('th', null, '')); t.appendChild(hd);
      var tot = { b: 0, a: 0, c: 0, p: 0, i: 0, o: 0 };
      rows.forEach(function (r) {
        var head = D.heads.filter(function (x) { return x.code === r.code; })[0];
        var tr = h('tr', { style: r.active ? '' : 'opacity:.55' }, h('td', { class: 'mono' }, r.code), h('td', null, r.name, head && head.note ? h('div', { class: 'small muted' }, head.note) : null, r.active ? null : pill('inactive')));
        tot.b += r.budget; tot.a += r.actual; tot.c += r.committed; tot.p += r.pending; tot.i += r.inflow; tot.o += r.outflow;
        if (k[0] === 'INCOME') [r.budget, r.actual, r.pending, r.gap].forEach(function (x, j) { tr.appendChild(h('td', { class: 'num', style: j === 3 && x > 0 ? 'color:var(--amber)' : '' }, money(x))); });
        else if (k[0] === 'EXPENSE') { [r.budget, r.actual, r.committed].forEach(function (x) { tr.appendChild(h('td', { class: 'num' }, money(x))); }); tr.appendChild(h('td', null, meter(r.actual, r.committed, r.budget, r.name), h('div', { class: 'meterlbl' }, r.util == null ? 'Not budgeted' : r.util + '%'))); tr.appendChild(h('td', { class: 'num', style: r.available < 0 ? 'color:var(--red);font-weight:700' : '' }, money(r.available))); }
        else [r.budget, r.inflow, r.outflow, r.held].forEach(function (x) { tr.appendChild(h('td', { class: 'num' }, money(x))); });
        if (can('admin')) tr.appendChild(h('td', null, h('button', { class: 'btn ghost sm', onclick: function () { headForm(head); } }, 'Edit')));
        t.appendChild(tr);
      });
      var tr = h('tr', { class: 'tot' }, h('td', null, ''), h('td', null, 'Total'));
      (k[0] === 'INCOME' ? [tot.b, tot.a, tot.p, tot.b - tot.a] : k[0] === 'EXPENSE' ? [tot.b, tot.a, tot.c] : [tot.b, tot.i, tot.o, tot.i - tot.o]).forEach(function (x) { tr.appendChild(h('td', { class: 'num' }, money(x))); });
      if (k[0] === 'EXPENSE') { tr.appendChild(h('td', null, '')); tr.appendChild(h('td', { class: 'num' }, money(tot.b - tot.a - tot.c))); }
      if (can('admin')) tr.appendChild(h('td', null, '')); t.appendChild(tr);
      v.appendChild(h('div', { class: 'card' }, h('div', { class: 'row sp-b' }, h('h3', null, k[1]), can('admin') && k[0] === 'EXPENSE' ? h('button', { class: 'btn sm sf', onclick: function () { headForm(null); } }, '+ Add head') : null), h('div', { class: 'tw' }, t)));
    });
    v.appendChild(h('p', { class: 'small muted' }, 'Committed = orders raised, verified or approved but not yet paid. An expense head with budget ₹0 treats every order as outbound (explanation + Admin approval). Budget changes are recorded in the audit trail.'));
  }
  function headForm(x) {
    x = x || { code: '', name: '', kind: 'EXPENSE', budget: 0, note: '', owner: '', active: true };
    var f = { code: inp({ value: x.code, readOnly: !!x.code, style: 'text-transform:uppercase', placeholder: 'e.g. EXP-FOOD' }), name: inp({ value: x.name }), kind: sel(Object.keys(D.kinds).map(function (k) { return [k, D.kinds[k]]; }), x.kind),
      budget: inp({ type: 'number', min: '0', step: '1', value: x.budget }), note: inp({ value: x.note, placeholder: 'how the budget was worked out' }), owner: inp({ value: x.owner, placeholder: 'committee member responsible' }), active: h('input', { type: 'checkbox', checked: x.active !== false }) };
    var msg = h('div', { class: 'msg' });
    var close = modal(x.code ? 'Edit head ' + x.code : 'Add budget head', h('div', null, h('div', { class: 'grid g2' }, field('Code', f.code, true), field('Name', f.name, true), field('Type', f.kind, true), field(x.kind === 'INCOME' ? 'Target (₹)' : 'Budget (₹)', f.budget, true), field('Basis / note', f.note), field('Responsible', f.owner)),
      h('label', { class: 'row', style: 'margin-top:10px' }, f.active, ' Active (inactive heads cannot be used for new entries)'),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn sf', onclick: function (ev) { quiet(run(ev.currentTarget, msg, function () { return act('headSave', { code: f.code.value, name: f.name.value, kind: f.kind.value, budget: f.budget.value, note: f.note.value, owner: f.owner.value, active: f.active.checked }); }, 'Head saved').then(function () { close(); })); } }, 'Save')), msg));
  }

  /* ----------------------------------------------------------------- bank */
  function vBank(v) {
    var R = D.recon, canB = can('bank');
    v.appendChild(h('div', { class: 'grid g4', style: 'margin-bottom:12px' },
      kpi('Balance as per books', money(R.bookBalance), 'Cash held outside bank ' + money(R.cashNet)),
      kpi('Balance as per bank', R.bankBalance == null ? '–' : money(R.bankBalance), R.bankLines + ' statement lines imported'),
      kpi('Difference', R.difference == null ? '–' : money(R.difference), R.difference === 0 ? (R.complete ? 'Bank agrees with the books' : 'Agrees after the open items below') : 'Expected bank ' + money(R.expectedBank) + ' – check the open items', R.difference != null && R.difference !== 0),
      kpi('Reconciled', R.reconciled + ' / ' + R.entries, R.complete ? '✓ Everything reconciled' : R.unreconciled + ' ledger entries · ' + R.bankOpen + ' bank lines open', !R.complete)));
    if (canB) v.appendChild(importCard());
    // bank lines
    var c = h('div', { class: 'card' }, h('div', { class: 'row sp-b' }, h('h3', null, 'Bank statement lines'), canB ? h('button', { class: 'btn sm', onclick: function (ev) { quiet(run(ev.currentTarget, null, function () { return act('bankAutoMatch'); }, function (n) { return n + ' line(s) matched by reference'; })); } }, 'Run auto-match') : null));
    c.appendChild(h('p', { class: 'small muted' }, 'Auto-match pairs a bank line with a ledger entry when the amount is the same and the transaction reference appears in the narration. Receipts uploaded without a reference are matched by hand (suggestions by amount, date and name).'));
    var F = [['OPEN', 'Open'], ['MATCHED', 'Matched'], ['IGNORED', 'Not in ledger'], ['ALL', 'All']];
    c.appendChild(h('div', { class: 'chips' }, F.map(function (f) { var n = D.bank.filter(function (b) { return f[0] === 'ALL' || b.status === f[0]; }).length; return h('button', { 'aria-pressed': UI.bank === f[0] ? 'true' : 'false', onclick: function () { UI.bank = f[0]; render(); } }, f[1] + ' (' + n + ')'); })));
    var q = inp({ placeholder: 'Search narration, reference, amount…', value: UI.bankQ, oninput: function () { UI.bankQ = q.value; draw(); } }); c.appendChild(q);
    var tw = h('div', { class: 'tw', style: 'margin-top:8px' }); c.appendChild(tw); v.appendChild(c);
    function draw() {
      var qq = UI.bankQ.toLowerCase(), t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Narration'), h('th', { class: 'num' }, 'Debit'), h('th', { class: 'num' }, 'Credit'), h('th', { class: 'num' }, 'Balance'), h('th', null, 'Status'), h('th', null, '')));
      var list = D.bank.filter(function (b) { return (UI.bank === 'ALL' || b.status === UI.bank) && (!qq || [b.id, b.narration, b.ref, b.debit, b.credit, b.ledgerNos, b.note].join(' ').toLowerCase().indexOf(qq) >= 0); }).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
      list.slice(0, 300).forEach(function (b) {
        var acts = h('td', { class: 'nowrap' });
        if (canB && b.status === 'OPEN') {
          acts.appendChild(h('button', { class: 'btn sm', onclick: function () { matchDlg(b); } }, 'Match…'));
          if (b.credit > 0) acts.appendChild(h('button', { class: 'btn ghost sm', style: 'margin-left:4px', title: 'Money received that is not in the books yet', onclick: function () { incomeForm({ bankId: b.id, amount: b.credit, paidOn: b.date, utr: b.ref || '', narration: b.narration, head: 'INC-OTHER', mode: 'NEFT' }); } }, '+ Income'));
          if (b.debit > 0) acts.appendChild(h('button', { class: 'btn ghost sm', style: 'margin-left:4px', title: 'Raise an expense order for a bank debit (e.g. bank charges)', onclick: function () { expenseForm(null, { head: 'EXP-BANK', title: b.narration.slice(0, 80), payee: 'Bank', amount: b.debit, invoiceNo: b.ref || 'No number', invoiceDate: b.date, payMethod: 'CASH' }); } }, '+ Expense'));
          acts.appendChild(h('button', { class: 'btn ghost sm', style: 'margin-left:4px', onclick: function (ev) { var r = prompt('Why is this line not part of the ledger? (e.g. opening balance, transfer between own accounts)'); if (r == null) return; quiet(run(ev.currentTarget, null, function () { return act('bankIgnore', b.id, r); }, 'Marked')); } }, 'Not in ledger'));
        } else if (canB) acts.appendChild(h('button', { class: 'btn ghost sm', onclick: function (ev) { if (!confirm('Undo the match for ' + b.id + '?')) return; quiet(run(ev.currentTarget, null, function () { return act('bankUnmatch', b.id); }, 'Unmatched')); } }, 'Undo'));
        t.appendChild(h('tr', null, h('td', { class: 'nowrap' }, dmy(b.date), h('div', { class: 'small muted mono' }, b.id)), h('td', null, b.narration, b.ref ? h('div', { class: 'small muted' }, 'Ref ' + b.ref) : null),
          h('td', { class: 'num' }, b.debit ? money(b.debit) : ''), h('td', { class: 'num' }, b.credit ? money(b.credit) : ''), h('td', { class: 'num' }, b.balance == null ? '' : money(b.balance)),
          h('td', null, b.status === 'MATCHED' ? pill('✓ ' + b.ledgerNos, 'ok') : b.status === 'IGNORED' ? pill('Not in ledger', 'info') : pill('Open', 'warn'), b.status === 'MATCHED' ? h('div', { class: 'small muted' }, b.matchType) : b.note ? h('div', { class: 'small muted' }, b.note) : null), acts));
      });
      tw.replaceChildren(list.length ? t : h('div', { class: 'empty' }, D.bank.length ? 'Nothing here.' : 'No bank statement imported yet.'));
    }
    draw();
    // unreconciled ledger
    var un = D.ledger.filter(function (l) { return !l.reversedBy && !l.reversalOf && l.amount > 0 && (!l.reconType || l.reconType === 'CASH'); });
    var t2 = h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Entry'), h('th', null, 'Party'), h('th', null, 'Reference'), h('th', { class: 'num' }, 'Receipt'), h('th', { class: 'num' }, 'Payment'), h('th', null, 'Status'), h('th', null, '')));
    un.forEach(function (l) {
      t2.appendChild(h('tr', null, h('td', { class: 'nowrap' }, dmy(l.date)), h('td', { class: 'mono' }, l.no), h('td', null, l.party, h('div', { class: 'small muted' }, headName(l.head))), h('td', { class: 'mono' }, l.utr || h('span', { class: 'muted' }, 'none')),
        h('td', { class: 'num' }, l.dir === 'IN' ? money(l.amount) : ''), h('td', { class: 'num' }, l.dir === 'OUT' ? money(l.amount) : ''),
        h('td', null, l.reconType === 'CASH' ? [pill('Cash / no bank', 'info'), h('div', { class: 'small muted' }, l.reconNote)] : pill('Not in bank yet', 'warn')),
        h('td', null, !canB ? null : l.reconType === 'CASH' ? h('button', { class: 'btn ghost sm', onclick: function (ev) { quiet(run(ev.currentTarget, null, function () { return act('ledgerCashRecon', l.no, '', true); }, 'Undone')); } }, 'Undo')
          : h('button', { class: 'btn ghost sm', onclick: function (ev) { var r = prompt('Why does ' + l.no + ' have no bank line? (e.g. cash received and kept by the treasurer)'); if (r == null) return; quiet(run(ev.currentTarget, null, function () { return act('ledgerCashRecon', l.no, r, false); }, 'Marked')); } }, 'Cash / no bank line'))));
    });
    v.appendChild(h('div', { class: 'card' }, h('h3', null, 'Ledger entries not matched with the bank'), h('p', { class: 'small muted' }, 'Entries that are not in the bank yet, and cash entries that will never appear in the bank.'), un.length ? h('div', { class: 'tw' }, t2) : h('div', { class: 'empty' }, '✓ Every ledger entry is matched with the bank.')));
    // batches
    var batches = {}; D.bank.forEach(function (b) { batches[b.batch] = batches[b.batch] || { n: 0, open: 0 }; batches[b.batch].n++; if (b.status === 'OPEN') batches[b.batch].open++; });
    if (can('admin') && Object.keys(batches).length) v.appendChild(h('div', { class: 'card' }, h('h3', null, 'Imported statements'), Object.keys(batches).map(function (k) {
      return h('div', { class: 'row', style: 'padding:4px 0;border-bottom:1px solid var(--line)' }, h('span', { class: 'grow' }, k + ' – ' + batches[k].n + ' lines (' + batches[k].open + ' open)'),
        batches[k].open === batches[k].n ? h('button', { class: 'btn ghost sm', onclick: function (ev) { if (!confirm('Delete the whole import "' + k + '"?')) return; quiet(run(ev.currentTarget, null, function () { return act('bankDeleteBatch', k); }, 'Import deleted')); } }, 'Delete import') : h('span', { class: 'small muted' }, 'has matched lines'));
    })));
  }
  function importCard() {
    var file = h('input', { type: 'file', accept: '.csv,.txt,.tsv,.xls,.xlsx,text/csv' }), paste = h('textarea', { placeholder: 'Or paste the statement rows here (copy from Excel / the bank website, including the header row)', style: 'min-height:70px' });
    var name = inp({ placeholder: 'e.g. SBI Nov 2026' }), out = h('div'), msg = h('div', { class: 'msg' }), rows = null;
    function readRows() {
      var f = file.files[0];
      if (!f) return Promise.resolve(FinCore.splitCsv(paste.value));
      if (!name.value) name.value = f.name.replace(/\.\w+$/, '');
      if (/\.xlsx?$/i.test(f.name)) return loadXlsx().then(function (X) { return f.arrayBuffer().then(function (buf) { var wb = X.read(buf, { type: 'array', cellDates: false }); var ws = wb.Sheets[wb.SheetNames[0]]; return X.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }); }); });
      return f.text().then(FinCore.splitCsv);
    }
    function preview() {
      quiet(run(null, msg, function () {
        return readRows().then(function (r) {
          rows = r; if (!r.length) throw new Error('No rows found. Choose a statement file or paste the rows.');
          var det = FinCore.detectStatement(r); out.replaceChildren();
          var hi = det.headerRow != null ? det.headerRow : 0, KEYS = ['date', 'narration', 'ref', 'debit', 'credit', 'amount', 'type', 'balance'], S = {};
          KEYS.forEach(function (k) { S[k] = sel([['', '–']]); S[k].onchange = refresh; });
          function setCols(rowIdx) {
            var header = r[rowIdx] || [], map = FinCore.mapHeader(header), width = Math.max.apply(null, r.slice(rowIdx, rowIdx + 30).map(function (x) { return x.length; }).concat([header.length]));
            var cols = []; for (var i = 0; i < width; i++) cols.push([String(i), String(header[i] || '').trim() || 'Column ' + (i + 1)]);
            KEYS.forEach(function (k) { S[k].replaceChildren.apply(S[k], [['', '–']].concat(cols).map(function (o) { return h('option', { value: o[0] }, o[1]); })); S[k].value = map[k] != null ? String(map[k]) : ''; });
          }
          var hdr = sel(r.slice(0, 40).map(function (x, i) { return [String(i), 'Row ' + (i + 1) + ': ' + x.filter(function (c) { return String(c).trim(); }).slice(0, 4).join(' | ').slice(0, 60)]; }), String(hi));
          hdr.onchange = function () { setCols(Number(hdr.value)); refresh(); };
          setCols(hi);
          var pv = h('div'), go = h('button', { class: 'btn ok', disabled: true }, 'Import');
          out.appendChild(h('div', { class: det.header ? 'note ok' : 'note warn' }, det.header ? 'Columns detected – check them, then import.' : 'Could not detect the columns. Pick the header row and the columns.'));
          out.appendChild(h('div', { class: 'grid g4' }, field('Header row', hdr), field('Date', S.date, true), field('Narration', S.narration), field('Reference / cheque', S.ref), field('Debit / withdrawal', S.debit), field('Credit / deposit', S.credit), field('Or: single amount column', S.amount), field('Dr / Cr column', S.type), field('Balance', S.balance)));
          out.appendChild(pv); out.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, go));
          var lines = [];
          function refresh() {
            var m = {}; Object.keys(S).forEach(function (k) { if (S[k].value !== '') m[k] = Number(S[k].value); });
            if (m.date == null || (m.amount == null && (m.debit == null || m.credit == null))) { pv.replaceChildren(h('div', { class: 'small muted' }, 'Choose the date column and either debit + credit columns or an amount column.')); go.disabled = true; return; }
            var res = FinCore.statementLines(r.slice(Number(hdr.value) + 1), m); lines = res.lines;
            var cr = 0, dr = 0; lines.forEach(function (l) { cr += l.credit; dr += l.debit; });
            var t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Narration'), h('th', null, 'Ref'), h('th', { class: 'num' }, 'Debit'), h('th', { class: 'num' }, 'Credit'), h('th', { class: 'num' }, 'Balance')));
            lines.slice(0, 6).forEach(function (l) { t.appendChild(h('tr', null, h('td', null, dmy(l.date)), h('td', null, l.narration), h('td', null, l.ref), h('td', { class: 'num' }, l.debit ? money(l.debit) : ''), h('td', { class: 'num' }, l.credit ? money(l.credit) : ''), h('td', { class: 'num' }, l.balance == null ? '' : money(l.balance)))); });
            pv.replaceChildren(h('div', { class: 'small', style: 'margin:8px 0' }, lines.length + ' transaction lines read · credits ' + money(cr) + ' · debits ' + money(dr) + (res.skipped ? ' · ' + res.skipped + ' rows skipped (no date / amount, e.g. totals)' : '')), h('div', { class: 'tw' }, t));
            go.disabled = !lines.length;
          }
          go.onclick = function () { quiet(run(go, msg, function () { return act('bankImport', lines, name.value || 'Statement ' + today()); }, function (x) { return x.added + ' lines added · ' + x.duplicates + ' already imported · ' + x.matched + ' auto-matched'; }).then(function () { out.replaceChildren(); paste.value = ''; file.value = ''; })); };
          refresh();
        });
      }));
    }
    return h('div', { class: 'card' }, h('h3', null, 'Import bank statement'), h('p', { class: 'small muted' }, 'Download the statement from the bank as CSV or Excel (or copy the rows). Lines already imported are skipped automatically, so overlapping statements are safe.'),
      h('div', { class: 'grid g2' }, field('Statement file', file), field('Name of this import', name)), paste,
      h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn', onclick: preview }, 'Read statement')), msg, out);
  }
  var xlsxP = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!xlsxP) xlsxP = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload = function () { res(window.XLSX); }; s.onerror = function () { xlsxP = null; rej(new Error('The Excel reader could not load. Save the statement as CSV and try again.')); }; document.head.appendChild(s); });
    return xlsxP;
  }
  function matchDlg(b) {
    var amt = b.credit > 0 ? b.credit : b.debit, sug = FinCore.suggestMatches(D.ledger, b), pick = {}, msg = h('div', { class: 'msg' }), totEl = h('b'), go = h('button', { class: 'btn ok', disabled: true }, 'Match');
    var q = inp({ placeholder: 'Search other open entries (name, amount, ref)…' }), list = h('div');
    function draw() {
      var qq = q.value.toLowerCase(), cand = qq ? D.ledger.filter(function (l) { return !l.reversedBy && !l.reversalOf && !l.reconType && l.amount > 0 && l.dir === (b.credit > 0 ? 'IN' : 'OUT') && [l.no, l.party, l.utr, l.amount, headName(l.head)].join(' ').toLowerCase().indexOf(qq) >= 0; }).map(function (l) { return { no: l.no, amount: l.amount, date: l.date, party: l.party, utr: l.utr, head: l.head, why: 'search' }; }) : sug;
      var t = h('table', { class: 't' }, h('tr', null, h('th', null, ''), h('th', null, 'Entry'), h('th', null, 'Date'), h('th', null, 'Party / head'), h('th', null, 'Ref'), h('th', { class: 'num' }, 'Amount'), h('th', null, 'Why suggested')));
      cand.forEach(function (c) { t.appendChild(h('tr', null, h('td', null, h('input', { type: 'checkbox', checked: !!pick[c.no], onchange: function (ev) { if (ev.target.checked) pick[c.no] = c.amount; else delete pick[c.no]; tot(); } })), h('td', { class: 'mono' }, c.no), h('td', { class: 'nowrap' }, dmy(c.date)), h('td', null, c.party, h('div', { class: 'small muted' }, headName(c.head))), h('td', { class: 'mono' }, c.utr || '–'), h('td', { class: 'num' }, money(c.amount)), h('td', { class: 'small muted' }, c.why))); });
      list.replaceChildren(cand.length ? h('div', { class: 'tw' }, t) : h('div', { class: 'empty' }, 'No open ' + (b.credit > 0 ? 'receipts' : 'payments') + ' found. If this money is not in the books, use "+ Income" / "+ Expense" or "Not in ledger".'));
    }
    function tot() { var s = 0; Object.keys(pick).forEach(function (k) { s += pick[k]; }); s = FinCore.r2(s); totEl.textContent = money(s) + ' of ' + money(amt); totEl.style.color = Math.abs(s - amt) < 0.01 ? 'var(--ok)' : 'var(--red)'; go.disabled = Math.abs(s - amt) >= 0.01; }
    q.oninput = draw;
    go.onclick = function () { quiet(run(go, msg, function () { return act('bankMatch', b.id, Object.keys(pick)); }, b.id + ' matched').then(function () { close(); })); };
    var close = modal('Match bank line ' + b.id, h('div', null, h('div', { class: 'note info' }, dmy(b.date) + ' · ' + b.narration + (b.ref ? ' · Ref ' + b.ref : '') + ' · ' + (b.credit > 0 ? 'Credit ' : 'Debit ') + money(amt)),
      h('p', { class: 'small muted' }, 'Tick the ledger entr' + (b.credit > 0 ? 'ies' : 'ies') + ' that make up this bank line. Several entries can be ticked when one bank line covers more than one receipt; the total must be equal.'), q, list, h('div', { class: 'row', style: 'margin-top:10px' }, h('span', null, 'Selected: ', totEl), go), msg), true);
    draw(); tot();
  }

  /* -------------------------------------------------------------- reports */
  function vReports(v) {
    var S = D.settings, from = inp({ type: 'date', value: S.periodFrom }), to = inp({ type: 'date', value: S.periodTo });
    var st = FinCore.statement(D, {}), R = D.recon;
    v.appendChild(h('div', { class: 'card' }, h('h2', null, 'Finance statement'),
      h('p', { class: 'small muted' }, 'Income & Expenditure, Receipts & Payments, balances (with refundable deposits as a liability), budget vs actual, explanations for over-budget / outbound payments, and the bank reconciliation statement – ready to print or save as PDF.'),
      st.final ? h('div', { class: 'note ok' }, '✓ All entries are approved and reconciled – the statement is issued as FINAL.') : h('div', { class: 'note warn' }, 'The statement is issued as DRAFT until every ledger entry and bank line is reconciled and nothing is awaiting approval (now: ' + R.unreconciled + ' entries, ' + R.bankOpen + ' bank lines, ' + st.pendingIncome.count + ' income, ' + st.pendingExpense.count + ' expense orders open).'),
      h('div', { class: 'grid g4' }, field('From', from), field('To', to), h('div', { style: 'align-self:end' }, h('button', { class: 'btn sf', onclick: function () {
        if (!FinCore.validDate(from.value) || !FinCore.validDate(to.value) || from.value > to.value) { toast('Choose a valid period.', true); return; }
        var s = FinCore.statement(D, { from: from.value, to: to.value }); docPreview('Finance statement', FinDocs.statement(D, s), 'KNPL-7 Finance Statement ' + from.value + ' to ' + to.value);
      } }, 'Generate statement')))));
    // ledger
    var c = h('div', { class: 'card' }), q = inp({ placeholder: 'Search ledger…', value: UI.ledQ, oninput: function () { UI.ledQ = q.value; draw(); } });
    var hs = sel([['', 'All heads']].concat(D.heads.map(function (x) { return [x.code, x.name]; })), UI.ledHead, { style: 'width:auto', onchange: function (ev) { UI.ledHead = ev.target.value; draw(); } });
    c.appendChild(h('div', { class: 'row sp-b' }, h('h2', { style: 'margin:0' }, 'Finance ledger'), h('button', { class: 'btn ghost sm', onclick: function () { download('KNPL-7 Finance Ledger ' + today() + '.csv', FinDocs.ledgerCsv(D), 'text/csv'); } }, 'Download CSV (Excel)')));
    c.appendChild(h('p', { class: 'small muted' }, 'Only approved income and paid expenses are posted. Entries are never edited or deleted – a mistake is corrected with a reversal entry (Admin).'));
    c.appendChild(h('div', { class: 'row' }, h('div', { class: 'grow' }, q), hs));
    var tw = h('div', { class: 'tw', style: 'margin-top:8px' }); c.appendChild(tw); v.appendChild(c);
    function draw() {
      var qq = UI.ledQ.toLowerCase(), list = D.ledger.filter(function (l) { return (!UI.ledHead || l.head === UI.ledHead) && (!qq || [l.no, l.party, l.description, l.utr, l.refId, l.amount, headName(l.head)].join(' ').toLowerCase().indexOf(qq) >= 0); });
      var t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Entry'), h('th', null, 'Head'), h('th', null, 'Party / details'), h('th', null, 'Mode / ref'), h('th', { class: 'num' }, 'Receipt'), h('th', { class: 'num' }, 'Payment'), h('th', null, 'Bank'), h('th', null, '')));
      var ti = 0, to2 = 0;
      list.slice().reverse().slice(0, 500).forEach(function (l) {
        if (l.dir === 'IN') ti += l.amount; else to2 += l.amount;
        var doc = null;
        if (l.refType === 'INCOME') { var i = D.income.filter(function (x) { return x.id === l.refId; })[0]; if (i && i.receiptNo) doc = h('button', { class: 'btn ghost sm', onclick: function () { docPreview('Receipt', FinDocs.receipt(D, i), 'Receipt ' + i.receiptNo.replace(/\//g, '-')); } }, 'Receipt'); }
        if (l.refType === 'EXPENSE') { var x = D.expenses.filter(function (k) { return k.id === l.refId; })[0]; if (x && x.voucherNo) doc = h('button', { class: 'btn ghost sm', onclick: function () { voucherDoc(x); } }, 'Voucher'); }
        var rev = can('admin') && !l.reversedBy && !l.reversalOf && l.reconType !== 'BANK' ? h('button', { class: 'btn ghost sm', style: 'margin-left:4px', onclick: function (ev) { var r = prompt('Reason for reversing ' + l.no + '?'); if (r == null) return; quiet(run(ev.currentTarget, null, function () { return act('ledgerReverse', l.no, r); }, 'Reversal posted')); } }, 'Reverse') : null;
        t.appendChild(h('tr', null, h('td', { class: 'nowrap' }, dmy(l.date)), h('td', { class: 'mono' }, l.no, h('div', { class: 'small muted' }, l.refId)), h('td', null, headName(l.head)), h('td', null, l.party, h('div', { class: 'small muted' }, l.description)), h('td', { class: 'small' }, l.mode, l.utr ? h('div', { class: 'mono' }, l.utr) : null),
          h('td', { class: 'num' }, l.dir === 'IN' ? money(l.amount) : ''), h('td', { class: 'num' }, l.dir === 'OUT' ? money(l.amount) : ''),
          h('td', null, l.reversedBy ? pill('Reversed by ' + l.reversedBy, 'bad') : l.reversalOf ? pill('Reversal', 'bad') : l.reconType === 'BANK' ? pill('✓ ' + l.bankId, 'ok') : l.reconType === 'CASH' ? pill('Cash', 'info') : pill('Open', 'warn')), h('td', { class: 'nowrap' }, doc, rev)));
      });
      t.appendChild(h('tr', { class: 'tot' }, h('td', { colspan: '5' }, list.length + ' entries' + (list.length > 500 ? ' (latest 500 shown)' : '')), h('td', { class: 'num' }, money(ti)), h('td', { class: 'num' }, money(to2)), h('td', { colspan: '2' }, 'Net ' + money(ti - to2))));
      tw.replaceChildren(list.length ? t : h('div', { class: 'empty' }, 'No ledger entries yet.'));
    }
    draw();
  }

  /* ---------------------------------------------------------------- audit */
  function vAudit(v) {
    var q = inp({ placeholder: 'Search the audit trail…', value: UI.audQ, oninput: function () { UI.audQ = q.value; draw(); } }), tw = h('div', { class: 'tw', style: 'margin-top:8px' });
    v.appendChild(h('div', { class: 'card' }, h('h2', null, 'Audit trail'), h('p', { class: 'small muted' }, 'Every change – who did it and when. The latest 500 actions are shown.'), q, tw));
    function draw() {
      var qq = UI.audQ.toLowerCase(), t = h('table', { class: 't' }, h('tr', null, h('th', null, 'When'), h('th', null, 'Who'), h('th', null, 'Action'), h('th', null, 'Ref'), h('th', null, 'Detail')));
      D.audit.filter(function (a) { return !qq || [a.at, a.by, a.action, a.ref, a.detail].join(' ').toLowerCase().indexOf(qq) >= 0; }).slice().reverse().forEach(function (a) { t.appendChild(h('tr', null, h('td', { class: 'nowrap' }, dmy(a.at)), h('td', null, a.by), h('td', { class: 'mono' }, a.action), h('td', { class: 'mono' }, a.ref), h('td', null, a.detail))); });
      tw.replaceChildren(t);
    }
    draw();
  }

  /* ------------------------------------------------------------- settings */
  function vSettings(v) {
    var S = D.settings, msg = h('div', { class: 'msg' }), F = {};
    function fld(k, label, type, hint) { F[k] = type === 'bool' ? h('input', { type: 'checkbox', checked: !!S[k] }) : inp({ type: type || 'text', value: S[k] }); return type === 'bool' ? h('label', { class: 'row', style: 'margin-top:14px' }, F[k], ' ' + label) : field(label, F[k], false, hint); }
    v.appendChild(h('div', { class: 'card' }, h('h2', null, 'Organisation & statement'), h('div', { class: 'grid g3' },
      fld('org', 'Organisation'), fld('season', 'Season'), fld('venue', 'Event line'), fld('periodFrom', 'Period from', 'date'), fld('periodTo', 'Period to', 'date'), fld('openingBalance', 'Opening balance (₹)', 'number', 'Leave 0 if the bank statement starts from zero; otherwise mark the opening credit line as "Not in ledger".'),
      fld('targetSurplus', 'Target surplus (₹)', 'number'), fld('preparedBy', 'Prepared by'), fld('verifiedBy', 'Verified by'), fld('approvedBy', 'Approved by'), fld('contact', 'Contact line on documents'),
      fld('bankName', 'Bank'), fld('bankAccount', 'Account no. (shown on statement)'), fld('bankIfsc', 'IFSC'), fld('upiId', 'KNPL UPI ID'))));
    v.appendChild(h('div', { class: 'card' }, h('h2', null, 'Approval rules & numbering'), h('div', { class: 'grid g3' },
      fld('dualAbove', 'Admin second approval from (₹)', 'number', 'Orders of this amount or more need an Admin approval after Finance. 0 = never.'), fld('dualForOutbound', 'Outbound (unbudgeted) expenses always need Admin approval', 'bool'), fld('cashLimit', 'Cash payment limit (₹)', 'number'),
      fld('prefixReceipt', 'Receipt prefix'), fld('prefixVoucher', 'Voucher prefix'), fld('prefixLedger', 'Ledger prefix')),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn sf', onclick: function (ev) {
        var o = {}; Object.keys(F).forEach(function (k) { o[k] = F[k].type === 'checkbox' ? F[k].checked : F[k].value; });
        quiet(run(ev.currentTarget, msg, function () { return act('settingsSave', o); }, 'Settings saved'));
      } }, 'Save settings')), msg));
    // sources
    var sc = h('div', { class: 'card' }, h('h2', null, 'Income sources'), h('p', { class: 'small muted' }, '"Fetch from sources" on the Income tab reads these. With "Source approval counts" on, entries approved at the source (e.g. by Finance on the Team Desk) go straight to the ledger; otherwise they wait for approval here.'));
    var srcs = JSON.parse(JSON.stringify(S.sources || [])), smsg = h('div', { class: 'msg' });
    var incHeads = D.heads.filter(function (x) { return x.kind !== 'EXPENSE'; }).map(function (x) { return [x.code, x.name]; });
    srcs.forEach(function (s) {
      var box = h('div', { class: 'item', style: 'display:block' }, h('div', { class: 'row sp-b' }, h('b', null, s.label), h('span', { class: 'small muted mono' }, s.id)));
      box.appendChild(h('div', { class: 'row' }, h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: s.enabled, onchange: function (ev) { s.enabled = ev.target.checked; } }), ' Enabled'), h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: s.trust, onchange: function (ev) { s.trust = ev.target.checked; } }), ' Source approval counts as Finance approval')));
      if (s.type === 'teamdesk') {
        box.appendChild(h('p', { class: 'small muted' }, 'Reads the Team Desk payments (caution deposit, ownership fee, draft fee, jersey fee) with the Finance PIN stored in the Apps Script properties (TEAMDESK_PIN). Season-replacement requests carry no payment and are skipped.'));
        box.appendChild(h('div', { class: 'grid g4' }, [['CD', 'Caution deposit →'], ['OWN', 'Ownership fee →'], ['DR', 'Draft fee →'], ['JER', 'Jersey fee →']].map(function (k) { var x = sel(incHeads, (s.map || {})[k[0]]); x.onchange = function () { s.map = s.map || {}; s.map[k[0]] = x.value; }; return field(k[1], x); })));
      } else {
        var g = h('div', { class: 'grid g4' });
        function t(k, label, obj, hint) { var x = inp({ value: (obj || s)[k] == null ? '' : (obj || s)[k] }); x.oninput = function () { (obj || s)[k] = k === 'fixedAmount' ? Number(x.value) || 0 : x.value; }; g.appendChild(field(label, x, false, hint)); return x; }
        t('sheetId', 'Google Sheet ID', null, 'from the sheet link …/d/<ID>/edit'); t('tab', 'Sheet tab name');
        var hd = sel(incHeads, s.head); hd.onchange = function () { s.head = hd.value; }; g.appendChild(field('Income head', hd));
        t('fixedAmount', 'Fixed amount (₹, 0 = use column)', null, 'e.g. 1000 for the registration fee');
        s.cols = s.cols || {};
        [['key', 'Unique ID column *'], ['party', 'Name column *'], ['amount', 'Amount column'], ['utr', 'Transaction ref column'], ['date', 'Payment date column'], ['proof', 'Proof URL column'], ['mode', 'Payment mode column'], ['status', 'Status column'], ['team', 'Team column'], ['desc', 'Description column']].forEach(function (k) { t(k[0], k[1], s.cols); });
        t('approved', 'Status value(s) meaning approved', null, 'comma separated'); t('rejected', 'Status value(s) meaning rejected', null, 'blank status = waiting');
        box.appendChild(g);
        box.appendChild(h('label', { class: 'row', style: 'margin-top:8px' }, h('input', { type: 'checkbox', checked: !!s.group, onchange: function (ev) { s.group = ev.target.checked; } }), ' Several rows share one ID (e.g. one sponsorship receipt with many items) – combine them'));
        if (!DEMO) box.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn ghost sm', onclick: function (ev) { quiet(run(ev.currentTarget, smsg, function () { return api('sourceColumns', TOKEN, s.sheetId, s.tab); }).then(function (r) { modal('Columns in ' + r.tab, h('div', null, h('p', { class: 'small muted' }, 'Copy the exact column names into the fields.'), r.headers.map(function (x) { return h('div', { class: 'row' }, h('span', { class: 'mono grow' }, x), copyBtn(x)); }), r.tabs ? h('p', { class: 'small muted' }, 'Tabs: ' + r.tabs.join(', ')) : null)); })); } }, 'Show the sheet columns')));
      }
      sc.appendChild(box);
    });
    sc.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn sf', onclick: function (ev) { quiet(run(ev.currentTarget, smsg, function () { return act('settingsSave', { sources: srcs }); }, 'Sources saved')); } }, 'Save sources')));
    sc.appendChild(smsg); v.appendChild(sc);
    // users
    var ut = h('table', { class: 't' }, h('tr', null, h('th', null, 'Profile'), h('th', null, 'What it can do'), h('th', null, 'Access code'), h('th', null, 'Status'), h('th', null, 'Last used'), h('th', null, '')));
    D.users.forEach(function (u) { ut.appendChild(h('tr', null, h('td', null, h('b', null, u.name), u.name !== u.roleName ? h('div', { class: 'small muted' }, u.roleName) : null), h('td', { class: 'small' }, u.roleHelp), h('td', { class: 'mono' }, u.hasCode ? '••••-••' + (u.codeHint || '') : '–'), h('td', null, u.active ? pill('Active', 'ok') : pill('Switched off')), h('td', { class: 'small' }, u.lastLogin ? dmy(u.lastLogin) : 'never'),
      h('td', { class: 'nowrap' }, h('button', { class: 'btn ghost sm', onclick: function () { userForm(u); } }, 'Edit'), h('button', { class: 'btn ghost sm', style: 'margin-left:4px', onclick: function (ev) { if (!confirm('Issue a NEW access code for ' + u.name + '? The current code stops working at once.')) return; quiet(run(ev.currentTarget, null, function () { return act('userNewCode', u.id); }).then(function (r) { showCode(r); if (r.self) toast('Your own code changed – use the new code next time you sign in.'); })); } }, 'New code')))); });
    v.appendChild(h('div', { class: 'card' }, h('div', { class: 'row sp-b' }, h('h2', { style: 'margin:0' }, 'Access profiles & codes'), h('button', { class: 'btn sf sm', onclick: function () { userForm(null); } }, '+ Add profile')),
      h('p', { class: 'small muted' }, 'One access code per profile. Give each code only to the people who do that job; they also type their own name when signing in, so every approval shows the person and the profile. "New code" replaces a leaked code at once and signs out everyone using the old one. Add an extra profile of the same type if a group needs its own code (e.g. a second Expense creation code for the ground committee).'),
      h('div', { class: 'tw' }, ut)));
  }
  function showCode(r) {
    var u = r.user, link = location.origin + location.pathname, ph = String(u.mobile || '').replace(/\D/g, '');
    var msg = '🏏 *KNPL-7 Finance Desk*\n\nAccess code for the *' + u.name + '* profile: *' + r.code + '*\nYou can: ' + u.roleHelp + '.\n\nSign in here: ' + link + '\nEnter the code and your own name.\nKeep this code private – it works like a password.\n\n– Team KNPL (Finance)';
    modal('Access code – ' + u.name, h('div', null,
      h('p', null, 'Share this code only with the people who do the ', h('b', null, u.name), ' work. It is shown only now – the Finance Desk keeps just a scrambled copy.'),
      h('div', { class: 'row' }, h('div', { style: 'font:800 40px var(--mono);letter-spacing:.12em' }, r.code), copyBtn(r.code)),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('a', { class: 'btn ok', target: '_blank', rel: 'noopener', href: 'https://wa.me/' + (ph ? (ph.length === 10 ? '91' + ph : ph) : '') + '?text=' + encodeURIComponent(msg) }, 'Send on WhatsApp'), h('span', { class: 'small muted' }, ph ? 'Opens a chat with ' + u.mobile : 'Choose the person / group in WhatsApp'))));
  }
  function userForm(u) {
    u = u || { id: '', name: '', mobile: '', role: 'EXP_CREATE', active: true };
    var f = { name: inp({ value: u.name, placeholder: 'e.g. Expense creation – Ground committee' }), mobile: inp({ value: u.mobile, inputmode: 'numeric', maxlength: '10', placeholder: 'optional' }), role: sel(Object.keys(D.roles).map(function (k) { return [k, D.roles[k]]; }), u.role), active: h('input', { type: 'checkbox', checked: u.active }) };
    var msg = h('div', { class: 'msg' });
    var help = h('div', { class: 'note info small' }); function sh() { help.textContent = D.roleHelp[f.role.value] || ''; } f.role.onchange = sh; sh();
    var close = modal(u.id ? 'Edit profile ' + u.name : 'Add access profile', h('div', null, h('div', { class: 'grid g3' }, field('Profile name', f.name, true), field('Type', f.role, true), field('WhatsApp no. to send the code (optional)', f.mobile)), help, u.id ? h('label', { class: 'row', style: 'margin-top:10px' }, f.active, ' Active (untick to switch this code off)') : h('p', { class: 'small muted' }, 'The access code is created when you save.'),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn sf', onclick: function (ev) { quiet(run(ev.currentTarget, msg, function () { return act('userSave', { id: u.id, name: f.name.value, mobile: f.mobile.value, role: f.role.value, active: f.active.checked }); }, 'User saved').then(function (r) { close(); if (r.code) showCode(r); })); } }, 'Save')), msg));
  }

  /* ---------------------------------------------------------------- start */
  if (TOKEN) load(); else showGate();
})();
