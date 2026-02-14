import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const wait = async (args: string[], flags: Flags) => {
  const target = args[0]
  if (!target) {
    console.error("Usage: mb wait <ms | selector | networkidle | url:...>")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)

  const ms = +target
  if (!isNaN(ms) && target === String(ms)) {
    await new Promise(r => setTimeout(r, ms))
    await close()
    return
  }

  if (target === "networkidle") {
    await page.waitForNetworkIdle({ timeout: flags.timeout })
    await close()
    return
  }

  if (target.startsWith("url:")) {
    await page.waitForFunction(
      (p) => location.href.includes(p),
      { timeout: flags.timeout },
      target.slice(4)
    )
    await close()
    return
  }

  await page.waitForSelector(target, { timeout: flags.timeout })
  await close()
}
