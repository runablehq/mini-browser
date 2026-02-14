import puppeteer, { type Page } from "puppeteer-core"
import { CDP_URL, VIEWPORT } from "./config"

export const connect = async (tab = 0) => {
  const browser = await puppeteer.connect({
    browserURL: CDP_URL,
    defaultViewport: VIEWPORT,
  })
  const pages = await browser.pages()
  if (tab < 0 || tab >= pages.length) {
    await browser.disconnect()
    throw new Error(`Invalid tab index: ${tab}. Open tabs: 0-${pages.length - 1}`)
  }
  const page = pages[tab]!
  if (!page) throw new Error("No pages found")
  return { browser, page, close: () => browser.disconnect() as Promise<void> }
}

interface WithPageInput {
  tab: number
}

export const withPage = async <T>(
  { tab }: WithPageInput,
  fn: (page: Page) => Promise<T>
) => {
  const { page, close } = await connect(tab)
  try {
    return await fn(page)
  } finally {
    await close()
  }
}
