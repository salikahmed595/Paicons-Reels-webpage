/**
 * PAICONS Self-Development — shared waitlist helpers (Vercel Functions).
 *
 * Storage: Upstash Redis over its REST API (no npm packages needed).
 * In Vercel: Project → Storage → Create → "Upstash for Redis", connect it to this project.
 * That adds the env vars below automatically (either naming works):
 *   KV_REST_API_URL + KV_REST_API_TOKEN   or   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * Optional: ADMIN_TOKEN (a long random secret) enables GET /api/waitlist/export.
 *
 * Stores only what the form asks for: name, email and/or WhatsApp, consent time, country code.
 */

export const COUNT_KEY = "meta:count";

export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });

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
