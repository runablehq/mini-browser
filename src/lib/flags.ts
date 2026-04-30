import { parseArgs } from "node:util"
import { DEFAULT_TIMEOUT } from "./config"

interface NumericFlagInput {
  name: string
  value: unknown
}

interface FormatParseArgsErrorInput {
  error: unknown
}

interface OptionalPositiveIntegerFlagInput {
  name: string
  value: unknown
}

const parseNumericFlag = ({ name, value }: NumericFlagInput) => {
  if (typeof value !== "string") {
    throw new Error(`Invalid value for --${name}: "${String(value)}". Expected a number.`)
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`Invalid value for --${name}: "${value}". Expected a number.`)
  }
  return numeric
}

const parseOptionalPositiveIntegerFlag = ({ name, value }: OptionalPositiveIntegerFlagInput) => {
  if (value === undefined) return undefined
  const numeric = parseNumericFlag({ name, value })
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`Invalid value for --${name}: "${String(value)}". Expected a positive integer.`)
  }
  return numeric
}

const formatParseArgsError = ({ error }: FormatParseArgsErrorInput) => {
  const message = error instanceof Error ? error.message : String(error)
  const unknownFlag = message.match(/Unknown option '([^']+)'/)
  if (unknownFlag?.[1]) {
    return `Unknown flag ${unknownFlag[1]}. Run 'mb --help' for usage.`
  }
  return `Invalid flags: ${message}`
}

export const parse = (argv: string[]) => {
  const parsed = (() => {
    try {
      return parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
          timeout: { type: "string", default: String(DEFAULT_TIMEOUT) },
          tab: { type: "string" },
          json: { type: "boolean", default: false },
          right: { type: "boolean", default: false },
          double: { type: "boolean", default: false },
          help: { type: "boolean", short: "h", default: false },
          fps: { type: "string" },
          scale: { type: "string" },
          width: { type: "string" },
          height: { type: "string" },
        },
      })
    } catch (error) {
      throw new Error(formatParseArgsError({ error }))
    }
  })()

  const { values, positionals } = parsed

  return {
    args: positionals,
    flags: {
      timeout: parseNumericFlag({ name: "timeout", value: values.timeout }),
      tab: values.tab,
      json: values.json!,
      right: values.right!,
      double: values.double!,
      help: values.help!,
      fps: values.fps ? parseNumericFlag({ name: "fps", value: values.fps }) : undefined,
      scale: values.scale ? parseNumericFlag({ name: "scale", value: values.scale }) : undefined,
      width: parseOptionalPositiveIntegerFlag({ name: "width", value: values.width }),
      height: parseOptionalPositiveIntegerFlag({ name: "height", value: values.height }),
    },
  }
}

export type Flags = ReturnType<typeof parse>["flags"]
