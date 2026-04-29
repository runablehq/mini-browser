import puppeteer, { type Target } from "puppeteer-core"
import { CDP_URL, VIEWPORT } from "./config"

/* puppeteer-core does not expose a public method for the underlying CDP
 target id, so we reach into `_targetId`. */

export const targetId = (t: Target) =>
  (t as unknown as { _targetId: string })._targetId

export const connect = async (tab?: string) => {

  const browser = await puppeteer.connect({
    browserURL: CDP_URL,
    defaultViewport: VIEWPORT,
  })

  const targets = browser.targets().filter((t) => t.type() === "page")
  const target = tab ? targets.find((t) => targetId(t) === tab) : targets[0]
  
  const page = target ? await target.page() : null

  if (!page) {
    await browser.disconnect()
    throw new Error(tab ? `No tab with id: ${tab}` : "No open tabs")
  }

  return {
    browser,
    page,
    close: () => browser.disconnect() as Promise<void>,
  }
}
