/* KNPL-7 Finance Desk – DEMO MODE. Runs the real FinCore logic inside this browser with sample data
 * (saved in localStorage), so the whole workflow can be tried before the Apps Script backend is deployed. */
(function () {
  'use strict';
  var KEY = 'knplfin_demo_v1', CK = 'knplfin_demo_cache_v1';
  var FILES = {};
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var db = load(KEY) || {}, cache = load(CK) || {};
  var store = {
    get: function (t) { return (db[t] || []).map(function (r) { return Object.assign({}, r); }); },
    put: function (t, rows) { db[t] = JSON.parse(JSON.stringify(rows)); if (!save(KEY, db)) console.warn('Demo storage full'); }
  };
  var ctx = {
    get now() { return new Date(); },
    cache: {
      get: function (k) { var x = cache[k]; if (!x) return null; if (x.e < Date.now()) { delete cache[k]; return null; } return x.v; },
      put: function (k, v, sec) { cache[k] = { v: v, e: Date.now() + (sec || 600) * 1000 }; save(CK, cache); },
      remove: function (k) { delete cache[k]; save(CK, cache); }
    },
    uuid: function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); },
    saveFile: function (f, label) {
      var url = 'data:' + f.mime + ';base64,' + f.data;
      if (url.length < 350000) return url;
      var id = 'demo-' + Object.keys(FILES).length; FILES[id] = url; return url; // large files kept for this session only
    },
    fetchSources: function () { return sampleSources(); }
  };
  function day(n) { var d = new Date(Date.now() + 5.5 * 3600e3 - n * 864e5); return d.toISOString().slice(0, 10); }
  var TEAMS = ['Madhura Mavericks', 'Kalinga United', 'Ayodhya Warriors', 'Knights of Kanchi', 'Spartans of Nalanda', 'Gandhara Giants', 'Vamos Vrindavan', 'Jaguars of Jhansi'];
  function sampleSources() {
    var r = [], i;
    for (i = 0; i < 8; i++) {
      r.push({ source: 'TEAMDESK', sourceRef: 'TD:CD-' + i, head: 'DEP-CD', party: TEAMS[i], team: TEAMS[i], description: 'Sponsorship Caution Deposit 3/5', amount: 3000, mode: 'UPI', utr: String(431200000100 + i), paidOn: day(12 - i), srcStatus: 'APPROVED', srcReceipt: 'KNPL7-TD-' + (101 + i), trust: true, approver: 'Team Desk (Finance)' });
      if (i < 5) r.push({ source: 'TEAMDESK', sourceRef: 'TD:OWN-' + i, head: 'INC-OWN', party: TEAMS[i], team: TEAMS[i], description: 'Ownership fee 1/3', amount: 5000, mode: 'UPI', utr: String(441200000200 + i), paidOn: day(8 - i), srcStatus: i < 4 ? 'APPROVED' : 'PENDING', srcReceipt: i < 4 ? 'KNPL7-TD-' + (201 + i) : '', trust: true, approver: 'Team Desk (Finance)' });
    }
    r.push({ source: 'SPONSOR', sourceRef: 'SP:KNPL7-CD-0004', head: 'INC-SPONS', party: 'Sree Sankara Trust', team: 'Madhura Mavericks', description: 'KNPL-7 Sahayog Sponsor', amount: 25000, mode: 'NEFT', utr: 'SBIN526318882211', paidOn: day(9), srcStatus: 'APPROVED', srcReceipt: 'KNPL7-CD-0004', trust: false });
    r.push({ source: 'SPONSOR', sourceRef: 'SP:KNPL7-CD-0007', head: 'INC-SPONS', party: 'Vaidyaratnam', team: 'Kalinga United', description: 'KNPL-7 Winners Sponsor', amount: 50000, mode: 'NEFT', utr: 'FDRL526319993344', paidOn: day(6), srcStatus: 'APPROVED', srcReceipt: 'KNPL7-CD-0007', trust: false });
    r.push({ source: 'SPONSOR', sourceRef: 'SP:KNPL7-CD-0009', head: 'INC-SPONS', party: 'Demo Traders', team: 'Ayodhya Warriors', description: 'KNPL-7 Lunch Sponsor × 2', amount: 10000, mode: 'UPI', utr: '452266117788', paidOn: day(3), srcStatus: 'APPROVED', srcReceipt: 'KNPL7-CD-0009', trust: false });
    for (i = 0; i < 6; i++) r.push({ source: 'REG', sourceRef: 'REG:KNPL7-' + ('000' + (21 + i)).slice(-4), head: 'INC-REG', party: ['Arjun N', 'Vishnu P', 'Hari M', 'Sreeraj K', 'Nikhil V', 'Adarsh T'][i], description: 'Registration fee – KNPL7-' + ('000' + (21 + i)).slice(-4), amount: 1000, mode: 'UPI', utr: i === 5 ? '' : String(462200000300 + i), paidOn: day(10 - i), srcStatus: 'APPROVED', trust: false });
    return r;
  }
  function call(fn, args) { return FinCore.handle(store, ctx, fn, args); }
  function seed() {
    db = {}; cache = {}; save(KEY, db); save(CK, cache);
    FinCore.ensureSetup(store, ctx, { name: 'Krishnadas M N', mobile: '9000000001', pin: '135246' });
    var A = call('login', ['9000000001', '135246']).token; call('changePin', [A, '135246', '111222']);
    function person(m, n, role, pin) { var r = call('userSave', [A, { mobile: m, name: n, role: role }]).result; var t = call('login', [m, r.tempPin]).token; call('changePin', [t, r.tempPin, pin]); return call('login', [m, pin]).token; }
    var F = person('9000000002', 'Unnikrishnan S', 'FINANCE', '222333');
    var M = person('9000000003', 'Ivish Kumar', 'MEMBER', '333444');
    person('9000000004', 'Auditor (read-only)', 'VIEWER', '444555');
    call('settingsSave', [A, { bankName: 'Demo Bank', bankAccount: 'XXXXXXXX4417', bankIfsc: 'DEMO0001234', upiId: 'knpl7@demo', sources: FinCore.DEFAULT_SETTINGS.sources.map(function (s) { var c = JSON.parse(JSON.stringify(s)); c.enabled = true; return c; }) }]);
    call('syncSources', [F]);
    var data = call('boot', [F]);
    data.income.filter(function (i) { return i.status === 'PENDING' && (i.source === 'SPONSOR' && i.party !== 'Demo Traders' || i.source === 'REG' && i.utr); }).slice(0, 6).forEach(function (i) { call('incomeDecide', [F, i.id, 'APPROVED', '']); });
    var pdf = { name: 'bill.pdf', mime: 'application/pdf', data: 'JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj4KZW5kb2JqCnRyYWlsZXIKPDwvUm9vdCAxIDAgUj4+CiUlRU9G' };
    var e1 = call('expenseCreate', [M, { head: 'EXP-TECH', title: 'Custom KNPL bidding page', description: 'Bidding page that switches off Bid-up at points / Skill Rating / category caps', payee: 'TENVOX Web Studio', invoiceNo: 'TWS-0112', invoiceDate: day(5), amount: 9500, payMethod: 'UPI', upi: 'tenvoxweb@okaxis', invoiceFile: pdf }]).result;
    call('expenseDecide', [F, e1.id, 'APPROVE', 'Checked against quotation', false]);
    call('expensePay', [F, e1.id, { mode: 'UPI', date: day(2), utr: '533118827364' }]);
    var e2 = call('expenseCreate', [M, { head: 'EXP-AUCTION', title: 'Mega Auction – LEGION boards (16 teams)', description: 'Acrylic KNPL LEGION field boards with player blocks', payee: 'Kochi Acrylic Works', invoiceNo: 'KAW/26/431', invoiceDate: day(3), amount: 48000, payMethod: 'BANK', accName: 'Kochi Acrylic Works', accNo: '50200011223344', accNo2: '50200011223344', ifsc: 'HDFC0001234', bank: 'HDFC Bank', branch: 'Kochi', invoiceFile: pdf }]).result;
    call('expenseDecide', [F, e2.id, 'APPROVE', 'Rates match the quotation', false]);
    call('expenseCreate', [M, { head: 'EXP-AUCTION', title: 'Auction hall decoration and sound', description: 'Stage, lights and sound at Chola Farm Resorts', payee: 'Angamaly Events', invoiceNo: 'AE-77', invoiceDate: day(1), amount: 32000, payMethod: 'UPI', phone: '9847012345', invoiceFile: pdf,
      explanation: 'The resort does not provide sound and lights for a closed-door event, so a vendor was hired at the quoted rate; the LEGION boards also cost more than planned.' }]);
    call('expenseCreate', [M, { head: 'EXP-UNB', title: 'Rain covers for both pitches', description: '', payee: 'Kerala Tarpaulins', invoiceNo: 'KT/2026/55', invoiceDate: day(1), amount: 18000, payMethod: 'BANK', accName: 'Kerala Tarpaulins', accNo: '123456789012', accNo2: '123456789012', ifsc: 'SBIN0070123', bank: 'State Bank of India', invoiceFile: pdf,
      explanation: 'Rain is forecast for the tournament week, so the ground committee decided to hire covers for both pitches; this was not planned in the budget.' }]);
    call('expenseCreate', [M, { head: 'EXP-PRINT', title: 'Registration posters printing', description: 'Phase 1 posters', payee: 'Thrissur Prints', invoiceNo: 'TP-9', invoiceDate: day(4), amount: 2400, payMethod: 'CASH', invoiceFile: pdf,
      explanation: 'Posters were needed for the registration drive before the printing budget was set; the committee asked for them at short notice for the Phase 1 rounds.' }]);
    call('incomeCreate', [M, { head: 'INC-OTHER', party: 'Well-wisher (cash)', amount: 2000, mode: 'Cash', paidOn: day(2), note: 'Cash donation received at the Playbook session for KNPL-7' }]);
    data = call('boot', [F]);
    var L = data.ledger.filter(function (l) { return l.mode !== 'Cash'; }), csv = 'Txn Date,Description,Ref No,Debit,Credit,Balance\n', bal = 0;
    L.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (l, i) {
      if (i === 3) return; // one receipt not yet in the bank → stays unreconciled
      var narr = (l.dir === 'IN' ? (i % 4 === 1 ? 'UPI CR ' + l.party.toUpperCase() : 'UPI/' + l.utr + '/' + l.party.toUpperCase()) : 'UPI/DR/' + l.utr + '/' + l.party.toUpperCase());
      if (i % 4 === 1 && l.dir === 'IN') narr = 'BY TRANSFER ' + l.party.toUpperCase().slice(0, 10); // no reference → manual match
      bal += l.dir === 'IN' ? l.amount : -l.amount;
      csv += l.date.split('-').reverse().join('/') + ',' + narr + ',,' + (l.dir === 'OUT' ? l.amount : '') + ',' + (l.dir === 'IN' ? l.amount : '') + ',' + bal.toFixed(2) + '\n';
    });
    bal += 5000; csv += day(0).split('-').reverse().join('/') + ',UPI CR 9846XXXXXX GOPAN NAMBOODIRI,,,5000,' + bal.toFixed(2) + '\n';
    bal -= 17.7; csv += day(0).split('-').reverse().join('/') + ',SMS CHARGES QTR,,17.70,,' + bal.toFixed(2) + '\n';
    var det = FinCore.detectStatement(FinCore.splitCsv(csv));
    call('bankImport', [F, det.lines, 'Demo statement']);
    ['fail:9000000001', 'fail:9000000002', 'fail:9000000003', 'fail:9000000004'].forEach(function (k) { ctx.cache.remove(k); });
    Object.keys(cache).forEach(function (k) { if (k.indexOf('sess:') === 0) delete cache[k]; }); save(CK, cache);
  }
  if (!db.Users || !db.Users.length) { try { seed(); } catch (e) { console.error('Demo seed failed', e); } }
  window.FinDemo = {
    api: function (fn, args) { return new Promise(function (res, rej) { setTimeout(function () { try { res(call(fn, args)); } catch (e) { rej(e); } }, 120); }); },
    reset: function () { seed(); },
    sampleStatement: function () { return 'Txn Date,Description,Ref No,Debit,Credit,Balance\n'; },
    logins: [['Admin', '9000000001', '111222'], ['Finance', '9000000002', '222333'], ['Committee member', '9000000003', '333444'], ['Viewer / auditor', '9000000004', '444555']]
  };
})();
