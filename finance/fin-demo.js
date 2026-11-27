/* KNPL-7 Finance Desk – DEMO MODE. Runs the real FinCore logic inside this browser with sample data
 * (saved in localStorage), so the whole workflow can be tried before the Apps Script backend is deployed. */
(function () {
  'use strict';
  var KEY = 'knplfin_demo_v7', CK = 'knplfin_demo_cache_v5';
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
    fetchSources: function () { return sampleSources(); },
    teamDesk: function (fn, args) {
      var T = load('knplfin_demo_td') || { fees: { 'KALINGA UNITED': { amount: 4900, note: '14 jerseys × ₹350' } }, splits: [], n: 1 };
      if (fn === 'teamDeskAdminFee') { if (Number(args[1]) > 0) T.fees[args[0]] = { amount: Number(args[1]), note: args[2] }; else delete T.fees[args[0]]; }
      if (fn === 'teamDeskAdminSplit') { var x = args[0]; T.splits.push({ row: ++T.n, sponsor: x.sponsor, from: x.from, to: x.to, amount: x.amount, note: x.note, at: new Date().toISOString().slice(0, 10) }); }
      if (fn === 'teamDeskAdminSplitDelete') T.splits = T.splits.filter(function (s) { return String(s.row) !== String(args[0]); });
      save('knplfin_demo_td', T);
      return { role: 'admin', teams: TEAMS.map(function (t) { return { team: t.toUpperCase() }; }), fees: T.fees, splits: T.splits };
    },
    regList: function () { return REGP; },
    sponsorDecide: function (cat, no, status) { return { status: status }; },
    teamDeskDecide: function (id, dec, remarks) { return { status: dec, receiptNo: dec === 'APPROVED' ? 'KNPL7-TD-9' + String(Date.now()).slice(-2) : '', remarks: remarks }; }
  };
  var REGP = [['KNPL7-0001', 'Krishnadas M N', 1, 'Madhura Mavericks'], ['KNPL7-0021', 'Arjun N'], ['KNPL7-0022', 'Vishnu P'], ['KNPL7-0023', 'Hari M', 0, '', 1], ['KNPL7-0024', 'Sreeraj K'], ['KNPL7-0025', 'Nikhil V'], ['KNPL7-0026', 'Adarsh T', 0, '', 1], ['KNPL7-0002', 'Unnikrishnan S', 1, 'Kalinga United']]
    .map(function (x, k) { return { id: x[0], name: x[1], owner: !!x[2], ownerTeam: x[3] || '', receipt: !x[2] && !x[4], pool: k > 5 ? 'WAITING LIST' : 'MAIN', category: ['Conqueror', 'Dominator', 'Rising Star'][k % 3], date: '' }; });
  function day(n) { var d = new Date(Date.now() + 5.5 * 3600e3 - n * 864e5); return d.toISOString().slice(0, 10); }
  var TEAMS = ['Madhura Mavericks', 'Kalinga United', 'Ayodhya Warriors', 'Knights of Kanchi', 'Spartans of Nalanda', 'Gandhara Giants', 'Vamos Vrindavan', 'Jaguars of Jhansi'];
  function sampleSources() {
    var r = [], i;
    for (i = 0; i < 8; i++) {
      r.push({ source: 'TEAMDESK', sourceRef: 'TD:CD-' + i, head: 'DEP-CD', party: TEAMS[i], team: TEAMS[i], description: 'Sponsorship Caution Deposit 3/5', amount: 3000, mode: 'UPI', utr: String(431200000100 + i), paidOn: day(12 - i), srcStatus: 'APPROVED', srcReceipt: 'KNPL7-TD-' + (101 + i), trust: true, approver: 'Team Desk (Finance)' });
      if (i < 5) r.push({ source: 'TEAMDESK', sourceRef: 'TD:OWN-' + i, head: 'INC-OWN', party: TEAMS[i], team: TEAMS[i], description: 'Ownership fee 1/3', amount: 5000, mode: 'UPI', utr: String(441200000200 + i), paidOn: day(8 - i), srcStatus: i < 3 ? 'APPROVED' : 'PENDING', srcReceipt: i < 3 ? 'KNPL7-TD-' + (201 + i) : '', trust: true, approver: 'Team Desk (Finance)', srcType: 'OWN1', contactName: 'Owner of ' + TEAMS[i], contactPhone: '' });
    }
    function sp(src, no, party, team, desc, amt, mode, utr, d, st, cn, ph) { r.push({ source: src, sourceRef: src + ':' + no, head: 'INC-SPONS', party: party, team: team, description: desc, amount: amt, mode: mode, utr: utr, paidOn: day(d), srcStatus: st, srcReceipt: no, trust: false, srcType: src === 'SPONSOR' ? 'CD' : 'FL', contactName: cn, contactPhone: ph, proof: '' }); }
    sp('SPONSOR', 'KNPL7-CD-0004', 'Sree Sankara Trust', 'Madhura Mavericks', 'Cover Drive: KNPL-7 Sahayog Sponsor', 25000, 'NEFT', 'SBIN526318882211', 9, 'APPROVED', 'Trust Secretary', '9000000001');
    sp('SPONSOR', 'KNPL7-CD-0007', 'Vaidyaratnam', 'Kalinga United', 'Cover Drive: KNPL-7 Winners Sponsor', 50000, 'NEFT', 'FDRL526319993344', 6, 'APPROVED', 'Manager', '9000000002');
    sp('SPONSOR', 'KNPL7-CD-0009', 'Demo Traders', 'Ayodhya Warriors', 'Cover Drive: KNPL-7 Lunch Sponsor × 2', 10000, 'UPI', '452266117788', 3, 'APPROVED', 'Rajesh', '9000000003');
    sp('SPONSOR', 'KNPL7-CD-0011', 'Kerala Ayur Mart', 'Madhura Mavericks', 'Cover Drive: KNPL Team Jersey Sponsor – Madhura Mavericks', 7500, 'UPI', '462288119900', 1, 'PENDING', 'Suresh K', '9000000004');
    sp('SPONSOR_FL', 'KNPL7-FL-0002', 'Annapoorna Caterers', 'Knights of Kanchi', 'Flick: Match Day Sponsor', 12000, 'UPI', '462299001122', 2, 'PENDING', 'Vinod', '9000000005');
    REGP.forEach(function (p, k) { if (!p.owner) r.push({ source: 'REG', sourceRef: 'REG:' + p.id, head: 'INC-REG', party: p.name, description: 'Player registration fee – ' + p.id, amount: 1000, mode: 'UPI', utr: '', paidOn: day(10 - k), srcStatus: 'APPROVED', trust: true, approver: 'Registration committee (fee verified)', srcType: 'REG', contactName: p.name, proof: p.receipt ? 'https://example.org/receipt' : '', note: p.receipt ? '' : 'Fee receipt not uploaded – marked verified by the committee (27 Nov 2026)' }); });
    return r;
  }
  function slots(id) {
    if (id === 'SPONSOR') return [{ code: 'CD01', name: 'KNPL Champions Everolling Trophy', slots: 1, rate: 150000, taken: 0, sponsors: [] }, { code: 'CD02', name: 'KNPL-7 Winners Sponsor', slots: 1, rate: 50000, taken: 1, sponsors: [{ name: 'Vaidyaratnam', team: 'Kalinga United', qty: 1, confirmed: true }] },
      { code: 'CD04', name: 'KNPL-7 Sahayog Sponsor', slots: 2, rate: 25000, taken: 1, sponsors: [{ name: 'Sree Sankara Trust', team: 'Madhura Mavericks', qty: 1, confirmed: true }] },
      { code: 'CD07', name: 'KNPL Team Jersey Sponsor', slots: 16, rate: 7500, taken: 1, sponsors: [{ name: 'Kerala Ayur Mart', team: 'Madhura Mavericks', jerseyTeam: 'Madhura Mavericks', qty: 1, confirmed: false }] },
      { code: 'CD08', name: 'KNPL-7 Lunch Sponsor', slots: 20, rate: 5000, taken: 2, sponsors: [{ name: 'Demo Traders', team: 'Ayodhya Warriors', qty: 2, confirmed: false }] }];
    return [];
  }
  function call(fn, args) { return FinCore.handle(store, ctx, fn, args); }
  function seed() {
    db = {}; cache = {}; save(KEY, db); save(CK, cache);
    FinCore.ensureSetup(store, ctx, { codes: { ADMIN: 'ADMN-DEMO', FEES: 'FEES-DEMO', FIN_OPS: 'FNCE-DEMO', EXP_CREATE: 'CRTE-DEMO', VIEWER: 'VWER-DEMO' } });
    var A = call('login', ['ADMN-DEMO', 'Krishnadas M N']).token;
    var FE = call('login', ['FEES-DEMO', 'Unnikrishnan S']).token, IN = call('login', ['FNCE-DEMO', 'Vineeth Kannath']).token, AP = IN, PY = IN;
    var M = call('login', ['CRTE-DEMO', 'Ivish Kumar']).token, F = AP;
    call('settingsSave', [A, { sponsorCats: FinCore.DEFAULT_SETTINGS.sponsorCats.map(function (c) { var o = JSON.parse(JSON.stringify(c)); if (c.code !== 'SD') o.sheetId = 'demo-register-' + c.code; if (c.code === 'FL') o.portal = 'https://example.org/flick/'; return o; }), bankName: 'Demo Bank', bankAccount: 'XXXXXXXX4417', bankIfsc: 'DEMO0001234', upiId: 'knpl7@demo', sources: FinCore.DEFAULT_SETTINGS.sources.map(function (s) { var c = JSON.parse(JSON.stringify(s)); c.enabled = true; return c; }) }]);
    call('syncSources', [FE]);
    var data = call('boot', [A]);
    data.income.filter(function (i) { return i.status === 'PENDING' && (i.source === 'SPONSOR' && i.party !== 'Demo Traders' || i.source === 'REG' && i.utr); }).slice(0, 6).forEach(function (i) { call('incomeDecide', [IN, i.id, 'APPROVED', '']); });
    var pdf = { name: 'bill.pdf', mime: 'application/pdf', data: 'JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj4KZW5kb2JqCnRyYWlsZXIKPDwvUm9vdCAxIDAgUj4+CiUlRU9G' };
    var e1 = call('expenseCreate', [M, { head: 'EXP-TECH', title: 'Custom KNPL bidding page', description: 'Bidding page that switches off Bid-up at points / Skill Rating / category caps', payee: 'TENVOX Web Studio', invoiceNo: 'TWS-0112', invoiceDate: day(5), amount: 9500, payMethod: 'UPI', upi: 'tenvoxweb@okaxis', invoiceFile: pdf }]).result;
    call('expenseDecide', [F, e1.id, 'APPROVE', 'Checked against quotation', false]);
    call('expensePay', [PY, e1.id, { mode: 'UPI', date: day(2), utr: '533118827364' }]);
    var e2 = call('expenseCreate', [M, { head: 'EXP-AUCTION', title: 'Mega Auction – LEGION boards (16 teams)', description: 'Acrylic KNPL LEGION field boards with player blocks', payee: 'Kochi Acrylic Works', invoiceNo: 'KAW/26/431', invoiceDate: day(3), amount: 48000, payMethod: 'BANK', accName: 'Kochi Acrylic Works', accNo: '50200011223344', accNo2: '50200011223344', ifsc: 'HDFC0001234', bank: 'HDFC Bank', branch: 'Kochi', invoiceFile: pdf }]).result;
    call('expenseDecide', [F, e2.id, 'APPROVE', 'Rates match the quotation', false]);
    call('expenseCreate', [M, { head: 'EXP-AUCTION', title: 'Auction hall decoration and sound', description: 'Stage, lights and sound at Chola Farm Resorts', payee: 'Angamaly Events', invoiceNo: 'AE-77', invoiceDate: day(1), amount: 32000, payMethod: 'UPI', phone: '9847012345', invoiceFile: pdf,
      explanation: 'The resort does not provide sound and lights for a closed-door event, so a vendor was hired at the quoted rate; the LEGION boards also cost more than planned.' }]);
    call('expenseCreate', [M, { head: 'EXP-UNB', title: 'Rain covers for both pitches', description: '', payee: 'Kerala Tarpaulins', invoiceNo: 'KT/2026/55', invoiceDate: day(1), amount: 18000, payMethod: 'BANK', accName: 'Kerala Tarpaulins', accNo: '123456789012', accNo2: '123456789012', ifsc: 'SBIN0070123', bank: 'State Bank of India', invoiceFile: pdf,
      explanation: 'Rain is forecast for the tournament week, so the ground committee decided to hire covers for both pitches; this was not planned in the budget.' }]);
    call('expenseCreate', [M, { head: 'EXP-PRINT', title: 'Registration posters printing', description: 'Phase 1 posters', payee: 'Thrissur Prints', invoiceNo: 'TP-9', invoiceDate: day(4), amount: 2400, payMethod: 'CASH', invoiceFile: pdf,
      explanation: 'Posters were needed for the registration drive before the printing budget was set; the committee asked for them at short notice for the Phase 1 rounds.' }]);
    call('incomeCreate', [M, { head: 'INC-OTHER', party: 'Well-wisher (cash)', amount: 2000, mode: 'Cash', paidOn: day(2), note: 'Cash donation received at the Playbook session for KNPL-7' }]);
    data = call('boot', [A]);
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
    call('bankImport', [PY, det.lines, 'Demo statement']);
    ctx.cache.remove('fail:codes');
    Object.keys(cache).forEach(function (k) { if (k.indexOf('sess:') === 0) delete cache[k]; }); save(CK, cache);
  }
  if (!db.Users || !db.Users.length) { try { seed(); } catch (e) { console.error('Demo seed failed', e); } }
  window.FinDemo = {
    api: function (fn, args) { return new Promise(function (res, rej) { setTimeout(function () { try { res(call(fn, args)); } catch (e) { rej(e); } }, 120); }); },
    reset: function () { seed(); },
    slots: slots,
    sampleStatement: function () { return 'Txn Date,Description,Ref No,Debit,Credit,Balance\n'; },
    logins: [['Admin', 'ADMN-DEMO'], ['Franchise fees', 'FEES-DEMO'], ['Finance (income, expense approval, payments)', 'FNCE-DEMO'], ['Expense creation (committee)', 'CRTE-DEMO'], ['Viewer / auditor', 'VWER-DEMO']]
  };
})();
