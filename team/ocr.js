/* KNPL-7 Team Desk – read a payment receipt in the browser and pick out the transaction number, amount and date.
 * Images: Tesseract.js (loaded only when needed). PDFs: pdf.js text, or the first page rendered and read.
 * window.KNPLOCR.read(file) -> {ok, text, utr, amount, date, mode}  (ok=false when the reader could not run) */
(function () {
  const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFW = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const loaded = {};
  function load(src) {
    if (!loaded[src]) loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
    return loaded[src];
  }
  let worker = null;
  async function ocrCanvas(src) {
    await load(TESS);
    if (!worker) worker = await window.Tesseract.createWorker('eng');
    const r = await worker.recognize(src);
    return r.data.text || '';
  }
  async function imageSource(file) {
    // upscale small screenshots a little, which helps the reader
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.max(1, Math.min(2, 1400 / Math.max(img.naturalWidth, img.naturalHeight)));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      return c;
    } finally { URL.revokeObjectURL(url); }
  }
  async function pdfText(file) {
    await load(PDFJS);
    const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = PDFW;
    const pdf = await lib.getDocument({data: await file.arrayBuffer()}).promise;
    const page = await pdf.getPage(1);
    const tc = await page.getTextContent();
    let text = tc.items.map(i => i.str + (i.hasEOL ? '\n' : ' ')).join('');
    if (text.replace(/\s/g, '').length < 20) {           // scanned PDF – render and read
      const vp = page.getViewport({scale: 2}), c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      await page.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
      text = await ocrCanvas(c);
    }
    return text;
  }
  const MON = {jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12};
  const iso = (y, m, d) => { y = Number(y); if (y < 100) y += 2000; m = Number(m); d = Number(d); if (!(y > 2020 && y < 2035 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return ''; return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); };
  /* Pure text parser (also used in tests). */
  function parse(raw) {
    const text = String(raw || '').replace(/[|]/g, ' ').replace(/[ \t]+/g, ' ');
    const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean);
    const out = {utr: '', amount: null, date: '', mode: ''};
    // 1. transaction number – labelled first, then any 12-digit UPI reference
    const strong = /(utr|u\.?t\.?r|upi\s*ref(?:erence)?(?:\s*(?:no|number|id))?|rrn|upi\s*transaction\s*id|bank\s*ref(?:erence)?(?:\s*no)?|imps\s*ref|neft\s*ref)/i;
    const weak = /(transaction\s*(?:id|no|number|ref)|txn\s*(?:id|no)|ref(?:erence)?\.?\s*(?:no|number|id))/i;
    const tok = s => { const m = String(s).match(/[A-Z0-9][A-Z0-9 \-]{6,40}[A-Z0-9]/i); if (!m) return ''; const t = m[0].replace(/[\s\-]/g, ''); return /\d{6,}/.test(t) && t.length >= 8 && t.length <= 35 ? t.toUpperCase() : ''; };
    [strong, weak].forEach(label => {
      for (let i = 0; i < lines.length && !out.utr; i++) {
        const L = lines[i], m = L.match(label);
        if (!m) continue;
        const after = L.slice(m.index + m[0].length).replace(/^[\s:#.\-\/A-Za-z]*?(?=[A-Z0-9]*\d)/, '').replace(/^[\s:#.\-]+/, '');
        out.utr = tok(after) || (lines[i + 1] ? tok(lines[i + 1]) : '');
      }
    });
    if (!out.utr) { const m = text.match(/(?<!\d)(\d{4}\s?\d{4}\s?\d{4})(?!\d)/); if (m) out.utr = m[1].replace(/\s/g, ''); }
    // 2. amount
    const am = text.match(/(?:₹|rs\.?|inr|amount(?:\s*paid)?\s*:?)\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,7})(?:\.(\d{1,2}))?/i);
    if (am) out.amount = Number(am[1].replace(/,/g, '') + (am[2] ? '.' + am[2] : ''));
    if (out.amount == null) { const l = lines.find(x => /^\W{0,3}\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?$/.test(x)); if (l) out.amount = Number(l.replace(/[^\d.]/g, '')); }
    // 3. date
    let d = text.match(/\b(\d{1,2})[\s\-\/.]*(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*[\s,\-\/.]*(\d{2,4})\b/i);
    if (d) out.date = iso(d[3], MON[d[2].toLowerCase()], d[1]);
    if (!out.date) { d = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i); if (d) out.date = iso(d[3], MON[d[1].toLowerCase()], d[2]); }
    if (!out.date) { d = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/); if (d) out.date = iso(d[3], d[2], d[1]); }
    if (!out.date) { d = text.match(/\b(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/); if (d) out.date = iso(d[1], d[2], d[3]); }
    // 4. mode
    if (/\b(neft|imps|rtgs)\b/i.test(text)) out.mode = 'Bank transfer';
    else if (/\bupi\b/i.test(text) || /^\d{12}$/.test(out.utr)) out.mode = 'UPI';
    return out;
  }
  async function read(file) {
    try {
      const text = file.type === 'application/pdf' ? await pdfText(file) : await ocrCanvas(await imageSource(file));
      return Object.assign({ok: true, text: text}, parse(text));
    } catch (e) { return {ok: false, error: String(e && e.message || e)}; }
  }
  window.KNPLOCR = {read: read, parse: parse};
})();
