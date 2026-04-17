# Petal & Stem

A pricing ledger for your aunt's florist business. Works offline, lives on her phone like a real app, sends pickup reminders, and (once you set it up) auto-syncs everything to a Google Sheet so she can view/print it from a PC.

This README walks **you** (the person setting it up) through getting her up and running. It's split into stages — do them in order, take a break between them, and don't worry about the parts you don't recognize. Total time: about 50 minutes spread across the steps.

---

## What's in here

- A React PWA built with Vite
- Local-first: data lives in IndexedDB on her phone (works fully offline)
- Pickup reminders via **OneSignal** (server-backed — fires even when phone is asleep) with local fallback
- Google Sheets sync as a viewable/printable backup
- Calendar export (.ics) as a bulletproof reminder fallback
- Hosted free on GitHub Pages

---

## Stage 1 — Get the project running locally (~10 min)

You'll do this on your own computer first to make sure everything works before pushing to her phone.

### 1.1 Install Node.js

If you don't have it: download the **LTS** installer from <https://nodejs.org> and run it. To check, open a terminal and type:

```bash
node --version
```

You want v18 or higher.

### 1.2 Install the project's dependencies

In your terminal, navigate to this folder (where this README lives) and run:

```bash
npm install
```

This downloads the libraries the app needs. Takes about 30 seconds.

### 1.3 Run it locally

```bash
npm run dev
```

