/* Team Desk – mobile tab bar: one swipeable row, active tab kept in view, and a "find a tab" sheet listing every tab. */
(function () {
  const tabs = document.querySelector('.tabs'); if (!tabs) return;
  const D = {
    live: ['Watch the Mega Auction live', 'Mega Auction തത്സമയം'],
    pay: ['Fees due, upload receipts, download receipts', 'അടയ്ക്കാനുള്ളവ, receipt upload & download'],
    pts: ['Balance points & Skill Rating of every team', 'എല്ലാ ടീമുകളുടെയും ബാക്കി പോയിന്റ് & SR'],
    pool: ['200 players for the auction + PDF planner', 'ലേലത്തിലെ 200 കളിക്കാർ + PDF planner'],
    fix: ['Fixtures and points table', 'മത്സരങ്ങളും points table-ഉം'],
    jer: ['Approved design and players\' jersey details', 'Approved design, കളിക്കാരുടെ jersey വിവരങ്ങൾ'],
    rep: ['Season replacement request (from 25 Jan)', 'Season replacement (25 ജനു. മുതൽ)'],
    spo: ['Your sponsorship target, link and leaderboard', 'Sponsorship ലക്ഷ്യം, link, leaderboard'],
    food: ['Food arrangement for match days', 'മത്സര ദിവസങ്ങളിലെ ഭക്ഷണം'],
    help: ['Who to call for each topic', 'ഓരോ വിഷയത്തിനും ബന്ധപ്പെടേണ്ടവർ']
  };
  const T = {all: ['All tabs', 'എല്ലാ ടാബും'], find: ['Find a tab…', 'ടാബ് തിരയുക…'], close: ['Close', 'അടയ്ക്കുക']};
  const L = () => (typeof LANG !== 'undefined' && LANG === 'ml') ? 1 : 0;
  const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const bar = E('div', 'tabnav'); tabs.parentNode.insertBefore(bar, tabs); bar.append(tabs);
  const more = E('button', 'tabmore'); more.type = 'button'; more.setAttribute('aria-label', 'All tabs');
  more.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>';
  bar.append(more);
  const edge = () => { bar.classList.toggle('atstart', tabs.scrollLeft < 6); bar.classList.toggle('atend', tabs.scrollLeft + tabs.clientWidth > tabs.scrollWidth - 6); };
  tabs.addEventListener('scroll', edge, {passive: true}); addEventListener('resize', edge);
  const centre = () => { const b = tabs.querySelector('[aria-selected=true]'); if (b && getComputedStyle(tabs).overflowX === 'auto') tabs.scrollTo({left: b.offsetLeft - (tabs.clientWidth - b.offsetWidth) / 2, behavior: 'smooth'}); setTimeout(edge, 350); };
  new MutationObserver(centre).observe(tabs, {subtree: true, attributes: true, attributeFilter: ['aria-selected']});
  let sheet = null;
  function open() {
    if (sheet) sheet.remove();
    sheet = E('div', 'tabsheet'); const pane = E('div', 'tabpane');
    const hd = E('div', 'tabsheethd'); hd.append(E('b', null, T.all[L()])); const x = E('button', 'tabx', '✕'); x.type = 'button'; x.setAttribute('aria-label', T.close[L()]); hd.append(x);
    const q = E('input', 'tabfind'); q.placeholder = T.find[L()]; q.type = 'search';
    const list = E('div', 'tablist');
    tabs.querySelectorAll('button[role=tab]').forEach(b => {
      const k = b.id.replace('tb-', ''); const it = E('button', 'tabitem' + (b.getAttribute('aria-selected') === 'true' ? ' on' : '')); it.type = 'button'; it.dataset.k = k;
      const nm = b.textContent.trim(), ds = D[k] ? D[k][L()] : '';
      it.append(E('span', 'tic ic-' + k), E('span', 'ttx')); it.lastChild.append(E('b', null, nm), E('small', null, ds));
      it.dataset.s = (nm + ' ' + ds + ' ' + (D[k] ? D[k].join(' ') : '')).toLowerCase();
      it.onclick = () => { close(); b.click(); window.scrollTo({top: 0, behavior: 'smooth'}); };
      list.append(it);
    });
    q.oninput = () => { const v = q.value.trim().toLowerCase(); list.querySelectorAll('.tabitem').forEach(i => i.hidden = !!v && !i.dataset.s.includes(v)); };
    pane.append(hd, q, list); sheet.append(pane); document.body.append(sheet);
    sheet.onclick = e => { if (e.target === sheet) close(); }; x.onclick = close;
    requestAnimationFrame(() => sheet.classList.add('in'));
  }
  function close() { if (!sheet) return; const s = sheet; sheet = null; s.classList.remove('in'); setTimeout(() => s.remove(), 200); }
  more.onclick = open; document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  setTimeout(() => { centre(); edge(); }, 300);
})();
