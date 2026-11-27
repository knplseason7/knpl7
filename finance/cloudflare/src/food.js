/* KNPL-7 Food Arrangement on Cloudflare: the unchanged Food Apps Script (food-src.gs -> food-core.js) running inside a Durable Object.
 * Its sheets live in SQLite, its cache / script properties in a small key-value table, and the timer is a Cloudflare cron (every minute).
 * Outside calls (the fixture, the Team Desk, the Finance sign-in) are done by the replay pattern used for Finance: the request is run,
 * rolled back when it needs an outside answer, the answer is fetched, and the request is run again. */
import { DurableObject } from 'cloudflare:workers';
import { createHash } from 'node:crypto';
import { makeFood } from './food-core.js';

class NeedExternal extends Error { constructor(url, opts) { super('external'); this.need = true; this.url = url; this.opts = opts; } }
function userError(msg) { const e = new Error(msg); e.user = true; return e; }

export class FoodDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS fmeta (name TEXT PRIMARY KEY)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS fsheet (name TEXT NOT NULL, r INTEGER NOT NULL, json TEXT NOT NULL, PRIMARY KEY (name, r))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS fkv (k TEXT PRIMARY KEY, v TEXT NOT NULL, exp INTEGER NOT NULL)');   // exp 0 = never expires (script properties)
  }

  /* ---- the Apps Script services, backed by SQLite */
  services(results) {
    const sql = this.sql, sheets = {};
    class Sheet {
      constructor(name) { this.name = name; this.rows = sql.exec('SELECT json FROM fsheet WHERE name = ? ORDER BY r', name).toArray().map((x) => JSON.parse(x.json)); }
      appendRow(r) { sql.exec('INSERT INTO fsheet (name, r, json) VALUES (?, ?, ?)', this.name, this.rows.length, JSON.stringify(r)); this.rows.push(r.slice()); }
      setFrozenRows() {}
      getDataRange() { const rows = this.rows; return { getValues: () => rows.map((r) => r.slice()) }; }
      getRange(row, col) {
        const me = this;
        return { setValue(v) { const r = me.rows[row - 1]; while (r.length < col) r.push(''); r[col - 1] = v; sql.exec('UPDATE fsheet SET json = ? WHERE name = ? AND r = ?', JSON.stringify(r), me.name, row - 1); } };
      }
      deleteRow(n) {
        this.rows.splice(n - 1, 1);
        sql.exec('DELETE FROM fsheet WHERE name = ?', this.name);
        this.rows.forEach((r, i) => sql.exec('INSERT INTO fsheet (name, r, json) VALUES (?, ?, ?)', this.name, i, JSON.stringify(r)));
      }
    }
    const kvGet = (k) => { const x = sql.exec('SELECT v, exp FROM fkv WHERE k = ?', k).toArray()[0]; return x && (x.exp === 0 || x.exp > Date.now()) ? x.v : null; };
    let n = 0;
    return {
      SpreadsheetApp: { getActiveSpreadsheet: () => ({
        getSheetByName: (name) => { if (!sql.exec('SELECT 1 AS x FROM fmeta WHERE name = ?', name).toArray().length) return null; return sheets[name] || (sheets[name] = new Sheet(name)); },
        insertSheet: (name) => { sql.exec('INSERT OR IGNORE INTO fmeta (name) VALUES (?)', name); return sheets[name] || (sheets[name] = new Sheet(name)); }
      }) },
      CacheService: { getScriptCache: () => ({
        get: (k) => kvGet('C:' + k),
        put: (k, v, sec) => { sql.exec('INSERT OR REPLACE INTO fkv (k, v, exp) VALUES (?, ?, ?)', 'C:' + k, String(v), Date.now() + Math.min(21600, sec || 600) * 1000); },
        remove: (k) => { sql.exec('DELETE FROM fkv WHERE k = ?', 'C:' + k); }
      }) },
      PropertiesService: { getScriptProperties: () => ({
        getProperty: (k) => kvGet('P:' + k),
        setProperty: (k, v) => { sql.exec('INSERT OR REPLACE INTO fkv (k, v, exp) VALUES (?, ?, 0)', 'P:' + k, String(v)); },
        deleteProperty: (k) => { sql.exec('DELETE FROM fkv WHERE k = ?', 'P:' + k); }
      }) },
      LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },     // one request at a time already
      Utilities: {
        DigestAlgorithm: { SHA_256: 'sha256' },
        computeDigest: (alg, v) => Array.from(createHash('sha256').update(String(v)).digest()),
        base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url'),
        getUuid: () => crypto.randomUUID()
      },
      UrlFetchApp: { fetch: (url, opts) => {
        const hit = url === 'internal:finance' ? null : kvGet('X:' + url + '|' + (opts && opts.payload || ''));   // answers kept for 2 minutes even if the request that fetched them failed (and was rolled back)
        if (hit !== null) return { getContentText: () => hit };
        const i = n++;
        if (i < results.length) { const r = results[i]; if (r.ok) return { getContentText: () => r.text }; throw new Error(r.error); }
        throw new NeedExternal(url, opts);
      } },
      ContentService: { createTextOutput: (t) => ({ t, setMimeType() { return this; } }), MimeType: { JSON: 1 } },
      ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }), deleteTrigger() {} }
    };
  }
  food(results) {
    const s = this.services(results);
    return makeFood(s.SpreadsheetApp, s.CacheService, s.PropertiesService, s.LockService, s.Utilities, s.UrlFetchApp, s.ContentService, s.ScriptApp);
  }

  /* ---- outside calls */
  async external(url, opts) {
    const body = opts && opts.payload ? String(opts.payload) : undefined;
    if (url === 'internal:finance') {                                               // Finance sign-in check: same Worker, direct call
      const j = JSON.parse(body || '{}');
      const res = await this.env.FIN.get(this.env.FIN.idFromName('main'), { locationHint: 'apac' }).run({ fn: j.fn, args: j.args || [], adminSecret: '' });
      return JSON.stringify(res);
    }
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' });
    const text = await r.text();
    try { if (JSON.parse(text).ok) this.sql.exec('INSERT OR REPLACE INTO fkv (k, v, exp) VALUES (?, ?, ?)', 'X:' + url + '|' + (body || ''), text, Date.now() + 120000); } catch (e) { /* not JSON: not kept */ }
    return text;
  }
  async replay(work) {
    const results = [];
    for (let pass = 0; pass < 8; pass++) {
      try { return this.ctx.storage.transactionSync(() => work(results)); }
      catch (err) {
        if (!(err && err.need)) throw err;
        try { results.push({ ok: true, text: await this.external(err.url, err.opts) }); } catch (e) { results.push({ ok: false, error: String(e && e.message || e) }); }
      }
    }
    throw userError('Too many outside calls in one request.');
  }

  /* ---- requests */
  guard(req) { if (!this.env.ADMIN_SECRET || req.adminSecret !== this.env.ADMIN_SECRET) throw userError('Not allowed.'); }
  async run(req) {
    const fn = String(req.fn || ''), args = req.args && typeof req.args === 'object' ? req.args : {};
    try {
      if (fn === '__import') return this.importAll(req);
      if (fn === '__status') { this.guard(req); return { ok: true, result: { sheets: this.sql.exec('SELECT name, COUNT(*) AS n FROM fsheet GROUP BY name').toArray(), props: this.sql.exec("SELECT k FROM fkv WHERE k LIKE 'P:%'").toArray().map((x) => x.k.slice(2)) } }; }
      const out = await this.replay((results) => {
        const F = this.food(results), H = F.HANDLERS_[fn];
        if (!H) throw new Error('Unknown request.');
        return H(args);
      });
      return { ok: true, result: out };
    } catch (err) {
      if (!(err && err.user) && !(err && err.message)) console.error(fn, err);
      return { ok: false, error: String((err && err.message) || err) };
    }
  }
  /** Cron (every minute): the meal allotment timer, and keeps the fixture copy fresh so people never wait for it. */
  async tick() {
    try {
      const x = this.sql.exec("SELECT exp FROM fkv WHERE k = 'C:fx'").toArray()[0];
      if (x && x.exp - Date.now() < 300000) this.sql.exec("DELETE FROM fkv WHERE k = 'C:fx'");
      await this.replay((results) => { const F = this.food(results); F.fx_(); F.tick(); return 1; });
    } catch (err) { console.error('tick', err && err.message); }
    return { ok: true };
  }
  importAll(req) {
    this.guard(req);
    const d = req.args && req.args.sheets ? req.args : null;
    if (!d) throw userError('Nothing to import.');
    const counts = {};
    this.ctx.storage.transactionSync(() => {
      for (const name of Object.keys(d.sheets)) {
        this.sql.exec('INSERT OR IGNORE INTO fmeta (name) VALUES (?)', name);
        this.sql.exec('DELETE FROM fsheet WHERE name = ?', name);
        d.sheets[name].forEach((r, i) => this.sql.exec('INSERT INTO fsheet (name, r, json) VALUES (?, ?, ?)', name, i, JSON.stringify(r)));
        counts[name] = d.sheets[name].length;
      }
      this.sql.exec('DELETE FROM fkv');
      for (const k of Object.keys(d.props || {})) this.sql.exec('INSERT INTO fkv (k, v, exp) VALUES (?, ?, 0)', 'P:' + k, String(d.props[k]));
    });
    return { ok: true, result: counts };
  }
}
