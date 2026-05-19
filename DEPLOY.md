# Deploy instructions

## Option 1 — Vercel (recommended, free)

### Step 1: Push to GitHub

1. Go to [github.com](https://github.com) → click **+** → **New repository**
2. Name it `lesson-generator`, set to **Public**, click **Create repository**
3. On the next screen click **uploading an existing file**
4. Upload all files from this repo: `index.html`, `vercel.json`, `README.md`, `DEPLOY.md`, `LICENSE`
5. Click **Commit changes**

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. Click **Add New Project** → select your `lesson-generator` repo → **Import**
3. Leave **Root Directory** as `/` (default — do not change it)
4. Leave all build settings blank
5. Click **Deploy**

Vercel reads `vercel.json` automatically. Your live URL will look like:
```
https://lesson-generator-abc123.vercel.app
```

Every push to GitHub redeploys automatically within ~30 seconds.

### Step 3: Enter your API key

1. Open your deployed URL
2. Paste your Anthropic API key into the input box at the top
3. Click **Save key** — stored in browser localStorage, never leaves your device
4. You only do this once per browser

---

## Option 2 — GitHub Pages (also free)

1. Push all files to GitHub (same as Step 1 above)
2. Go to your repo → **Settings** → **Pages**
3. Under **Source** → **Deploy from a branch**
4. Branch: `main`, Folder: **/ (root)**
5. Click **Save**

Live at `https://YOUR_USERNAME.github.io/lesson-generator` within 1–2 minutes.

---

## Option 3 — Local (no hosting)

```bash
git clone https://github.com/YOUR_USERNAME/lesson-generator.git
cd lesson-generator
open index.html
```

Or just double-click `index.html`. Works in any browser. The only network call is to `api.anthropic.com`.

---

## Updating the app

After downloading a new `index.html`:

**Via GitHub UI:**
1. Go to your repo → click `index.html` → click the pencil icon (Edit)
2. Select all, paste the new content
3. Click **Commit changes**

Vercel redeploys automatically.

**Via Git:**
```bash
git add index.html
git commit -m "Update lesson generator"
git push
```

---

## Changing your API key

**In the browser console:**
```javascript
localStorage.removeItem('anthropic_api_key')
location.reload()
```

**Via DevTools:**
1. Open DevTools → **Application** tab → **Local Storage** → your site URL
2. Delete the row `anthropic_api_key`
3. Refresh — the key input box reappears

---

## Sharing with colleagues

Each person who opens the URL must enter their own API key on first visit. Their key is stored only in their own browser. Usage costs are charged to whoever's key is active.

**If you want a single shared key for all users**, you need a backend proxy — a small server that holds the key and forwards requests to Anthropic. This prevents the key from being visible in the browser. Ask for help if needed.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `model: ... (404)` | Model not available on your account | Wait 24h after first billing or contact Anthropic support |
| `invalid_api_key` | Wrong or revoked key | Generate a new key at console.anthropic.com |
| `credit_balance` error | No credits | Add funds at console.anthropic.com → Billing |
| Key input box not appearing | Old key in localStorage | Run `localStorage.removeItem('anthropic_api_key')` in console |
| Blank lesson output | Claude returned malformed HTML | Try again or simplify your prompt |
| Vercel deploy fails | Wrong root directory | Confirm Root Directory is set to `/` (repo root), not `src` |
