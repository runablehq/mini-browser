import puppeteer, { type Page } from "puppeteer-core"
import { CDP_URL, VIEWPORT } from "./config"

export const connect = async (tab = 0) => {
  const browser = await puppeteer.connect({
    browserURL: CDP_URL,
  })
  const pages = await browser.pages()
  const page = pages[tab] ?? pages[0]
  if (!page) throw new Error("No pages found")
  await page.setViewport(VIEWPORT)
  return { browser, page, close: () => browser.disconnect() }
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
    close()
  }
}
