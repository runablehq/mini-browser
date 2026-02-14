import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

// Fill multiple form fields at once
// Usage: mb fill '{"Email": "test@example.com", "Password": "secret"}'
// Keys can be: accessible name, placeholder, label text, or CSS selector

interface ParseFieldsInput {
  json: string
}

const parseFields = ({ json }: ParseFieldsInput) => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON for fill. Use: mb fill \'{"Field Name":"value"}\'')
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Fill payload must be a JSON object of field/value pairs")
  }

  const entries = Object.entries(parsed as Record<string, unknown>)
  const invalidEntry = entries.find(([, value]) => typeof value !== "string")
  if (invalidEntry) {
    throw new Error(`Fill value for "${invalidEntry[0]}" must be a string`)
  }

  return parsed as Record<string, string>
}

export const fill = async (args: string[], flags: Flags) => {
  const json = args[0]
  if (!json) {
    throw new Error('Usage: mb fill \'{"Field Name":"value", ...}\'')
  }

  const fields = parseFields({ json })
  const { page, close } = await connect(flags.tab)

  const results = await page.evaluate((fields) => {
    const filled: string[] = []
    const failed: string[] = []

    const query = (selector: string, key: string) => {
      try {
        return document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
      } catch {
        throw new Error(`Invalid selector for field "${key}": ${selector}`)
      }
    }

    const escapeSelectorValue = (value: string) => {
      if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value)
      }
      return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    }

    const findInput = (key: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null => {
      // Try CSS selector first
      if (key.startsWith("#") || key.startsWith(".") || key.startsWith("[")) {
        return query(key, key)
      }

      const escapedKey = escapeSelectorValue(key)

      // Try by aria-label
      const byAria = query(`[aria-label="${escapedKey}"]`, key)
      if (byAria) return byAria

      // Try by placeholder
      const byPlaceholder = query(`[placeholder="${escapedKey}"]`, key)
      if (byPlaceholder) return byPlaceholder

      // Try by name attribute
      const byName = query(`[name="${escapedKey}"]`, key)
      if (byName) return byName

      // Try by id
      const byId = document.getElementById(key) as HTMLInputElement
      if (byId) return byId

      // Try by label text
      const labels = document.querySelectorAll("label")
      for (const label of labels) {
        if (label.textContent?.trim().toLowerCase().includes(key.toLowerCase())) {
          const forId = label.getAttribute("for")
          if (forId) {
            const input = document.getElementById(forId) as HTMLInputElement
            if (input) return input
          }
          const input = label.querySelector("input, textarea, select") as HTMLInputElement
          if (input) return input
        }
      }

      return null
    }

    for (const [key, value] of Object.entries(fields)) {
      const el = findInput(key)
      if (!el) {
        failed.push(key)
        continue
      }

      if (el.tagName === "SELECT") {
        (el as HTMLSelectElement).value = value
      } else {
        (el as HTMLInputElement).value = value
      }
      
      // Trigger change event
      el.dispatchEvent(new Event("input", { bubbles: true }))
      el.dispatchEvent(new Event("change", { bubbles: true }))
      filled.push(key)
    }

    return { filled, failed }
  }, fields)

  close()

  if (results.filled.length > 0) {
    console.log(`Filled: ${results.filled.join(", ")}`)
  }
  if (results.failed.length > 0) {
    throw new Error(`Not found: ${results.failed.join(", ")}`)
  }
}
