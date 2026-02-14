import { text as readStdin } from "node:stream/consumers"
import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const js = async (args: string[], flags: Flags) => {
  const code = args[0] === "-"
    ? await readStdin(process.stdin)
    : args.join(" ")

  if (!code.trim()) {
    console.error("Usage: mb js <code> OR echo 'code' | mb js -")
    process.exit(1)
  }

  const { page, close } = await connect(flags.tab)
  const result = await page.evaluate(code)
  close()

  if (result === undefined || result === null) return
  console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2))
}
