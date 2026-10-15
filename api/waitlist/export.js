/** GET /api/waitlist/export  →  CSV. Needs header  Authorization: Bearer <ADMIN_TOKEN> */
import { configured, json, redis, timingSafeEqual } from "../_lib/waitlist.js";

export async function GET(request) {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin || !configured()) return json({ ok: false }, 404);
  if (!timingSafeEqual(request.headers.get("authorization") || "", `Bearer ${admin}`)) return json({ ok: false }, 401);

  const rows = [["name", "email", "whatsapp", "consentAt", "country"]];
  for (const pattern of ["email:*", "phone:*"]) {
    let cursor = "0";
    do {
      const [next, keys] = await redis("SCAN", cursor, "MATCH", pattern, "COUNT", "500");
      cursor = String(next);
      if (keys.length) {
        for (const raw of await redis("MGET", ...keys)) {
          const v = JSON.parse(raw || "{}");
          rows.push([v.name, v.email, v.whatsapp, v.consentAt, v.country]);
        }
      }
    } while (cursor !== "0");
  }

  // Prefix formula characters so spreadsheet apps don't execute them.
  const cell = c => { let s = String(c ?? ""); if (/^[=+\-@]/.test(s) && !/^\+\d+$/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const csv = rows.map(r => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=waitlist.csv", "cache-control": "no-store" } });
}
