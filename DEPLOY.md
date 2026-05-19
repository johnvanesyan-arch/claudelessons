# Deploy

## Vercel (recommended)

1. **Push to GitHub:**
   - Create a new repo at [github.com/new](https://github.com/new) — name it `lesson-generator`, make it Public
   - Upload all files from this folder (or `git push` if using the CLI)

2. **Deploy:**
   - Go to [vercel.com](https://vercel.com) → Sign in with GitHub
   - **Add New Project** → import your `lesson-generator` repo
   - Leave **Root Directory** as `/` (default — do NOT change it)
   - Leave all build settings empty
   - Click **Deploy**

3. **Use:**
   - Open your live URL
   - Paste your Anthropic API key when prompted
   - Click **Save key** (stored in your browser only)

Every git push redeploys automatically.

## GitHub Pages

1. Push files to GitHub
2. **Settings → Pages**
3. Source: Deploy from branch → `main` → `/ (root)`
4. Save → live at `https://YOUR_USERNAME.github.io/lesson-generator` within 1–2 minutes

## Local

```bash
git clone https://github.com/YOUR_USERNAME/lesson-generator.git
cd lesson-generator
open index.html
```

Or just double-click `index.html`. **Note:** some browsers restrict IndexedDB on `file://` URLs. If history doesn't persist locally, run a tiny local server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Updating

After downloading new files: replace them in your GitHub repo. Vercel auto-deploys.

## Resetting your API key

In the browser console (DevTools):
```javascript
localStorage.removeItem('anthropic_api_key')
location.reload()
```

## Wiping all history

```javascript
indexedDB.deleteDatabase('lesson_generator')
```

## Troubleshooting

| Error | Fix |
|---|---|
| `model: ... (404)` | Account doesn't have model access yet — wait 24h after first billing |
| `invalid_api_key` | Generate a new key at console.anthropic.com |
| `credit_balance` error | Add funds → Billing |
| Lesson saved but tabs broken | Click "Edit HTML" to inspect; the runtime tries to fix tabs but the lesson HTML may be very malformed. Regenerate. |
| History not appearing | Open DevTools console — IDB errors will be logged. Check storage quota in Application tab. |
