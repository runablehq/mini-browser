import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const go = async (args: string[], flags: Flags) => {
  const url = args[0]
  if (!url) {
    console.error("Usage: mb go <url>")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: flags.timeout })
  console.log(page.url())
  await close()
}
