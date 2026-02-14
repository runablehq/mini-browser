```
               ┌─────────────────────────────────────────┐
               │  ███╗   ███╗██████╗                     │
               │  ████╗ ████║██╔══██╗                    │
               │  ██╔████╔██║██████╔╝                    │
               │  ██║╚██╔╝██║██╔══██╗                    │
               │  ██║ ╚═╝ ██║██████╔╝                    │
               │  ╚═╝     ╚═╝╚═════╝                     │
               │                                         │
               │     mini-browser for agents             │
               └─────────────────────────────────────────┘
```

A lightweight browser CLI for AI agents. Navigate, observe, interact — all from the command line.

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Build the CLI
bun run build

# 3. Start Chrome with remote debugging
./start-chrome.sh

# 4. You're ready!
node dist/mb.js --help
```

---

## Demo

```bash
# Navigate to a page
$ mb go "https://example.com"
https://example.com/

# Get page text
$ mb text
Example Domain

This domain is for use in documentation examples without needing permission.

Learn more

# Find interactive elements with coordinates
$ mb snap
[0] link "Learn more" (246, 223)

# Click by coordinates
$ mb click 246 223

# Check where we ended up
$ mb url
https://www.iana.org/help/example-domains

# Go back
$ mb back

# Take a screenshot
$ mb shot page.png
page.png
```

---

## Commands

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVIGATION                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  go <url>              Navigate to URL                              │
│  url                   Print current URL                            │
│  back                  Go back                                      │
│  forward               Go forward                                   │
├─────────────────────────────────────────────────────────────────────┤
│  OBSERVE                                                            │
├─────────────────────────────────────────────────────────────────────┤
│  shot [file]           Screenshot (default: ./shot.png)             │
│  snap                  Interactive elements with (x, y) coords      │
│  text [selector]       Visible text content                         │
├─────────────────────────────────────────────────────────────────────┤
│  INTERACT                                                           │
├─────────────────────────────────────────────────────────────────────┤
│  click <x> <y>         Click at coordinates                         │
│  type [x y] <text>     Type text (triple-clicks to select first)    │
│  fill <k=v...>         Fill form: Email=a@b.com "Name=Jo Do"        │
│  key <key...>          Press keys (Enter, Tab, Meta+a)              │
│  move <x> <y>          Move mouse / hover                           │
│  drag <x1> <y1> <x2> <y2>  Drag from point to point                 │
│  scroll <dir> [px]     Scroll up/down/left/right                    │
├─────────────────────────────────────────────────────────────────────┤
│  TABS                                                               │
├─────────────────────────────────────────────────────────────────────┤
│  tab list              List open tabs                               │
│  tab new [url]         Open new tab, print index                    │
│  tab close [n]         Close tab (default: last)                    │
├─────────────────────────────────────────────────────────────────────┤
│  OTHER                                                              │
├─────────────────────────────────────────────────────────────────────┤
│  js <code>             Run JavaScript in page context               │
│  wait <target>         Wait for ms/selector/networkidle/url:...     │
│  audit                 Design audit (colors, fonts, contrast)       │
│  logs                  Stream console logs (Ctrl+C to stop)         │
└─────────────────────────────────────────────────────────────────────┘
```

### Flags

| Flag | Description |
|------|-------------|
| `--timeout <ms>` | Command timeout (default: 30000) |
| `--tab <n>` | Target tab index (default: 0) |
| `--json` | JSON output |
| `--right` | Right-click |
| `--double` | Double-click |

---

## How It Works

```
┌──────────┐     CDP      ┌─────────────────┐
│    mb    │ ◄──────────► │  Chrome/Chromium │
│   CLI    │   (9222)     │  (debug mode)    │
└──────────┘              └─────────────────┘
```

1. **Start Chrome** with `--remote-debugging-port=9222`
2. **Run commands** — `mb` connects via Chrome DevTools Protocol
3. **Observe + Interact** — screenshots, text, clicks, forms, etc.

---

## For Agents

The `snap` command is your best friend:

```bash
$ mb snap
[0] button "Sign In" (845, 32)
[1] input[type=email] (512, 245)
[2] input[type=password] (512, 312)
[3] button "Submit" (512, 380)
[4] link "Forgot password?" (512, 420)
```

Each element has **coordinates** — use them with `click`, `type`, or `fill`.

```bash
# Click the Sign In button
mb click 845 32

# Or fill a form by label
mb fill Email=user@example.com Password=secret123
mb click 512 380
```

---
