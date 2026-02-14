import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const drag = async (args: string[], flags: Flags) => {
  if (args.length < 4) {
    console.error("Usage: mb drag <x1> <y1> <x2> <y2>")
    process.exit(1)
  }

  const coords = args.map(Number)
  const [x1, y1, x2, y2] = coords
  if (coords.some(isNaN)) {
    console.error("All coordinates must be numbers")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)

  await page.mouse.move(x1!, y1!)
  await page.mouse.down()
  await page.mouse.move(x2!, y2!, { steps: 10 })
  await page.mouse.up()

  close()
}
