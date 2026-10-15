/**
 * GET /api/geo  →  {country, currency, rate}
 * The visitor's country (from Vercel), its currency, and how many units of that currency make US$1,
 * so the page can show the founding price in every visitor's own currency.
 *
 * Rates: ExchangeRate-API open access (free, no key, updates daily; attribution is shown on the page).
 * Cached in memory for 12 hours. If rates can't be fetched, the page falls back to US$.
 */
import { json } from "./_lib/waitlist.js";
import { COUNTRY_CURRENCY } from "./_lib/currencies.js";

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
let cache = { at: 0, rates: null };

async function rates() {
  if (cache.rates && Date.now() - cache.at < 12 * 3600e3) return cache.rates;
  try {
    const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data && data.result === "success" && data.rates) cache = { at: Date.now(), rates: data.rates };
  } catch { /* keep the last good rates, if any */ }
  return cache.rates;
}

export async function GET(request) {
  const country = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  const currency = COUNTRY_CURRENCY[country] || "USD";
  const r = currency === "USD" ? 1 : (await rates())?.[currency];
  return json(r ? { country, currency, rate: r } : { country, currency: "USD", rate: 1 }, 200, { "cache-control": "private, no-store" });
}
