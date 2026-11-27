/* KNPL-7 Team Desk – "Auction Pool" tab: the 200 players left for the Mega Auction, by category, Skill Rating highest first,
   with a team-specific fillable PDF planner (a/pool/<team>.pdf). */
(function () {
  const AX = {
    title: ['Auction Pool – 200 players', 'Auction Pool – 200 കളിക്കാർ'],
    intro: ['Players still available for the Mega Auction on 12 Dec 2026, after the draft. Grouped by category, Skill Rating highest first – the order they will be called.', '12 ഡിസംബർ Mega Auction-ൽ ലഭ്യമായ കളിക്കാർ (ഡ്രാഫ്റ്റിന് ശേഷം). Category തിരിച്ച്, Skill Rating കൂടിയവർ ആദ്യം – വിളിക്കുന്ന ക്രമത്തിൽ.'],
    dl: ['⬇ Download PDF planner', '⬇ PDF Planner ഡൗൺലോഡ്'],
    dlNote: ['Your team\'s PDF has your balance points and Skill Rating on top, and a box against every player to type (or write) the highest points you will bid, plus notes. Open it in a PDF app (Adobe Acrobat / Drive) to type and save.', 'നിങ്ങളുടെ ടീമിന്റെ PDF-ൽ ബാക്കി പോയിന്റും Skill Rating-ഉം മുകളിൽ ഉണ്ട്; ഓരോ കളിക്കാരനും നിങ്ങൾ bid ചെയ്യുന്ന പരമാവധി പോയിന്റ് എഴുതാൻ box-ഉം Notes-ഉം. Type ചെയ്ത് save ചെയ്യാൻ PDF app-ൽ (Adobe Acrobat / Drive) തുറക്കുക, അല്ലെങ്കിൽ print ചെയ്ത് എഴുതാം.'],
    search: ['Search name, Reg ID or district…', 'പേര്, Reg ID അല്ലെങ്കിൽ ജില്ല…'],
    all: ['All', 'എല്ലാം'], players: ['players', 'കളിക്കാർ'], base: ['Base point', 'Base Point'],
    allDays: ['All 4 days', '4 ദിവസവും'], none: ['No player matches.', 'ആരെയും കണ്ടെത്തിയില്ല.'],
    conf: ['Keep your planner private – it is for your team only.', 'Planner രഹസ്യമായി സൂക്ഷിക്കുക – ഇത് നിങ്ങളുടെ ടീമിന് മാത്രം.'],
    err: ['Could not load the pool. Please refresh.', 'Pool ലഭിച്ചില്ല. Refresh ചെയ്യുക.']
  };
  const L = () => (typeof LANG !== 'undefined' && LANG === 'ml') ? 1 : 0;
  const tx = k => AX[k][L()];
  const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const cap = s => String(s || '').split(' ').map(w => w.length > 2 ? w.charAt(0) + w.slice(1).toLowerCase() : w).join(' ');
  const slug = s => String(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  const nf = n => Number(n).toLocaleString('en-IN');
  let D = null, busy = null, cat = '', q = '';
  function list() {
    const box = document.getElementById('apList'); box.replaceChildren(); let shown = 0;
    D.groups.forEach(g => {
      if (cat && cat !== g.c) return;
      const ps = g.players.filter(p => !q || (p.n + ' ' + p.id + ' knpl7-' + p.id + ' ' + p.d).toLowerCase().includes(q));
      if (!ps.length) return;
      const sec = E('section', 'apgrp'); sec.style.setProperty('--k', g.col);
      const hd = E('div', 'aphd'); hd.append(E('b', null, g.c), E('span', null, g.players.length + ' ' + tx('players') + ' · ' + tx('base') + ' ' + nf(g.bp)));
      sec.append(hd, E('p', 'apnote', g.note));
      ps.forEach(p => {
        const r = E('div', 'aprow'), im = E('img'); im.loading = 'lazy'; im.alt = ''; im.src = '../pool/f/' + p.id + '.jpg'; im.onerror = () => im.style.visibility = 'hidden';
        const nm = E('div', 'apnm'); nm.append(E('b', null, cap(p.n)), E('small', null, 'KNPL7-' + p.id + ' · ' + p.d));
        const av = E('span', 'apav' + (p.av === 'All 4 days' ? '' : ' part'), p.av === 'All 4 days' ? tx('allDays') : p.av);
        r.append(E('span', 'aprk', String(g.players.indexOf(p) + 1)), im, nm, av, E('span', 'apsr', String(p.sr)));
        sec.append(r); shown++;
      });
      box.append(sec);
    });
    if (!shown) box.append(E('p', 'muted', tx('none')));
  }
  function paint() {
    const root = document.getElementById('apbox'); if (!root) return; root.replaceChildren();
    if (!D) { root.append(E('p', 'muted', '…')); return; }
    const team = (typeof S !== 'undefined' && S && S.team) ? S.team : '';
    const c = E('div', 'card');
    c.append(E('h2', null, tx('title')), E('p', 'small muted', tx('intro')));
    const a = E('a', 'btn or', tx('dl')); a.href = 'a/pool/' + (team ? slug(team) : 'all-teams') + '.pdf?v=1'; a.target = '_blank'; a.rel = 'noopener';
    a.download = 'KNPL7-Auction-Pool-Planner' + (team ? '-' + cap(team).replace(/\s+/g, '-') : '') + '.pdf';
    c.append(a, E('p', 'small', tx('dlNote')), E('p', 'small muted', tx('conf')));
    root.append(c);
    const t = E('div', 'card');
    const chips = E('div', 'apchips');
    [['', tx('all') + ' · 200']].concat(D.groups.map(g => [g.c, g.c + ' · ' + g.players.length])).forEach(([k, lab]) => {
      const b = E('button', 'apchip' + (cat === k ? ' on' : ''), lab); b.type = 'button';
      const g = D.groups.find(x => x.c === k); if (g) b.style.setProperty('--k', g.col);
      b.onclick = () => { cat = k; chips.querySelectorAll('.apchip').forEach(x => x.classList.toggle('on', x === b)); list(); }; chips.append(b);
    });
    const s = E('input', 'apq'); s.placeholder = tx('search'); s.value = q; s.oninput = () => { q = s.value.trim().toLowerCase(); list(); };
    t.append(chips, s, E('div', null)); t.lastChild.id = 'apList'; root.append(t);
    list();
  }
  window.paintPool = async function () {
    if (!D) {
      if (!busy) busy = fetch('a/auction-pool.json?v=1', {cache: 'no-cache'}).then(r => r.json()).then(j => { D = j; }).catch(() => { busy = null; });
      paint(); await busy;
      if (!D) { const b = document.getElementById('apbox'); if (b) b.replaceChildren(E('p', 'msg err', tx('err'))); return; }
    }
    paint();
  };
})();
