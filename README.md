# Lesson Generator

> EFL/ESL lesson builder powered by Claude (Anthropic)

A single-file web app that generates fully structured, interactive lesson widgets from a student profile, source material, and a plain-English prompt. No build step. No server. No framework.

---

## How it works

1. **Student** — enter the learner's profile (level, native language, goals, weaknesses)
2. **Material** — paste any source text: article, dialogue, script, transcript
3. **Prompt** — describe the lesson you want in plain English
4. **Generate** — Claude returns a complete interactive lesson widget with tabs, timing, and activities

Each generated lesson includes: Before you start box, Overview, Warm-up, Language bank (with translations), Dialogue (full / gap-fill / practice), Fluency cycle (3 timed rounds), Hot-seat activity, and Homework.

---

## Requirements

| What | Where |
|---|---|
| Anthropic API key | [console.anthropic.com](https://console.anthropic.com) |
| API credit balance | $5 minimum — each lesson costs ~$0.01 |
| Browser | Chrome, Firefox, Safari, Edge — all work |

No Node.js. No npm. No build tools.

---

## Deploy in 5 minutes

### Option A — Vercel (recommended)

1. Fork this repo on GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your fork
3. Leave all settings as default — Vercel detects `vercel.json` automatically
4. Click **Deploy**
5. Open your live URL → enter your API key → done

### Option B — GitHub Pages

1. Fork this repo
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Save → wait ~1 minute → live at `https://YOUR_USERNAME.github.io/lesson-generator`

### Option C — Local

```bash
git clone https://github.com/YOUR_USERNAME/lesson-generator.git
cd lesson-generator
open index.html   # or double-click the file
```

Full step-by-step instructions in [DEPLOY.md](DEPLOY.md).

---

## First run

On first visit you'll see an API key input box. Paste your key from [console.anthropic.com](https://console.anthropic.com) and click **Save key**. It's stored in your browser's `localStorage` — you only do this once per browser. The key never touches any server other than Anthropic's.

To reset your key:
```javascript
// Run in browser console
localStorage.removeItem('anthropic_api_key')
location.reload()
```

---

## File structure

```
lesson-generator/
├── index.html      ← entire app: HTML + CSS + JS, self-contained
├── vercel.json     ← Vercel deploy config
├── DEPLOY.md       ← detailed deploy + troubleshooting guide
├── LICENSE
└── README.md
```

---

## Troubleshooting

| Error | Likely cause | Fix |
|---|---|---|
| `model: ... (404)` | Model not on your account yet | Wait 24h after first billing, or contact Anthropic support |
| `invalid_api_key` | Wrong or expired key | Generate a new key at console.anthropic.com |
| `credit_balance` error | Zero credits | Add funds → Billing |
| Key box not appearing | Stale key in localStorage | Run `localStorage.removeItem('anthropic_api_key')` in console |
| Blank lesson output | Claude returned malformed HTML | Try again with a simpler or shorter prompt |

---

## Security

- Your API key is stored only in your browser's `localStorage`
- It is sent directly to `api.anthropic.com` — no intermediate server
- It is never logged, stored, or transmitted anywhere else
- **Do not commit your API key to this repo**

If you share the deployed URL with colleagues, each person enters their own key. If you want a shared key setup (so others don't need their own), you'll need a backend proxy — see [DEPLOY.md](DEPLOY.md).

---

## License

MIT — use freely, modify freely.
