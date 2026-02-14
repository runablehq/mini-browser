import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const forward = async (args: string[], flags: Flags) => {
  const { page, close } = await connect(flags.tab)
  await page.goForward({ waitUntil: "domcontentloaded", timeout: flags.timeout })
  console.log(page.url())
  await close()
}
