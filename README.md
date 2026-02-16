
# mb · mini-browser for agents

Browser CLI for agents. Each command is a small Unix tool — reads args, writes stdout, composes with pipes and `&&`.

## Setup

```bash
npm install -g @runablehq/mini-browser
mb-start-chrome            # starts Chrome with --remote-debugging-port=9222
mb go "https://example.com"
```

Also ships `mb-restart-chrome` to kill and relaunch the debug Chrome instance.

For local development: `bun install && bun run build`, then use `node dist/mb.js`.

## Commands

```
Navigation:
  go <url>                    Navigate (waits for networkidle)
  url                         Print current URL
  back / forward              History navigation

Observe:
  text [selector]             Visible text (selector uses querySelector, default: body)
  shot [file]                 Screenshot (default: ./shot.png)
  snap                        Interactive elements via Accessibility Tree

Interact:
  click <x> <y>               Click at coordinates
  type [x y] <text>           Type text (with coords: triple-clicks to select first)
  fill <k=v...>               Fill form fields by label/name/placeholder/selector
  key <key...>                Press keys — supports combos: Meta+a, Ctrl+Shift+T
  move <x> <y>                Hover
  drag <x1> <y1> <x2> <y2>   Drag between points
  scroll [dir] [px]           Scroll (default: down 500)

Tabs:
  tab list / new [url] / close [n]

Other:
  js <code>                   Eval JS in page — strings print raw, objects print JSON
  wait <ms|selector|networkidle|url:pattern>
  audit                       Design audit (colors, fonts, contrast)
  logs                        Stream console logs

Flags:
  --timeout <ms>   (default: 30000)
  --tab <n>        target tab (default: 0)
  --json           structured output (snap, tab list, logs)
  --right          right-click
  --double         double-click
```

## Notes

All output goes to stdout. Pipe to grep, jq, wc, or redirect to files as usual.

`js` reads from stdin with `-`:
    echo 'document.title' | mb js -
    cat scrape.js | mb js -

`text` calls querySelector — returns first match only. `text "p"` may return empty
if the first `<p>` on the page is empty. Use a scoped selector like `text "main"` or
`text "#content"` for better results on noisy pages.

`snap` output format:
    [0] button "Submit" (512, 380)
    [1] textbox "Email" (512, 245) [disabled=true]
It returns role, accessible name, center (x,y) coords, and state flags (checked,
expanded, disabled, selected, pressed, haspopup). Only elements in the current
viewport are returned — scroll down and snap again to find more.

`fill` matches fields by accessible name, label text, placeholder, then CSS selector
in that order. Use `fill "#my-input=value"` to target by selector when labels are
missing.

`type` without coordinates types at current focus. With coordinates it triple-clicks
the field first (selects all existing text) then types the replacement.

`wait` picks its strategy from the argument format:
    wait 2000           sleep (ms)
    wait ".modal"       wait for selector
    wait networkidle    wait for no network activity
    wait url:/dashboard wait for URL to contain string

`scroll` defaults to `scroll down 500` if called with no args.

`go` waits for networkidle0 before returning, so SPAs render before the next command
runs. For heavy SPAs that fetch data after mount, follow up with `wait ".selector"`
for a content element.

`--json` on snap returns `[{role, name, x, y, state}]`. On tab list returns
`[{index, url, title}]`. On logs emits JSON lines `{tab, type, time, message}`.

Overlays (cookie banners, modals) block clicks on elements underneath. Dismiss them
first, or remove via JS:
    mb js 'document.querySelector("[class*=cookie]")?.remove()'
    mb js 'document.body.style.overflow="auto"'
