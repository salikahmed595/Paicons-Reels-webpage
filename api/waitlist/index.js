/** POST /api/waitlist  {name, email?, whatsapp?, consent}  (email OR whatsapp required) */
import { COUNT_KEY, configured, json, redis, sheetsAdd, sheetsConfigured } from "../_lib/waitlist.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s-]{10,18}$/;
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

// "0300 1234567", "+92 300 1234567" and "923001234567" are the same number.
function normalizePhone(raw) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("03")) d = "92" + d.slice(1);
  return d.length >= 10 && d.length <= 15 ? d : "";
}

export async function POST(request) {
  if (!configured() && !sheetsConfigured()) return json({ ok: false, error: "not_configured" }, 503);

  let data;
  try {
    const type = request.headers.get("content-type") || "";
    data = type.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (data.company) return json({ ok: true });

  const name = clean(data.name, 80);
  const email = clean(data.email, 120).toLowerCase();
  const whatsapp = clean(data.whatsapp, 20);
  const phone = whatsapp && PHONE_RE.test(whatsapp) ? normalizePhone(whatsapp) : "";
  const consent = data.consent === true || data.consent === "on" || data.consent === "true";

  const emailOk = !email || EMAIL_RE.test(email);
  const phoneOk = !whatsapp || !!phone;
  if (name.length < 2 || !consent || !emailOk || !phoneOk || (!email && !phone)) {
    return json({ ok: false, error: "invalid" }, 422);
  }

  // One entry per person: dedupe on email if given, otherwise on the normalized phone number.
  const key = email ? `email:${email}` : `phone:${phone}`;
  // Show "+<country code>…" only when we know the country code (typed with + or 00, or a Pakistani 03xx number);
  // otherwise keep the number as typed, so a local number isn't given a wrong code.
  const intl = /^\s*(\+|00)/.test(whatsapp) || /^03\d{9}$/.test(whatsapp.replace(/\D/g, ""));
  const entry = {
    name, email, whatsapp: phone ? (intl ? `+${phone}` : whatsapp) : "",
    consentAt: new Date().toISOString(),
    country: request.headers.get("x-vercel-ip-country") || "",
    source: new URL(request.url).hostname,
    offer: clean(data.offer, 60),   // the price this visitor was shown, in their currency
  };

  // Save to every configured store; each one skips duplicates on its own.
  // Succeed if at least one store saved it, so a Sheets hiccup never loses a sign-up kept in Redis.
  const saves = [];
  if (sheetsConfigured()) saves.push(sheetsAdd(entry));
  if (configured()) saves.push((async () => {
    if ((await redis("SET", key, JSON.stringify(entry), "NX")) === "OK") await redis("INCR", COUNT_KEY);
  })());
  const results = await Promise.allSettled(saves);
  results.filter(r => r.status === "rejected").forEach(r => console.error("waitlist store failed:", r.reason?.message));
  if (!results.some(r => r.status === "fulfilled")) return json({ ok: false, error: "storage" }, 503);
  // Same response for new and repeat sign-ups (doesn't reveal who is on the list).
  return json({ ok: true });
}
