import puppeteer from "puppeteer-core"
import { CDP_URL, VIEWPORT } from "../lib/config"
import { targetId } from "../lib/browser"
import type { Flags } from "../lib/flags"

const subcommands = { list, new: newTab, close }

const help = `Usage: mb tab <list|new|close> [args]

  list              List open tabs (id, url, title)
  new [url]         Open new tab, print id
  close [id]        Close tab by id (default: last opened)`

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
  const targets = browser.targets().filter((t) => t.type() === "page")

  const entries = await Promise.all(
    targets.map(async (target) => {
      const page = await target.page()
      return {
        id: targetId(target),
        url: target.url(),
        title: page ? await page.title() : "",
      }
    }),
  )

  await browser.disconnect()

  if (flags.json) {
    console.log(JSON.stringify(entries, null, 2))
    return
  }

  for (const { id, url, title } of entries) {
    console.log(`${id}\t${url}\t${title}`)
  }
}

async function newTab(args: string[], flags: Flags) {
  const url = args[0]
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: VIEWPORT })

  /* page.tagrte is deprecated in puppeteer-core, 
  so we use the CDP Target.createTarget directly to get the targetId */

  const cdp = await browser.target().createCDPSession()
  const { targetId: id } = await cdp.send("Target.createTarget", { url: "about:blank" })
  await cdp.detach()

  const target = await browser.waitForTarget((t) => targetId(t) === id)
  const page = await target.page()
  
  if (!page) {
    await browser.disconnect()
    throw new Error("Failed to attach to new tab")
  }

  if (url) {
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: flags.timeout })
    } catch (e) {
      await page.close()
      await browser.disconnect()
      throw e
    }
  }

  await browser.disconnect()
  console.log(id)
}

async function close(args: string[], _flags: Flags) {
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: VIEWPORT })
  const targets = browser.targets().filter((t) => t.type() === "page")

  if (targets.length <= 1) {
    await browser.disconnect()
    throw new Error("Cannot close the last tab")
  }

  const requestedId = args[0]

  const target = requestedId
    ? targets.find((t) => targetId(t) === requestedId)
    : targets[targets.length - 1]

  if (!target) {
    await browser.disconnect()
    throw new Error(`No tab with id: ${requestedId}`)
  }

  const id = targetId(target)
  const url = target.url()
  const page = await target.page()
  await page!.close()
  await browser.disconnect()
  
  console.log(`Closed tab ${id}\t${url}`)
}
