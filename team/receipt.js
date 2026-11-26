/* KNPL-7 payment receipt (A4, jsPDF). makeReceipt(info) -> Promise<jsPDF doc>
 * info = {p: payment, team: 'MADHURA MAVERICKS', owner: {id, name}, lines: draft lines (optional), base: '../' path to site root} */
(function () {
  const NAVY = [11, 26, 56], SAFF = [224, 122, 31], INK = [19, 33, 63], MUTED = [91, 103, 132], LINE = [217, 223, 236], OK = [31, 138, 91], SOFT = [243, 245, 250];
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(n) { return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : ''); }
  function three(n) { const h = Math.floor(n / 100), r = n % 100; return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
  function words(num) {
    let n = Math.floor(num), paise = Math.round((num - n) * 100), out = [];
    if (n === 0) out.push('Zero');
    const cr = Math.floor(n / 1e7); n %= 1e7; const lk = Math.floor(n / 1e5); n %= 1e5; const th = Math.floor(n / 1000); n %= 1000;
    if (cr) out.push(three(cr) + ' Crore'); if (lk) out.push(two(lk) + ' Lakh'); if (th) out.push(two(th) + ' Thousand'); if (n) out.push(three(n));
    return 'Rupees ' + out.join(' ') + (paise ? ' and ' + two(paise) + ' Paise' : '') + ' Only';
  }
  function inr(v) {
    const n = Number(v || 0), int = Math.floor(n), dec = Math.round((n - int) * 100);
    let s = String(int), last = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last = ',' + last;
    return 'Rs. ' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last + (dec ? '.' + String(dec).padStart(2, '0') : '.00');
  }
  const title = t => String(t || '').toLowerCase().replace(/\b[a-z]/g, m => m.toUpperCase()).replace(/\bOf\b/g, 'of');
  const slug = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function img(url) {
    return fetch(url).then(r => r.ok ? r.blob() : null).then(b => b && new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = () => res(null); f.readAsDataURL(b); })).catch(() => null);
  }
  async function makeReceipt(info) {
    const { jsPDF } = window.jspdf;
    const p = info.p, base = info.base || '../';
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 16;
    const [knpl, tlogo] = await Promise.all([img(base + 'team/a/knpl.png'), img(base + 'draft/logos/' + slug(title(info.team)) + '.png')]);
    // header
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, 44, 'F');
    doc.setFillColor(...SAFF); doc.rect(0, 44, W, 2.2, 'F');
    if (knpl) doc.addImage(knpl, 'PNG', M, 8, 28, 28);
    doc.setTextColor(255, 179, 102); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text('KERALA NAMBOODIRIS PREMIER LEAGUE', M + 34, 15, { charSpace: 0.6 });
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text('PAYMENT RECEIPT', M + 34, 25);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(201, 211, 234);
    doc.text('KNPL Season 7  ·  Making the Impossible a Reality', M + 34, 32);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text('RECEIPT NO.', W - M, 14, { align: 'right' });
    doc.setFontSize(13); doc.text(p.receiptNo || '-', W - M, 21, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(201, 211, 234);
    doc.text('Date: ' + (p.approvedOn || '').replace(/,.*$/, ''), W - M, 28, { align: 'right' });
    doc.text('Payment ID: ' + p.id, W - M, 34, { align: 'right' });
    // received from
    let y = 58;
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text('RECEIVED FROM', M, y);
    doc.text('TOWARDS', W / 2 + 4, y);
    doc.setTextColor(...INK); doc.setFontSize(13);
    const team = title(info.team);
    const tx = tlogo ? M + 17 : M;
    if (tlogo) doc.addImage(tlogo, 'PNG', M, y + 3, 14, 14);
    if (p.type === 'REPL' && p.replIn) {
      doc.text(p.replIn.name || ('KNPL7-' + p.replIn.id), tx, y + 8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
      doc.text('KNPL7-' + p.replIn.id + '  ·  season replacement player, ' + team, tx, y + 14, { maxWidth: W / 2 - tx - 2 });
    } else {
      doc.text(team, tx, y + 8, { maxWidth: W / 2 - tx - 2 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
      doc.text('Franchise owner: ' + (info.owner && info.owner.name ? info.owner.name + ' (KNPL7-' + info.owner.id + ')' : ''), tx, y + 14, { maxWidth: W / 2 - tx - 2 });
    }
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
    doc.text(doc.splitTextToSize(p.kind, W / 2 - M - 4), W / 2 + 4, y + 8);
    // table
    y = 88;
    doc.setFillColor(...NAVY); doc.roundedRect(M, y, W - 2 * M, 9, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', M + 4, y + 6); doc.text('AMOUNT', W - M - 4, y + 6, { align: 'right' });
    y += 9;
    let rows = [[p.kind, p.amount]];
    if (p.type === 'DRAFT' && info.lines && info.lines.length) {
      const sum = info.lines.reduce((a, l) => a + l.pay, 0);
      if (Math.abs(sum - p.amount) < 0.01) rows = info.lines.map(l => [(l.owner ? 'Owner – ' : 'Drafted – ') + l.name + ' (KNPL7-' + l.id + ', ' + l.cat + ', SR ' + l.sr + ')  ·  draft price ' + inr(l.price) + ' × ' + Math.round(l.share * 100) + '%', l.pay]);
    }
    if (p.type === 'REPL' && p.replOut) rows = [['Season replacement – 50% of the registration fee of ' + (p.replOut.name || '') + ' (KNPL7-' + p.replOut.id + '), replaced by ' + (p.replIn ? p.replIn.name + ' (KNPL7-' + p.replIn.id + ')' : ''), p.amount]];
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
    rows.forEach((r, i) => {
      const t = doc.splitTextToSize(r[0], W - 2 * M - 48), h = Math.max(10, t.length * 4.6 + 5);
      if (i % 2) { doc.setFillColor(...SOFT); doc.rect(M, y, W - 2 * M, h, 'F'); }
      doc.text(t, M + 4, y + 6.4); doc.text(inr(r[1]), W - M - 4, y + 6.4, { align: 'right' });
      y += h;
    });
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, y, W - M, y);
    y += 2;
    doc.setFillColor(...SOFT); doc.roundedRect(W / 2, y, W / 2 - M, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('TOTAL RECEIVED', W / 2 + 4, y + 7.8);
    doc.setFontSize(13); doc.text(inr(p.amount), W - M - 4, y + 8, { align: 'right' });
    y += 18;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize('Amount in words: ' + words(p.amount), W - 2 * M), M, y);
    // payment details
    y += 12;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.text('PAYMENT DETAILS', M, y);
    y += 3;
    const det = [['Mode', p.mode], ['Transaction ref.', p.utr || '-'], ['Date of payment', p.paidOn], ['Paid by', p.payer], ['Submitted on', p.at], ['Approved on', p.approvedOn]];
    doc.setDrawColor(...LINE); doc.roundedRect(M, y, W - 2 * M, 30, 2, 2, 'S');
    det.forEach((d, i) => {
      const cx = M + 5 + (i % 2) * ((W - 2 * M) / 2), cy = y + 8 + Math.floor(i / 2) * 9;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.text(d[0], cx, cy);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(String(d[1] || '-'), cx + 32, cy);
    });
    y += 38;
    if (p.type === 'REPL') {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize('As per Rule 10.2 of the KNPL-7 Mega Auction Rule Book, this Rs. 500 is collected from the season replacement player and paid by KNPL to the replaced player. It is not a charge to the team.', W - 2 * M), M, y);
      y += 12;
    }
    if (p.type === 'DRAFT') {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize('Year-1 draft fee: owner 100%; other drafted players 50% now, 25% in KNPL-8 and 25% in KNPL-9 (Rule Book 5.4).', W - 2 * M), M, y);
      y += 10;
    }
    // PAID stamp
    doc.setDrawColor(...OK); doc.setTextColor(...OK); doc.setLineWidth(1.1);
    doc.roundedRect(W - M - 46, y + 2, 44, 18, 3, 3, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('PAID', W - M - 24, y + 11.5, { align: 'center' });
    doc.setFontSize(7.5); doc.text('VERIFIED BY KNPL COMMITTEE', W - M - 24, y + 17, { align: 'center' });
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Team KNPL', M, y + 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text('KNPL Core Committee', M, y + 15);
    // footer
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 270, W - M, 270);
    doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('This is a computer-generated receipt issued after verification of the payment by the KNPL committee. No signature is required.', W / 2, 276, { align: 'center' });
    doc.text('Queries: Team KNPL  ·  Krishnadas – 99862 18725  ·  knplseason7.github.io/knpl7/team', W / 2, 281, { align: 'center' });
    doc.setFillColor(...NAVY); doc.rect(0, 289, W, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7.5);
    doc.text('KNPL-7  ·  11–14 February 2027  ·  FISAT & Boundary Grounds, Angamaly', W / 2, 294, { align: 'center' });
    return doc;
  }
  window.KNPLReceipt = { makeReceipt, inr, words, fileName: (p, team) => p.receiptNo + ' ' + title(team).replace(/[^A-Za-z0-9 ]/g, '') + ' ' + ({ OWN: 'Ownership Fee', DRAFT: 'Draft Fee', REPL: 'Season Replacement' }[p.type] || 'Payment') + '.pdf' };
})();
