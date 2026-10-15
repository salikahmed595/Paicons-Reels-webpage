/** GET /api/waitlist/count  →  {count}. Public, cached 5 minutes (the page shows it only from 50 up). */
import { COUNT_KEY, configured, json, redis, sheetsConfigured, sheetsCount } from "../_lib/waitlist.js";

export async function GET() {
  let count = 0;
  try {
    if (sheetsConfigured()) count = await sheetsCount();
    else if (configured()) count = parseInt((await redis("GET", COUNT_KEY)) || "0", 10) || 0;
  } catch { /* show nothing */ }
  return json({ count }, 200, { "cache-control": "public, max-age=0, s-maxage=300" });
}
