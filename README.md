# PAICONS Self-Development: waitlist landing page

The mobile-first landing page for **PAICONS Self-Development**, a private reel counter for Android. Visitors anywhere in the world join the waitlist at a founding price shown **in their own currency**: **US$0.99/month** (regular US$4.99), or **Rs 100/month** (regular Rs 700) in Pakistan.

It's a single static page (`index.html`) plus three small Vercel Functions that save waitlist sign-ups to **your Google Sheet** (and optionally Upstash Redis). There's no build step and no npm packages.

```
├── index.html                 ← the whole page: HTML, CSS and JS inline
├── assets/                    ← videos, posters, app screenshots, icons, social share image
├── api/waitlist/index.js      ← POST /api/waitlist         (save a sign-up)
├── api/waitlist/count.js      ← GET  /api/waitlist/count   (real number of sign-ups)
├── api/waitlist/export.js     ← GET  /api/waitlist/export  (CSV download, admin only)
├── api/geo.js                 ← GET  /api/geo              (visitor's country, for local prices)
├── api/_lib/waitlist.js       ← shared helpers (not a route)
├── google-sheets/Code.gs      ← Apps Script that adds sign-ups to your Google Sheet (not published)
├── vercel.json                ← security and caching headers
├── manifest.webmanifest, robots.txt, sitemap.xml
```

## 1. Before you publish

Replace **`https://paicons.com/self-development/`** with your real page URL. It appears in `index.html` (the canonical link, `og:` tags and structured data), `robots.txt` and `sitemap.xml`. These URLs control how the page appears in Google and in WhatsApp and Facebook link previews.

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **import this GitHub repository**.
2. Leave **Framework Preset** on **Other**. There's no build command and no output directory to set. Click **Deploy**.
3. Connect the waitlist to your Google Sheet (next section).
4. Under **Settings → Domains**, add your domain, for example `app.paicons.com`.

Until a store is connected, the form shows "That didn't save", so nobody's details are silently lost.

## 3. Waitlist in Google Sheets

Every sign-up becomes a row: **Joined at · Name · Email · WhatsApp · Country · Consent · Source · Price shown**. Duplicates are skipped. *Price shown* is the founding price that person saw, in their currency, so you know what you promised them.

**First, make the sheet private.** Open the sheet → **Share** → under *General access* choose **Restricted**. Right now anyone with the link can open it, and it's about to hold people's names and phone numbers.

1. In the sheet, open **Extensions → Apps Script**.
2. Delete what's there and paste everything from [`google-sheets/Code.gs`](google-sheets/Code.gs).
3. On the `const SECRET = ...` line, replace `CHANGE-ME-to-a-long-random-value` with a long random password (letters and numbers, 30+ characters). Click **Save**.
4. Click **Deploy → New deployment** → gear icon → **Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone

   Click **Deploy**, allow access with your Google account, and copy the **Web app URL** (it ends in `/exec`).

   *"Anyone" only lets the website reach the script. Without the secret it does nothing, and your sheet stays private.*
5. In Vercel, go to **Settings → Environment Variables** and add:
   - `SHEETS_WEBHOOK_URL` = the Web app URL
   - `SHEETS_SECRET` = the same secret as in step 3
6. Go to **Deployments → ⋯ → Redeploy**.
7. Join the waitlist once on your live page. A **Waitlist** tab appears in the sheet with your row.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

### Optional: a backup copy in Upstash Redis

Go to **Storage → Create Database → Upstash for Redis → Connect**, then redeploy. Sign-ups then go to both places, and a sign-up is kept even if Google is briefly unavailable. Add `ADMIN_TOKEN` to download the Redis copy as CSV:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://YOUR-DOMAIN/api/waitlist/export -o waitlist.csv
```

### Test it locally (optional)

```bash
npx vercel dev
```

## 4. What the waitlist does

- It asks for a name, **a WhatsApp number or an email** (at least one), and a consent checkbox.
- It saves **one entry per person**, by email or WhatsApp number. `0300 1234567` and `+92 300 1234567` count as the same number. Repeat sign-ups get the same "OK" reply, so nobody can find out who is already on the list.
- A hidden field catches bots. Their submissions are answered "OK" and never stored.
- `GET /api/waitlist/count` returns the real number of sign-ups (rows in the sheet). The page shows "N people have already joined" **only once there are 50 or more**. To change this, edit `PROOF_MIN` in `index.html`.
- It stores only what the form asks for, plus the time of consent and the visitor's country code.

## 5. Prices by country

The page guesses the visitor's country instantly from their phone's time zone and language, then confirms it with Vercel (`/api/geo`). It then shows every price in that currency:

| Visitors from | Waitlist / month | Regular / month |
|---|---|---|
| Pakistan | Rs 100 | Rs 700 |
| United States | $0.99 | $4.99 |
| Eurozone | €0.99 | €4.99 |
| United Kingdom | £0.99 | £4.49 |
| India | ₹89 | ₹449 |
| Bangladesh | BDT 119 | BDT 599 |
| UAE / Saudi Arabia | AED / SAR 3.99 | AED / SAR 18.99 |
| Canada | CA$1.39 | CA$6.99 |
| Australia | A$1.49 | A$7.99 |
| Everywhere else | US$0.99 | US$4.99 |

The burger and screen-time-app comparison changes with the currency too. To change a price or add a country, edit `PRICES` and `CUR` near the top of the script in `index.html`.

**Set the same prices in Google Play.** In Play Console, set the subscription's base price to US$4.99 and check each country's local price. Then add a **waitlist offer** for US$0.99 (Rs 100 in Pakistan). Google Play converts any country you don't set by hand. It charges in local currency with taxes included, so the final amount can differ slightly from the page.

## 6. Things to keep honest

- Make sure the prices in `PRICES` match what you will actually charge in Google Play. If the founding price lasts only for a limited time, say so on the page. Google Play applies a special price only through an offer you set up in Play Console.
- The page has **no fake reviews, invented user counts or countdown timers**, on purpose. Add testimonials only once you have real ones.
- The footer explains how waitlist details are used. Honour deletion requests.

## 7. Get found on Google

The page is written for an international audience, and its topics were chosen with Pakistan keyword data (October 2026):

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

## 8. Videos

| File | What it is |
|---|---|
| `assets/promo.mp4` | 45-second story video with voiceover (476×846, about 2.3 MB). It plays near the top of the page. |
| `assets/app-demo.mp4` | 1 min 17 s real screen recording of the app (540×1200). It has chapter buttons in the "The real app" section. |

Both load only when a visitor taps play. To replace one, use an MP4 encoded as H.264 with `faststart` and keep the same file name. If you change the app demo, update the chapter times in `index.html` (search for `data-t=`).

---

© 2026 PAICONS. PAICONS Self-Development is an independent app and is not affiliated with Meta, Instagram, Facebook, Google, YouTube or TikTok.