Open the URL it prints (usually <http://localhost:5173/petal-and-stem/>) in Chrome. You should see Petal & Stem with seed data.

Click around — Flowers, Build, Supplies, Orders. Add a flower, log a price, schedule an order. Everything except Google Sheets sync should work right now (sync needs Stage 2).

Press `Ctrl+C` in the terminal to stop the dev server.

---

## Stage 2 — Set up Google Cloud (~15 min)

This is the gnarliest part. We're creating an OAuth Client ID so the app can write to your aunt's Google Drive on her behalf. You only do this once.

### 2.1 Create a Google Cloud project

1. Go to <https://console.cloud.google.com/>
2. Sign in with the Google account you're willing to host this under (your aunt never sees this account)
3. At the top, click the project picker (says "Select a project" or shows a current project name)
4. Click **NEW PROJECT** in the upper right of the dialog
5. Project name: `petal-and-stem` (anything works)
6. Click **CREATE**, then wait ~15 seconds and select the new project from the picker

### 2.2 Enable the APIs

The app needs two APIs turned on for this project.

1. In the left sidebar, click **APIs & Services → Library**
2. Search for **Google Sheets API**, click it, click **ENABLE**
3. Hit back, search for **Google Drive API**, click it, click **ENABLE**

### 2.3 Configure the OAuth consent screen

This is the screen your aunt will see when she clicks "Connect Google" in the app.

1. Left sidebar: **APIs & Services → OAuth consent screen**
2. Pick **External** → **CREATE**
3. Fill in:
   - **App name:** `Petal & Stem`
   - **User support email:** your email
   - **Developer contact:** your email
   - Skip everything else
4. Click **SAVE AND CONTINUE**
5. **Scopes** screen: just click **SAVE AND CONTINUE** (we'll declare scopes in code)
6. **Test users** screen: click **ADD USERS** and add **your aunt's Gmail address**. This is the email she'll sign in with from her phone.
7. Click **SAVE AND CONTINUE**, then **BACK TO DASHBOARD**

> **Why test users?** Until an app is "verified" by Google (a 4–6 week review process), only listed test users can sign in. For a single-user app this is fine — you can add up to 100 test users. Your aunt just needs to be on this list.

### 2.4 Create the OAuth Client ID

1. Left sidebar: **APIs & Services → Credentials**
2. **+ CREATE CREDENTIALS → OAuth client ID**
3. Application type: **Web application**
4. Name: `Petal & Stem PWA`
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add **both**:
   - `http://localhost:5173` (for local dev)
   - `https://YOUR-USERNAME.github.io` (replace YOUR-USERNAME with your GitHub username, no trailing slash)
6. Skip **Authorized redirect URIs** (we use implicit flow, not redirect)
7. Click **CREATE**

A dialog appears with your **Client ID**. It looks like `123456789-abc...xyz.apps.googleusercontent.com`. **Copy it.**

### 2.5 Paste the Client ID into the app

Open `src/config.js` in this project. Find this line:

```js
export const GOOGLE_CLIENT_ID = '';
```

Paste your Client ID between the quotes:

```js
export const GOOGLE_CLIENT_ID = '123456789-abc...xyz.apps.googleusercontent.com';
```

Save the file.

### 2.6 Test it locally

Run `npm run dev` again. Open the app, tap the gear icon (Settings). Scroll down — there's now a **Google Sheets sync** section with a **Connect Google** button. Click it.

A Google sign-in popup appears. Sign in with the **test user account you added in step 2.3** (your aunt's Gmail, or your own if you also added yourself). You'll see a scary "Google hasn't verified this app" warning — click **Advanced → Go to Petal & Stem (unsafe)**. This is normal and only happens once per device.

Approve the permissions. Back in the app, you should see "Connected ✓ — Last synced just now". Open your Drive in another tab — there should be a new spreadsheet called "Enchanted Phlorals — Ledger" with all the data.

If that worked, you're done with the hardest part.

---

## Stage 3 — Set up OneSignal (~5 min)

OneSignal is a free push notification service. Without it, reminders only work when the app is open on her phone. With it, reminders fire **even when her phone is asleep or the app is fully closed** — OneSignal's servers hold the scheduled notification and deliver it on time. Free tier, $0 forever, 1 subscriber.

### 3.1 Create a OneSignal account

1. Go to <https://onesignal.com> and sign up (free)
2. Create a new app — name it **Petal & Stem**
3. When asked to choose a platform, pick **Web**
4. For the site setup, choose **Typical Site**
5. Enter the site URL: `https://YOUR-USERNAME.github.io` (you'll deploy here in Stage 4)
6. Skip custom prompt setup — we handle the prompt in our own UI
7. Click **Save**

### 3.2 Copy your keys

1. In the OneSignal dashboard, go to **Settings → Keys & IDs**
2. Copy the **OneSignal App ID** (looks like `abcd1234-5678-...`)
3. Copy the **REST API Key** (looks like `NzYy...`)

### 3.3 Paste into config

Open `src/config.js` and fill in both values:

```js
export const ONESIGNAL_APP_ID = 'abcd1234-5678-...';
export const ONESIGNAL_REST_API_KEY = 'NzYy...';
```

Save the file.

> **Security note:** The REST API key is visible in your client code. For a single-user florist app with one subscriber, this is fine — the worst case is someone could send her a push notification. If you're uncomfortable, you can leave these empty and the app will fall back to local-only reminders (still works when the app is open).

### 3.4 Test locally

Run `npm run dev`, open the app, go to Settings → Reminders → **Enable reminders**. If OneSignal is configured correctly, you'll see "Server-backed delivery active" under the enabled status. Tap **Test it** — a push notification should appear.

---

## Stage 4 — Deploy to GitHub Pages (~10 min)

Free hosting, served at `https://YOUR-USERNAME.github.io/petal-and-stem/`.

### 4.1 Create a repo on GitHub

1. Go to <https://github.com/new>
2. Repository name: **petal-and-stem** (must match the URL — `vite.config.js` is hardcoded for this)
3. Public (GitHub Pages is free for public repos)
4. Don't initialize with anything — leave it empty
5. **Create repository**

### 4.2 Push the code

In your terminal, in the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/petal-and-stem.git
git push -u origin main
```

(Replace YOUR-USERNAME.)

### 4.3 Build and deploy

Easiest path: install the `gh-pages` helper and let it deploy the `dist/` folder for you.

```bash
npm install --save-dev gh-pages
```

Add a deploy script to `package.json`. Open `package.json` and change the `"scripts"` block to:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "vite build && gh-pages -d dist"
}
```

Then run:

```bash
npm run deploy
```

This builds the app and pushes the `dist/` folder to a `gh-pages` branch on GitHub.

### 4.4 Turn on GitHub Pages

1. On GitHub, go to your repo → **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages`, folder `/ (root)`
4. **Save**

Wait ~1 minute, then visit `https://YOUR-USERNAME.github.io/petal-and-stem/`. The app should load.

> If you get a 404, wait another 2–3 minutes — first deploys take a moment to propagate. Refresh.

### 4.5 Future updates

Anytime you change anything in the code:

```bash
git add . && git commit -m "describe what changed"
git push
npm run deploy
```

---

## Stage 5 — Install on your aunt's phone (~5 min, with her)

### 5.1 Open the URL in Chrome

Have her open Chrome on her Android phone and visit `https://YOUR-USERNAME.github.io/petal-and-stem/`.

### 5.2 Add to Home Screen

In Chrome, tap the **⋮** menu → **Add to Home screen** (or sometimes it's labeled **Install app**). Tap Install. The app icon appears on her home screen — she can launch it like any other app.

### 5.3 Connect Google Sheets (optional but recommended)

1. Open the app from the home screen
2. Tap the gear icon (Settings)
3. Scroll to **Google Sheets sync → Connect Google**
4. Sign in with her Gmail (the one you added as a test user in Stage 2.3)
5. **Scary warning:** "Google hasn't verified this app." Tap **Advanced → Go to Petal & Stem (unsafe)**. This only happens once.
6. Approve permissions

She should see "Connected ✓". A spreadsheet now lives in her Drive that mirrors the app.

### 5.4 Enable reminders

1. Still in Settings → **Reminders** section
2. Tap **Enable reminders**
3. Browser asks for notification permission — tap **Allow**
4. Tap **Test it** to confirm a notification appears

Now every order with reminders enabled will trigger a notification at the times she set (default: 2 days before, then 5 hours before).

### 5.5 Show her the basics

- **Flowers tab:** add the things she stocks. Tap **Log price** when TJ prices change.
- **Build tab:** tap + on each flower to mock up an arrangement, see the material cost.
- **Supplies tab:** wrapping, ribbons.
- **Orders tab:** calendar view. Tap a day to see/add orders for it.
- **Settings (gear):** business name, default pickup time, reminder timing.
- **Transfer (arrows):** backup/restore. Useful if she ever switches phones.

---

## Troubleshooting

**"Google hasn't verified this app" warning won't go away**
That's expected for unverified apps. Tap **Advanced → Go to Petal & Stem (unsafe)**. Only test users (the emails you added in Stage 2.3) can do this.

**She added a new email and gets "Access blocked"**
Go back to **APIs & Services → OAuth consent screen → Test users** and add the new email.

**Reminders aren't firing on her phone**
- If OneSignal is configured: check that she tapped "Enable reminders" in Settings and allowed the browser permission prompt. OneSignal handles delivery from their servers — it should work even with the app closed.
- If OneSignal is NOT configured (keys left empty): reminders only fire while the app is open. This is the local-only fallback.
- Check Android settings → Apps → Chrome → Notifications are enabled
- The .ics calendar export is a 100% reliable backup — she can use **To Calendar** on each order to add it to her phone's actual calendar app

**OneSignal test notification doesn't arrive**
- Make sure you pasted both the App ID and REST API Key into `src/config.js`
- Check that the OneSignal app's platform is set to "Web" (not mobile)
- In the OneSignal dashboard → Audience → Subscriptions, verify her device shows up
- Try clearing browser cache and reopening the app

**The Sheet is missing some data**
Tap **Sync now** in Settings → Google Sheets sync. If still missing, disconnect and reconnect.

**Build fails with "missing dependency"**
Run `npm install` again, then `npm run build`.

**Deployed app shows blank page**
Open browser DevTools → Console. Most likely: the `base` in `vite.config.js` doesn't match your repo name. They must match exactly.

---

## File layout

```
petal-and-stem/
├── public/
│   ├── sw.js                 # Service worker (offline + OneSignal push + local notifications)
│   ├── manifest.webmanifest  # PWA install manifest
│   ├── icon-*.png            # App icons
│   └── .nojekyll             # Tells GitHub Pages to serve all files
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Main app (the big one)
│   ├── idb.js                # IndexedDB storage layer
│   ├── onesignal.js          # OneSignal SDK + REST API scheduling
│   ├── notifications.js      # Local reminder scheduling (fallback layer)
│   ├── sheets.js             # Google Sheets sync
│   ├── reminderUtils.js      # Shared offset helpers
│   └── config.js             # Google Client ID + OneSignal keys go here
├── vite.config.js            # Build config — `base` must match GH repo name
├── package.json              # Dependencies & scripts
└── README.md                 # This file
```

---

## What I deliberately didn't add

- **Two-way Sheets sync.** The app pushes to the Sheet; edits made in the Sheet don't come back. Adding two-way means resolving conflicts when both sides change, and she shouldn't be editing the Sheet anyway.
- **A login system.** Her data lives on her phone. The Google sign-in is *only* for the Sheet sync — the app itself doesn't need an account.
- **Tax calculations or markup formulas.** The Build tab shows raw material cost; she does the markup mentally. If she wants this added later, the place to add it is right above the cost summary in `ArrangementView`.

If she asks for changes, the most likely candidates are: tax/markup, more flower types, custom payment methods, or quiet hours for reminders. None are hard.
