# PAICONS Self-Development: waitlist landing page

The mobile-first landing page for **PAICONS Self-Development**, a private reel counter for Android. Visitors join the waitlist at the founding price of **Rs 100/month** (regular price Rs 700).

It's a single static page (`index.html`) plus three small Vercel Functions that save waitlist sign-ups to Upstash Redis. There's no build step and no npm packages.

```
├── index.html                 ← the whole page: HTML, CSS and JS inline
├── assets/                    ← videos, posters, app screenshots, icons, social share image
├── api/waitlist/index.js      ← POST /api/waitlist         (save a sign-up)
├── api/waitlist/count.js      ← GET  /api/waitlist/count   (real number of sign-ups)
├── api/waitlist/export.js     ← GET  /api/waitlist/export  (CSV download, admin only)
├── api/_lib/waitlist.js       ← shared helpers (not a route)
├── vercel.json                ← security and caching headers
├── manifest.webmanifest, robots.txt, sitemap.xml
```

## 1. Before you publish

Replace **`https://paicons.com/self-development/`** with your real page URL. It appears in `index.html` (the canonical link, `og:` tags and structured data), `robots.txt` and `sitemap.xml`. These URLs control how the page appears in Google and in WhatsApp and Facebook link previews.

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **import this GitHub repository**.
2. Leave **Framework Preset** on **Other**. There's no build command and no output directory to set. Click **Deploy**.
3. **Add storage for the waitlist.** Go to the project → **Storage** → **Create Database** → **Upstash for Redis** (free tier is plenty) → **Connect** it to this project. This adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables automatically.
4. *(Optional, for downloading the list)* go to **Settings → Environment Variables** and add `ADMIN_TOKEN` with a long random value.
5. Go to **Deployments → ⋯ → Redeploy** so the new variables take effect.
6. Under **Settings → Domains**, add your domain, for example `app.paicons.com`.

Until storage is connected, the form shows "Sorry, that didn't save", so nobody's details are silently lost.

### Test it locally (optional)

```bash
npx vercel dev
```

## 3. Download your waitlist

Download it as CSV with the columns name, email, whatsapp, consentAt and country:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://YOUR-DOMAIN/api/waitlist/export -o waitlist.csv
```

You can also browse entries in the Upstash console (keys `email:*` and `phone:*`).

## 4. What the waitlist does

- It asks for a name, **a WhatsApp number or an email** (at least one), and a consent checkbox.
- It saves **one entry per person**, by email or WhatsApp number. `0300 1234567` and `+92 300 1234567` count as the same number. Repeat sign-ups get the same "OK" reply, so nobody can find out who is already on the list.
- A hidden field catches bots. Their submissions are answered "OK" and never stored.
- `GET /api/waitlist/count` returns the real number of sign-ups. The page shows "N people have already joined" **only once there are 50 or more**. To change this, edit `PROOF_MIN` in `index.html`.
- It stores only what the form asks for, plus the time of consent and the visitor's country code.

## 5. Things to keep honest

- Make sure the **Rs 100 waitlist / Rs 700 regular** prices match what you will actually charge. If the founding price lasts only for a limited time, say so on the page. Google Play applies a special price only through an offer you set up in Play Console.
- The page has **no fake reviews, invented user counts or countdown timers**, on purpose. Add testimonials only once you have real ones.
- The footer explains how waitlist details are used. Honour deletion requests.

## 6. Get found on Google

The page is built around what people in Pakistan actually search for. Keyword data for Pakistan, October 2026:

| Search | Monthly searches | Difficulty (0–100) |
|---|---|---|
| screen time | 3,600 | 69 |
| digital wellbeing | 880 | **13 (easy)** |
| dopamine detox | 480 | **9 (easy)** |
| productivity app | 320 | 37 |
| social media addiction | 110 | 47 |

The title, description, headings, free guide and structured data (app, video and FAQ) target "digital wellbeing", "dopamine detox" and "reduce screen time on reels". Hardly anyone searches for "reel counter" yet.

After you deploy:

1. Open [Google Search Console](https://search.google.com/search-console) and add your domain.
2. Go to **Sitemaps** and submit `sitemap.xml`.
3. Go to **URL inspection**, paste the page URL, and click **Request indexing**.
4. Check the structured data at <https://search.google.com/test/rich-results>.
5. Link to the page from paicons.com, your Instagram bio and YouTube descriptions.

## 7. Videos

| File | What it is |
|---|---|
| `assets/promo.mp4` | 45-second story video with voiceover (476×846, about 2.3 MB). It plays near the top of the page. |
| `assets/app-demo.mp4` | 1 min 17 s real screen recording of the app (540×1200). It has chapter buttons in the "The real app" section. |

Both load only when a visitor taps play. To replace one, use an MP4 encoded as H.264 with `faststart` and keep the same file name. If you change the app demo, update the chapter times in `index.html` (search for `data-t=`).

---

© 2026 PAICONS. PAICONS Self-Development is an independent app and is not affiliated with Meta, Instagram, Facebook, Google, YouTube or TikTok.
