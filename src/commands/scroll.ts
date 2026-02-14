import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

const deltas: Record<string, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const scroll = async (args: string[], flags: Flags) => {
  const dir = args[0] || "down"
  const px = Number(args[1] || 500)

  const delta = deltas[dir]
  if (!delta) {
    console.error("Direction must be: up, down, left, right")
    process.exit(1)
  }
  if (!Number.isFinite(px) || px <= 0) {
    console.error("Pixels must be a positive number")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)
  await page.evaluate(({ x, y }) => window.scrollBy(x, y), { x: delta.x * px, y: delta.y * px })
  close()
}
