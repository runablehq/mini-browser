import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const text = async (args: string[], flags: Flags) => {
  const selector = args[0] || "body"
  const { page, close } = await connect(flags.tab)

  const content = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null
    return el?.innerText?.trim() ?? null
  }, selector)

  await close()

  if (content === null) {
    console.error(`Selector not found: ${selector}`)
    process.exit(1)
  }

  console.log(content)
}
