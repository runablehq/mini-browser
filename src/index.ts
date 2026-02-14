import { parse } from "./lib/flags"
import { go } from "./commands/go"
import { url } from "./commands/url"
import { back } from "./commands/back"
import { forward } from "./commands/forward"
import { shot } from "./commands/shot"
import { snap } from "./commands/snap"
import { text } from "./commands/text"
import { click } from "./commands/click"
import { type } from "./commands/type"
import { fill } from "./commands/fill"
import { key } from "./commands/key"
import { move } from "./commands/move"
import { drag } from "./commands/drag"
import { scroll } from "./commands/scroll"
import { js } from "./commands/js"
import { wait } from "./commands/wait"
import { audit } from "./commands/audit"

const commands = { go, url, back, forward, shot, snap, text, click, type, fill, key, move, drag, scroll, js, wait, audit }

const help = `mb — Browser CLI for Agents

Usage: mb <command> [args] [flags]

Navigation:
  go <url>              Navigate to URL
  url                   Print current URL
  back                  Go back
  forward               Go forward

Observe:
  shot [file]           Screenshot (default: ./shot.png)
  snap                  Interactive elements with (x, y)
  text [selector]       Visible text content

Interact:
  click <x> <y>         Click at coordinates
  type [x y] <text>     Type text (triple-clicks to select first)
  fill <k=v...>         Fill form: Email=a@b.com "Name=Jo Do"
  key <key...>          Press keys (Enter, Tab, Meta+a)
  move <x> <y>          Move mouse / hover
  drag <x1> <y1> <x2> <y2>  Drag
  scroll <dir> [px]     Scroll up/down/left/right

Other:
  js <code>             Run JavaScript
  wait <target>         Wait for ms/selector/networkidle/url:...
  audit                 Design audit (colors, fonts, spacing, contrast)

Flags:
  --timeout <ms>        Timeout (default: 30000)
  --tab <n>             Tab index (default: 0)
  --json                JSON output
  --right/--double      Right/double click`

const main = async () => {
  try {
    const { args, flags } = parse(process.argv.slice(2))
    const [cmd, ...rest] = args

    if (!cmd || flags.help) {
      console.log(help)
      process.exit(0)
    }

    const handler = commands[cmd as keyof typeof commands]
    if (!handler) {
      throw new Error(`Unknown command: ${cmd}\nRun 'mb --help' for usage`)
    }

    await handler(rest, flags)
  } catch (e) {
    console.error(`Error: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }
}

main()
