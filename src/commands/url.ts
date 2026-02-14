import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

export const url = async (args: string[], flags: Flags) => {
  const { page, close } = await connect(flags.tab)
  console.log(page.url())
  await close()
}
