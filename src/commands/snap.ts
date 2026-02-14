import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

// Chrome's AX tree for names/roles + DOM.getBoxModel for coordinates.

const INTERACTIVE_ROLES = new Set([
  "link", "button", "textbox", "combobox", "searchbox",
  "checkbox", "radio", "switch", "slider", "spinbutton",
  "tab", "menuitem", "menuitemcheckbox", "menuitemradio",
  "option", "treeitem", "select",
])

const STATE_PROPS = new Set([
  "haspopup", "expanded", "checked", "selected", "disabled", "pressed",
])

const VIEWPORT_MARGIN = 5

interface SnapElement {
  role: string
  name: string
  x: number
  y: number
  state: Record<string, unknown>
}

interface Viewport {
  width: number
  height: number
}

const getBox = async (client: any, backendNodeId: number) => {
  const { model } = await client.send("DOM.getBoxModel", { backendNodeId }) as { model: any }
  if (model.width === 0 || model.height === 0) return null
  const [x1, y1, x2, , , y3] = model.border
  return {
    x: Math.round((x1 + x2) / 2),
    y: Math.round((y1 + y3) / 2),
  }
}

const inViewport = ({ x, y }: { x: number; y: number }, viewport: Viewport) =>
  x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height + VIEWPORT_MARGIN

const extractState = (properties: any[]) =>
  (properties ?? []).reduce<Record<string, unknown>>((acc, p) => {
    if (STATE_PROPS.has(p.name)) acc[p.name] = p.value.value
    return acc
  }, {})

const nameFallback = (name: string, role: string, properties: any[]) => {
  if (name) return name
  // for links, try to extract href from properties
  const href = properties?.find((p: any) => p.name === "url")?.value?.value
  if (href && role === "link") {
    try { return new URL(href).pathname.replace(/\/$/, "") || href } catch {}
  }
  return ""
}

const formatElement = (el: SnapElement, index: number) => {
  const stateStr = Object.entries(el.state)
    .map(([k, v]) => `[${k}=${v}]`)
    .join(" ")
  return `[${index}] ${el.role} "${el.name}" (${el.x}, ${el.y})${stateStr ? " " + stateStr : ""}`
}

export const snap = async (args: string[], flags: Flags) => {
  const { page, close } = await connect(flags.tab)
  const client = await page.createCDPSession()

  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const { nodes } = await client.send("Accessibility.getFullAXTree") as { nodes: any[] }

  const interesting = nodes.filter(n =>
    !n.ignored && n.backendDOMNodeId && INTERACTIVE_ROLES.has(n.role?.value)
  )

  const elements = (await Promise.all(
    interesting.map(async (n): Promise<SnapElement | null> => {
      try {
        const box = await getBox(client, n.backendDOMNodeId)
        if (!box || !inViewport(box, viewport)) return null

        return {
          role: n.role.value,
          name: nameFallback(n.name?.value || "", n.role.value, n.properties),
          ...box,
          state: extractState(n.properties),
        }
      } catch {
        return null
      }
    })
  ))
    .filter((el): el is SnapElement => el !== null)
    .sort((a, b) => a.y - b.y || a.x - b.x)

  await client.detach()
  await close()

  if (flags.json) {
    console.log(JSON.stringify(elements, null, 2))
    return
  }

  elements.forEach((el, i) => console.log(formatElement(el, i)))
}
