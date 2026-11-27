/* KNPL-7 Finance Desk – Jersey tab (Admin only).
 *  1. Manufacturer's final designs: upload each team's final jersey design as it arrives (kept as versions, stored in Drive).
 *  2. Designs received from the teams (Choice 1 / Choice 2 / logo): the committee jersey admin, passed on to the Team Desk. */
(function () {
  'use strict';
  var S = { fin: null, finErr: '', ch: null, chErr: '', file: null, team: '', note: '', msg: '', bad: false, busy: false, chFiles: {}, chTeam: '', chNo: '', chNote: '', chMsg: '', chBad: false, loaded: false };
  var TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1, 'image/svg+xml': 1, 'application/pdf': 1 };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function title(t) { return String(t || '').toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).replace(/\bOf\b/g, 'of'); }
  function slug(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function b64(file) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1]); }; fr.onerror = function () { rej(new Error('Could not read the file.')); }; fr.readAsDataURL(file); }); }
  function fixType(f) {
    if (TYPES[f.type]) return f.type; var n = (f.name || '').toLowerCase();
    return n.endsWith('.png') ? 'image/png' : n.endsWith('.webp') ? 'image/webp' : n.endsWith('.svg') ? 'image/svg+xml' : n.endsWith('.pdf') ? 'application/pdf' : (n.endsWith('.jpg') || n.endsWith('.jpeg')) ? 'image/jpeg' : f.type;
  }
  function when(s) { var d = new Date(String(s).replace(' ', 'T')); return isNaN(d) ? String(s || '') : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

  function mount(root, call) {
    function loadFin() { return call('jerseyFinals').then(function (r) { S.fin = r; S.finErr = ''; }).catch(function (e) { S.finErr = e.message; }); }
    function loadCh() { return call('jerseyList').then(function (r) { S.ch = r; S.chErr = ''; }).catch(function (e) { S.chErr = e.message; }); }
    function reload() { return Promise.all([loadFin(), loadCh()]).then(draw); }

    function draw() {
      root.replaceChildren(); var box = document.createElement('div'); root.appendChild(box);
      var h = '<div class="card"><div class="row sp-b"><div><h3 style="margin:0">Jersey designs</h3><div class="small muted">Admin only. Every upload is recorded in the audit trail with your name.</div></div><button class="btn ghost sm" id="jRef">Refresh</button></div></div>';
      // 1. manufacturer finals
      h += '<div class="card"><h3 style="margin-top:0">Final design from the manufacturer</h3>';
      if (S.finErr) h += '<p class="small" style="color:var(--red)">' + esc(S.finErr) + '</p>';
      else if (!S.fin) h += '<p class="muted small">Loading…</p>';
      else {
        var F = S.fin, latest = {}, hist = {}; F.files.forEach(function (x) { (hist[x.team] = hist[x.team] || []).push(x); if (!latest[x.team] || x.version > latest[x.team].version) latest[x.team] = x; });
        h += '<p class="small muted">Upload each team\'s final design as soon as the manufacturer sends it. A new upload for the same team becomes the next version; older versions stay available.</p>';
        h += '<div class="row" style="align-items:flex-end"><div class="grow" style="min-width:220px"><label class="small muted" for="jfTeam">Team</label><select id="jfTeam"><option value="">— Select team —</option>' +
          F.teams.map(function (t) { return '<option value="' + esc(t) + '"' + (S.team === t ? ' selected' : '') + '>' + esc(title(t)) + (latest[t] ? ' (v' + latest[t].version + ' uploaded)' : ' (awaiting)') + '</option>'; }).join('') + '</select></div>' +
          '<div class="grow" style="min-width:220px"><label class="small muted" for="jfFile">Final design file (JPG, PNG, WEBP, SVG or PDF, up to 15 MB)</label><input type="file" id="jfFile" accept="image/*,application/pdf"></div></div>' +
          '<div style="margin-top:8px"><label class="small muted" for="jfNote">Note (optional)</label><input id="jfNote" maxlength="300" placeholder="e.g. Final print-ready file, received on WhatsApp" value="' + esc(S.note) + '"></div>' +
          '<div class="row" style="margin-top:10px"><button class="btn" id="jfUp"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Uploading…' : 'Upload final design') + '</button><span class="small" id="jfMsg" style="color:var(' + (S.bad ? '--red' : '--ok') + ')">' + esc(S.msg) + '</span></div>';
        var have = Object.keys(latest).length;
        h += '<div class="small muted" style="margin:14px 0 6px"><b>' + have + ' of ' + F.teams.length + '</b> teams have a final design uploaded.</div><div style="overflow:auto"><table><thead><tr><th>Team</th><th>Latest</th><th>Uploaded</th><th>Note</th><th></th></tr></thead><tbody>' +
          F.teams.map(function (t) {
            var l = latest[t]; if (!l) return '<tr><td>' + esc(title(t)) + '</td><td colspan="4" class="muted">Awaiting</td></tr>';
            var older = (hist[t] || []).filter(function (x) { return x.id !== l.id; }).sort(function (a, b) { return b.version - a.version; });
            return '<tr><td>' + esc(title(t)) + '</td><td><a href="' + esc(l.url) + '" target="_blank" rel="noopener"><b>v' + l.version + '</b> · ' + esc(l.name || 'View') + '</a>' +
              (older.length ? '<details class="small"><summary>' + older.length + ' older</summary>' + older.map(function (o) { return '<div><a href="' + esc(o.url) + '" target="_blank" rel="noopener">v' + o.version + ' · ' + esc(o.name) + '</a> <span class="muted">' + esc(when(o.at)) + '</span> <button class="btn ghost sm" data-rm="' + esc(o.id) + '">Remove</button></div>'; }).join('') + '</details>' : '') +
              '</td><td class="small nowrap">' + esc(when(l.at)) + '<div class="muted">' + esc(l.by) + '</div></td><td class="small">' + esc(l.note || '') + '</td><td><button class="btn ghost sm" data-rm="' + esc(l.id) + '">Remove</button></td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      h += '</div>';
      // 2. team designs
      h += '<div class="card"><h3 style="margin-top:0">Designs received from the teams (Choice 1 / Choice 2)</h3>';
      if (S.chErr) h += '<p class="small" style="color:var(--red)">' + esc(S.chErr) + '</p>';
      else if (!S.ch) h += '<p class="muted small">Loading…</p>';
      else {
        var T = S.ch.teams, done = T.filter(function (t) { return t.saved; }).sort(function (a, b) { return a.saved.order - b.saved.order; }), pend = T.filter(function (t) { return !t.saved; });
        var cur = T.filter(function (t) { return t.team === S.chTeam; })[0], taken = {}; T.forEach(function (x) { if (x.saved && x !== cur) taken[x.saved.order] = x.team; });
        var firstFree = 0; for (var i = 1; i <= T.length; i++) if (!taken[i]) { firstFree = i; break; }
        var no = S.chNo || (cur && cur.saved ? cur.saved.order : firstFree);
        h += '<p class="small muted">Add each team\'s two choices and logo, and mark the order in which they reached you on WhatsApp. <b>' + done.length + ' of ' + T.length + '</b> entered.</p>';
        h += '<div class="row" style="align-items:flex-end"><div class="grow" style="min-width:220px"><label class="small muted" for="jcTeam">Team</label><select id="jcTeam"><option value="">— Select team —</option>' +
          '<optgroup label="Not entered yet (' + pend.length + ')">' + pend.map(function (t) { return '<option value="' + esc(t.team) + '"' + (S.chTeam === t.team ? ' selected' : '') + '>' + esc(title(t.team)) + '</option>'; }).join('') + '</optgroup>' +
          (done.length ? '<optgroup label="Already entered – replace files">' + done.map(function (t) { return '<option value="' + esc(t.team) + '"' + (S.chTeam === t.team ? ' selected' : '') + '>No. ' + t.saved.order + ' · ' + esc(title(t.team)) + '</option>'; }).join('') + '</optgroup>' : '') + '</select></div>' +
          '<div style="min-width:160px"><label class="small muted" for="jcNo">Received order No.</label><select id="jcNo">' + T.map(function (_, k) { var n = k + 1; return '<option value="' + n + '"' + (taken[n] ? ' disabled' : '') + (Number(no) === n ? ' selected' : '') + '>No. ' + n + (taken[n] ? ' – ' + esc(title(taken[n])) : '') + '</option>'; }).join('') + '</select></div></div>';
        h += '<div class="row" style="margin-top:8px">' + [['c1', 'Choice 1'], ['c2', 'Choice 2'], ['logo', 'Logo (optional)']].map(function (s) { return '<div class="grow" style="min-width:200px"><label class="small muted">' + s[1] + '</label><input type="file" data-jc="' + s[0] + '" accept="image/*,application/pdf"><div class="small muted">' + (S.chFiles[s[0]] ? esc(S.chFiles[s[0]].name) + ' · ready' : '') + '</div></div>'; }).join('') + '</div>';
        h += '<div style="margin-top:8px"><label class="small muted" for="jcNote">Note (optional)</label><input id="jcNote" maxlength="500" value="' + esc(S.chNote) + '"></div>';
        h += '<div class="row" style="margin-top:10px"><button class="btn" id="jcSave"' + (S.busy ? ' disabled' : '') + '>' + (cur && cur.saved ? 'Update ' + esc(title(cur.team)) : 'Save') + '</button><span class="small" style="color:var(' + (S.chBad ? '--red' : '--ok') + ')">' + esc(S.chMsg) + '</span></div>';
        h += '<div style="overflow:auto;margin-top:12px"><table class="small"><thead><tr><th>No.</th><th>Team</th><th>Entered</th></tr></thead><tbody>' + (done.length ? done.map(function (t) { return '<tr><td>' + t.saved.order + '</td><td>' + esc(title(t.team)) + '</td><td class="muted">' + esc(t.saved.at || '') + (t.saved.logo ? ' · logo ✔' : '') + '</td></tr>'; }).join('') : '<tr><td colspan="3" class="muted">Nothing entered yet.</td></tr>') + '</tbody></table></div>';
      }
      h += '</div>';
      box.innerHTML = h;
      var q = function (s) { return box.querySelector(s); }, qa = function (s) { return Array.prototype.slice.call(box.querySelectorAll(s)); };
      q('#jRef').onclick = function () { S.msg = ''; S.chMsg = ''; reload(); };
      if (q('#jfTeam')) {
        q('#jfTeam').onchange = function () { S.team = this.value; };
        q('#jfNote').oninput = function () { S.note = this.value; };
        q('#jfFile').onchange = function () { S.file = this.files[0] || null; };
        q('#jfUp').onclick = function () {
          var f = S.file, m = q('#jfMsg'); S.bad = true;
          if (!S.team) { m.style.color = 'var(--red)'; m.textContent = 'Choose the team.'; return; }
          if (!f) { m.style.color = 'var(--red)'; m.textContent = 'Choose the final design file.'; return; }
          var mime = fixType(f); if (!TYPES[mime]) { m.style.color = 'var(--red)'; m.textContent = 'Only JPG, PNG, WEBP, SVG or PDF files can be used.'; return; }
          if (f.size > 15 * 1048576) { m.style.color = 'var(--red)'; m.textContent = 'This file is larger than 15 MB.'; return; }
          S.busy = true; S.msg = 'Uploading…'; draw();
          b64(f).then(function (data) { return call('jerseyFinalUpload', S.team, { name: f.name, mime: mime, data: data }, S.note); })
            .then(function (r) { S.fin = r; S.msg = '✔ Uploaded for ' + title(S.team); S.bad = false; S.file = null; S.note = ''; S.team = ''; })
            .catch(function (e) { S.msg = e.message; S.bad = true; })
            .then(function () { S.busy = false; draw(); });
        };
        qa('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this uploaded design from the list? The file stays in Drive.')) return; call('jerseyFinalRemove', b.dataset.rm).then(function (r) { S.fin = r; S.msg = 'Removed.'; S.bad = false; draw(); }).catch(function (e) { S.msg = e.message; S.bad = true; draw(); }); }; });
      }
      if (q('#jcTeam')) {
        q('#jcTeam').onchange = function () { S.chTeam = this.value; S.chNo = ''; draw(); };
        q('#jcNo').onchange = function () { S.chNo = this.value; };
        q('#jcNote').oninput = function () { S.chNote = this.value; };
        qa('[data-jc]').forEach(function (i) { i.onchange = function () { var f = i.files[0]; if (!f) { delete S.chFiles[i.dataset.jc]; return; } var mime = fixType(f); if (!TYPES[mime]) { alert('Only JPG, PNG, WEBP, SVG or PDF files can be used.'); i.value = ''; return; } if (f.size > ((S.ch.maxMb || 10) * 1048576)) { alert('This file is larger than ' + (S.ch.maxMb || 10) + ' MB.'); i.value = ''; return; } f.__mime = mime; S.chFiles[i.dataset.jc] = f; draw(); }; });
        q('#jcSave').onclick = function () {
          var t = S.ch.teams.filter(function (x) { return x.team === S.chTeam; })[0], no = Number(q('#jcNo').value), keys = Object.keys(S.chFiles);
          function err(m) { S.chMsg = m; S.chBad = true; draw(); }
          if (!t) return err('Select the team.');
          if (!t.saved && (!S.chFiles.c1 || !S.chFiles.c2)) return err('Add both Choice 1 and Choice 2.');
          if (t.saved && !keys.length && !S.chNote.trim() && no === t.saved.order) return err('Nothing to change – add a file or choose a different number.');
          if (t.saved && !confirm('Update ' + title(t.team) + '?')) return;
          S.busy = true; S.chMsg = 'Uploading…'; S.chBad = false; draw();
          var ids = {}, chain = Promise.resolve();
          keys.forEach(function (s) { chain = chain.then(function () { var f = S.chFiles[s]; return b64(f).then(function (d) { return call('jerseyUpload', t.team, s, { name: f.name, mime: f.__mime, data: d }); }).then(function (r) { ids[s] = r.id; }); }); });
          chain.then(function () { return call('jerseySave', { team: t.team, c1: { id: ids.c1 || '' }, c2: { id: ids.c2 || '' }, logo: { id: ids.logo || '' }, no: no, note: S.chNote.trim() }); })
            .then(function (r) { S.chMsg = '✔ Saved: ' + title(t.team) + ' – No. ' + r.saved.order; S.chBad = false; S.chFiles = {}; S.chNote = ''; S.chTeam = ''; S.chNo = ''; return loadCh(); })
            .catch(function (e) { S.chMsg = e.message; S.chBad = true; })
            .then(function () { S.busy = false; draw(); });
        };
      }
    }
    if (S.loaded) draw(); else { S.loaded = true; draw(); reload(); }
  }
  window.FinJersey = { mount: mount, reset: function () { S = { fin: null, finErr: '', ch: null, chErr: '', file: null, team: '', note: '', msg: '', bad: false, busy: false, chFiles: {}, chTeam: '', chNo: '', chNote: '', chMsg: '', chBad: false, loaded: false }; } };
})();
