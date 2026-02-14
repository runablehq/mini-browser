import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const type = async (args: string[], flags: Flags) => {
  if (args.length === 0) {
    console.error("Usage: mb type <text> OR mb type <x> <y> <text>")
    process.exit(1)
  }

  const maybeX = +args[0]!
  const maybeY = +args[1]!
  const hasCoords = args.length >= 3 && !isNaN(maybeX) && !isNaN(maybeY)

  const coords = hasCoords ? { x: maybeX, y: maybeY } : null
  const text = hasCoords ? args.slice(2).join(" ") : args.join(" ")

  if (!text) {
    console.error("Text is required")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)

  if (coords) {
    // Triple-click to select all text in the field
    await page.mouse.click(coords.x, coords.y, { clickCount: 3 })
    await new Promise(r => setTimeout(r, 50))
  }

  // Type replaces selection (or appends if nothing selected)
  await page.keyboard.type(text)

  await close()
}
