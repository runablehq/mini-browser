import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const back = async (args: string[], flags: Flags) => {
  const { page, close } = await connect(flags.tab)
  await page.goBack({ waitUntil: "domcontentloaded", timeout: flags.timeout })
  console.log(page.url())
  close()
}
