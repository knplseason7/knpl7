/* Shared helpers for the KNPL-7 Team Desk pages. */
const API_URL = 'https://script.google.com/macros/s/AKfycbxX7MQ9VkfZo7USkdxQzldaOVKIkE8hFiwe-xZsJl_ynAKcGBu8wRX6OmwMBTb22ARg/exec';
const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const slug = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const title = t => String(t || '').toLowerCase().replace(/\b[a-z]/g, m => m.toUpperCase()).replace(/\bOf\b/g, 'of');
const inr = v => '₹' + Number(v || 0).toLocaleString('en-IN', {maximumFractionDigits: 2});
let LANG = 'en';
try { LANG = localStorage.getItem('knpl_tdl') || 'en'; } catch (e) {}
const ML_MONTHS = ['ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dmy(iso) { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return String(iso || ''); return Number(m[3]) + ' ' + (LANG === 'ml' ? ML_MONTHS : EN_MONTHS)[Number(m[2]) - 1] + ' ' + m[1]; }
/* t(key, vars) – text in the current language. TX is defined by each page. */
function t(k, v) { const e = (window.TX || {})[k]; let s = e ? (e[LANG === 'ml' ? 1 : 0] || e[0]) : k; if (v) Object.keys(v).forEach(n => { s = s.split('{' + n + '}').join(v[n]); }); return s; }
function applyStatic() {
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll('[data-th]').forEach(n => { n.innerHTML = t(n.dataset.th); });
  document.querySelectorAll('[data-tp]').forEach(n => { n.placeholder = t(n.dataset.tp); });
  document.body.classList.toggle('ml', LANG === 'ml');
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === LANG));
}
function setLang(l, rerender) { LANG = l; try { localStorage.setItem('knpl_tdl', l); } catch (e) {} applyStatic(); if (rerender) rerender(); }
/* Server messages come as "English\nMalayalam". */
function msgOf(e) { const s = String((e && e.message) || e || ''); const p = s.split('\n'); return p.length > 1 ? (LANG === 'ml' ? p[1] : p[0]) : s; }
async function api(fn, ...args) {
  let r;
  try { r = await fetch(API_URL, {method: 'POST', body: JSON.stringify({fn, args}), redirect: 'follow'}); }
  catch (_) { throw new Error('Could not reach the KNPL server. Check your internet connection and try again.\nKNPL സെർവറുമായി ബന്ധിപ്പിക്കാനായില്ല. ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.'); }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Request failed.');
  return j.result;
}
/* Compress images in the browser before upload (max 1600 px, JPEG). PDFs are sent as they are. */
async function compressFile(file, maxMb) {
  const toB64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = () => rej(new Error('read')); fr.readAsDataURL(blob); });
  if (file.type === 'application/pdf') {
    if (file.size > maxMb * 1048576) throw new Error('The PDF is larger than ' + maxMb + ' MB. Upload a screenshot (JPG / PNG) instead.\nPDF ' + maxMb + ' MB-ൽ കൂടുതലാണ്. പകരം Screenshot (JPG / PNG) Upload ചെയ്യുക.');
    return {name: file.name, mime: file.type, data: await toB64(file), size: file.size};
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Upload a JPG, PNG, WEBP image or a PDF.\nJPG, PNG, WEBP ചിത്രം അല്ലെങ്കിൽ PDF Upload ചെയ്യുക.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('The image could not be opened.\nചിത്രം തുറക്കാനായില്ല.')); i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.75));
    const use = blob && blob.size < file.size ? blob : file;
    if (use.size > maxMb * 1048576) throw new Error('The file is too large.\nFile വളരെ വലുതാണ്.');
    return {name: file.name.replace(/\.\w+$/, '') + (use === blob ? '.jpg' : ''), mime: use === blob ? 'image/jpeg' : file.type, data: await toB64(use), size: use.size};
  } finally { URL.revokeObjectURL(url); }
}
