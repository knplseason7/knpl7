/* KNPL-7 Finance Desk – Food tab (Food Arrangement committee page).
 * Runs inside the Finance Desk. The person signs in once to the Finance Desk (Food management profile or Admin);
 * this tab hands that session to the Food backend (FIN_CONFIG.FOOD_API_URL), which checks it with the Finance Desk. */
(function () {
  'use strict';
  var MN = { B: 'Breakfast', L: 'Lunch', T: 'Tea' }, S = { token: '', D: null, msg: '', bad: false, rep: null, repDay: 1, audit: null, busy: false, err: '' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nice(n) { return String(n || '').toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function call(fn, args) {
    var url = (window.FIN_CONFIG || {}).FOOD_API_URL;
    if (!url) return Promise.reject(new Error('The Food backend is not connected yet. Set FOOD_API_URL in finance/config.js after deploying FoodApi.gs.'));
    return fetch(url, { method: 'POST', body: JSON.stringify({ fn: fn, args: args || {} }), redirect: 'follow' })
      .catch(function () { throw new Error('Could not reach the Food server. Check your internet connection and try again.'); })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) { var e = new Error(String(j.error || 'Request failed.').split('\n')[0]); e.code = j.code; throw e; } return j.result; });
  }
  function authed(fn, args, financeToken) {
    args = Object.assign({ token: S.token }, args || {});
    return call(fn, args).catch(function (e) {
      if (!/log ?in again|Please log/i.test(e.message)) throw e;
      return login(financeToken).then(function () { args.token = S.token; return call(fn, args); });
    });
  }
  function login(financeToken) { return call('adminLogin', { financeToken: financeToken }).then(function (r) { S.token = r.token; }); }

  function mount(root, opts) {
    var ft = opts.financeToken, canClear = opts.admin;
    function say(m, bad) { S.msg = m; S.bad = !!bad; draw(); }
    function load() {
      S.busy = true; S.err = '';
      var go = S.token ? Promise.resolve() : login(ft);
      return go.then(function () { return authed('adminSummary', {}, ft); })
        .then(function (d) { S.D = d; S.busy = false; draw(); })
        .catch(function (e) { S.busy = false; S.err = e.message; draw(); });
    }
    function act(fn, args, ok) { return authed(fn, args, ft).then(function () { S.msg = ok; S.bad = false; S.audit = null; return load(); }).catch(function (e) { say(e.message, 1); load(); }); }
    var D;
    function tn(id) { var t = D.teams.filter(function (x) { return x.id === id; })[0]; return t ? nice(t.name) : id; }

    function draw() {
      D = S.D; root.replaceChildren();
      var box = document.createElement('div'); root.appendChild(box);
      if (S.err) { box.innerHTML = '<div class="card"><b>Food tab</b><p class="muted">' + esc(S.err) + '</p><button class="btn sm" id="fRetry">Try again</button></div>'; box.querySelector('#fRetry').onclick = load; return; }
      if (!D) { box.innerHTML = '<div class="card muted">Loading Food Arrangement…</div>'; if (!S.busy) load(); return; }
      var h = '<div class="card"><div class="row sp-b"><div><h3 style="margin:0">Food Arrangement – committee</h3><div class="small muted">Signed in as ' + esc(D.person || 'committee') + '. Every change here is recorded with your name.</div></div><button class="btn ghost sm" id="fRef">Refresh</button></div>' + (S.msg ? '<div class="small" style="margin-top:8px;color:var(' + (S.bad ? '--red' : '--ok') + ')" role="status">' + esc(S.msg) + '</div>' : '') + '</div>';
      // RSVP status
      var tot = D.teams.length, none = D.teams.filter(function (t) { return !t.players; }), noc = D.teams.filter(function (t) { return !t.consent; });
      h += '<div class="card"><h3 style="margin-top:0">Yes / No collection</h3><div class="small muted">' + (tot - none.length) + ' of ' + tot + ' teams have at least one player answer. ' + (noc.length ? noc.length + ' owner(s) have not accepted the rules yet.' : 'All owners have accepted the rules.') + ' The window closes 9 Feb 2027, 6:30 PM; after that only you can edit.</div><div style="overflow:auto"><table><thead><tr><th>Team</th><th>Food code</th><th>Rules accepted by</th><th class="right">Players answered</th><th class="right">Meal Yes\'s</th></tr></thead><tbody>' +
        D.teams.map(function (t) { return '<tr><td>' + esc(nice(t.name)) + '</td><td class="mono"><b>' + esc(t.code || '–') + '</b></td><td>' + (t.consent ? esc(t.consent) : '<span class="muted">not yet</span>') + '</td><td class="right">' + (t.players || '<span style="color:var(--red)">0</span>') + '</td><td class="right">' + (t.yesMeals || 0) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (none.length ? '<div class="small" style="margin-top:8px"><b>To chase (no answers yet):</b> ' + none.map(function (t) { return esc(nice(t.name)); }).join(', ') + '</div>' : '') + '</div>';
      // meals
      h += '<div class="card"><h3 style="margin-top:0">Meals and counters</h3><p class="small muted">Before 7:30 / 12:00 / 3:00 the split is a live preview so the caterer can plan. The timer locks it at the meal time; after that you can change a team\'s counter, Yes count or the buffer.</p>';
      var day = 0;
      D.meals.forEach(function (m, i) {
        if (m.day !== day) { day = m.day; h += '<div style="font-weight:800;margin:10px 0 4px">Day ' + day + '</div>'; }
        h += '<details class="card tight" style="margin:6px 0"><summary><b>' + MN[m.meal] + '</b> · Yes ' + m.totalYes + ' · ' + esc(D.grounds[0]) + ' <b>' + m.totals[0] + '</b> / ' + esc(D.grounds[1]) + ' <b>' + m.totals[1] + '</b> · Buffer ' + (m.buffer == null ? m.suggestedBuffer + ' (suggested)' : m.buffer) + ' each · ' + (m.locked ? '🔒 locked' : 'preview') + '</summary>' +
          '<div class="row" style="margin:8px 0"><button class="btn sm" data-gen="' + i + '">' + (m.locked ? 'Regenerate' : 'Generate now') + '</button>' + (m.locked ? '<span class="small">Buffer per counter: <input type="number" min="0" style="width:80px;display:inline-block" id="fBuf' + i + '" value="' + m.buffer + '"> <button class="btn ghost sm" data-buf="' + i + '">Set</button></span>' : '') + '</div>' +
          '<table><thead><tr><th>Team</th><th>Yes</th><th>Counter</th><th>Basis</th></tr></thead><tbody>' + m.teams.filter(function (t) { return t.yes > 0 || m.locked; }).sort(function (a, b) { return tn(a.id).localeCompare(tn(b.id)); }).map(function (t) {
            return '<tr><td>' + esc(tn(t.id)) + '</td><td>' + (m.locked ? '<input type="number" min="0" style="width:70px" data-y="' + i + '|' + t.id + '" value="' + t.yes + '">' : t.yes) + '</td><td>' + (m.locked ? '<select data-g="' + i + '|' + t.id + '"><option value="0"' + (t.ground === 0 ? ' selected' : '') + '>' + esc(D.grounds[0]) + '</option><option value="1"' + (t.ground === 1 ? ' selected' : '') + '>' + esc(D.grounds[1]) + '</option></select>' : esc(D.grounds[t.ground])) + '</td><td>' + esc(t.basis) + '</td></tr>'; }).join('') + '</tbody></table></details>';
      });
      h += '</div>';
      // daily record
      h += '<div class="card"><h3 style="margin-top:0">Daily record (used vs given)</h3><div class="row"><select id="fDay" style="max-width:140px">' + [1, 2, 3, 4].map(function (d) { return '<option' + (d === S.repDay ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select><button class="btn sm" id="fRep">Show</button>' + (canClear ? '<button class="btn ghost sm" id="fRepT">Show practice entries</button>' : '') + '</div><div id="fRepOut" class="small" style="margin-top:8px">' + (S.rep ? repHtml(S.rep) : '') + '</div></div>';
      // audit
      h += '<div class="card"><div class="row sp-b"><h3 style="margin:0">Change log</h3><button class="btn ghost sm" id="fAud">' + (S.audit ? 'Reload' : 'Show') + '</button></div>' + (S.audit ? '<div style="overflow:auto"><table class="small"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th></tr></thead><tbody>' + (S.audit.length ? S.audit.map(function (a) { return '<tr><td class="nowrap">' + esc(new Date(a.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</td><td>' + esc(a.who) + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.detail) + '</td></tr>'; }).join('') : '<tr><td colspan="4" class="muted">No changes yet.</td></tr>') + '</tbody></table></div>' : '') + '</div>';
      if (canClear) h += '<div class="card"><h3 style="margin-top:0">Practice mode</h3><p class="small muted">Counter volunteers can run practice entries before the event. Clear them before day 1.</p><button class="btn no sm" id="fClr">Clear all practice entries</button></div>';
      box.innerHTML = h;
      var q = function (s) { return box.querySelector(s); }, qa = function (s) { return Array.prototype.slice.call(box.querySelectorAll(s)); };
      q('#fRef').onclick = function () { S.msg = ''; load(); };
      qa('[data-gen]').forEach(function (b) { b.onclick = function () { var m = D.meals[+b.dataset.gen]; if (m.locked && !confirm('Regenerate ' + MN[m.meal] + ' of day ' + m.day + '? Counter overrides for this meal will be reset.')) return; act('adminGenerate', { day: m.day, meal: m.meal }, 'Generated.'); }; });
      qa('[data-buf]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.buf, m = D.meals[i]; act('adminBuffer', { day: m.day, meal: m.meal, size: q('#fBuf' + i).value }, 'Buffer saved.'); }; });
      qa('[data-g]').forEach(function (s) { s.onchange = function () { var p = s.dataset.g.split('|'), m = D.meals[+p[0]]; act('adminOverride', { day: m.day, meal: m.meal, teamId: p[1], ground: +s.value }, 'Counter changed.'); }; });
      qa('[data-y]').forEach(function (s) { s.onchange = function () { var p = s.dataset.y.split('|'), m = D.meals[+p[0]]; act('adminSetYes', { day: m.day, meal: m.meal, teamId: p[1], yes: s.value }, 'Yes count saved.'); }; });
      function rep(test) { S.repDay = +q('#fDay').value; authed('adminReport', { day: S.repDay, test: test }, ft).then(function (r) { S.rep = r; draw(); }).catch(function (e) { say(e.message, 1); }); }
      q('#fRep').onclick = function () { rep(false); }; if (q('#fRepT')) q('#fRepT').onclick = function () { rep(true); };
      q('#fAud').onclick = function () { authed('adminAudit', {}, ft).then(function (r) { S.audit = r; draw(); }).catch(function (e) { say(e.message, 1); }); };
      if (q('#fClr')) q('#fClr').onclick = function () { if (!confirm('Delete all practice entries?')) return; authed('adminClearTest', {}, ft).then(function (r) { say('Cleared ' + r.cleared + ' practice entries.'); }).catch(function (e) { say(e.message, 1); }); };
    }
    function repHtml(r) {
      return r.length ? r.map(function (m) { return '<div style="font-weight:800;margin-top:8px">' + MN[m.meal] + ' · Yes ' + m.totalYes + ' · Buffer used ' + esc(D.grounds[0]) + ' ' + m.bufferUsed[0] + ' / ' + esc(D.grounds[1]) + ' ' + m.bufferUsed[1] + ' of ' + m.buffer + '</div><table><tbody>' +
        m.teams.filter(function (t) { return t.yes || t.served; }).map(function (t) { return '<tr><td>' + esc(nice(t.team)) + '</td><td>' + esc(t.ground) + '</td><td>Given ' + t.served + ' of ' + t.yes + '</td></tr>'; }).join('') + '</tbody></table>'; }).join('') : 'Nothing locked for this day yet.';
    }
    draw();
  }
  window.FinFood = { mount: mount, reset: function () { S = { token: '', D: null, msg: '', bad: false, rep: null, repDay: 1, audit: null, busy: false, err: '' }; } };
})();
