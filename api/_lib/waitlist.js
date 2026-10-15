/**
 * PAICONS Self-Development — shared waitlist helpers (Vercel Functions). No npm packages needed.
 *
 * Where sign-ups go (set either or both in Vercel → Settings → Environment Variables):
 *
 *   Google Sheet (recommended)  SHEETS_WEBHOOK_URL  the Apps Script Web app URL (google-sheets/Code.gs)
 *                               SHEETS_SECRET       the same SECRET as in Code.gs
 *
 *   Upstash Redis (optional)    KV_REST_API_URL + KV_REST_API_TOKEN
 *                               (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *                               ADMIN_TOKEN enables GET /api/waitlist/export (CSV from Redis)
 *
 * Stores only what the form asks for: name, email and/or WhatsApp, consent time, country code.
 */

export const COUNT_KEY = "meta:count";

export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });

/* ---------- Google Sheets (Apps Script web app) ---------- */

const sheetsConfig = () =>
  process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_SECRET
    ? { url: process.env.SHEETS_WEBHOOK_URL, secret: process.env.SHEETS_SECRET }
    : null;

export const sheetsConfigured = () => !!sheetsConfig();

/** Appends one sign-up. The script skips duplicates. Returns {added, count}. */
export async function sheetsAdd(entry) {
  const cfg = sheetsConfig();
  // Apps Script answers POST with a redirect to the result; fetch follows it.
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: cfg.secret, ...entry }),
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !data.ok) throw new Error(`sheets_${(data && data.error) || res.status}`);
  return data;
}

export async function sheetsCount() {
  const cfg = sheetsConfig();
  const url = new URL(cfg.url);
  url.searchParams.set("secret", cfg.secret);
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000) });
  const data = await res.json().catch(() => null);
  if (!data || !data.ok) throw new Error("sheets_count");
  return data.count || 0;
}

/* ---------- Upstash Redis ---------- */

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export const configured = () => !!redisConfig();

/** Runs one Redis command, e.g. redis("SET", "k", "v", "NX"). */
export async function redis(...command) {
  const cfg = redisConfig();
  if (!cfg) throw new Error("not_configured");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || `redis_${res.status}`);
  return data.result;
}

export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
