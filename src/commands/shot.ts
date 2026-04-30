import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

interface ViewportFlagsInput {
  flags: Flags
}

const getViewportSize = ({ flags }: ViewportFlagsInput) => {
  const { width, height } = flags
  const hasWidth = width !== undefined
  const hasHeight = height !== undefined

  if (!hasWidth && !hasHeight) return undefined
  if (!hasWidth || !hasHeight) {
    throw new Error("--width and --height must be provided together.")
  }

  return { width, height }
}

export const shot = async (args: string[], flags: Flags) => {
  const path = args[0] || "./shot.png"
  const viewportSize = getViewportSize({ flags })
  const { page, close } = await connect(flags.tab)
  try {
    if (viewportSize) {
      await page.setViewport(viewportSize)
    }
    await page.screenshot({ path, type: "png" })
    console.log(path)
  } finally {
    await close()
  }
}
