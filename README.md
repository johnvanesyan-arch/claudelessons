# Lesson Generator

EFL/ESL lesson builder powered by Claude (Anthropic). Generates interactive HTML lesson widgets from a student profile, source material, and a plain-English prompt.

## Features

- 4-step wizard: student profile → material → prompt → generate
- **Streaming output** — content appears as it's generated, not after a long wait
- **Cancel button** — stop generation any time
- **Lesson templates** — TV-show fluency, vocab, grammar in context, exam prep, interpreter training, L1-aware
- **Profile library** — save and reload student profiles
- **Prompt library** — save and reload prompts
- **Source library** — save and reload reusable source materials
- **Lesson history** — past 7 days, with search, stored in IndexedDB
- **Edit raw HTML** — fine-tune generated lessons before saving
- **Download / print** — keep lessons after the 7-day window
- **Light + dark mode** — auto-detected from OS

## Project structure

```
lesson-generator/
├── index.html              # App shell
├── css/
│   └── styles.css          # All styles
├── js/
│   ├── storage.js          # IndexedDB + localStorage layer
│   ├── lesson-runtime.js   # Tab-fix runtime injected into generated lessons
│   ├── api.js              # Anthropic streaming client with AbortController
│   ├── ui.js               # Stepper, panels, profile, error UI
│   ├── templates.js        # Lesson templates, prompt + source libraries
│   ├── history.js          # Lesson history with search and 7-day cleanup
│   └── app.js              # Main flow: prompt build, generate, render, edit
├── vercel.json
├── DEPLOY.md
├── LICENSE
└── README.md
```

## Requirements

- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
- ~$5 in API credits (each lesson ~$0.01)
- Modern browser (Chrome, Firefox, Safari, Edge)

## Quick start

### Deploy on Vercel
1. Push this folder to a GitHub repo
2. [vercel.com](https://vercel.com) → New Project → import the repo
3. Leave Root Directory as `/` (default)
4. Deploy

### Local
Open `index.html` in your browser. That's it. No build step.

### First run
Paste your API key into the input box at the top. It's stored in your browser only.

See [DEPLOY.md](DEPLOY.md) for full step-by-step.

## License
MIT
