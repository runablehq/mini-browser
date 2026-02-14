import puppeteer from "puppeteer-core"
import { CDP_URL, VIEWPORT } from "../lib/config"
import type { Flags } from "../lib/flags"

const subcommands = { list, new: newTab, close }

const help = `Usage: mb tab <list|new|close> [args]

  list              List open tabs
  new [url]         Open new tab, print index
  close [n]         Close tab (default: last)`

export const tab = async (args: string[], flags: Flags) => {
  const [sub, ...rest] = args

  if (!sub || !(sub in subcommands)) {
    console.error(help)
    process.exit(1)
  }

  const handler = subcommands[sub as keyof typeof subcommands]
  await handler(rest, flags)
}

async function list(_args: string[], flags: Flags) {
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: VIEWPORT })
  const pages = await browser.pages()

  const entries = await Promise.all(
    pages.map(async (page, i) => ({
      index: i,
      url: page.url(),
      title: await page.title(),
    }))
  )

  await browser.disconnect()

  if (flags.json) {
    console.log(JSON.stringify(entries, null, 2))
    return
  }

  for (const { index, url, title } of entries) {
    console.log(`${index}\t${url}\t${title}`)
  }
}

async function newTab(args: string[], flags: Flags) {
  const url = args[0]
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: VIEWPORT })
  const page = await browser.newPage()

  if (url) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: flags.timeout })
    } catch (e) {
      await page.close()
      await browser.disconnect()
      throw e
    }
  }

  const pages = await browser.pages()
  const index = pages.indexOf(page)
  await browser.disconnect()
  console.log(index)
}

async function close(args: string[], _flags: Flags) {
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: VIEWPORT })
  const pages = await browser.pages()

  if (pages.length <= 1) {
    await browser.disconnect()
    throw new Error("Cannot close the last tab")
  }

  const index = args[0] !== undefined ? Number(args[0]) : pages.length - 1

  if (!Number.isInteger(index) || index < 0 || index >= pages.length) {
    await browser.disconnect()
    throw new Error(`Invalid tab index: ${args[0]}. Open tabs: 0-${pages.length - 1}`)
  }

  const target = pages[index]!
  const url = target.url()
  await target.close()
  await browser.disconnect()
  console.log(`Closed tab ${index}\t${url}`)
}
