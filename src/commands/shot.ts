import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const shot = async (args: string[], flags: Flags) => {
  const path = args[0] || "./shot.png"
  const { page, close } = await connect(flags.tab)
  await page.screenshot({ path, type: "png" })
  console.log(path)
  await close()
}
