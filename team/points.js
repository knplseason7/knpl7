/* KNPL-7 Team Desk – "Points & SR" tab: every team's balance points and balance Skill Rating (from a/standings.json). */
(function () {
  const PX = {
    title: ['Points & Skill Rating – all 16 teams', 'പോയിന്റ് & Skill Rating – 16 ടീമുകളും'],
    stage: ['After the draft (frozen 27 Nov 2026) – before the Mega Auction on 12 Dec.', 'ഡ്രാഫ്റ്റിന് ശേഷം (27 നവംബർ 2026-ന് ഫ്രീസ് ചെയ്തു) – 12 ഡിസംബർ Mega Auction-ന് മുമ്പ്.'],
    yours: ['Your team', 'നിങ്ങളുടെ ടീം'],
    balPts: ['Balance points', 'ബാക്കി പോയിന്റ്'], balSr: ['Balance Skill Rating', 'ബാക്കി Skill Rating'],
    places: ['Places to fill', 'നിറയ്ക്കാനുള്ള സ്ഥാനങ്ങൾ'], maxBid: ['Highest bid now', 'ഇപ്പോൾ പരമാവധി bid'], maxSr: ['Highest SR you can buy now', 'ഇപ്പോൾ വാങ്ങാവുന്ന പരമാവധി SR'],
    of: ['of', '/'], used: ['used', 'ഉപയോഗിച്ചു'],
    squad: ['Your squad so far', 'ഇതുവരെയുള്ള squad'],
    owner: ['Owner', 'ഉടമ'], drafted: ['Drafted', 'Drafted'],
    allTitle: ['All teams – sorted by balance points', 'എല്ലാ ടീമുകളും – ബാക്കി പോയിന്റ് ക്രമത്തിൽ'],
    hTeam: ['Team', 'ടീം'], hPl: ['Players', 'കളിക്കാർ'], hPu: ['Points used', 'ഉപയോഗിച്ച പോയിന്റ്'], hPb: ['Balance points', 'ബാക്കി പോയിന്റ്'],
    hSu: ['SR used', 'ഉപയോഗിച്ച SR'], hSb: ['Balance SR', 'ബാക്കി SR'], hMb: ['Highest bid now', 'പരമാവധി bid'], hMs: ['Highest SR now', 'പരമാവധി SR'],
    youTag: ['YOU', 'നിങ്ങൾ'],
    how: ['How these are worked out', 'എങ്ങനെ കണക്കാക്കുന്നു'],
    h1: ['Purse 1,00,000 points and squad Skill Rating cap 560 for every team. Owner and drafted players are already counted.', 'ഓരോ ടീമിനും 1,00,000 പോയിന്റ് purse, squad Skill Rating cap 560. ഉടമയും draft ചെയ്ത കളിക്കാരും ഇതിൽ ഉൾപ്പെട്ടിട്ടുണ്ട്.'],
    h2: ['Highest bid now = balance points − {r} × (places still empty after this player). Rule 6.3.', 'പരമാവധി bid = ബാക്കി പോയിന്റ് − {r} × (ഈ കളിക്കാരന് ശേഷം ബാക്കിയുള്ള സ്ഥാനങ്ങൾ). Rule 6.3.'],
    h3: ['Highest SR now = balance SR − {s} × (places still empty after this player). {s} = average Skill Rating of the Rising Star Core players still available, rounded up. Rule 6.4.', 'പരമാവധി SR = ബാക്കി SR − {s} × (ഈ കളിക്കാരന് ശേഷം ബാക്കിയുള്ള സ്ഥാനങ്ങൾ). {s} = ലഭ്യമായ Rising Star Core കളിക്കാരുടെ ശരാശരി Skill Rating (മുകളിലേക്ക് round). Rule 6.4.'],
    h4: ['During the auction these change after every sale – the auction screen shows the live figures.', 'ലേലത്തിൽ ഓരോ വിൽപ്പനയ്ക്കും ശേഷം ഇവ മാറും – ലേല സ്ക്രീനിൽ തത്സമയം കാണാം.'],
    err: ['Could not load the figures. Please refresh.', 'കണക്കുകൾ ലഭിച്ചില്ല. Refresh ചെയ്യുക.']
  };
  const L = () => (typeof LANG !== 'undefined' && LANG === 'ml') ? 1 : 0;
  const tx = (k, v) => { let s = PX[k][L()]; if (v) Object.keys(v).forEach(x => s = s.split('{' + x + '}').join(v[x])); return s; };
  const nf = n => Number(n).toLocaleString('en-IN');
  const cap = s => String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\bOf\b/g, 'of');
  const slug = s => String(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const CC = {'Conqueror Vanguard': '#c2410c', 'Conqueror Core': '#ea580c', 'Dominator Apex': '#0f766e', 'Dominator Core': '#14918a', 'Rising Star Elite': '#4f46e5', 'Rising Star Core': '#7c74f0'};
  let D = null, busy = null;
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').replace(/H/g, '').replace(/D/g, 'T');
  function calc(t) {
    const left = D.squad - t.players.length, pb = D.purse - t.ptsUsed, sb = D.srCap - t.srUsed, after = Math.max(0, left - 1);
    return {left, pb, sb, mb: left ? pb - D.ptsReservePerPlace * after : 0, ms: left ? sb - D.srReservePerPlace * after : 0};
  }
  function logo(team, cls) { const i = E('img', cls); i.alt = ''; i.src = '../draft/logos/' + slug(team) + '.png'; i.onerror = () => i.style.visibility = 'hidden'; return i; }
  function paint() {
    const box = document.getElementById('ptsbox'); if (!box) return;
    box.replaceChildren();
    if (!D) { box.append(E('p', 'muted', '…')); return; }
    const me = (typeof S !== 'undefined' && S && S.team) ? norm(S.team) : '';
    const rows = D.teams.map(t => Object.assign({t}, calc(t))).sort((a, b) => b.pb - a.pb || b.sb - a.sb || a.t.team.localeCompare(b.t.team));
    const mine = rows.find(r => norm(r.t.team) === me);
    const head = E('div', 'card');
    head.append(E('h2', null, tx('title')), E('p', 'small muted', tx('stage')));
    box.append(head);
    if (mine) {
      const c = E('div', 'card ptsme');
      const top = E('div', 'ptsmehd'); top.append(logo(mine.t.team, 'ptslg'), E('div', null)); top.lastChild.append(E('div', 'ptskick', tx('yours')), E('b', null, cap(mine.t.team)));
      const grid = E('div', 'ptsgrid');
      const tile = (k, v, sub, hot) => { const d = E('div', 'ptstile' + (hot ? ' hot' : '')); d.append(E('span', null, tx(k)), E('b', null, v)); if (sub) d.append(E('small', null, sub)); return d; };
      grid.append(tile('balPts', nf(mine.pb), nf(mine.t.ptsUsed) + ' ' + tx('used') + ' · ' + tx('of') + ' ' + nf(D.purse), 1),
        tile('balSr', nf(mine.sb), mine.t.srUsed + ' ' + tx('used') + ' · ' + tx('of') + ' ' + D.srCap, 1),
        tile('places', String(mine.left), mine.t.players.length + ' / ' + D.squad),
        tile('maxBid', nf(mine.mb)), tile('maxSr', String(mine.ms)));
      const sq = E('div', 'ptssq'); sq.append(E('div', 'ptskick', tx('squad')));
      mine.t.players.forEach(p => { const r = E('div', 'ptspl'); const n = E('span', null, cap(p.n)); n.prepend(E('i', 'ptsrole', p.role === 'Owner' ? tx('owner') : tx('drafted')));
        const cg = E('em', null, p.c); cg.style.setProperty('--k', CC[p.c] || '#64748b'); r.append(n, cg, E('span', 'ptsnum', 'SR ' + p.sr), E('span', 'ptsnum', nf(p.pt) + ' pts')); sq.append(r); });
      c.append(top, grid, sq); box.append(c);
    }
    const tc = E('div', 'card'); tc.append(E('h3', null, tx('allTitle')));
    const wrap = E('div', 'ptswrap'), tb = E('table', 'ptstab'), th = E('tr');
    ['#', 'hTeam', 'hPl', 'hPu', 'hPb', 'hSu', 'hSb', 'hMb', 'hMs'].forEach((k, i) => th.append(E('th', i > 1 ? 'n' : '', k === '#' ? '#' : tx(k))));
    tb.append(th);
    rows.forEach((r, i) => {
      const tr = E('tr', norm(r.t.team) === me ? 'me' : ''), nm = E('td', 'tm');
      nm.append(logo(r.t.team, 'ptsmini'), E('span', null, cap(r.t.team))); if (norm(r.t.team) === me) nm.append(E('i', 'ptsyou', tx('youTag')));
      tr.append(E('td', 'rk', String(i + 1)), nm, E('td', 'n', r.t.players.length + '/' + D.squad), E('td', 'n', nf(r.t.ptsUsed)), E('td', 'n b', nf(r.pb)), E('td', 'n', String(r.t.srUsed)), E('td', 'n b', String(r.sb)), E('td', 'n', nf(r.mb)), E('td', 'n', String(r.ms)));
      tb.append(tr);
    });
    wrap.append(tb); tc.append(wrap); box.append(tc);
    const how = E('div', 'card'); how.append(E('h3', null, tx('how')));
    const ul = E('ul', 'small ptshow'); [tx('h1'), tx('h2', {r: nf(D.ptsReservePerPlace)}), tx('h3', {s: D.srReservePerPlace}), tx('h4')].forEach(s => ul.append(E('li', null, s)));
    how.append(ul); box.append(how);
    const tr = box.querySelector('tr.me'); if (tr && innerWidth < 700) setTimeout(() => tr.scrollIntoView({block: 'nearest', inline: 'nearest'}), 50);
  }
  window.paintPts = async function () {
    if (!D) {
      if (!busy) busy = fetch('a/standings.json?v=' + Date.now(), {cache: 'no-store'}).then(r => r.json()).then(j => { D = j; }).catch(() => { busy = null; });
      paint(); await busy;
      if (!D) { const b = document.getElementById('ptsbox'); if (b) b.replaceChildren(E('p', 'msg err', tx('err'))); return; }
    }
    paint();
  };
})();
