import puppeteer, { type Page, type Protocol } from "puppeteer-core"
import { CDP_URL, VIEWPORT } from "../lib/config"
import type { Flags } from "../lib/flags"

export const logs = async (_args: string[], flags: Flags) => {
  const browser = await puppeteer.connect({
    browserURL: CDP_URL,
    defaultViewport: VIEWPORT,
  })

  const setupPage = async (page: Page, index: number) => {
    const client = await page.createCDPSession()
    await client.send("Runtime.enable")

    client.on("Runtime.consoleAPICalled", (event: Protocol.Runtime.ConsoleAPICalledEvent) => {
      const args = event.args
        .map((a) => a.value !== undefined ? String(a.value) : a.description ?? "")
        .join(" ")
      
      const time = new Date().toLocaleTimeString("en-US", { hour12: false })
      const type = event.type === "warning" ? "warn" : event.type
      
      if (flags.json) {
        console.log(JSON.stringify({ tab: index, type, time, message: args }))
      } else {
        const prefix = index > 0 ? `[${index}] ` : ""
        console.log(`${prefix}[${time}] ${type}: ${args}`)
      }
    })
  }

  // Setup existing pages
  const pages = await browser.pages()
  for (let i = 0; i < pages.length; i++) {
    await setupPage(pages[i]!, i)
  }

  // Listen for new pages
  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      const page = await target.page()
      if (page) {
        const allPages = await browser.pages()
        const index = allPages.indexOf(page)
        await setupPage(page, index)
      }
    }
  })

  console.error("Watching console logs... (Ctrl+C to stop)\n")

  // Keep alive until Ctrl+C
  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.error("\nStopped")
      resolve()
    })
  })

  await browser.disconnect()
}
