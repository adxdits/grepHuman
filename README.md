<p align="center">
  <img src="public/icons/logo.png" alt="grepHuman" width="280" />
</p>

<h1 align="center">grepHuman</h1>

<p align="center">
  Chrome extension that labels Google search results so you can tell what's real and what's AI slop.
</p>

---
<img width="1512" height="756" alt="Screenshot 2026-02-17 at 21 49 02" src="https://github.com/user-attachments/assets/3a7cc7a2-1c26-4a7a-80d2-fbba2425d8b3" />


## Why

I got tired of it. Every article I open is the same recycled garbage. "In today's fast-paced digital landscape" — shut up. You can feel it in your gut when something was written by ChatGPT. The same filler words, the same structure, the same nothing.

So I thought: the older the article, the more likely a human actually wrote it. Anything before November 30, 2022 (when ChatGPT launched) is guaranteed human. After that? Roll the dice.

I built this tool to put that info right on the search results page. No clicking, no guessing. You see a green badge, you know a person wrote that. You see red, it's slop.

## What it does

grepHuman runs on Google search pages and adds a badge next to every result:

- **✓ Not AI** (green) — Published before ChatGPT existed. 100% human.
- **⚠ Maybe AI** (orange) — Published after Nov 30, 2022. Could go either way.
- **✖ AI Slop** (red) — The snippet is full of ChatGPT-speak. Emojis as bullet points, "dive into", "let's explore", "in today's digital landscape", the whole package.

You can also:
- Toggle labels on/off
- Hide AI/slop results entirely
- Show them back whenever you want

## Slop detection

The extension scans the search result snippet for patterns that ChatGPT loves:

- Filler phrases like "delve into", "harness the power", "game changer", "buckle up", "seamlessly", "cutting-edge", "navigate the complexities"
- Emoji spam and emojis used as list bullets (🔥 Title: ...)
- Hype emojis everywhere (🚀✅💡🎯⭐)
- Exclamation mark abuse

Each pattern adds to a slop score. Cross the threshold and you get the red badge.

## Install

```bash
npm install
npm run build
```

Then load it in Chrome:

1. Go to `chrome://extensions/`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `dist/grephuman/browser`

Done. Open a Google search and you'll see the badges.

## Dev

```bash
npm start        # dev server at localhost:4200
npm run build    # production build
npm run watch    # build + watch
```
## Privacy Policy for grepHuman

grepHuman does not collect or use any personal information from users.
The extension only analyzes the snippets of Google search results to indicate whether the content is likely written by a human or AI.
No other user data is collected, stored, or shared.

Contact: adamalmounayar@hotmail.com
