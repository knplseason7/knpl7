/* KNPL-7 Finance Desk API on Cloudflare Workers.
 * The SAME business rules (core.js = finance/fin-core.js) run inside one Durable Object that keeps every table in SQLite.
 * Reads/writes are local and take milliseconds. The few things that live outside (Google Drive file saving, the Team Desk
 * links, the registration / sponsorship register sheets) go through the existing Apps Script web app ("bridge").
 * Because the core is synchronous, an outside call is done by running the request, noticing it needs the call, doing it,
 * and running the request again with the answer (the first run is rolled back, so nothing is applied twice). */
import { DurableObject } from 'cloudflare:workers';
import FinCore from './core.js';
export { FoodDO } from './food.js';

const SYNC_GAP_MS = 120000;
const BRIDGE_FNS = { saveFile: 1, fetchSources: 1, teamDeskDecide: 1, sponsorDecide: 1, regList: 1, teamDesk: 1, jersey: 1 };

class NeedExternal extends Error { constructor(name, args) { super('external:' + name); this.need = true; this.ext = name; this.extArgs = args; } }
function userError(msg, code) { const e = new Error(msg); e.user = true; if (code) e.code = code; return e; }

function cors(env, req) {
  const o = req.headers.get('Origin') || '';
  const ok = o === env.ALLOWED_ORIGIN || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  return { 'Access-Control-Allow-Origin': ok ? o : env.ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
function reply(env, req, obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors(env, req)) }); }

export default {
  async scheduled(event, env, ctx) {                                                      // every minute: Food meal timer
    ctx.waitUntil(env.FOOD.get(env.FOOD.idFromName('main'), { locationHint: 'apac' }).tick());
  },
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, req) });
    if (req.method === 'GET') return reply(env, req, { ok: true, result: { service: 'KNPL-7 Finance Desk', version: FinCore.VERSION, backend: 'cloudflare' } });
    if (req.method !== 'POST') return reply(env, req, { ok: false, error: 'Bad request.' }, 405);
    let text; try { text = await req.text(); } catch (e) { return reply(env, req, { ok: false, error: 'Bad request.' }, 400); }
    let body; try { body = JSON.parse(text || '{}'); } catch (e) { return reply(env, req, { ok: false, error: 'Bad request.' }); }
    if (new URL(req.url).pathname.replace(/\/+$/, '') === '/food') {                      // Food Arrangement (same Worker, its own Durable Object)
      const f = env.FOOD.get(env.FOOD.idFromName('main'), { locationHint: 'apac' });
      return reply(env, req, await f.run({ fn: String(body.fn || ''), args: body.args, adminSecret: req.headers.get('X-Admin-Secret') || String(body.adminSecret || '') }));
    }
    const fn = String(body.fn || '');
    if (fn === 'ping') return reply(env, req, { ok: true, result: { ok: true, version: FinCore.VERSION } });
    const stub = env.FIN.get(env.FIN.idFromName('main'), { locationHint: 'apac' });
    const res = await stub.run({ fn, args: Array.isArray(body.args) ? body.args : [], adminSecret: req.headers.get('X-Admin-Secret') || String(body.adminSecret || '') });
    return reply(env, req, res);
  }
};

