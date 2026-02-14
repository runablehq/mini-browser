import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"
import type { KeyInput } from "puppeteer-core"

export const key = async (args: string[], flags: Flags) => {
  if (args.length === 0) {
    console.error("Usage: mb key <key...>")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)

  for (const k of args) {
    if (!k.includes("+")) {
      await page.keyboard.press(k as KeyInput)
      continue
    }

    const parts = k.split("+")
    const modifiers = parts.slice(0, -1)
    const finalKey = parts.at(-1)!

    for (const m of modifiers) await page.keyboard.down(m as KeyInput)
    await page.keyboard.press(finalKey as KeyInput)
    for (const m of [...modifiers].reverse()) await page.keyboard.up(m as KeyInput)
  }

  close()
}
