import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const move = async (args: string[], flags: Flags) => {
  if (args.length < 2) {
    console.error("Usage: mb move <x> <y>")
    process.exit(1)
  }

  const x = +args[0]!
  const y = +args[1]!
  if (isNaN(x) || isNaN(y)) {
    console.error("x and y must be numbers")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)
  await page.mouse.move(x, y)
  await close()
}
