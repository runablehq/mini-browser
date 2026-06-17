import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const reload = async (args: string[], flags: Flags) => {
  const { page, close } = await connect(flags.tab)
  await page.reload({ waitUntil: "networkidle0", timeout: flags.timeout })
  console.log(page.url())
  await close()
}
