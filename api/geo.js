/** GET /api/geo  →  {country}. The visitor's country from Vercel, so the page can show prices in their currency. */
import { json } from "./_lib/waitlist.js";

export function GET(request) {
  return json({ country: request.headers.get("x-vercel-ip-country") || "" }, 200, { "cache-control": "private, no-store" });
}
