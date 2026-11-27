/* KNPL-7 Finance Desk – core logic.
 * The SAME file runs in the browser (demo mode + shared calculations) and in Google Apps Script
 * (copy it as FinanceCore.gs). No browser or Apps Script APIs are used here; everything outside
 * (sheets, files, cache, clock) comes in through `store` and `ctx`.
 *
 *   FinCore.handle(store, ctx, fn, args) -> result
 *   store: { get(table) -> rows[], put(table, rows) }
 *   ctx:   { now: Date, cache: {get(k), put(k, v, sec), remove(k)}, uuid(), saveFile(file, label) -> url,
 *            fetchSources(settings) -> records[] (only for syncSources) }
 */
var FinCore = (function () {
  'use strict';
  var VERSION = '1.0.0';

  /* ---------------------------------------------------------------- schema */
  var SCHEMA = {
    Users: 'id mobile name role codeHash codeHint pinHash salt active:b mustChange:b createdAt lastLogin',
    Heads: 'code name kind budget:n owner note active:b sort:n',
    Income: 'id source sourceRef head party team description amount:n mode utr paidOn proof status srcStatus srcReceipt outbound:b note createdBy createdAt decidedBy decidedAt remarks receiptNo ledgerNo bankId srcType contactName contactPhone',
    Expenses: 'id head title description payee invoiceNo invoiceDate amount:n invoiceFile payMethod accName accNo ifsc bank branch upi phone detailsSource budget:n committed:n actual:n overBy:n expKind explanation status createdBy createdAt updatedAt ackBy ackAt approvedBy approvedAt adminBy adminAt remarks paidOn paidMode utr paidProof paidBy paidAt voucherNo ledgerNo history:j',
    Ledger: 'no date dir head refType refId party description amount:n mode utr postedBy postedAt bankId reconType reconBy reconAt reconNote reversedBy reversalOf',
    Bank: 'id date narration ref debit:n credit:n balance:n? hash batch status ledgerNos matchType matchedBy matchedAt note',
    Payees: 'key name accName accNo ifsc bank branch upi phone updatedAt',
    Jersey: 'id team url name mime size:n note version:n removed:b at by',
    Audit: 'at by action ref detail',
    Settings: 'key value:j'
  };
  var FIELDS = {};
  Object.keys(SCHEMA).forEach(function (t) {
    FIELDS[t] = SCHEMA[t].split(' ').map(function (f) { var p = f.split(':'); return { name: p[0], type: p[1] || 's' }; });
  });
  function coerce(table, row) {
    var o = {};
    FIELDS[table].forEach(function (f) {
      var v = row[f.name];
      if (f.type === 'n') o[f.name] = v === '' || v == null || isNaN(Number(v)) ? 0 : Number(v);
      else if (f.type === 'n?') o[f.name] = v === '' || v == null || isNaN(Number(v)) ? null : Number(v);
      else if (f.type === 'b') o[f.name] = v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
      else if (f.type === 'j') { if (typeof v === 'string') { try { o[f.name] = v ? JSON.parse(v) : null; } catch (e) { o[f.name] = null; } } else o[f.name] = v == null ? null : v; }
      else o[f.name] = v == null ? '' : (v instanceof Date ? isoDate(v) : String(v));
    });
    return o;
  }

  /* -------------------------------------------------------------- defaults */
  /* Access profiles – one access code per profile (job), shared by whoever does that job. The person also types
     their name at sign-in, so every approval and the audit trail show "Name · Profile". */
  var ROLES = { ADMIN: 'Admin', FEES: 'Franchise fees', FIN_OPS: 'Other income, expense approval & payments', EXP_CREATE: 'Expense creation', VIEWER: 'Viewer / Auditor',
    INCOME: 'Other income', EXP_APPROVE: 'Expense approval', PAY: 'Payments & bank', FOOD: 'Food management' };
  var ROLE_HELP = {
    ADMIN: 'Everything: settings, budget, access codes, second approval of large / outbound expenses, reversals, sponsorship credit between teams',
    FEES: 'Fetch Team Desk payments; approve franchise income (ownership, caution deposit, draft, jersey fees); set each team\'s jersey fee',
    FIN_OPS: 'Approve sponsorship, registration and other income; verify expense orders against the budget and accept explanations; pay approved orders; import the bank statement and reconcile',
    INCOME: 'Fetch sources; approve sponsorship, registration and other / outbound income',
    EXP_APPROVE: 'Verify expense orders against the budget, acknowledge explanations, approve / query / reject',
    EXP_CREATE: 'Raise expense orders with bills; add outbound income for approval',
    PAY: 'Pay approved orders and record the transaction; import the bank statement and reconcile',
    VIEWER: 'Read-only: dashboard, ledger, statements, audit trail',
    FOOD: 'Food Arrangement only: Yes/No counts, counter allotment, buffer, daily record. No access to any finance data'
  };
  /* The KNPL-7 duty split: one code each. INCOME / EXP_APPROVE / PAY remain available as separate profile types if the work is split later. */
  var PROFILE_ORDER = ['ADMIN', 'FEES', 'FIN_OPS', 'EXP_CREATE', 'VIEWER', 'FOOD'];
  var PROFILE_NAMES = { ADMIN: 'Admin – Krishnadas M N', FEES: 'Franchise fees – Unnikrishnan S', FIN_OPS: 'Finance – Vineeth Kannath', EXP_CREATE: 'Expense creation (committee)', VIEWER: 'Viewer / Auditor', FOOD: 'Food management – Vishal AN' };
  var KINDS = { INCOME: 'Income', EXPENSE: 'Expense', DEPOSIT: 'Deposit (refundable)' };
  var PAY_MODES = ['UPI', 'NEFT', 'IMPS', 'RTGS', 'Cheque', 'Cash'];
  var DEFAULT_HEADS = [
    ['INC-REG', 'Player Registration Fee', 'INCOME', 232000, '232 players × ₹1,000 (248 completed Phase 2; 16 franchise owners exempted)'],
    ['INC-OWN', 'Franchise Ownership Fee (KNPL-7 instalment)', 'INCOME', 80000, '16 franchises × ₹5,000'],
    ['INC-DRAFT', 'Draft Fee', 'INCOME', 0, 'Set after the draft window closes'],
    ['INC-JERSEY', 'Team Jersey Fee (at actuals)', 'INCOME', 0, 'Teams without a jersey sponsor'],
    ['INC-SPONS', 'Sponsorship', 'INCOME', 800000, '16 franchises × ₹50,000 target'],
    ['INC-OTHER', 'Other / Outbound Income', 'INCOME', 0, 'Unbudgeted income'],
    ['DEP-CD', 'Sponsorship Caution Deposit', 'DEPOSIT', 240000, '16 × ₹15,000 – refundable, shown as a liability'],
    ['EXP-PRIZE', 'Prize Money', 'EXPENSE', 110000, 'Winners 50,000 · Runners 30,000 · Bronze Brigade 2 × 15,000'],
    ['EXP-TROPHY', 'Mementos & Trophies', 'EXPENSE', 150000, ''],
    ['EXP-AUCTION', 'Mega Auction', 'EXPENSE', 75000, '12 Dec 2026, Chola Farm Resorts'],
    ['EXP-GROUND', 'Ground Fee', 'EXPENSE', 212000, '2 grounds × (2 weekdays × 25,000 + 2 weekend days × 28,000) + taxes'],
    ['EXP-TECH', 'Technology (custom bidding page etc.)', 'EXPENSE', 10000, ''],
    ['EXP-JERSEY', 'Team Jerseys', 'EXPENSE', 0, 'Set the budget'],
    ['EXP-OPS', 'Match Operations (balls, umpires, scorers)', 'EXPENSE', 0, 'Set the budget'],
    ['EXP-MEDIA', 'Live Stream, Commentary & Media', 'EXPENSE', 0, 'Set the budget'],
    ['EXP-FOOD', 'Food & Refreshments', 'EXPENSE', 0, 'Set the budget'],
    ['EXP-PRINT', 'Printing & Publicity', 'EXPENSE', 0, 'Set the budget'],
    ['EXP-REFUND', 'Registration Fee Refunds', 'EXPENSE', 0, 'Season replacement / unsold refunds'],
    ['EXP-BANK', 'Bank Charges', 'EXPENSE', 0, ''],
    ['EXP-UNB', 'Unbudgeted / Outbound Expense', 'EXPENSE', 0, 'Any expense not in the budget – explanation always needed']
  ];
  var DEFAULT_SETTINGS = {
    org: 'Kerala Namboodiris Premier League (KNPL)',
    season: 'KNPL Season 7',
    venue: '11–14 February 2027 · FISAT & Boundary Grounds, Angamaly',
    periodFrom: '2026-08-01', periodTo: '2027-03-31',
    openingBalance: 0,
    targetSurplus: 240000,
    bankName: '', bankAccount: '', bankIfsc: '', upiId: '',
    dualAbove: 25000, dualForOutbound: true, cashLimit: 5000,
    prefixReceipt: 'KNPL7/FR/', prefixVoucher: 'KNPL7/PV/', prefixLedger: 'KNPL7/L/',
    preparedBy: 'Krishnadas M N', verifiedBy: 'Unnikrishnan S (Finance)', approvedBy: 'KNPL Core Committee',
    contact: 'Team fees: Unnikrishnan S · Fund raising: Krishnadas M N',
    sources: [
      { id: 'TEAMDESK', type: 'teamdesk', label: 'Team Desk (franchise payments)', enabled: true, trust: true,
        map: { CD: 'DEP-CD', OWN: 'INC-OWN', DR: 'INC-DRAFT', JER: 'INC-JERSEY' } },
      /* Player registration fee: every player who completed Phase 2 (Status Approved, Auction Joined YES) is recorded as paid
         and approved; franchise owners are exempted (committee decision of 27 Nov 2026). */
      { id: 'REG', type: 'registration', label: 'Player registration fee (KNPL-7)', enabled: true, trust: true,
        sheetId: '1yLTJPg-2sh2xjuF8jVH6imyHxF99tVRmd8RvdStvZpw', tab: 'Registrations', head: 'INC-REG', fixedAmount: 1000 }
    ],
    /* Sponsorship categories – each has its own portal and register sheet (same format as the Cover Drive portal).
       Requests are approved / rejected on the Finance Desk; the decision is written back to the register, so the sponsor
       can download the receipt and poster from the portal. */
    sponsorTarget: 50000,
    sponsorCats: [
      { id: 'SPONSOR', code: 'CD', cat: 'Cover Drive', enabled: true, sheetId: '1PO6rCjwjbmRhkXb6i68rGwx7H4RNc0w3woLQQ9IVtGY', tab: 'Sponsorships',
        portal: 'https://knplseason7.github.io/knpl7-cover-drive/',
        api: 'https://script.google.com/macros/s/AKfycbzhb0N02RyK_lLfsMxQCooY_BRN1MtGhnVCVc7Wn4w6RtdVdPc30k3QaJs4gzgSkEOF/exec' },
      { id: 'SPONSOR_FL', code: 'FL', cat: 'Flick', enabled: true, sheetId: '', tab: 'Sponsorships', portal: '', api: '' },
      { id: 'SPONSOR_SD', code: 'SD', cat: 'Straight Drive', enabled: true, sheetId: '', tab: 'Sponsorships', portal: '', api: '' }
    ]
  };
  var SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

  /* --------------------------------------------------------------- helpers */
  function E(msg) { var e = new Error(msg); e.user = true; return e; }
  function r2(x) { return Math.round((Number(x) || 0) * 100) / 100; }
  function isoDate(d) { var x = new Date(d.getTime() + 5.5 * 3600e3); return x.toISOString().slice(0, 10); }
  function stamp(d) { var x = new Date(d.getTime() + 5.5 * 3600e3).toISOString(); return x.slice(0, 10) + ' ' + x.slice(11, 16); }
  function validDate(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return false;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] && +m[1] > 2020 && +m[1] < 2040;
  }
  function dayDiff(a, b) { return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 864e5); }
  function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 300); }
  function text(v, max) { return String(v == null ? '' : v).replace(/\r/g, '').replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, max || 2000); }
  function normRef(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function mobile10(s) { var d = String(s || '').replace(/\D/g, ''); return d.length > 10 ? d.slice(-10) : d; }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function inr(v) {
    var n = r2(v), neg = n < 0; n = Math.abs(n);
    var int = Math.floor(n), dec = Math.round((n - int) * 100), s = String(int), last = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last = ',' + last;
    return (neg ? '-' : '') + '₹' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last + (dec ? '.' + pad(dec, 2) : '');
  }
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
  function three(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
  function words(num) {
    num = Math.abs(r2(num));
    var n = Math.floor(num), paise = Math.round((num - n) * 100), out = [];
    if (n === 0) out.push('Zero');
    var cr = Math.floor(n / 1e7); n %= 1e7; var lk = Math.floor(n / 1e5); n %= 1e5; var th = Math.floor(n / 1000); n %= 1000;
    if (cr) out.push(cr >= 100 ? three(cr) + ' Crore' : two(cr) + ' Crore'); if (lk) out.push(two(lk) + ' Lakh'); if (th) out.push(two(th) + ' Thousand'); if (n) out.push(three(n));
    return 'Rupees ' + out.join(' ') + (paise ? ' and ' + two(paise) + ' Paise' : '') + ' Only';
  }

  /* ---------------------------------------------------- SHA-256 (pure JS) */
  var SHA_K = null, SHA_H = null;
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var bytes = [], i, j;
    var s = unescape(encodeURIComponent(ascii));
    for (i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    if (!SHA_K) {
      SHA_K = []; SHA_H = []; var primes = [], cand = 2;
      while (primes.length < 64) { var isP = true; for (j = 0; j < primes.length && primes[j] * primes[j] <= cand; j++) if (cand % primes[j] === 0) { isP = false; break; } if (isP) primes.push(cand); cand++; }
      for (i = 0; i < 64; i++) { var p = primes[i]; if (i < 8) SHA_H[i] = (Math.pow(p, 1 / 2) * 4294967296) | 0; SHA_K[i] = (Math.pow(p, 1 / 3) * 4294967296) | 0; }
    }
    var K = SHA_K, H = SHA_H.slice();
    var bitLen = bytes.length * 8; bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    for (var off = 0; off < bytes.length; off += 64) {
      var w = [];
      for (i = 0; i < 16; i++) w[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
      for (i = 16; i < 64; i++) { var s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = ''; for (i = 0; i < 8; i++) out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return out;
  }
  function hashPin(pin, salt) { var h = salt + ':' + pin; for (var i = 0; i < 300; i++) h = sha256(h + ':' + salt); return h; }


  /* --------------------------------------------- explanation quality check */
  var STOP = ('a an the to for of and or but in on at by with from as is was were are be been has have had will would should can could ' +
    'this that these those it its we our us they their he his she her i my me you your not no than more less due because since so ' +
    'which who what when where why how also only very there here after before over under per into about then them us any some all event events thing things item items').split(' ');
  var WEAK = 'needed need needs required require requirement urgent urgently request requested necessary important must essential purpose work works'.split(' ');
  var CUES = ('because due since reason caused cause increase increased higher high extra additional more revised revision rate rates price prices ' +
    'quotation quote quoted vendor supplier cost costs costing gst tax taxes transport delivery urgent emergency unexpected unforeseen unplanned change changed changes ' +
    'requirement required request requested added addition new damaged damage replace replacement shortage short missed missing late delay delayed ' +
    'committee decided decision approved sponsor sponsors players teams team ground venue quantity qty units number count more than budget budgeted estimate estimated ' +
    'underestimated original originally earlier last season previous instead needed need balance rain weather police permission fee fees charges hike premium upgrade').split(' ');
  var KEYS = ['qwerty', 'asdf', 'zxcv', 'qwer', 'wasd', 'hjkl', 'uiop', 'jkl', 'abcd', 'abcdef', 'xyz', 'lorem', 'ipsum', 'test', 'testing', 'dummy', 'sample', 'blah', 'xxx', 'na', 'nil', 'none', 'ok', 'okay'];
  function checkExplanation(raw, context) {
    var t = String(raw || '').replace(/\s+/g, ' ').trim(), issues = [];
    var ml = (t.match(/[ഀ-ൿ]/g) || []).length;
    var tokens = t.split(/[^A-Za-zഀ-ൿ0-9₹]+/).filter(Boolean);
    var wordsA = tokens.filter(function (w) { return /[A-Za-zഀ-ൿ]/.test(w); });
    var lower = wordsA.map(function (w) { return w.toLowerCase(); });
    var distinct = {}; lower.forEach(function (w) { distinct[w] = 1; });
    var nDistinct = Object.keys(distinct).length;
    var latin = lower.filter(function (w) { return /^[a-z]+$/.test(w); });
    var gib = latin.filter(function (w) {
      if (w.length < 4) return false;
      if (!/[aeiou]/.test(w)) return true;
      if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(w)) return true;
      if (/(.)\1\1/.test(w)) return true;
      var v = (w.match(/[aeiouy]/g) || []).length / w.length; return v < 0.15 || v > 0.85;
    });
    var junk = lower.filter(function (w) { return KEYS.indexOf(w) >= 0; });
    var stops = latin.filter(function (w) { return STOP.indexOf(w) >= 0; }).length;
    var cues = lower.filter(function (w) { return CUES.indexOf(w) >= 0; }).length + (/\d/.test(t) ? 1 : 0);
    var content = lower.filter(function (w) { return STOP.indexOf(w) < 0 && KEYS.indexOf(w) < 0 && WEAK.indexOf(w) < 0 && gib.indexOf(w) < 0; });
    var cDistinct = {}; content.forEach(function (w) { cDistinct[w] = 1; });
    if (t.length < 40) issues.push('It is too short – write at least one full sentence (40+ characters).');
    if (wordsA.length < 8) issues.push('Use at least 8 words.');
    if (/(.)\1{4,}/.test(t)) issues.push('It has the same character repeated many times.');
    if (wordsA.length && nDistinct / wordsA.length < 0.5) issues.push('Too many repeated words.');
    if (latin.length && gib.length / Math.max(1, latin.length) > 0.2) issues.push('Some words look like random letters (' + gib.slice(0, 3).join(', ') + ').');
    if (junk.length >= 2 || (junk.length && wordsA.length < 12)) issues.push('Filler words like "' + junk[0] + '" are not a reason.');
    if (ml < 15 && latin.length >= 8 && stops < 2) issues.push('It does not read as a sentence.');
    if (ml < 15 && cues === 0) issues.push('Say why: what changed, what caused the extra cost, or why it was not in the budget.');
    if (Object.keys(cDistinct).length < 5 && ml < 15) issues.push('It is too vague – give the actual reason ("needed" or "required" alone is not a reason).');
    if (context) {
      var ctxw = {}; String(context).toLowerCase().split(/[^a-zഀ-ൿ0-9]+/).forEach(function (w) { if (w) ctxw[w] = 1; });
      var novel = Object.keys(cDistinct).filter(function (w) { return !ctxw[w]; });
      if (Object.keys(cDistinct).length && novel.length < 3) issues.push('Do not just repeat the title or description – explain the reason.');
    }
    var score = Math.max(0, 100 - issues.length * 25);
    return { ok: issues.length === 0, score: score, issues: issues,
      advice: issues.length ? 'Please mention a clear and valid reason – e.g. what changed, why it could not be avoided, and how the extra amount was arrived at.' : '' };
  }

  /* ------------------------------------------ payee details from bill text */
  var IFSC_RE = /\b([A-Z]{4}0[A-Z0-9]{6})\b/;
  var UPI_RE = /^[a-zA-Z0-9][a-zA-Z0-9.\-_]{1,255}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
  function validIfsc(s) { return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(s || '')); }
  function validAcc(s) { return /^\d{9,18}$/.test(String(s || '')); }
  function validUpi(s) { return UPI_RE.test(String(s || '')) && !/\.(com|in|org|net|co)$/i.test(String(s)); }
  function parsePayee(raw) {
    var t = String(raw || '').replace(/[|]/g, ' ').replace(/ /g, ' ');
    var lines = t.split(/\n/).map(function (s) { return s.replace(/[ \t]+/g, ' ').trim(); }).filter(Boolean);
    var flat = lines.join('\n'), up = flat.toUpperCase(), out = { accNo: '', ifsc: '', upi: '', phone: '', accName: '', bank: '', invoiceNo: '', invoiceDate: '', amount: null, gstin: '' };
    var m = up.match(/IFS(?:C|C\s*CODE)?\s*(?:CODE)?\s*[:\-.]?\s*([A-Z]{4})[\s\-]?[0O][\s\-]?([A-Z0-9]{6})\b/);
    if (!m) { m = up.match(/\b([A-Z]{4})0([A-Z0-9]{6})\b/); if (m && !/\d/.test(m[2])) m = null; }
    if (m) out.ifsc = m[1] + '0' + m[2];
    var am = flat.match(/(?:a\s*\/\s*c|acc(?:oun)?t?|account)\s*(?:no|number|num|#)?\.?\s*[:\-#.]?\s*([0-9][0-9 \-]{7,24}[0-9])/i);
    if (am) { var d = am[1].replace(/\D/g, ''); if (d.length >= 9 && d.length <= 18) out.accNo = d; }
    if (!out.accNo && out.ifsc) { var cands = flat.match(/\b\d{9,18}\b/g) || []; cands = cands.filter(function (c) { return !/^[6-9]\d{9}$/.test(c); }); if (cands.length === 1) out.accNo = cands[0]; }
    var um = flat.match(/\b([a-zA-Z0-9][a-zA-Z0-9.\-_]{1,60}@[a-zA-Z][a-zA-Z0-9]{1,30})\b(?!\.)/g) || [];
    for (var i = 0; i < um.length; i++) if (validUpi(um[i])) { out.upi = um[i]; break; }
    var pm = flat.match(/(?:g\s*pay|google\s*pay|phone\s*pe|paytm|upi|mobile|mob|ph(?:one)?|contact)\s*(?:no|number)?\.?\s*[:\-]?\s*(?:\+?91[\s\-]?)?([6-9]\d{4}[\s\-]?\d{5})/i);
    if (pm) out.phone = pm[1].replace(/\D/g, '');
    var nm = flat.match(/(?:a\s*\/\s*c\s*(?:holder\s*)?name|account\s*(?:holder\s*)?name|beneficiary(?:\s*name)?|name\s*of\s*(?:the\s*)?account\s*holder|payee(?:\s*name)?)\s*[:\-]?\s*([A-Za-z][A-Za-z .&'\-]{2,60})/i);
    if (nm) out.accName = nm[1].replace(/\s+(a\s*\/\s*c|account|ifsc|bank|branch).*$/i, '').trim();
    var bm = flat.match(/(?:bank(?:\s*name)?)\s*[:\-]\s*([A-Za-z][A-Za-z .&\-]{2,50})/i);
    if (bm) out.bank = bm[1].replace(/\s+(branch|ifsc|a\/c|account).*$/i, '').trim();
    var im = flat.match(/(?:invoice|inv|bill|receipt)\s*(?:no|number|#)\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\/\-]{1,24})/i);
    if (im) out.invoiceNo = im[1];
    var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
    function iso(y, mo, dd) { y = +y; if (y < 100) y += 2000; var s = y + '-' + pad(+mo, 2) + '-' + pad(+dd, 2); return validDate(s) ? s : ''; }
    var dm = flat.match(/(?:date|dated|dt)\.?\s*[:\-]?\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i);
    if (dm) out.invoiceDate = iso(dm[3], dm[2], dm[1]);
    if (!out.invoiceDate) { dm = flat.match(/(?:date|dated|dt)\.?\s*[:\-]?\s*(\d{1,2})[\s\-\/.]*(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*[\s,\-\/.]*(\d{2,4})/i); if (dm) out.invoiceDate = iso(dm[3], MON[dm[2].toLowerCase()], dm[1]); }
    var tm = flat.match(/(?:grand\s*total|net\s*(?:amount|payable|total)|total\s*(?:amount|payable|due)?|amount\s*(?:payable|due))\s*(?:\(?(?:rs|inr|₹)\.?\)?)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.\d{1,2})?|[0-9]{2,8}(?:\.\d{1,2})?)/gi);
    if (tm) { var best = null; tm.forEach(function (x) { var n = Number(x.replace(/^[^0-9]*(?=[0-9])/, '').match(/[0-9,]+(?:\.\d{1,2})?/)[0].replace(/,/g, '')); if (n > 0 && (best == null || n > best)) best = n; }); out.amount = best; }
    var gm = up.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/); if (gm) out.gstin = gm[1];
    return out;
  }

  /* -------------------------------------------- bank statement text parser */
  function parseAmount(v) {
    if (v == null) return null; if (typeof v === 'number') return isFinite(v) ? Math.abs(v) : null;
    var s = String(v).replace(/[₹,\s]|rs\.?|inr/gi, '').replace(/(cr|dr)$/i, '');
    if (s === '' || s === '-' || s === '--') return null;
    s = s.replace(/^\((.*)\)$/, '$1');
    var n = Number(s); return isFinite(n) ? Math.abs(n) : null;
  }
  function parseSigned(v) {
    if (v == null || v === '') return null; if (typeof v === 'number') return isFinite(v) ? v : null;
    var raw = String(v).trim(), a = parseAmount(raw); if (a == null) return null;
    return /^-|^\(.*\)$|dr\.?$/i.test(raw.replace(/\s/g, '')) ? -a : a;
  }
  function parseDateAny(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number' && v > 20000 && v < 80000) { var d0 = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return d0.toISOString().slice(0, 10); }
    var s = String(v).trim(), MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 }, m;
    function iso(y, mo, dd) { y = +y; if (y < 100) y += 2000; var o = y + '-' + pad(+mo, 2) + '-' + pad(+dd, 2); return validDate(o) ? o : ''; }
    if ((m = s.match(/^(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})/))) return iso(m[1], m[2], m[3]);
    if ((m = s.match(/^(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{2,4})/))) return iso(m[3], m[2], m[1]);
    if ((m = s.match(/^(\d{1,2})[\s\-\/.]*([A-Za-z]{3,4})[a-z]*[\s,\-\/.]*(\d{2,4})/)) && MON[m[2].toLowerCase()]) return iso(m[3], MON[m[2].toLowerCase()], m[1]);
    if ((m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/)) && MON[m[1].toLowerCase()]) return iso(m[3], MON[m[1].toLowerCase()], m[2]);
    return '';
  }
  function splitCsv(textIn) {
    var rows = [], row = [], cell = '', q = false, s = String(textIn || '').replace(/^﻿/, '');
    var head = s.split('\n').slice(0, 25).join('\n'), tabs = (head.match(/\t/g) || []).length, commas = (head.match(/,/g) || []).length, semis = (head.match(/;/g) || []).length;
    var delim = tabs >= 2 && tabs >= commas ? '\t' : semis > commas * 2 && semis >= 4 ? ';' : ',';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }
  /* rows: array of arrays (from CSV or a spreadsheet). Returns {header, map, lines, skipped} */
  var STMT_PAT = { date: /^(txn\s*|transaction\s*|value\s*|tran\s*)?date$|^date/i, narration: /narration|description|particulars|remarks|details/i,
      ref: /ref|chq|cheque|utr|instrument/i, debit: /debit|withdraw|dr\b|^dr$|paid\s*out/i, credit: /credit|deposit|cr\b|^cr$|paid\s*in/i,
      balance: /balance/i, amount: /^amount|amount\s*\(|^amt/i, type: /^(dr\s*\/\s*cr|cr\s*\/\s*dr|type|txn\s*type)$/i };
  function mapHeader(row) {
    var pat = STMT_PAT, mp = {};
    (row || []).map(function (x) { return String(x == null ? '' : x).trim(); }).forEach(function (h, j) {
      if (h && pat.type.test(h)) { if (mp.type == null) mp.type = j; return; }
      Object.keys(pat).forEach(function (k) { if (mp[k] == null && h && pat[k].test(h) && !(k === 'date' && /value/i.test(h) && mp.date != null)) mp[k] = j; });
    });
    if (mp.debit != null && mp.credit != null && mp.debit === mp.credit) delete mp.credit;
    ['amount', 'type'].forEach(function (k) { if (mp[k] != null && (mp[k] === mp.debit || mp[k] === mp.credit || mp[k] === mp.balance)) delete mp[k]; });
    return mp;
  }
  function detectStatement(rows) {
    var hi = -1, map = null;
    for (var i = 0; i < Math.min(rows.length, 40); i++) {
      var mp = mapHeader(rows[i]);
      if (mp.date != null && (mp.debit != null && mp.credit != null || mp.amount != null)) { hi = i; map = mp; break; }
    }
    if (hi < 0) return { header: null, map: null, lines: [], skipped: rows.length };
    return { header: rows[hi], map: map, headerRow: hi, lines: statementLines(rows.slice(hi + 1), map).lines, skipped: statementLines(rows.slice(hi + 1), map).skipped };
  }
  function statementLines(rows, map) {
    var lines = [], skipped = 0;
    rows.forEach(function (r) {
      var date = parseDateAny(r[map.date]);
      var dr = null, cr = null;
      if (map.debit != null && map.credit != null) { dr = parseAmount(r[map.debit]); cr = parseAmount(r[map.credit]); }
      else if (map.amount != null) {
        var raw = String(r[map.amount] || ''), a = parseAmount(raw), ty = map.type != null ? String(r[map.type] || '') : '';
        if (a != null) { if (/dr|debit|withdraw/i.test(ty) || /dr$/i.test(raw.trim()) || /^-/.test(raw.trim())) dr = a; else cr = a; }
      }
      dr = dr || 0; cr = cr || 0;
      if (!date || (dr > 0) === (cr > 0)) { skipped++; return; }
      lines.push({ date: date, narration: str(map.narration != null ? r[map.narration] : '', 300), ref: str(map.ref != null ? r[map.ref] : '', 60),
        debit: r2(dr), credit: r2(cr), balance: map.balance != null ? parseSigned(r[map.balance]) : null });
    });
    return { lines: lines, skipped: skipped };
  }

  /* ------------------------------------------------------- state & context */
  function State(store) {
    this.store = store; this.cache = {}; this.dirty = {};
  }
  State.prototype.t = function (name) {
    if (!this.cache[name]) this.cache[name] = (this.store.get(name) || []).map(function (r) { return coerce(name, r); });
    return this.cache[name];
  };
  State.prototype.touch = function (name) { this.dirty[name] = true; };
  State.prototype.flush = function () {
    var self = this;
    Object.keys(this.dirty).forEach(function (n) { self.store.put(n, self.cache[n].map(function (r) { return coerce(n, r); })); });
    this.dirty = {};
  };
  State.prototype.settings = function () {
    var rows = this.t('Settings'), s = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    rows.forEach(function (r) { if (r.key !== 'seq' && SETTING_KEYS.indexOf(r.key) >= 0 && r.value != null) s[r.key] = r.value; });
    return s;
  };
  State.prototype.setSetting = function (key, value) {
    var rows = this.t('Settings'), r = rows.filter(function (x) { return x.key === key; })[0];
    if (r) r.value = value; else rows.push({ key: key, value: value });
    this.touch('Settings');
  };
  State.prototype.next = function (kind) {
    var rows = this.t('Settings'), r = rows.filter(function (x) { return x.key === 'seq'; })[0];
    if (!r) { r = { key: 'seq', value: {} }; rows.push(r); }
    r.value = r.value || {}; r.value[kind] = (Number(r.value[kind]) || 0) + 1; this.touch('Settings');
    return r.value[kind];
  };
  State.prototype.log = function (user, action, ref, detail) {
    this.t('Audit').push({ at: this.now, by: user ? user.name : 'System', action: action, ref: ref || '', detail: str(detail, 500) });
    this.touch('Audit');
  };
  function findBy(rows, k, v) { for (var i = 0; i < rows.length; i++) if (rows[i][k] === v) return rows[i]; return null; }

  /* ------------------------------------------------------------ permissions */
  var CAN = {
    viewAll: ['ADMIN', 'FEES', 'FIN_OPS', 'INCOME', 'EXP_APPROVE', 'PAY', 'VIEWER'], createExpense: ['ADMIN', 'EXP_CREATE'], createIncome: ['ADMIN', 'FEES', 'FIN_OPS', 'INCOME', 'EXP_CREATE'],
    decideIncome: ['ADMIN', 'FEES', 'FIN_OPS', 'INCOME'], decideExpense: ['ADMIN', 'FIN_OPS', 'EXP_APPROVE'], pay: ['ADMIN', 'FIN_OPS', 'PAY'], bank: ['ADMIN', 'FIN_OPS', 'PAY'], admin: ['ADMIN'], sync: ['ADMIN', 'FEES', 'FIN_OPS', 'INCOME'],
    teamView: ['ADMIN', 'FEES', 'FIN_OPS', 'INCOME'], teamFees: ['ADMIN', 'FEES'], teamCredit: ['ADMIN'], food: ['ADMIN', 'FOOD'], jersey: ['ADMIN']
  };
  function need(user, what) { if (CAN[what].indexOf(user.role) < 0) throw E('The "' + ROLES[user.role] + '" profile cannot do this. Sign in with the right access code.'); }
  function canMap(role) { var m = {}; Object.keys(CAN).forEach(function (k) { m[k] = CAN[k].indexOf(role) >= 0; }); return m; }
  /* Franchise heads = the heads Team Desk payments are mapped to. FEES approves only these; INCOME only the others. */
  function feeHeads(s) { var src = (s.sources || []).filter(function (x) { return x.type === 'teamdesk'; })[0] || {}, m = src.map || {}; return Object.keys(m).map(function (k) { return m[k]; }); }
  function incomeScope(role, s, row) {
    if (role === 'ADMIN') return true;
    var fee = row.source === 'TEAMDESK' || feeHeads(s).indexOf(row.head) >= 0;
    return role === 'FEES' ? fee : (role === 'INCOME' || role === 'FIN_OPS') ? !fee : false;
  }

  /* ---------------------------------------------------------- calculations */
  function activeLedger(l) { return !l.reversedBy && !l.reversalOf; }
  function headMap(heads) { var m = {}; heads.forEach(function (h) { m[h.code] = h; }); return m; }
  var COMMITTED = ['SUBMITTED', 'QUERY', 'AWAITING_ADMIN', 'APPROVED'];
  function summary(heads, income, expenses, ledger) {
    var rows = {}, tot = { incTarget: 0, incReceived: 0, incPending: 0, expBudget: 0, expActual: 0, expCommitted: 0, depTarget: 0, depIn: 0, depOut: 0 };
    heads.forEach(function (h) { rows[h.code] = { code: h.code, name: h.name, kind: h.kind, budget: r2(h.budget), active: h.active, actual: 0, inflow: 0, outflow: 0, pending: 0, committed: 0, sort: h.sort }; });
    ledger.forEach(function (l) { var r = rows[l.head]; if (!r) return; if (l.dir === 'IN') r.inflow = r2(r.inflow + l.amount); else r.outflow = r2(r.outflow + l.amount); });
    income.forEach(function (i) { var r = rows[i.head]; if (r && (i.status === 'PENDING' || i.status === 'SOURCE_PENDING')) r.pending = r2(r.pending + i.amount); });
    expenses.forEach(function (x) { var r = rows[x.head]; if (r && COMMITTED.indexOf(x.status) >= 0) r.committed = r2(r.committed + x.amount); });
    var list = Object.keys(rows).map(function (k) {
      var r = rows[k];
      if (r.kind === 'INCOME') { r.actual = r2(r.inflow - r.outflow); r.gap = r2(r.budget - r.actual); tot.incTarget += r.budget; tot.incReceived += r.actual; tot.incPending += r.pending; }
      else if (r.kind === 'EXPENSE') { r.actual = r2(r.outflow - r.inflow); r.available = r2(r.budget - r.actual - r.committed); r.gap = r.available; r.util = r.budget > 0 ? r2((r.actual + r.committed) / r.budget * 100) : (r.actual + r.committed > 0 ? null : 0); tot.expBudget += r.budget; tot.expActual += r.actual; tot.expCommitted += r.committed; }
      else { r.actual = r2(r.inflow - r.outflow); r.held = r.actual; r.gap = r2(r.budget - r.inflow); tot.depTarget += r.budget; tot.depIn += r.inflow; tot.depOut += r.outflow; }
      return r;
    }).sort(function (a, b) { return (a.sort || 0) - (b.sort || 0) || a.code.localeCompare(b.code); });
    Object.keys(tot).forEach(function (k) { tot[k] = r2(tot[k]); });
    tot.netOperating = r2(tot.incReceived - tot.expActual);
    tot.projectedSurplus = r2(tot.incTarget - tot.expBudget);
    tot.depHeld = r2(tot.depIn - tot.depOut);
    return { heads: list, totals: tot };
  }
  /* Orders are checked in the order they were raised: for an existing order, unpaid orders raised AFTER it do not
     count against it (they are the ones that must explain any over-spending). Paid orders always count (via the ledger). */
  function budgetCheck(heads, expenses, ledger, headCode, amount, excludeId) {
    var h = findBy(heads, 'code', headCode);
    if (!h) return null;
    var others = expenses.filter(function (x) { return x.id !== excludeId && !(excludeId && x.id > excludeId); });
    var s = summary([h], [], others, ledger).heads[0];
    var res = { head: h.code, name: h.name, kind: h.kind, budget: r2(h.budget), actual: s.actual, committed: s.committed, amount: r2(amount), expKind: '', overBy: 0 };
    if (h.kind !== 'EXPENSE') { res.available = null; return res; }
    res.available = r2(h.budget - s.actual - s.committed);
    res.after = r2(res.available - amount);
    if (h.budget <= 0) { res.expKind = 'OUTBOUND'; res.overBy = r2(amount); }
    else if (res.after < -0.004) { res.expKind = 'OVER'; res.overBy = r2(-res.after); }
    return res;
  }
  function reconStatus(state, settings) {
    var ledger = state.ledger || state.t('Ledger'), bank = state.bank || state.t('Bank');
    var act = ledger.filter(function (l) { return activeLedger(l) && l.amount > 0; });
    var unrec = act.filter(function (l) { return !l.reconType; });
    var inSum = 0, outSum = 0; ledger.forEach(function (l) { if (l.dir === 'IN') inSum += l.amount; else outSum += l.amount; });
    var sorted = bank.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1); });
    var withBal = sorted.filter(function (b) { return b.balance != null; });
    var bankBal = withBal.length ? withBal[withBal.length - 1].balance : null;
    var cr = 0, dr = 0; bank.forEach(function (b) { cr += b.credit; dr += b.debit; });
    var book = r2(Number(settings.openingBalance || 0) + inSum - outSum);
    var cashRec = act.filter(function (l) { return l.reconType === 'CASH'; });
    var cashNet = 0; cashRec.forEach(function (l) { cashNet += l.dir === 'IN' ? l.amount : -l.amount; });
    var uIn = 0, uOut = 0; unrec.forEach(function (l) { if (l.dir === 'IN') uIn += l.amount; else uOut += l.amount; });
    var openB = bank.filter(function (b) { return b.status === 'OPEN'; });
    var oCr = 0, oDr = 0; openB.forEach(function (b) { oCr += b.credit; oDr += b.debit; });
    var ign = bank.filter(function (b) { return b.status === 'IGNORED'; }), igNet = 0; ign.forEach(function (b) { igNet += b.credit - b.debit; });
    // book balance, less cash held outside the bank, less receipts not yet seen in the bank, plus payments not yet cleared,
    // plus bank items not yet in the books (open lines), plus bank items that are deliberately outside the ledger (ignored)
    var expectedBank = r2(book - cashNet - uIn + uOut + oCr - oDr + igNet);
    return { entries: act.length, reconciled: act.length - unrec.length, unreconciled: unrec.length, unreconciledIn: r2(uIn), unreconciledOut: r2(uOut),
      bankLines: bank.length, bankOpen: openB.length, bankOpenCredit: r2(oCr), bankOpenDebit: r2(oDr), bankIgnoredNet: r2(igNet),
      bookBalance: book, cashNet: r2(cashNet), bankBalance: bankBal, bankCredits: r2(cr), bankDebits: r2(dr), expectedBank: expectedBank,
      difference: bankBal == null ? null : r2(bankBal - expectedBank), complete: unrec.length === 0 && openB.length === 0 };
  }
  function suggestMatches(ledger, line) {
    var dir = line.credit > 0 ? 'IN' : 'OUT', amt = line.credit > 0 ? line.credit : line.debit, hay = normRef(line.narration + ' ' + line.ref);
    return ledger.filter(function (l) { return activeLedger(l) && !l.reconType && l.dir === dir && l.amount > 0; }).map(function (l) {
      var sc = 0, why = [];
      var u = normRef(l.utr);
      if (u.length >= 6 && hay.indexOf(u) >= 0) { sc += 60; why.push('reference found'); }
      if (Math.abs(l.amount - amt) < 0.01) { sc += 30; why.push('same amount'); } else if (l.amount < amt) { sc += 5; }
      var dd = Math.abs(dayDiff(line.date, l.date));
      if (dd <= 3) { sc += 10 - dd * 2; why.push(dd === 0 ? 'same date' : dd + ' day(s) apart'); }
      var p = String(l.party || '').toUpperCase().split(/\s+/).filter(function (w) { return w.length > 3; });
      if (p.some(function (w) { return hay.indexOf(normRef(w)) >= 0; })) { sc += 8; why.push('name in narration'); }
      return { no: l.no, score: sc, why: why.join(', '), amount: l.amount, date: l.date, party: l.party, utr: l.utr, head: l.head };
    }).filter(function (x) { return x.score >= 5; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 30);
  }

  /* --------------------------------------------------------- ledger posting */
  function post(state, user, e) {
    var s = state.settings(), no = s.prefixLedger + pad(state.next('L'), 5);
    var row = { no: no, date: e.date, dir: e.dir, head: e.head, refType: e.refType, refId: e.refId, party: e.party, description: str(e.description, 300),
      amount: r2(e.amount), mode: e.mode || '', utr: e.utr || '', postedBy: user ? user.name : 'System', postedAt: state.now, bankId: '', reconType: '', reconBy: '', reconAt: '', reconNote: '', reversedBy: '', reversalOf: e.reversalOf || '' };
    if (e.mode === 'Cash' && !e.reversalOf) { row.reconType = 'CASH'; row.reconBy = 'System'; row.reconAt = state.now; row.reconNote = 'Cash – no bank entry'; }
    state.t('Ledger').push(row); state.touch('Ledger');
    return row;
  }
  function linkBank(state, user, bankId, ledgerRows, how) {
    var b = findBy(state.t('Bank'), 'id', bankId); if (!b) throw E('Bank line ' + bankId + ' not found.');
    b.status = 'MATCHED'; b.ledgerNos = ledgerRows.map(function (l) { return l.no; }).join(','); b.matchType = how; b.matchedBy = user ? user.name : 'System'; b.matchedAt = state.now;
    ledgerRows.forEach(function (l) { l.bankId = bankId; l.reconType = 'BANK'; l.reconBy = b.matchedBy; l.reconAt = state.now; l.reconNote = how; });
    state.touch('Bank'); state.touch('Ledger');
  }

  /* -------------------------------------------------------------- file help */
  function takeFile(ctx, f, label, required) {
    if (!f) { if (required) throw E('Attach the ' + label + '.'); return ''; }
    if (typeof f === 'string') { if (/^https?:\/\//.test(f) || /^data:/.test(f) || /^blob:/.test(f)) return f; throw E('Invalid file for ' + label + '.'); }
    if (!f.data || !/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.mime || '')) throw E('The ' + label + ' must be a JPG, PNG, WEBP or PDF.');
    if (f.data.length > 7 * 1024 * 1024 * 1.37) throw E('The ' + label + ' is larger than 7 MB.');
    return ctx.saveFile(f, label);
  }

  /* ------------------------------------------------------------------ auth */
  /* Sign-in is by a personal ACCESS CODE (8 characters, shown as XXXX-XXXX). Only a hash of the code is stored;
     the Admin issues / re-issues codes in Settings ▸ Users and shares them personally. */
  var CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';           // no 0/O, 1/I/L confusion
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function codeHash(c) { return hashPin(normCode(c), 'KNPL7-FIN'); }
  function newCode(ctx) {
    var hex = (String(ctx.uuid()) + String(ctx.uuid())).replace(/[^0-9a-f]/gi, ''), out = '';
    for (var i = 0; out.length < 8; i += 2) out += CODE_ABC[parseInt(hex.substr(i, 2), 16) % 32];
    return out.slice(0, 4) + '-' + out.slice(4);
  }
  function publicUser(u) { return { id: u.id, name: u.name, mobile: u.mobile, role: u.role, roleName: ROLES[u.role], roleHelp: ROLE_HELP[u.role], active: u.active, hasCode: !!u.codeHash, codeHint: u.codeHint, lastLogin: u.lastLogin, createdAt: u.createdAt }; }
  /* Applies the KNPL-7 duty split to existing data: switches off profiles whose type is not in PROFILE_ORDER
     (their old codes stop working), renames the kept ones with their holder, and creates + codes any missing one. */
  function applyDuties(state, ctx) {
    var users = state.t('Users'), off = [];
    users.forEach(function (u) {
      if (!u.active) return;
      if (PROFILE_ORDER.indexOf(u.role) < 0) { u.active = false; off.push(u.name); }
      else if (u.codeHash && PROFILE_NAMES[u.role] && users.filter(function (x) { return x.role === u.role && x.active && x.codeHash; })[0] === u) u.name = PROFILE_NAMES[u.role];
    });
    state.touch('Users');
    var made = ensureProfiles(state, ctx);
    state.log(null, 'DUTIES', '', 'Switched off: ' + (off.join(', ') || 'none') + '; new: ' + (made.map(function (x) { return x.profile; }).join(', ') || 'none'));
    return { switchedOff: off, created: made };
  }
  /* Creates any missing default profile (one per type) and gives a code to profiles without one.
     A legacy row of that type without a code (e.g. a person added before profiles) is turned into the profile. */
  function ensureProfiles(state, ctx, fixed) {
    var users = state.t('Users'), out = [];
    PROFILE_ORDER.forEach(function (role) {
      var have = users.filter(function (u) { return u.role === role && u.active; });
      var row = have.filter(function (u) { return u.codeHash; })[0];
      if (row) return;
      row = have[0];
      if (row) row.name = PROFILE_NAMES[role]; else { row = makeUser(state, { name: PROFILE_NAMES[role], role: role }); users.push(row); }
      out.push({ profile: PROFILE_NAMES[role], role: role, code: giveCode(state, ctx, row, fixed && fixed[role]) });
    });
    if (out.length) state.log(null, 'PROFILES', '', out.map(function (x) { return x.profile; }).join(', ') + ' – access codes issued');
    return out;
  }
  function login(state, ctx, code, person) {
    var c = normCode(code); person = str(person, 40);
    if (person.length < 3) throw E('Enter your name – it is recorded with everything you approve or change.');
    if (c.length !== 8) throw E('Enter your 8-character access code (e.g. 7KQ3-PXM9).');
    var fk = 'fail:codes', fails = Number(ctx.cache.get(fk) || 0);
    if (fails >= 30) throw E('Too many wrong codes were tried. Please try again after 15 minutes.');
    var h = codeHash(c), u = state.t('Users').filter(function (x) { return x.codeHash && x.codeHash === h; })[0];
    if (!u) { ctx.cache.put(fk, String(fails + 1), 900); throw E('This access code is not valid. Check it and try again.'); }
    if (!u.active) throw E('This access code has been switched off. Contact the Finance Desk Admin.');
    var token = String(ctx.uuid()).replace(/-/g, '') + String(ctx.uuid()).replace(/-/g, '').slice(0, 8);
    ctx.cache.put('sess:' + token, JSON.stringify({ id: u.id, k: u.codeHash.slice(0, 16), p: person }), 6 * 3600);
    u.lastLogin = state.now + ' · ' + person; state.touch('Users');
    return { token: token, user: publicUser(u) };
  }
  function session(state, ctx, token) {
    var v = token ? ctx.cache.get('sess:' + token) : null, o = null;
    try { o = v ? JSON.parse(v) : null; } catch (e0) { o = null; }
    var u = o ? findBy(state.t('Users'), 'id', o.id) : null;
    if (!u || !u.active || !u.codeHash || o.k !== u.codeHash.slice(0, 16)) { var e = E('Your session has ended. Please sign in again.'); e.code = 'SESSION'; throw e; }
    ctx.cache.put('sess:' + token, v, 6 * 3600);              // sessions end when the profile's code is replaced
    // the acting user: the profile, named after the person who signed in with it
    return { id: u.id, role: u.role, profile: u.name, person: o.p, name: o.p + ' · ' + u.name, active: true, _row: u };
  }
  function giveCode(state, ctx, u, fixed) {
    var users = state.t('Users'), code, h, tries = 0;
    do { code = fixed || newCode(ctx); h = codeHash(code); tries++; } while (!fixed && tries < 20 && users.some(function (x) { return x !== u && x.codeHash === h; }));
    if (users.some(function (x) { return x !== u && x.codeHash === h; })) throw E('That code is already in use.');
    u.codeHash = h; u.codeHint = normCode(code).slice(-2); u.pinHash = ''; u.salt = ''; u.mustChange = false;
    state.touch('Users');
    return code;
  }
  function makeUser(state, d) {
    return { id: 'U' + pad(state.next('U'), 3), mobile: d.mobile || '', name: d.name, role: d.role, codeHash: '', codeHint: '', pinHash: '', salt: '', active: true, mustChange: false, createdAt: state.now, lastLogin: '' };
  }

  /* --------------------------------------------------------------- setup */
  function ensureSetup(state, admin) {
    var res = {};
    if (!state.t('Heads').length) {
      DEFAULT_HEADS.forEach(function (h, i) { state.t('Heads').push({ code: h[0], name: h[1], kind: h[2], budget: h[3], owner: '', note: h[4], active: true, sort: (i + 1) * 10 }); });
      state.touch('Heads'); res.heads = DEFAULT_HEADS.length;
    }
    res.profiles = ensureProfiles(state, state.ctx, admin && admin.codes);
    return res;
  }

  /* ------------------------------------------------------------------ boot */
  function boot(state, user) {
    var s = state.settings(), heads = state.t('Heads'), inc = state.t('Income'), exp = state.t('Expenses'), led = state.t('Ledger'), bank = state.t('Bank');
    var all = CAN.viewAll.indexOf(user.role) >= 0;
    var mine = function (x) { return x.createdBy === user.id; };
    var users = state.t('Users');
    var names = {}; users.forEach(function (u) { names[u.id] = u.name; });  // profile names (the person is in the history / decidedBy)
    var out = {
      version: VERSION, now: state.now, me: { id: user.id, role: user.role, roleName: ROLES[user.role], profile: user.profile, person: user.person, name: user.name, can: canMap(user.role), feeHeads: feeHeads(s) }, settings: s, roleHelp: ROLE_HELP, roles: ROLES, kinds: KINDS, payModes: PAY_MODES,
      heads: heads, summary: summary(heads, inc, exp, led), names: names,
      income: all ? inc : inc.filter(mine), expenses: all ? exp : exp.filter(mine),
      ledger: all ? led : [], bank: all ? bank : [], payees: state.t('Payees'),
      recon: all ? reconStatus(state, s) : null,
      audit: all ? state.t('Audit').slice(-500) : [],
      users: user.role === 'ADMIN' ? users.map(publicUser) : [],
      lastSync: (findBy(state.t('Settings'), 'key', 'lastSync') || {}).value || null
    };
    if (user.role === 'FOOD') {                               // Food management sees only the Food tab: nothing from the ledger, budget, payees or settings
      out.heads = []; out.summary = summary([], [], [], []); out.names = {}; out.income = []; out.expenses = []; out.ledger = []; out.bank = []; out.payees = []; out.recon = null; out.audit = []; out.users = []; out.lastSync = null; out.settings = {};
    }
    if (user.role === 'VIEWER') out.payees = out.payees.map(function (p) { var q = JSON.parse(JSON.stringify(p)); q.accNo = q.accNo ? 'XXXX' + q.accNo.slice(-4) : ''; return q; });
    return out;
  }

  /* --------------------------------------------------------------- income */
  function incomeCreate(state, ctx, user, d) {
    need(user, 'createIncome');
    var h = findBy(state.t('Heads'), 'code', d.head);
    if (!h || !h.active || h.kind === 'EXPENSE') throw E('Choose an income or deposit head.');
    var party = str(d.party, 120), amount = r2(d.amount), mode = str(d.mode, 20), utr = str(d.utr, 40).toUpperCase(), paidOn = str(d.paidOn, 10), note = text(d.note, 600);
    if (party.length < 2) throw E('Enter who paid (name of the person / company).');
    if (!(amount > 0) || amount > 1e8) throw E('Enter a valid amount.');
    if (PAY_MODES.indexOf(mode) < 0) throw E('Choose the payment mode.');
    if (!validDate(paidOn) || paidOn > isoDate(ctx.now)) throw E('Enter a valid payment date (not in the future).');
    if (utr && normRef(utr).length < 6) throw E('The transaction reference looks too short. Leave it blank if the receipt has none.');
    if (note.length < 10) throw E('Write a short note on what this income is for (10+ characters).');
    if (utr) { var dup = state.t('Income').filter(function (x) { return normRef(x.utr) === normRef(utr) && ['REJECTED', 'CANCELLED', 'REVERSED'].indexOf(x.status) < 0; })[0]; if (dup) throw E('This transaction reference is already recorded as ' + dup.id + ' (' + dup.party + ').'); }
    var bankId = str(d.bankId, 20);
    if (bankId) { var b = findBy(state.t('Bank'), 'id', bankId); if (!b || b.status !== 'OPEN' || !(b.credit > 0)) throw E('That bank line is no longer open.'); if (Math.abs(b.credit - amount) > 0.009) throw E('The amount must match the bank credit of ' + inr(b.credit) + '.'); }
    var proof = takeFile(ctx, d.proof, 'payment proof', mode !== 'Cash' && !bankId);
    var row = { id: 'INC-' + pad(state.next('INC'), 4), source: bankId ? 'BANK' : 'MANUAL', sourceRef: bankId ? 'BANK:' + bankId : '', head: h.code, party: party, team: str(d.team, 60),
      description: str(d.description || h.name, 200), amount: amount, mode: mode, utr: utr, paidOn: paidOn, proof: proof, status: 'PENDING', srcStatus: '', srcReceipt: '',
      outbound: true, note: note + ' (added by ' + user.person + ')', createdBy: user.id, createdAt: state.now, decidedBy: '', decidedAt: '', remarks: '', receiptNo: '', ledgerNo: '', bankId: bankId };
    state.t('Income').push(row); state.touch('Income');
    state.log(user, 'INCOME_CREATE', row.id, party + ' · ' + inr(amount) + ' · ' + h.name);
    return row;
  }
  function approveIncome(state, user, row, byName) {
    var s = state.settings();
    row.status = 'APPROVED'; row.decidedBy = byName || user.name; row.decidedAt = state.now;
    if (!row.receiptNo) row.receiptNo = s.prefixReceipt + pad(state.next('FR'), 4);
    var l = post(state, user, { date: row.paidOn || isoDate(new Date()), dir: 'IN', head: row.head, refType: 'INCOME', refId: row.id, party: row.party, description: row.description, amount: row.amount, mode: row.mode, utr: row.utr });
    row.ledgerNo = l.no; state.touch('Income');
    if (row.bankId) { var b = findBy(state.t('Bank'), 'id', row.bankId); if (b && b.status === 'OPEN') linkBank(state, user, b.id, [l], 'CREATED FROM BANK'); }
    return l;
  }
  function incomeDecide(state, ctx, user, id, dec, remarks) {
    need(user, 'decideIncome');
    var row = findBy(state.t('Income'), 'id', id);
    if (!row) throw E('Income entry ' + id + ' not found.');
    if (row.status !== 'PENDING') throw E(id + ' is not waiting for approval (now ' + row.status + ').');
    if (!incomeScope(user.role, state.settings(), row)) throw E(id + ' (' + row.head + ') is ' + (user.role === 'FEES' ? 'not franchise income – it is approved with the Finance (other income) code.' : 'franchise income – it is approved with the Franchise fees code.'));
    if (row.createdBy === user.id) throw E('This entry was added with your profile\'s code, so it must be approved with another code (Admin, or the other income profile).');
    remarks = str(remarks, 300);
    if (dec === 'APPROVED') { approveIncome(state, user, row); state.log(user, 'INCOME_APPROVE', id, row.receiptNo + ' · ' + inr(row.amount)); }
    else if (dec === 'REJECTED') { if (remarks.length < 5) throw E('Give the reason for rejecting.'); row.status = 'REJECTED'; row.remarks = remarks; row.decidedBy = user.name; row.decidedAt = state.now; state.touch('Income'); state.log(user, 'INCOME_REJECT', id, remarks); }
    else throw E('Unknown decision.');
    return row;
  }
  /* Franchise payments are decided HERE and the decision is written back to the Team Desk, so the owner sees the status
     there and gets the Team Desk receipt; an approval is posted to the ledger at the same time. */
  function teamDeskDecide(state, ctx, user, id, dec, remarks) {
    need(user, 'decideIncome');
    var row = findBy(state.t('Income'), 'id', id);
    if (!row) throw E('Income entry ' + id + ' not found.');
    if (row.source !== 'TEAMDESK') throw E(id + ' is not a Team Desk payment.');
    if (row.status !== 'SOURCE_PENDING' && row.status !== 'PENDING') throw E(id + ' is already ' + row.status.toLowerCase() + '.');
    if (!incomeScope(user.role, state.settings(), row)) throw E(id + ' is franchise income – it is approved with the Franchise fees code.');
    remarks = str(remarks, 300);
    if (dec === 'REJECTED' && remarks.length < 5) throw E('Give the reason for rejecting – the team owner sees it and can upload again.');
    if (dec !== 'APPROVED' && dec !== 'REJECTED') throw E('Unknown decision.');
    if (!ctx.teamDeskDecide) throw E('The Team Desk link is not available.');
    var r = ctx.teamDeskDecide(String(row.sourceRef).replace(/^TD:/, ''), dec, remarks) || {};
    var st = String(r.status || '').toUpperCase();
    if (st === 'APPROVED') {
      row.srcStatus = 'APPROVED'; row.srcReceipt = r.receiptNo || row.srcReceipt; row.receiptNo = row.receiptNo || row.srcReceipt;
      approveIncome(state, user, row, user.name);
      state.log(user, 'INCOME_APPROVE', id, 'Team Desk ' + (row.srcReceipt || '') + ' · ' + inr(row.amount) + ' · ' + row.party);
    } else if (st === 'REJECTED') {
      row.srcStatus = 'REJECTED'; row.status = 'REJECTED'; row.remarks = r.remarks || remarks; row.decidedBy = user.name; row.decidedAt = state.now; state.touch('Income');
      state.log(user, 'INCOME_REJECT', id, 'Team Desk · ' + row.remarks);
    } else throw E('The Team Desk did not confirm the decision (status ' + (st || 'unknown') + '). Fetch from sources and try again.');
    return row;
  }
  /* Team Desk finance settings worked from here: team jersey fee (at actuals) and sponsorship credit moved between teams.
     Both are written to the Team Desk (which stays the record the owners see); every change is also kept in the audit trail. */
  function tdLink(ctx) { if (!ctx.teamDesk) throw E('The Team Desk link is not available.'); return ctx.teamDesk; }
  function tdTitle(t) { return String(t || '').toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).replace(/\bOf\b/g, 'of'); }
  function tdView(d, ctx) {
    d = d || {};
    var fees = {}; Object.keys(d.fees || {}).forEach(function (k) { var f = d.fees[k] || {}; fees[k] = { amount: Number(f.amount) || 0, note: String(f.note || '') }; });
    return {
      role: String(d.role || ''), creditReady: String(d.role || '') === 'admin' || !!(ctx && ctx.teamDeskAdminPin),
      teams: (d.teams || []).map(function (t) { return String(t.team); }).sort(), fees: fees,
      splits: (d.splits || []).map(function (x) { return { row: x.row, sponsor: String(x.sponsor || ''), from: String(x.from || ''), to: String(x.to || ''), amount: Number(x.amount) || 0, note: String(x.note || ''), at: String(x.at || '') }; })
    };
  }
  function teamDeskInfo(state, ctx, user) { need(user, 'teamView'); return tdView(tdLink(ctx)('teamDeskAdmin', [], !!ctx.teamDeskAdminPin), ctx); }
  function tdTeam(info, team) { if (info.teams.length && info.teams.indexOf(team) < 0) throw E('Unknown team ' + team + '.'); return team; }
  function teamDeskFee(state, ctx, user, team, amount, note) {
    need(user, 'teamFees');
    team = str(team, 80); note = str(note, 200); amount = r2(Number(amount || 0));
    if (!team) throw E('Choose the team.');
    if (!(amount >= 0) || amount > 500000) throw E('Enter the jersey fee in rupees (0 removes it).');
    if (amount > 0 && note.length < 3) throw E('Add how the amount was worked out, e.g. "14 jerseys × ₹350".');
    var d = tdLink(ctx)('teamDeskAdminFee', [team, amount, note]);
    state.log(user, 'TEAM_JERSEY_FEE', tdTitle(team), amount ? inr(amount) + ' · ' + note : 'removed');
    return tdView(d, ctx);
  }
  function teamDeskSplit(state, ctx, user, x) {
    need(user, 'teamCredit');
    x = x || {};
    var sp = str(x.sponsor, 120), from = str(x.from, 80), to = str(x.to, 80), amt = r2(Number(x.amount || 0)), note = str(x.note, 300);
    if (sp.length < 3) throw E('Name the sponsor / item, e.g. "Ever-Rolling Trophy – 1/3 share".');
    if (!from || !to || from === to) throw E('Choose two different teams.');
    if (!(amt > 0) || amt > 5000000) throw E('Enter the amount to move.');
    if (note.length < 5) throw E('Add a note – why the credit is moved (the committee decision).');
    var d = tdLink(ctx)('teamDeskAdminSplit', [{ sponsor: sp, from: from, to: to, amount: amt, note: note }], true);
    state.log(user, 'TEAM_CREDIT_MOVE', sp, inr(amt) + ' · ' + tdTitle(from) + ' → ' + tdTitle(to) + ' · ' + note);
    return tdView(d, ctx);
  }
  function teamDeskSplitDelete(state, ctx, user, row, label) {
    need(user, 'teamCredit');
    if (row == null || row === '') throw E('Which credit move?');
    var d = tdLink(ctx)('teamDeskAdminSplitDelete', [row], true);
    state.log(user, 'TEAM_CREDIT_CANCEL', String(row), str(label, 300));
    return tdView(d, ctx);
  }
  function sponsorCat(s, source) { return (s.sponsorCats || []).filter(function (c) { return c.id === source; })[0] || null; }
  /* Sponsorship requests are approved / rejected HERE; the decision is written to the category's register sheet
     (Status = Confirmed / Rejected), which releases the slot on rejection and unlocks the receipt & poster on the portal. */
  function sponsorDecide(state, ctx, user, id, dec, remarks) {
    need(user, 'decideIncome');
    var s = state.settings(), row = findBy(state.t('Income'), 'id', id);
    if (!row) throw E('Income entry ' + id + ' not found.');
    var cat = sponsorCat(s, row.source);
    if (!cat) throw E(id + ' is not a sponsorship request from a portal.');
    if (row.status !== 'SOURCE_PENDING' && row.status !== 'PENDING') throw E(id + ' is already ' + row.status.toLowerCase() + '.');
    if (!incomeScope(user.role, s, row)) throw E('Sponsorship is approved with the Finance code.');
    if (row.createdBy === user.id) throw E('Added with this profile – approve it with another profile.');
    remarks = str(remarks, 300);
    if (dec !== 'APPROVED' && dec !== 'REJECTED') throw E('Unknown decision.');
    if (dec === 'REJECTED' && remarks.length < 5) throw E('Give the reason for rejecting – it goes in the message to the sponsor.');
    var ref = String(row.sourceRef).replace(/^[^:]*:/, '');
    if (!(dec === 'APPROVED' && row.srcStatus === 'APPROVED')) {
      if (!ctx.sponsorDecide) throw E('The sponsorship register link is not available.');
      var r = ctx.sponsorDecide(cat, ref, dec === 'APPROVED' ? 'Confirmed' : 'Rejected', user.name) || {};
      if (String(r.status) !== (dec === 'APPROVED' ? 'Confirmed' : 'Rejected')) throw E('The register did not confirm the decision. Fetch from sources and try again.');
    }
    if (dec === 'APPROVED') {
      row.srcStatus = 'APPROVED'; approveIncome(state, user, row, user.name);
      state.log(user, 'INCOME_APPROVE', id, cat.cat + ' ' + ref + ' · ' + inr(row.amount) + ' · ' + row.party);
    } else {
      row.srcStatus = 'REJECTED'; row.status = 'REJECTED'; row.remarks = remarks; row.decidedBy = user.name; row.decidedAt = state.now; state.touch('Income');
      state.log(user, 'INCOME_REJECT', id, cat.cat + ' ' + ref + ' · ' + remarks + ' (slot released)');
    }
    return row;
  }
  function syncSources(state, ctx, user) {
    need(user, 'sync');
    var s = state.settings(), recs = ctx.fetchSources(s) || [], inc = state.t('Income'), heads = headMap(state.t('Heads'));
    var res = { read: 0, added: 0, updated: 0, autoApproved: 0, skipped: 0, warnings: [] };
    (recs.errors || []).forEach(function (w) { res.warnings.push(w); });
    recs.forEach(function (r) {
      res.read++;
      if (!r.sourceRef || !heads[r.head]) { res.skipped++; if (!heads[r.head]) res.warnings.push(r.sourceRef + ': head ' + r.head + ' does not exist'); return; }
      var ex = findBy(inc, 'sourceRef', r.sourceRef), amt = r2(r.amount);
      if (!(amt > 0)) { res.skipped++; return; }
      if (ex) {
        if (ex.status === 'APPROVED') { if (Math.abs(ex.amount - amt) > 0.009 && ex.note.indexOf('Source amount now') < 0) { ex.note = (ex.note ? ex.note + ' · ' : '') + 'Source amount now ' + inr(amt) + ' – check'; state.touch('Income'); res.warnings.push(ex.id + ': amount changed at source'); } return; }
        if (ex.status === 'REJECTED' || ex.status === 'REVERSED') return;
        if (ex.status === 'CANCELLED' && r.srcStatus !== 'APPROVED') return;
        var ch = false;
        if (r.srcStatus === 'REJECTED' && (ex.status === 'PENDING' || ex.status === 'SOURCE_PENDING')) { ex.status = 'CANCELLED'; ex.remarks = 'Rejected at source'; ch = true; }
        else if (r.srcStatus === 'APPROVED' && (ex.status === 'SOURCE_PENDING' || ex.status === 'CANCELLED')) { ex.status = 'PENDING'; ch = true; }
        ['party', 'team', 'description', 'mode', 'utr', 'paidOn', 'proof', 'srcReceipt', 'srcType', 'contactName', 'contactPhone'].forEach(function (k) { if (r[k] != null && String(r[k]) !== ex[k] && ex.status !== 'APPROVED') { ex[k] = String(r[k]); ch = true; } });
        if (Math.abs(ex.amount - amt) > 0.009) { ex.amount = amt; ch = true; }
        ex.srcStatus = r.srcStatus;
        if (ex.status === 'PENDING' && r.trust && r.srcStatus === 'APPROVED') { approveIncome(state, user, ex, r.approver || 'Source approval'); res.autoApproved++; ch = true; }
        if (ch) { res.updated++; state.touch('Income'); }
        return;
      }
      if (r.srcStatus === 'REJECTED') { res.skipped++; return; }
      var row = { id: 'INC-' + pad(state.next('INC'), 4), source: r.source, sourceRef: r.sourceRef, head: r.head, party: str(r.party, 120) || '(not given)', team: str(r.team, 60),
        description: str(r.description, 200) || heads[r.head].name, amount: amt, mode: str(r.mode, 20), utr: str(r.utr, 40).toUpperCase(), paidOn: validDate(r.paidOn) ? r.paidOn : '', proof: str(r.proof, 500),
        status: r.srcStatus === 'APPROVED' ? 'PENDING' : 'SOURCE_PENDING', srcStatus: r.srcStatus, srcReceipt: str(r.srcReceipt, 40), outbound: false, note: str(r.note, 200), createdBy: 'SYNC', createdAt: state.now,
        decidedBy: '', decidedAt: '', remarks: '', receiptNo: '', ledgerNo: '', bankId: '', srcType: str(r.srcType, 12), contactName: str(r.contactName, 60), contactPhone: str(r.contactPhone, 15) };
      if (!row.paidOn) row.paidOn = String(state.now).slice(0, 10);
      inc.push(row); state.touch('Income'); res.added++;
      if (r.trust && r.srcStatus === 'APPROVED') { if (r.srcReceipt) row.receiptNo = r.srcReceipt; approveIncome(state, user, row, r.approver || 'Source approval'); res.autoApproved++; }
    });
    state.setSetting('lastSync', { at: state.now, by: user.name, result: res });
    state.log(user, 'SYNC', '', res.read + ' read, ' + res.added + ' new, ' + res.updated + ' updated, ' + res.autoApproved + ' auto-approved');
    if (res.added || res.autoApproved) autoMatch(state, user);
    return res;
  }

  /* -------------------------------------------------------------- expenses */
  function hist(x, user, action, note, now) { x.history = x.history || []; x.history.push({ at: now, by: user.name, role: user.role, action: action, note: note || '' }); }
  function readExpense(state, ctx, user, d, existing) {
    var heads = state.t('Heads'), h = findBy(heads, 'code', d.head), s = state.settings();
    if (!h || !h.active || h.kind === 'INCOME') throw E('Choose an expense head (or a deposit head for a deposit refund).');
    var x = {
      head: h.code, title: str(d.title, 120), description: text(d.description, 800), payee: str(d.payee, 120), invoiceNo: str(d.invoiceNo, 40), invoiceDate: str(d.invoiceDate, 10),
      amount: r2(d.amount), payMethod: str(d.payMethod, 10), accName: str(d.accName, 120), accNo: String(d.accNo || '').replace(/\s/g, ''), ifsc: String(d.ifsc || '').replace(/\s/g, '').toUpperCase(),
      bank: str(d.bank, 80), branch: str(d.branch, 120), upi: str(d.upi, 80), phone: mobile10(d.phone), detailsSource: d.detailsSource === 'AUTO' || d.detailsSource === 'SAVED' ? d.detailsSource : 'MANUAL', explanation: text(d.explanation, 2000)
    };
    if (x.title.length < 4) throw E('Enter what the expense is for (title).');
    if (x.payee.length < 2) throw E('Enter the payee (vendor / person to be paid).');
    if (!(x.amount > 0) || x.amount > 1e8) throw E('Enter a valid amount.');
    if (!x.invoiceNo) throw E('Enter the invoice / bill number (write "No number" if the bill has none).');
    if (!validDate(x.invoiceDate) || x.invoiceDate > isoDate(ctx.now)) throw E('Enter a valid invoice / bill date (not in the future).');
    if (x.payMethod === 'BANK') {
      if (x.accName.length < 3) throw E('Enter the account holder name.');
      if (!validAcc(x.accNo)) throw E('The bank account number must be 9 to 18 digits.');
      if (d.accNo2 != null && String(d.accNo2).replace(/\s/g, '') !== x.accNo) throw E('The two account numbers do not match. Re-enter to confirm.');
      if (!validIfsc(x.ifsc)) throw E('The IFSC code is not valid (11 characters, e.g. SBIN0070123).');
      x.upi = ''; x.phone = '';
    } else if (x.payMethod === 'UPI') {
      if (!x.upi && !x.phone) throw E('Enter the UPI ID or the GPay / PhonePe number.');
      if (x.upi && !validUpi(x.upi)) throw E('The UPI ID is not valid (e.g. name@okaxis).');
      if (x.phone && !/^[6-9]\d{9}$/.test(x.phone)) throw E('The GPay / PhonePe number must be a 10-digit mobile number.');
      x.accNo = ''; x.ifsc = ''; x.accName = x.accName || x.payee;
    } else if (x.payMethod === 'CASH') {
      if (x.amount > Number(s.cashLimit || 0)) throw E('Cash payment is allowed only up to ' + inr(s.cashLimit) + '. Give bank or UPI details.');
      x.accNo = ''; x.ifsc = ''; x.upi = ''; x.phone = '';
    } else throw E('Choose how the payee should be paid (Bank / UPI / Cash).');
    var dup = state.t('Expenses').filter(function (e) {
      return (!existing || e.id !== existing.id) && ['REJECTED', 'CANCELLED', 'REVERSED'].indexOf(e.status) < 0 && e.payee.toLowerCase() === x.payee.toLowerCase() &&
        normRef(e.invoiceNo) === normRef(x.invoiceNo) && normRef(x.invoiceNo) !== 'NONUMBER';
    })[0];
    if (dup) throw E('This bill (' + x.invoiceNo + ' of ' + x.payee + ') is already in ' + dup.id + '.');
    var bc = budgetCheck(heads, state.t('Expenses'), state.t('Ledger'), x.head, x.amount, existing ? existing.id : null);
    x.budget = bc.budget; x.committed = bc.committed; x.actual = bc.actual; x.overBy = bc.overBy; x.expKind = bc.expKind;
    if (bc.expKind) {
      var chk = checkExplanation(x.explanation, x.title + ' ' + x.description);
      if (!x.explanation) throw E((bc.expKind === 'OUTBOUND' ? 'This expense is not in the budget (outbound).' : 'This expense is over the budget by ' + inr(bc.overBy) + '.') + ' Write an explanation note.');
      if (!chk.ok) throw E('The explanation note is not acceptable: ' + chk.issues.join(' ') + ' ' + chk.advice);
    } else x.explanation = x.explanation || '';
    var file = takeFile(ctx, d.invoiceFile, 'invoice / bill', !(existing && existing.invoiceFile));
    x.invoiceFile = file || (existing ? existing.invoiceFile : '');
    return x;
  }
  function expenseCreate(state, ctx, user, d) {
    need(user, 'createExpense');
    var x = readExpense(state, ctx, user, d, null);
    x.id = 'EXP-' + pad(state.next('EXP'), 4); x.status = 'SUBMITTED'; x.createdBy = user.id; x.createdAt = state.now; x.updatedAt = state.now; x.history = [];
    hist(x, user, 'Submitted', x.expKind ? (x.expKind === 'OVER' ? 'Over budget by ' + inr(x.overBy) : 'Outbound (unbudgeted)') : 'Within budget', state.now);
    state.t('Expenses').push(coerce('Expenses', x)); state.touch('Expenses');
    state.log(user, 'EXPENSE_CREATE', x.id, x.payee + ' · ' + inr(x.amount) + (x.expKind ? ' · ' + x.expKind : ''));
    return findBy(state.t('Expenses'), 'id', x.id);
  }
  function expenseUpdate(state, ctx, user, id, d) {
    var ex = findBy(state.t('Expenses'), 'id', id);
    if (!ex) throw E('Expense order ' + id + ' not found.');
    if (ex.createdBy !== user.id) throw E('Only the person who created ' + id + ' can edit it.');
    if (['SUBMITTED', 'QUERY'].indexOf(ex.status) < 0) throw E(id + ' cannot be edited now (' + ex.status + ').');
    var x = readExpense(state, ctx, user, d, ex);
    Object.keys(x).forEach(function (k) { ex[k] = x[k]; });
    ex.status = 'SUBMITTED'; ex.updatedAt = state.now; ex.ackBy = ''; ex.ackAt = '';
    hist(ex, user, 'Edited & resubmitted', str(d.reply, 300), state.now);
    state.touch('Expenses'); state.log(user, 'EXPENSE_EDIT', id, inr(ex.amount));
    return ex;
  }
  function expenseCancel(state, ctx, user, id, reason) {
    var ex = findBy(state.t('Expenses'), 'id', id);
    if (!ex) throw E('Expense order ' + id + ' not found.');
    if (ex.createdBy !== user.id && user.role !== 'ADMIN') throw E('Only the creator or an Admin can cancel ' + id + '.');
    if (['SUBMITTED', 'QUERY', 'AWAITING_ADMIN', 'APPROVED'].indexOf(ex.status) < 0) throw E(id + ' cannot be cancelled now (' + ex.status + ').');
    reason = str(reason, 300); if (reason.length < 5) throw E('Give the reason for cancelling.');
    ex.status = 'CANCELLED'; ex.remarks = reason; ex.updatedAt = state.now; hist(ex, user, 'Cancelled', reason, state.now);
    state.touch('Expenses'); state.log(user, 'EXPENSE_CANCEL', id, reason);
    return ex;
  }
  function needsAdmin(s, ex) { return (Number(s.dualAbove) > 0 && ex.amount >= Number(s.dualAbove)) || (s.dualForOutbound && ex.expKind === 'OUTBOUND'); }
  function expenseDecide(state, ctx, user, id, action, remarks, ack) {
    need(user, 'decideExpense');
    var ex = findBy(state.t('Expenses'), 'id', id), s = state.settings();
    if (!ex) throw E('Expense order ' + id + ' not found.');
    if (ex.createdBy === user.id) throw E(id + ' was raised with this profile\'s code, so it must be verified with another code.');
    remarks = str(remarks, 400);
    var stage = ex.status === 'SUBMITTED' ? 'FIN' : ex.status === 'AWAITING_ADMIN' ? 'ADM' : '';
    if (!stage) throw E(id + ' is not waiting for a decision (now ' + ex.status + ').');
    if (stage === 'ADM' && user.role !== 'ADMIN') throw E('This order needs the second approval by an Admin.');
    if (stage === 'ADM' && String(ex.approvedBy).split(' · ')[0].toLowerCase() === String(user.person).toLowerCase()) throw E('The second approval must be by a different person than the one who verified it.');
    if (action === 'REJECT' || action === 'QUERY') {
      if (remarks.length < 5) throw E(action === 'REJECT' ? 'Give the reason for rejecting.' : 'Write the question / what must be corrected.');
      ex.status = action === 'REJECT' ? 'REJECTED' : 'QUERY'; ex.remarks = remarks; ex.updatedAt = state.now;
      hist(ex, user, action === 'REJECT' ? 'Rejected' : 'Sent back with query', remarks, state.now);
      state.touch('Expenses'); state.log(user, 'EXPENSE_' + action, id, remarks); return ex;
    }
    if (action !== 'APPROVE') throw E('Unknown action.');
    var bc = budgetCheck(state.t('Heads'), state.t('Expenses'), state.t('Ledger'), ex.head, ex.amount, ex.id);
    if (bc.expKind && !ex.expKind) throw E('This order is now ' + (bc.expKind === 'OVER' ? 'over the budget by ' + inr(bc.overBy) : 'outside the budget') + ' (other orders were approved or paid meanwhile, or the budget changed). Send it back so the creator can add an explanation note.');
    if (ex.expKind && !ack) throw E('Read the explanation note for the ' + (ex.expKind === 'OVER' ? 'over-spending' : 'outbound expense') + ' and tick the acknowledgement before approving.');
    if (stage === 'FIN') {
      if (ex.expKind) { ex.ackBy = user.name; ex.ackAt = state.now; }
      ex.approvedBy = user.name; ex.approvedAt = state.now; ex.overBy = bc.overBy; ex.expKind = bc.expKind || ex.expKind;
      ex.status = needsAdmin(s, ex) ? 'AWAITING_ADMIN' : 'APPROVED';
      hist(ex, user, ex.status === 'AWAITING_ADMIN' ? 'Verified – sent for Admin approval' : 'Verified & approved for payment', (ex.expKind ? 'Explanation acknowledged. ' : '') + remarks, state.now);
    } else {
      ex.adminBy = user.name; ex.adminAt = state.now; ex.status = 'APPROVED';
      hist(ex, user, 'Admin approved for payment', (ex.expKind ? 'Explanation acknowledged. ' : '') + remarks, state.now);
    }
    ex.updatedAt = state.now; state.touch('Expenses'); state.log(user, 'EXPENSE_APPROVE', id, ex.status + ' · ' + inr(ex.amount));
    return ex;
  }
  function expensePay(state, ctx, user, id, p) {
    need(user, 'pay');
    var ex = findBy(state.t('Expenses'), 'id', id), s = state.settings();
    if (!ex) throw E('Expense order ' + id + ' not found.');
    if (ex.status !== 'APPROVED') throw E(id + ' is not approved for payment (now ' + ex.status + ').');
    var mode = str(p.mode, 20), date = str(p.date, 10), utr = str(p.utr, 40).toUpperCase(), amount = p.amount == null || p.amount === '' ? ex.amount : r2(p.amount);
    if (PAY_MODES.indexOf(mode) < 0) throw E('Choose the payment mode.');
    if (!validDate(date) || date > isoDate(ctx.now)) throw E('Enter a valid payment date (not in the future).');
    if (Math.abs(amount - ex.amount) > 0.009) throw E('The amount paid must be the approved amount ' + inr(ex.amount) + '. For a different amount, send the order back for correction.');
    if (mode !== 'Cash' && normRef(utr).length < 6) throw E('Enter the transaction reference (UTR / UPI ref / cheque no.).');
    if (utr) { var dup = state.t('Ledger').filter(function (l) { return l.dir === 'OUT' && normRef(l.utr) === normRef(utr) && activeLedger(l); })[0]; if (dup) throw E('This transaction reference is already used in ' + dup.no + '.'); }
    ex.paidProof = takeFile(ctx, p.proof, 'payment proof', false);
    ex.paidMode = mode; ex.paidOn = date; ex.utr = utr; ex.paidBy = user.name; ex.paidAt = state.now; ex.status = 'PAID';
    ex.voucherNo = s.prefixVoucher + pad(state.next('PV'), 4);
    var l = post(state, user, { date: date, dir: 'OUT', head: ex.head, refType: 'EXPENSE', refId: ex.id, party: ex.payee, description: ex.title, amount: ex.amount, mode: mode, utr: utr });
    ex.ledgerNo = l.no; ex.updatedAt = state.now; hist(ex, user, 'Paid', mode + (utr ? ' · ' + utr : '') + ' · ' + ex.voucherNo, state.now);
    state.touch('Expenses');
    if (ex.payMethod !== 'CASH') {
      var key = (ex.payMethod === 'BANK' ? ex.accNo + '|' + ex.ifsc : (ex.upi || ex.phone)).toUpperCase(), py = state.t('Payees'), pr = findBy(py, 'key', key);
      if (!pr) { pr = { key: key }; py.push(pr); }
      pr.name = ex.payee; pr.accName = ex.accName; pr.accNo = ex.accNo; pr.ifsc = ex.ifsc; pr.bank = ex.bank; pr.branch = ex.branch; pr.upi = ex.upi; pr.phone = ex.phone; pr.updatedAt = state.now; state.touch('Payees');
    }
    state.log(user, 'EXPENSE_PAY', id, ex.voucherNo + ' · ' + inr(ex.amount) + ' · ' + mode + ' ' + utr);
    autoMatch(state, user);
    return ex;
  }

  /* ---------------------------------------------------------------- ledger */
  function ledgerReverse(state, ctx, user, no, reason) {
    need(user, 'admin');
    var l = findBy(state.t('Ledger'), 'no', no);
    if (!l) throw E('Ledger entry ' + no + ' not found.');
    if (l.reversedBy || l.reversalOf) throw E(no + ' is already reversed / is a reversal.');
    if (l.reconType === 'BANK') throw E(no + ' is matched with the bank statement. Unmatch it first.');
    reason = str(reason, 300); if (reason.length < 10) throw E('Give a clear reason for the reversal (10+ characters).');
    var rv = post(state, user, { date: isoDate(ctx.now), dir: l.dir, head: l.head, refType: 'REVERSAL', refId: l.refId, party: l.party, description: 'Reversal of ' + no + ': ' + reason, amount: -l.amount, mode: l.mode, utr: '', reversalOf: no });
    l.reversedBy = rv.no; state.touch('Ledger');
    var tbl = l.refType === 'INCOME' ? 'Income' : l.refType === 'EXPENSE' ? 'Expenses' : '';
    if (tbl) { var src = findBy(state.t(tbl), 'id', l.refId); if (src) { src.status = 'REVERSED'; src.remarks = 'Reversed (' + rv.no + '): ' + reason; if (tbl === 'Expenses') hist(src, user, 'Payment reversed', reason, state.now); state.touch(tbl); } }
    state.log(user, 'LEDGER_REVERSE', no, reason);
    return rv;
  }

  /* ------------------------------------------------------------------ bank */
  function bankImport(state, ctx, user, lines, batch) {
    need(user, 'bank');
    if (!lines || !lines.length) throw E('No statement lines to import.');
    if (lines.length > 3000) throw E('Import at most 3,000 lines at a time.');
    if (lines.length > 1 && String(lines[0].date) > String(lines[lines.length - 1].date)) lines = lines.slice().reverse(); // newest-first statements → keep the bank's own order oldest-first
    var bank = state.t('Bank'), have = {}; bank.forEach(function (b) { have[b.hash] = 1; });
    var added = 0, dup = 0, bad = 0, seen = {};
    batch = str(batch, 60) || ('Import ' + state.now);
    lines.forEach(function (ln) {
      var date = str(ln.date, 10), dr = r2(ln.debit), cr = r2(ln.credit);
      if (!validDate(date) || date > isoDate(ctx.now) || (dr > 0) === (cr > 0) || dr < 0 || cr < 0) { bad++; return; }
      var bal = ln.balance == null || ln.balance === '' ? null : r2(ln.balance);
      var base = [date, normRef(ln.narration), normRef(ln.ref), dr, cr, bal == null ? '' : bal].join('|');
      seen[base] = (seen[base] || 0) + 1;
      var hash = sha256(base + '#' + seen[base]).slice(0, 20);
      if (have[hash]) { dup++; return; }
      have[hash] = 1;
      bank.push({ id: 'B-' + pad(state.next('B'), 5), date: date, narration: str(ln.narration, 300), ref: str(ln.ref, 60), debit: dr, credit: cr, balance: bal, hash: hash, batch: batch, status: 'OPEN', ledgerNos: '', matchType: '', matchedBy: '', matchedAt: '', note: '' });
      added++;
    });
    state.touch('Bank');
    var m = autoMatch(state, user);
    state.log(user, 'BANK_IMPORT', batch, added + ' added, ' + dup + ' duplicate, ' + bad + ' unreadable, ' + m + ' auto-matched');
    return { added: added, duplicates: dup, bad: bad, matched: m };
  }
  function autoMatch(state, user) {
    var bank = state.t('Bank'), led = state.t('Ledger'), n = 0;
    bank.filter(function (b) { return b.status === 'OPEN'; }).forEach(function (b) {
      var dir = b.credit > 0 ? 'IN' : 'OUT', amt = b.credit > 0 ? b.credit : b.debit, hay = normRef(b.narration + ' ' + b.ref);
      var c = led.filter(function (l) { var u = normRef(l.utr); return activeLedger(l) && !l.reconType && l.dir === dir && Math.abs(l.amount - amt) < 0.01 && u.length >= 6 && hay.indexOf(u) >= 0; });
      if (c.length === 1) { linkBank(state, user, b.id, c, 'AUTO (reference + amount)'); n++; }
    });
    return n;
  }
  function bankMatch(state, ctx, user, bankId, nos) {
    need(user, 'bank');
    var b = findBy(state.t('Bank'), 'id', bankId);
    if (!b) throw E('Bank line not found.'); if (b.status !== 'OPEN') throw E('This bank line is already ' + b.status.toLowerCase() + '.');
    nos = (nos || []).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    if (!nos.length) throw E('Pick at least one ledger entry.');
    var dir = b.credit > 0 ? 'IN' : 'OUT', amt = b.credit > 0 ? b.credit : b.debit, rows = [], sum = 0;
    nos.forEach(function (no) {
      var l = findBy(state.t('Ledger'), 'no', no);
      if (!l || !activeLedger(l)) throw E(no + ' cannot be matched (not found or reversed).');
      if (l.dir !== dir) throw E(no + ' is ' + (l.dir === 'IN' ? 'a receipt' : 'a payment') + ', but the bank line is a ' + (dir === 'IN' ? 'credit' : 'debit') + '.');
      if (l.reconType) throw E(no + ' is already reconciled.');
      rows.push(l); sum += l.amount;
    });
    if (Math.abs(r2(sum) - amt) > 0.009) throw E('The selected entries total ' + inr(sum) + ', but the bank line is ' + inr(amt) + '.');
    linkBank(state, user, bankId, rows, 'MANUAL');
    state.log(user, 'BANK_MATCH', bankId, nos.join(', '));
    return b;
  }
  function bankUnmatch(state, ctx, user, bankId) {
    need(user, 'bank');
    var b = findBy(state.t('Bank'), 'id', bankId);
    if (!b) throw E('Bank line not found.'); if (b.status === 'OPEN') throw E('This bank line is not matched.');
    if (b.status === 'MATCHED') state.t('Ledger').forEach(function (l) { if (l.bankId === bankId) { l.bankId = ''; l.reconType = ''; l.reconBy = ''; l.reconAt = ''; l.reconNote = ''; } });
    b.status = 'OPEN'; b.ledgerNos = ''; b.matchType = ''; b.matchedBy = ''; b.matchedAt = ''; b.note = '';
    state.touch('Bank'); state.touch('Ledger'); state.log(user, 'BANK_UNMATCH', bankId, '');
    return b;
  }
  function bankIgnore(state, ctx, user, bankId, note) {
    need(user, 'bank');
    var b = findBy(state.t('Bank'), 'id', bankId);
    if (!b) throw E('Bank line not found.'); if (b.status !== 'OPEN') throw E('Only open lines can be marked as not part of the ledger.');
    note = str(note, 300); if (note.length < 5) throw E('Write why this bank line is not part of the ledger (e.g. opening balance, transfer between own accounts).');
    b.status = 'IGNORED'; b.note = note; b.matchedBy = user.name; b.matchedAt = state.now; state.touch('Bank');
    state.log(user, 'BANK_IGNORE', bankId, note); return b;
  }
  function bankDeleteBatch(state, ctx, user, batch) {
    need(user, 'admin');
    var bank = state.t('Bank'), rows = bank.filter(function (b) { return b.batch === batch; });
    if (!rows.length) throw E('Batch not found.');
    if (rows.some(function (b) { return b.status !== 'OPEN'; })) throw E('Some lines of this batch are matched or ignored. Unmatch them first.');
    state.cache.Bank = bank.filter(function (b) { return b.batch !== batch; }); state.touch('Bank');
    state.log(user, 'BANK_DELETE_BATCH', batch, rows.length + ' lines'); return rows.length;
  }
  function ledgerCashRecon(state, ctx, user, no, note, undo) {
    need(user, 'bank');
    var l = findBy(state.t('Ledger'), 'no', no);
    if (!l || !activeLedger(l)) throw E('Ledger entry not found or reversed.');
    if (undo) { if (l.reconType !== 'CASH') throw E(no + ' is not marked as cash / no bank entry.'); l.reconType = ''; l.reconBy = ''; l.reconAt = ''; l.reconNote = ''; }
    else {
      if (l.reconType) throw E(no + ' is already reconciled.');
      note = str(note, 300); if (note.length < 5) throw E('Write why this entry has no bank line (e.g. paid in cash, handed over to treasurer).');
      l.reconType = 'CASH'; l.reconBy = user.name; l.reconAt = state.now; l.reconNote = note;
    }
    state.touch('Ledger'); state.log(user, undo ? 'LEDGER_CASH_UNDO' : 'LEDGER_CASH', no, note || ''); return l;
  }

  /* ------------------------------------------------------- heads & admin */
  function headSave(state, ctx, user, h) {
    need(user, 'admin');
    var code = String(h.code || '').toUpperCase().trim(), heads = state.t('Heads'), ex = findBy(heads, 'code', code);
    if (!/^[A-Z][A-Z0-9-]{1,15}$/.test(code)) throw E('Head code: 2–16 letters, digits or "-", starting with a letter (e.g. EXP-FOOD).');
    var name = str(h.name, 80), kind = String(h.kind || ''), budget = r2(h.budget);
    if (name.length < 3) throw E('Enter the head name.');
    if (!KINDS[kind]) throw E('Choose the type (income / expense / deposit).');
    if (!(budget >= 0) || budget > 1e9) throw E('Budget must be 0 or more.');
    if (ex && ex.kind !== kind) {
      var used = state.t('Ledger').some(function (l) { return l.head === code; }) || state.t('Expenses').some(function (x) { return x.head === code; }) || state.t('Income').some(function (x) { return x.head === code; });
      if (used) throw E('This head is already used, so its type cannot change.');
    }
    var before = ex ? ex.name + ' · ' + ex.kind + ' · ' + inr(ex.budget) + (ex.active ? '' : ' · inactive') : 'new';
    if (!ex) { ex = { code: code, sort: (heads.length + 1) * 10 }; heads.push(ex); }
    ex.name = name; ex.kind = kind; ex.budget = budget; ex.owner = str(h.owner, 60); ex.note = str(h.note, 200); ex.active = h.active !== false;
    if (h.sort != null && h.sort !== '') ex.sort = Number(h.sort) || ex.sort;
    state.touch('Heads'); state.log(user, 'HEAD_SAVE', code, before + ' → ' + name + ' · ' + kind + ' · ' + inr(budget) + (ex.active ? '' : ' · inactive'));
    return ex;
  }
  function userSave(state, ctx, user, d) {
    need(user, 'admin');
    var users = state.t('Users'), mob = mobile10(d.mobile), name = str(d.name, 60), role = String(d.role || '');
    if (mob && !/^[6-9]\d{9}$/.test(mob)) throw E('The mobile number (optional, used to send the code on WhatsApp) must have 10 digits.');
    if (name.length < 3) throw E('Enter the name.'); if (!ROLES[role]) throw E('Choose the role.');
    var ex = d.id ? findBy(users, 'id', d.id) : null;
    var clash = users.filter(function (u) { return u.name.toLowerCase() === name.toLowerCase() && (!ex || u.id !== ex.id); })[0];
    if (clash) throw E('A profile named "' + name + '" already exists.');
    var code = null;
    if (!ex) { ex = makeUser(state, { mobile: mob, name: name, role: role }); users.push(ex); code = giveCode(state, ctx, ex); }
    else {
      if (ex.id === user.id && (role !== 'ADMIN' || d.active === false)) throw E('You cannot switch off or change the Admin profile you are signed in with.');
      ex.mobile = mob; ex.name = name; ex.role = role; ex.active = d.active !== false;
    }
    if (!users.some(function (u) { return u.role === 'ADMIN' && u.active; })) throw E('At least one active Admin is needed.');
    state.touch('Users'); state.log(user, 'USER_SAVE', ex.id, name + ' · ' + role + (ex.active ? '' : ' · switched off') + (code ? ' · code issued' : ''));
    return { user: publicUser(ex), code: code };
  }
  function userNewCode(state, ctx, user, id) {
    need(user, 'admin');
    var u = findBy(state.t('Users'), 'id', id); if (!u) throw E('User not found.');
    var code = giveCode(state, ctx, u);
    state.log(user, 'USER_NEW_CODE', u.id, u.name + ' – new access code issued, old code stopped');
    return { user: publicUser(u), code: code, self: u.id === user.id };
  }
  function settingsSave(state, ctx, user, obj) {
    need(user, 'admin');
    var changed = [];
    Object.keys(obj || {}).forEach(function (k) {
      if (SETTING_KEYS.indexOf(k) < 0) return;
      var v = obj[k], def = DEFAULT_SETTINGS[k];
      if (typeof def === 'number') { v = Number(v); if (!isFinite(v) || v < 0) throw E('"' + k + '" must be a number of 0 or more.'); }
      else if (typeof def === 'boolean') v = v === true || v === 'true';
      else if (k === 'sponsorCats') {
        if (!Array.isArray(v)) throw E('Sponsorship categories must be a list.');
        v = DEFAULT_SETTINGS.sponsorCats.map(function (d0) {
          var c = v.filter(function (x) { return x && x.id === d0.id; })[0] || {}, o = JSON.parse(JSON.stringify(Object.assign({}, d0, c)));
          o.id = d0.id; o.code = d0.code; o.cat = str(o.cat, 40) || d0.cat; o.enabled = o.enabled !== false && o.enabled !== 'false';
          var m = String(o.sheetId || '').match(/\/d\/([\w-]{20,})/); o.sheetId = m ? m[1] : str(o.sheetId, 80).replace(/[^\w-]/g, '');
          o.tab = str(o.tab, 60) || 'Sponsorships'; o.portal = str(o.portal, 300); o.api = str(o.api, 300);
          if (o.api && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(o.api)) throw E(o.cat + ': the portal API must be an Apps Script web app address ending in /exec.');
          return o;
        });
      }
      else if (k === 'sources') { if (!Array.isArray(v)) throw E('Sources must be a list.'); v = v.map(function (src) { var d0 = DEFAULT_SETTINGS.sources.filter(function (x) { return x.id === src.id; })[0] || {}; return JSON.parse(JSON.stringify(Object.assign({}, d0, src))); }); }
      else { v = str(v, 300); if ((k === 'periodFrom' || k === 'periodTo') && !validDate(v)) throw E('Enter valid period dates.'); }
      state.setSetting(k, v); changed.push(k);
    });
    var s = state.settings(); if (s.periodFrom > s.periodTo) throw E('The period start must be before its end.');
    state.log(user, 'SETTINGS', '', changed.join(', '));
    return changed;
  }

  /* ------------------------------------------------------------ statement */
  function statement(data, opt) {
    opt = opt || {};
    var s = data.settings, from = opt.from || s.periodFrom, to = opt.to || s.periodTo;
    var heads = headMap(data.heads), led = data.ledger.filter(function (l) { return l.date >= from && l.date <= to; });
    var before = data.ledger.filter(function (l) { return l.date < from; });
    var opening = Number(s.openingBalance || 0); before.forEach(function (l) { opening += l.dir === 'IN' ? l.amount : -l.amount; });
    var by = {}, recIn = 0, recOut = 0;
    led.forEach(function (l) {
      var h = heads[l.head] || { name: l.head, kind: l.dir === 'IN' ? 'INCOME' : 'EXPENSE' }, k = l.head;
      by[k] = by[k] || { code: k, name: h.name, kind: h.kind, budget: h.budget || 0, inflow: 0, outflow: 0 };
      if (l.dir === 'IN') { by[k].inflow += l.amount; recIn += l.amount; } else { by[k].outflow += l.amount; recOut += l.amount; }
    });
    data.heads.forEach(function (h) { if (!by[h.code] && h.active && h.budget > 0) by[h.code] = { code: h.code, name: h.name, kind: h.kind, budget: h.budget, inflow: 0, outflow: 0 }; });
    var list = Object.keys(by).map(function (k) { var r = by[k]; r.inflow = r2(r.inflow); r.outflow = r2(r.outflow); return r; })
      .sort(function (a, b) { return ((heads[a.code] || {}).sort || 999) - ((heads[b.code] || {}).sort || 999); });
    var income = list.filter(function (r) { return r.kind === 'INCOME'; }).map(function (r) { return { code: r.code, name: r.name, budget: r.budget, actual: r2(r.inflow - r.outflow), variance: r2(r.inflow - r.outflow - r.budget) }; });
    var expense = list.filter(function (r) { return r.kind === 'EXPENSE'; }).map(function (r) { return { code: r.code, name: r.name, budget: r.budget, actual: r2(r.outflow - r.inflow), variance: r2(r.budget - (r.outflow - r.inflow)) }; });
    var deposit = list.filter(function (r) { return r.kind === 'DEPOSIT'; }).map(function (r) { return { code: r.code, name: r.name, budget: r.budget, received: r.inflow, refunded: r.outflow, held: r2(r.inflow - r.outflow) }; });
    function sum(a, k) { var t = 0; a.forEach(function (x) { t += x[k]; }); return r2(t); }
    var totInc = sum(income, 'actual'), totExp = sum(expense, 'actual'), totDep = sum(deposit, 'held');
    var exps = data.expenses.filter(function (x) { return x.status === 'PAID' && x.paidOn >= from && x.paidOn <= to; });
    var flagged = exps.filter(function (x) { return x.expKind; }).map(function (x) { return { id: x.id, voucherNo: x.voucherNo, head: (heads[x.head] || {}).name || x.head, title: x.title, payee: x.payee, amount: x.amount, kind: x.expKind, overBy: x.overBy, explanation: x.explanation, ackBy: x.ackBy, adminBy: x.adminBy }; });
    var pendingInc = data.income.filter(function (i) { return i.status === 'PENDING' || i.status === 'SOURCE_PENDING'; });
    var pendingExp = data.expenses.filter(function (x) { return COMMITTED.indexOf(x.status) >= 0; });
    var rec = data.recon || reconStatus({ ledger: data.ledger, bank: data.bank }, s);
    return {
      org: s.org, season: s.season, venue: s.venue, from: from, to: to, generatedAt: data.now,
      opening: r2(opening), receipts: r2(recIn), payments: r2(recOut), closing: r2(opening + recIn - recOut),
      receiptsByHead: list.filter(function (r) { return r.inflow; }).map(function (r) { return { name: r.name, kind: r.kind, amount: r.inflow }; }),
      paymentsByHead: list.filter(function (r) { return r.outflow; }).map(function (r) { return { name: r.name, kind: r.kind, amount: r.outflow }; }),
      income: income, expense: expense, deposit: deposit, totalIncome: totInc, totalExpense: totExp, depositsHeld: totDep,
      surplus: r2(totInc - totExp), targetSurplus: Number(s.targetSurplus || 0),
      incomeBudget: sum(income, 'budget'), expenseBudget: sum(expense, 'budget'),
      flagged: flagged, pendingIncome: { count: pendingInc.length, amount: sum(pendingInc, 'amount') }, pendingExpense: { count: pendingExp.length, amount: sum(pendingExp, 'amount') },
      recon: rec, final: !!(rec && rec.complete && !pendingInc.length && !pendingExp.length && led.length),
      entries: led.length, signatories: { preparedBy: s.preparedBy, verifiedBy: s.verifiedBy, approvedBy: s.approvedBy }
    };
  }

  /* ----------------------------------------------- jersey: manufacturer's final designs (Admin) */
  function jerseyFinals(state, ctx, user, fn, a) {
    var rows = state.t('Jersey');
    function view() {
      var teams = [];
      try { if (ctx.jersey) teams = (ctx.jersey('jerseyAdmin', []).teams || []).map(function (t) { return String(t.team); }); } catch (e) { teams = []; }
      rows.forEach(function (r) { if (teams.indexOf(r.team) < 0) teams.push(r.team); });
      return { teams: teams.sort(), files: rows.filter(function (r) { return !r.removed; }).map(function (r) { return { id: r.id, team: r.team, url: r.url, name: r.name, note: r.note, version: Number(r.version), at: r.at, by: r.by }; }) };
    }
    if (fn === 'jerseyFinals') return view();
    if (fn === 'jerseyFinalRemove') {
      var x = findBy(rows, 'id', String(a[0] || '')); if (!x || x.removed) throw E('That upload was not found.');
      x.removed = true; state.touch('Jersey'); state.log(user, 'JERSEY_FINAL_REMOVE', x.team, 'Removed final design v' + x.version + ' (' + x.name + ')'); state.flush(); return view();
    }
    var team = str(a[0], 80), f = a[1], note = str(a[2], 300);
    if (!team) throw E('Choose the team.');
    if (!f || !f.data || !/^(image\/(jpeg|png|webp|svg\+xml)|application\/pdf)$/.test(f.mime || '')) throw E('The final design must be a JPG, PNG, WEBP, SVG or PDF file.');
    if (f.data.length > 15 * 1024 * 1024 * 1.37) throw E('The file is larger than 15 MB.');
    var ver = rows.filter(function (r) { return r.team === team; }).reduce(function (m, r) { return Math.max(m, Number(r.version) || 0); }, 0) + 1;
    var url = ctx.saveFile(f, 'Jersey final ' + team + ' v' + ver);
    rows.push({ id: String(ctx.uuid()).replace(/-/g, '').slice(0, 8), team: team, url: url, name: str(f.name, 80), mime: f.mime, size: Math.round(f.data.length / 1.37), note: note, version: ver, removed: false, at: state.now, by: user.name });
    state.touch('Jersey'); state.log(user, 'JERSEY_FINAL', team, 'Manufacturer final design v' + ver + ' uploaded (' + str(f.name, 80) + ')'); state.flush();
    return view();
  }

  /* --------------------------------------------------------------- router */
  var WRITE = {
    incomeCreate: incomeCreate, incomeDecide: incomeDecide, syncSources: syncSources, teamDeskDecide: teamDeskDecide,
    teamDeskInfo: teamDeskInfo, sponsorDecide: sponsorDecide,
    regList: function (state, ctx, user) { need(user, 'viewAll'); if (!ctx.regList) throw E('The registration sheet link is not available.'); var s = (state.settings().sources || []).filter(function (x) { return x.id === 'REG'; })[0]; return ctx.regList(s || {}); }, teamDeskFee: teamDeskFee, teamDeskSplit: teamDeskSplit, teamDeskSplitDelete: teamDeskSplitDelete,
    expenseCreate: expenseCreate, expenseUpdate: expenseUpdate, expenseCancel: expenseCancel, expenseDecide: expenseDecide, expensePay: expensePay,
    ledgerReverse: ledgerReverse, ledgerCashRecon: ledgerCashRecon,
    bankImport: bankImport, bankMatch: bankMatch, bankUnmatch: bankUnmatch, bankIgnore: bankIgnore, bankDeleteBatch: bankDeleteBatch,
    bankAutoMatch: function (state, ctx, user) { need(user, 'bank'); var n = autoMatch(state, user); state.log(user, 'BANK_AUTOMATCH', '', n + ' matched'); return n; },
    headSave: headSave, userSave: userSave, userNewCode: userNewCode, settingsSave: settingsSave
  };
  function handle(store, ctx, fn, args) {
    args = args || [];
    var state = new State(store); state.now = stamp(ctx.now || new Date());
    var result;
    if (fn === 'login') { result = login(state, ctx, args[0], args[1]); state.flush(); return result; }
    if (fn === 'logout') { if (args[0]) ctx.cache.remove('sess:' + args[0]); return true; }
    if (fn === 'ping') return { ok: true, version: VERSION };
    var user = session(state, ctx, args[0]), rest = args.slice(1);
    if (fn === 'boot') return boot(state, user);
    if (fn === 'foodAuth') { need(user, 'food'); return { person: user.person, role: user.role, profile: user.profile }; }   // lets the Food backend trust a Finance Desk sign-in
    if (fn === 'jerseyFinals' || fn === 'jerseyFinalUpload' || fn === 'jerseyFinalRemove') { need(user, 'jersey'); return jerseyFinals(state, ctx, user, fn, rest); }
    if (fn === 'jerseyList' || fn === 'jerseyUpload' || fn === 'jerseySave') {              // Jersey designs: Admin only, passed on to the Team Desk's jersey admin
      need(user, 'jersey'); if (!ctx.jersey) throw E('The Team Desk jersey link is not available.');
      if (fn === 'jerseyList') return ctx.jersey('jerseyAdmin', []);
      if (fn === 'jerseyUpload') return ctx.jersey('jerseyAdminUpload', [String(rest[0] || ''), String(rest[1] || ''), rest[2]]);
      var jr = ctx.jersey('jerseyAdminSave', [rest[0]]);
      state.log(user, 'JERSEY_SAVE', String((rest[0] || {}).team || ''), 'Jersey designs saved as No. ' + (((jr || {}).saved || {}).order || '?')); state.flush();
      return jr;
    }
    if (!WRITE[fn]) throw E('Unknown request: ' + fn);
    if (user.role === 'VIEWER') throw E('Viewers cannot change anything.');
    if (user.role === 'FOOD') throw E('The Food management profile can only use the Food tab.');
    result = WRITE[fn].apply(null, [state, ctx, user].concat(rest));
    state.flush();
    return { result: result, data: boot(state, user) };
  }

  return {
    VERSION: VERSION, SCHEMA: SCHEMA, FIELDS: FIELDS, ROLES: ROLES, KINDS: KINDS, PAY_MODES: PAY_MODES, DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    handle: handle, ensureSetup: function (store, ctx, admin) { var st = new State(store); st.now = stamp(ctx.now || new Date()); st.ctx = ctx; var r = ensureSetup(st, admin); st.flush(); return r; },
    /* Gives a user a new access code outside a session (Apps Script editor / demo seeding). fixed = optional code to set. */
    issueCode: function (store, ctx, match, fixed) { var st = new State(store); st.now = stamp(ctx.now || new Date()); var u = st.t('Users').filter(function (x) { return x.id === match || x.name === match; })[0] || st.t('Users').filter(function (x) { return x.role === match && x.active; })[0]; if (!u) throw new Error('No user ' + match); var c = giveCode(st, ctx, u, fixed); st.log(null, 'USER_NEW_CODE', u.id, u.name + ' – code issued from the script editor'); st.flush(); return c; },
    addUser: function (store, ctx, d) { var st = new State(store); st.now = stamp(ctx.now || new Date()); if (st.t('Users').some(function (x) { return x.name.toLowerCase() === String(d.name).toLowerCase(); })) return null; var u = makeUser(st, { mobile: mobile10(d.mobile), name: d.name, role: d.role }); st.t('Users').push(u); var c = giveCode(st, ctx, u, d.code); st.log(null, 'USER_SAVE', u.id, u.name + ' · ' + u.role + ' · added from the script editor'); st.flush(); return c; },
    normCode: normCode, sponsorCat: sponsorCat,
    /* Script-editor only: runs one change as the Admin profile so it is validated and kept in the audit trail. */
    runAsAdmin: function (store, ctx, fn, args) { var st = new State(store); st.now = stamp(ctx.now || new Date()); if (!WRITE[fn]) throw new Error('Unknown ' + fn);
      var r = WRITE[fn].apply(null, [st, ctx, { id: 'SYSTEM', role: 'ADMIN', profile: 'ADMIN', person: 'Krishnadas M N', name: 'Krishnadas M N · Admin (script editor)' }].concat(args || [])); st.flush(); return r; }, ROLE_HELP: ROLE_HELP, PROFILE_ORDER: PROFILE_ORDER, canMap: canMap, incomeScope: incomeScope, feeHeads: feeHeads,
    applyDuties: function (store, ctx) { var st = new State(store); st.now = stamp(ctx.now || new Date()); var r = applyDuties(st, ctx); st.flush(); return r; },
    ensureProfiles: function (store, ctx, fixed) { var st = new State(store); st.now = stamp(ctx.now || new Date()); var r = ensureProfiles(st, ctx, fixed); st.flush(); return r; },
    coerce: coerce, sha256: sha256, hashPin: hashPin,
    checkExplanation: checkExplanation, parsePayee: parsePayee, validIfsc: validIfsc, validAcc: validAcc, validUpi: validUpi,
    splitCsv: splitCsv, detectStatement: detectStatement, mapHeader: mapHeader, statementLines: statementLines, parseDateAny: parseDateAny, parseAmount: parseAmount, parseSigned: parseSigned,
    summary: summary, budgetCheck: budgetCheck, reconStatus: function (ledger, bank, settings) { return reconStatus({ ledger: ledger, bank: bank }, settings); },
    suggestMatches: suggestMatches, statement: statement, needsAdmin: needsAdmin,
    inr: inr, words: words, r2: r2, validDate: validDate, normRef: normRef, isoDate: isoDate, stamp: stamp
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = FinCore;