export class FinanceDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS rows (tbl TEXT NOT NULL, pos INTEGER NOT NULL, json TEXT NOT NULL, PRIMARY KEY (tbl, pos))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, exp INTEGER NOT NULL)');
  }

  /* ------------------------------------------------------------ storage (synchronous SQLite) */
  makeStore() {
    const sql = this.sql, snap = {};
    const load = (name) => { if (!snap[name]) snap[name] = sql.exec('SELECT json FROM rows WHERE tbl = ? ORDER BY pos', name).toArray().map((r) => r.json); return snap[name]; };
    return {
      get(name) { return load(name).map((j) => JSON.parse(j)); },
      put(name, rows) {
        const old = load(name), next = rows.map((r) => JSON.stringify(r));
        for (let i = 0; i < next.length; i++) if (old[i] !== next[i]) sql.exec('INSERT OR REPLACE INTO rows (tbl, pos, json) VALUES (?, ?, ?)', name, i, next[i]);
        if (old.length > next.length) sql.exec('DELETE FROM rows WHERE tbl = ? AND pos >= ?', name, next.length);
        snap[name] = next;
      }
    };
  }
  makeCache() {
    const sql = this.sql;
    return {
      get: (k) => { const r = sql.exec('SELECT v, exp FROM kv WHERE k = ?', k).toArray()[0]; return r && r.exp > Date.now() ? r.v : null; },
      put: (k, v, sec) => { sql.exec('INSERT OR REPLACE INTO kv (k, v, exp) VALUES (?, ?, ?)', k, String(v), Date.now() + Math.min(21600, sec || 600) * 1000); },
      remove: (k) => { sql.exec('DELETE FROM kv WHERE k = ?', k); }
    };
  }
  makeCtx(results) {
    let n = 0;
    const ext = (name) => (...args) => {
      const i = n++;
      if (i < results.length) { const r = results[i]; if (r.ok) return r.value; throw userError(r.error); }
      throw new NeedExternal(name, args);
    };
    return {
      now: new Date(), cache: this.makeCache(), uuid: () => crypto.randomUUID(),
      saveFile: ext('saveFile'), fetchSources: ext('fetchSources'), teamDeskDecide: ext('teamDeskDecide'), sponsorDecide: ext('sponsorDecide'),
      regList: ext('regList'), teamDesk: ext('teamDesk'), jersey: ext('jersey'),
      teamDeskAdminPin: this.env.TEAMDESK_ADMIN_PIN_SET === '1'
    };
  }

  /* ------------------------------------------------------------ the bridge to the existing Apps Script */
  async bridge(name, args) {
    if (!BRIDGE_FNS[name] && name !== 'exportAll') throw userError('Unknown outside call.');
    if (!this.env.BRIDGE_URL || !this.env.BRIDGE_SECRET) throw userError('The Google link is not set up yet (BRIDGE_URL / BRIDGE_SECRET).');
    const r = await fetch(this.env.BRIDGE_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: 'bridge', args: [this.env.BRIDGE_SECRET, name, args] }), redirect: 'follow' });
    let j; try { j = await r.json(); } catch (e) { throw userError('The Google link sent an unexpected reply.'); }
    if (!j.ok) throw userError(String(j.error || 'The Google link request failed.'));
    return j.result;
  }

  /* ------------------------------------------------------------ one request */
  async run(req) {
    const fn = req.fn, args = req.args;
    try {
      if (fn === '__import') return await this.importAll(req);
      if (fn === '__status') { this.guard(req); return { ok: true, result: { tables: this.sql.exec('SELECT tbl, COUNT(*) AS n FROM rows GROUP BY tbl').toArray() } }; }
      const results = [];
      if (fn === 'syncSources') {                                              // automatic fetches from open pages run at most every 2 minutes; the Fetch button always runs
        const early = this.syncGate(args); if (early) return { ok: true, result: early };
      }
      for (let pass = 0; pass < 8; pass++) {
        try {
          const out = this.ctx.storage.transactionSync(() => this.once(fn, args, results));
          return { ok: true, result: out };
        } catch (err) {
          if (!(err && err.need)) throw err;
          let r; try { r = { ok: true, value: await this.bridge(err.ext, err.extArgs) }; } catch (e2) { r = { ok: false, error: e2.message }; }
          results.push(r);
        }
      }
      throw userError('Too many outside calls in one request.');
    } catch (err) {
      const msg = err && err.user ? err.message : 'Server error: ' + (err && err.message ? err.message : err);
      if (!(err && err.user)) console.error(fn, err && err.stack ? err.stack : err);
      return { ok: false, error: msg, code: err && err.code ? err.code : '' };
    }
  }
  once(fn, args, results) {
    const store = this.makeStore(), ctx = this.makeCtx(results);
    const out = FinCore.handle(store, ctx, fn, args);
    if (fn === 'syncSources') ctx.cache.put('syncAt', String(Date.now()), 600);    // rolled back with everything else if the run had to be repeated
    return out;
  }
  syncGate(args) {
    const manual = args[1] === 'manual';
    const last = Number(this.makeCache().get('syncAt') || 0);
    if (manual || Date.now() - last >= SYNC_GAP_MS) return null;
    const store = this.makeStore(), ctx = this.makeCtx([]);
    // sign-in and permission are still checked; the data comes back without reading the outside sources
    FinCore.requireSync(store, ctx, String(args[0] || ''));
    return { result: { read: 0, added: 0, updated: 0, autoApproved: 0, skipped: 0, warnings: [], throttled: true }, data: FinCore.handle(store, ctx, 'boot', [String(args[0] || '')]) };
  }

  /* ------------------------------------------------------------ one-time import from the Google Sheet */
  guard(req) { if (!this.env.ADMIN_SECRET || req.adminSecret !== this.env.ADMIN_SECRET) throw userError('Not allowed.'); }
  async importAll(req) {
    this.guard(req);
    const dump = req.args[0] && req.args[0].tables ? req.args[0] : await this.bridge('exportAll', []);
    const tables = dump.tables || {}, names = Object.keys(tables), counts = {};
    this.ctx.storage.transactionSync(() => {
      for (const n of names) {
        this.sql.exec('DELETE FROM rows WHERE tbl = ?', n);
        tables[n].forEach((r, i) => this.sql.exec('INSERT INTO rows (tbl, pos, json) VALUES (?, ?, ?)', n, i, JSON.stringify(r)));
        counts[n] = tables[n].length;
      }
      this.sql.exec('DELETE FROM kv');
    });
    return { ok: true, result: counts };
  }
}
