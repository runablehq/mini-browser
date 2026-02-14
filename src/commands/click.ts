import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const click = async (args: string[], flags: Flags) => {
  const [xStr, yStr] = args
  if (!xStr || !yStr) {
    console.error("Usage: mb click <x> <y>")
    process.exit(1)
  }

  const x = +xStr
  const y = +yStr
  if (isNaN(x) || isNaN(y)) {
    console.error("x and y must be numbers")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)
  await page.mouse.click(x, y, {
    button: flags.right ? "right" : "left",
    clickCount: flags.double ? 2 : 1,
  })
  await close()
}
