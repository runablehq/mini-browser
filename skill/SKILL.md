---
name: mini-browser
description: "Browser automation skill for AI agents using the mb CLI. Use when the agent needs to browse the web, take screenshots, scrape text, fill forms, click elements, record screencasts, run JS in pages, or audit designs. Triggers on: \"browse\", \"open a page\", \"take a screenshot\", \"scrape\", \"fill form\", \"click button\", \"web automation\", \"record screen\", \"design audit\", \"accessibility check\"."
---

# mini-browser (mb) — Browser CLI for Agents

`mb` is a browser CLI where each command is a small Unix tool. It talks to Chrome over CDP (port 9222) via puppeteer-core.

## Setup (only if not already available)

Setup is only needed when `mb` is not installed or Chrome is not reachable.
Run these checks first — if both pass, skip straight to the Command Reference.

### Check if ready

```bash
# 1. Is mb installed?
which mb && echo "mb: ok" || echo "mb: MISSING"

# 2. Is Chrome listening on CDP?
curl -sf http://127.0.0.1:9222/json/version > /dev/null && echo "chrome: ok" || echo "chrome: NOT RUNNING"
```

If **both** print "ok", everything is ready — go use `mb` commands directly.

### Install (only if `mb` is missing)

```bash
npm install -g @runablehq/mini-browser
```

### Start Chrome (only if not running)

```bash
mb-start-chrome
```

This launches Chrome with `--remote-debugging-port=9222`, a fresh profile, and a
1024×768 window. It no-ops if Chrome is already running.

To kill and relaunch:

```bash
mb-restart-chrome
```

### Verify

```bash
mb go "https://example.com" && mb text
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CHROME_PORT` | `9222` | CDP port |
| `CHROME_BIN` | auto-detected | Path to Chrome/Chromium binary |
| `CHROME_PID_FILE` | `<scripts>/.chrome-pid` | PID file location |
| `CHROME_USER_DATA_DIR` | `<scripts>/.chrome-profile` | Chrome profile directory |

## Command Reference

### Navigation

| Command | Description |
|---|---|
| `mb go <url>` | Navigate to URL (waits for networkidle) |
| `mb url` | Print current URL |
| `mb back` | Go back |
| `mb forward` | Go forward |

### Observation

| Command | Description |
|---|---|
| `mb text [selector]` | Visible text content (default: body) |
| `mb shot [file]` | Screenshot to PNG (default: ./shot.png) |
| `mb snap` | List interactive elements with coordinates |

### Interaction

| Command | Description |
|---|---|
| `mb click <x> <y>` | Click at coordinates |
| `mb type [x y] <text>` | Type text (with coords: selects first) |
| `mb fill <k=v...>` | Fill form fields by label/name/placeholder |
| `mb key <key...>` | Press keys (Enter, Tab, Meta+a) |
| `mb move <x> <y>` | Hover at coordinates |
| `mb drag <x1> <y1> <x2> <y2>` | Drag between points |
| `mb scroll [dir] [px]` | Scroll (default: down 500) |

### Recording

| Command | Description |
|---|---|
| `mb record start <file>` | Start recording (.webm, .mp4, .gif) |
| `mb record stop` | Stop recording and save |
| `mb record status` | Check if recording is active |

### Tabs

| Command | Description |
|---|---|
| `mb tab list` | List open tabs |
| `mb tab new [url]` | Open new tab, print index |
| `mb tab close [n]` | Close tab (default: last) |

### Other

| Command | Description |
|---|---|
| `mb js <code>` | Run JavaScript in page context |
| `mb wait <target>` | Wait for ms / selector / networkidle / url:pattern |
| `mb audit` | Design audit (palette, typography, contrast, a11y, SEO) |
| `mb logs` | Stream console logs (Ctrl+C to stop) |

### Flags

| Flag | Default | Description |
|---|---|---|
| `--timeout <ms>` | 30000 | Command timeout |
| `--tab <n>` | 0 | Target tab index |
| `--json` | false | Structured JSON output |
| `--right` | false | Right-click |
| `--double` | false | Double-click |
| `--fps <n>` | 30 | Recording frame rate |
| `--scale <n>` | 1 | Recording scale factor |

## Usage Patterns

### Observe → Act loop

The standard agent loop: snapshot the page, pick an element, act on it.

```bash
mb snap                          # list interactive elements with (x, y)
mb click 512 380                 # click the button at those coordinates
mb wait networkidle              # wait for the page to settle
mb snap                          # observe again
```

### Fill and submit a form

```bash
mb go "https://example.com/login"
mb fill "Email=user@example.com" "Password=hunter2"
mb key Enter
mb wait url:/dashboard
```

### Take a screenshot

```bash
mb shot page.png
```

### Extract text

```bash
mb text "main"                   # text from <main>
mb text "#content"               # text from #content
mb text                          # full body text
```

### Run JavaScript

```bash
mb js 'document.title'
echo 'document.querySelectorAll("a").length' | mb js -
```

### Record a screencast

```bash
mb record start demo.mp4 --fps 30 --scale 1
# ... interact with the page ...
mb record stop
```

### Design audit

```bash
mb audit                         # human-readable report
mb audit --json                  # structured JSON output
```

### Dismiss overlays

Cookie banners and modals block clicks. Remove them with JS:

```bash
mb js 'document.querySelector("[class*=cookie]")?.remove()'
```

### Wait strategies

```bash
mb wait 2000                     # sleep 2 seconds
mb wait ".modal"                 # wait for selector to appear
mb wait networkidle              # wait for no network activity
mb wait url:/dashboard           # wait for URL to contain string
```

## Important Notes

- **Viewport is 1024×768.** `snap` only returns elements in the current viewport — scroll and snap again to find more.
- **`text` uses querySelector** — returns first match only. Use `text "main"` over `text "p"` for better results.
- **`go` waits for networkidle.** For heavy SPAs, follow up with `wait ".selector"`.
- **`type` with coordinates triple-clicks first** to select existing text, then types the replacement.
- **`fill` field matching order:** aria-label → placeholder → name attr → id → label text → CSS selector (use `#`/`.`/`[` prefix).
- **`--json` output:** `snap` → `[{role, name, x, y, state}]`, `tab list` → `[{index, url, title}]`, `logs` → JSON lines, `audit` → full audit object.
- **Recording state** is stored in `~/.mb-recorder.json`. Only one recording at a time.
- **`tab close`** cannot close the last remaining tab.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Chrome not found" | Set `CHROME_BIN=/path/to/chrome` |
| Connection refused | Run `mb-start-chrome` first |
| Stale recording state | Delete `~/.mb-recorder.json` |
| Chrome window wrong size | `mb-restart-chrome` (creates fresh profile) |
| Element not in snap output | `mb scroll down 500` then `mb snap` again |
