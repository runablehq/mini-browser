import { connect } from "../lib/browser"
import type { Flags } from "../lib/flags"

// --- interfaces ---

interface ColorEntry {
  hex: string
  count: number
  uses: string[]
}

interface CountEntry {
  value: string
  count: number
}

interface NamedCount {
  name: string
  count: number
}

interface A11yData {
  imagesNoAlt: number
  inputsNoLabel: number
  linksNoText: number
  buttonsNoText: number
  headings: number[]
  lang: string
  title: string
}

interface SeoData {
  title: string
  metaDescription: string
  canonical: string
  h1Count: number
  h1Text: string
  hasViewport: boolean
  og: { title: boolean; description: boolean; image: boolean }
}

interface DesignData {
  colors: ColorEntry[]
  families: NamedCount[]
  sizes: CountEntry[]
  weights: CountEntry[]
  margins: CountEntry[]
  paddings: CountEntry[]
  radii: CountEntry[]
  a11y: A11yData
  seo: SeoData
}

interface ContrastIssue {
  selector: string
  ratio: number
  threshold: number
  fontSize: string
  fontWeight: string
}

interface BrowserIssue {
  code: string
  detail: string
}

// --- pure helpers ---

const findHeadingSkips = (headings: number[]) =>
  headings.reduce<string[]>((skips, level, i) => {
    const prev = headings[i - 1]
    if (i > 0 && prev !== undefined && level > prev + 1)
      return [...skips, `h${prev}→h${level}`]
    return skips
  }, [])

const findDesignIssues = ({ colors, families, sizes, radii }: DesignData) => {
  const checks = [
    { count: families.length, max: 3, msg: "font families — limit to 2-3" },
    { count: sizes.length, max: 8, msg: "font sizes — consolidate to 5-7 step type scale" },
    { count: colors.length, max: 15, msg: "colors — tighten palette to 8-12" },
    { count: radii.length, max: 4, msg: "border-radius values — standardize to 2-3" },
  ]
  return checks
    .filter(({ count, max }) => count > max)
    .map(({ count, msg }) => `${count} ${msg}`)
}

const findA11yIssues = (a11y: A11yData, headingSkips: string[]) =>
  [
    a11y.imagesNoAlt && `${a11y.imagesNoAlt} images missing alt`,
    a11y.inputsNoLabel && `${a11y.inputsNoLabel} inputs missing label`,
    a11y.linksNoText && `${a11y.linksNoText} links without text`,
    a11y.buttonsNoText && `${a11y.buttonsNoText} buttons without text`,
    headingSkips.length && `heading skip: ${headingSkips.join(", ")}`,
  ].filter(Boolean) as string[]

const check = (ok: boolean, yes: string, no: string) =>
  ok ? `  ✓ ${yes}` : `  ✗ ${no}`

const formatText = (
  { data, contrast, browser, designIssues, a11yIssues, headingSkips }:
  { data: DesignData; contrast: ContrastIssue[]; browser: BrowserIssue[]; designIssues: string[]; a11yIssues: string[]; headingSkips: string[] }
) => {
  const { colors, families, sizes, weights, margins, paddings, radii, a11y, seo } = data
  const lines: string[] = []
  const out = (s: string) => lines.push(s)

  // palette
  out(`PALETTE  ${colors.length} colors`)
  colors.slice(0, 12).forEach(c =>
    out(`  ${c.hex}  ${String(c.count).padStart(3)}x  ${c.uses.join(",")}`))
  if (colors.length > 12) out(`  ... +${colors.length - 12} more`)

  // typography
  out(`\nTYPOGRAPHY  ${families.length} families, ${sizes.length} sizes`)
  families.forEach(f => out(`  ${f.name} (${f.count})`))
  out(`  sizes: ${sizes.map(s => `${s.value}(${s.count})`).join("  ")}`)
  out(`  weights: ${weights.map(w => `${w.value}(${w.count})`).join("  ")}`)

  // spacing
  out(`\nSPACING`)
  if (margins.length) out(`  margins:  ${margins.map(m => `${m.value}(${m.count})`).join("  ")}`)
  if (paddings.length) out(`  paddings: ${paddings.map(p => `${p.value}(${p.count})`).join("  ")}`)
  if (radii.length) out(`  radii:    ${radii.map(r => `${r.value}(${r.count})`).join("  ")}`)

  // contrast
  if (contrast.length) {
    out(`\nCONTRAST  ${contrast.length} issues (Chrome DevTools)`)
    contrast.slice(0, 10).forEach(c =>
      out(`  ${c.selector}  ${c.ratio}:1 (need ${c.threshold}:1)  ${c.fontSize} w${c.fontWeight}`))
    if (contrast.length > 10) out(`  ... +${contrast.length - 10} more`)
  }

  // accessibility
  out(`\nACCESSIBILITY`)
  out(check(!!a11y.lang, `lang="${a11y.lang}"`, "missing lang attribute"))
  out(check(!!a11y.title, "page has title", "missing page title"))
  a11yIssues.forEach(i => out(`  ✗ ${i}`))
  if (!a11yIssues.length && a11y.lang && a11y.title) out("  ✓ no issues")

  // seo
  out(`\nSEO`)
  out(check(!!seo.title, `title: "${seo.title}"`, "missing title"))
  out(check(!!seo.metaDescription, `meta description (${seo.metaDescription.length} chars)`, "missing meta description"))
  out(check(!!seo.canonical, `canonical: ${seo.canonical}`, "no canonical link"))
  out(check(seo.hasViewport, "viewport meta", "missing viewport meta"))
  out(seo.h1Count === 1 ? `  ✓ 1 h1: "${seo.h1Text}"`
    : seo.h1Count === 0 ? "  ✗ no h1"
    : `  ⚠ ${seo.h1Count} h1 tags (should be 1)`)
  out(`  ${seo.og.title ? "✓" : "✗"} og:title  ${seo.og.description ? "✓" : "✗"} og:description  ${seo.og.image ? "✓" : "✗"} og:image`)

  // browser issues
  if (browser.length) {
    const grouped: Record<string, BrowserIssue[]> = {}
    for (const i of browser) {
      if (!grouped[i.code]) grouped[i.code] = []
      grouped[i.code]!.push(i)
    }
    out(`\nBROWSER  ${browser.length} issues`)
    for (const [code, items] of Object.entries(grouped)) {
      const details = items.map(i => i.detail).filter(Boolean)
      out(`  ${code} (${details.length})`)
      details.slice(0, 3).forEach(d => out(`    ${d}`))
      if (details.length > 3) out(`    ... +${details.length - 3} more`)
    }
  }

  // design
  if (designIssues.length) {
    out(`\nDESIGN`)
    designIssues.forEach(i => out(`  ✗ ${i}`))
  }

  const total = designIssues.length + contrast.length + a11yIssues.length
  out(`\n${total} issues total`)

  return lines.join("\n")
}

// --- cdp audit ---

const collectCdpIssues = async (page: Awaited<ReturnType<typeof connect>>["page"]) => {
  const contrast: ContrastIssue[] = []
  const browser: BrowserIssue[] = []

  try {
    const client = await page.createCDPSession()

    client.on("Audits.issueAdded", ({ issue }: any) => {
      if (issue.code === "LowTextContrastIssue") {
        const d = issue.details.lowTextContrastIssueDetails
        contrast.push({
          selector: d.violatingNodeSelector,
          ratio: Math.round(d.contrastRatio * 100) / 100,
          threshold: d.thresholdAA,
          fontSize: d.fontSize,
          fontWeight: d.fontWeight,
        })
      } else {
        const detail =
          issue.details?.mixedContentIssueDetails?.insecureURL ??
          issue.details?.deprecationIssueDetails?.type ??
          issue.details?.contentSecurityPolicyIssueDetails?.violatedDirective ??
          issue.details?.cookieIssueDetails?.cookie?.name ?? ""
        browser.push({ code: issue.code, detail })
      }
    })

    await client.send("Audits.enable")
    await client.send("Audits.checkContrast" as any, { reportAAA: false })

    return { contrast, browser, cleanup: async () => {
      try { await client.send("Audits.disable"); await client.detach() } catch {}
    }}
  } catch {
    return { contrast, browser, cleanup: async () => {} }
  }
}

// --- dom extraction (single evaluate call) ---

const extractDesignData = (page: Awaited<ReturnType<typeof connect>>["page"]) =>
  page.evaluate(() => {
    const parseRgb = (s: string): [number, number, number] | null => {
      const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
    }
    const toHex = (rgb: [number, number, number]) =>
      "#" + rgb.map(c => c.toString(16).padStart(2, "0")).join("")
    const transparent = (s: string) => s === "rgba(0, 0, 0, 0)" || s === "transparent"

    const tally = <K extends string>(map: Record<K, number>, key: K) => {
      map[key] = (map[key] || 0) + 1
    }

    const colors: Record<string, { count: number; uses: Set<string> }> = {}
    const families: Record<string, number> = {}
    const sizes: Record<string, number> = {}
    const weights: Record<string, number> = {}
    const marginVals: Record<string, number> = {}
    const paddingVals: Record<string, number> = {}
    const radii: Record<string, number> = {}

    for (const el of document.querySelectorAll("body *")) {
      const rect = (el as HTMLElement).getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue

      for (const [val, use] of [[cs.color, "text"], [cs.backgroundColor, "bg"]] as const) {
        if (transparent(val)) continue
        const rgb = parseRgb(val)
        if (!rgb) continue
        const h = toHex(rgb)
        const entry = colors[h] ?? (colors[h] = { count: 0, uses: new Set() })
        entry.count++
        entry.uses.add(use)
      }

      const fam = cs.fontFamily.split(",")[0]?.trim().replace(/['"]/g, "") ?? ""
      tally(families, fam)
      tally(sizes, cs.fontSize)
      tally(weights, cs.fontWeight)

      for (const dir of ["Top", "Right", "Bottom", "Left"] as const) {
        const m = (cs as any)[`margin${dir}`], p = (cs as any)[`padding${dir}`]
        if (m && m !== "0px") tally(marginVals, m)
        if (p && p !== "0px") tally(paddingVals, p)
      }

      if (cs.borderRadius && cs.borderRadius !== "0px") tally(radii, cs.borderRadius)
    }

    // a11y
    const countMatching = (sel: string, predicate: (el: Element) => boolean) =>
      [...document.querySelectorAll(sel)].filter(predicate).length

    const hasAccessibleName = (el: Element) => {
      const text = (el as HTMLElement).innerText?.trim() || el.getAttribute("aria-label") || ""
      return !!text || !!el.querySelector("img[alt]")
    }

    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .map(h => parseInt(h.tagName.charAt(1)))

    const a11y = {
      imagesNoAlt: countMatching("img", el => !el.hasAttribute("alt")),
      inputsNoLabel: countMatching("input:not([type=hidden]), textarea, select", el => {
        const inp = el as HTMLInputElement
        const id = inp.id
        return !(inp.hasAttribute("aria-label") || inp.hasAttribute("aria-labelledby")
          || inp.hasAttribute("title") || inp.hasAttribute("placeholder")
          || (id && document.querySelector(`label[for="${id}"]`))
          || inp.closest("label"))
      }),
      linksNoText: countMatching("a[href]", el => !hasAccessibleName(el)),
      buttonsNoText: countMatching("button, [role=button]", el => !hasAccessibleName(el)),
      headings,
      lang: document.documentElement.getAttribute("lang") || "",
      title: document.title?.trim().slice(0, 80) || "",
    }

    // seo
    const meta = (sel: string, attr = "content") =>
      document.querySelector(sel)?.getAttribute(attr) || ""

    const h1 = document.querySelector("h1") as HTMLElement | null
    const seo = {
      title: a11y.title,
      metaDescription: meta('meta[name="description"]').slice(0, 120),
      canonical: meta('link[rel="canonical"]', "href"),
      h1Count: document.querySelectorAll("h1").length,
      h1Text: h1?.innerText?.trim().slice(0, 80) || "",
      hasViewport: !!document.querySelector('meta[name="viewport"]'),
      og: {
        title: !!document.querySelector('meta[property="og:title"]'),
        description: !!document.querySelector('meta[property="og:description"]'),
        image: !!document.querySelector('meta[property="og:image"]'),
      },
    }

    // sort helpers
    const descByCount = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1])
    const ascByPx = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))

    return {
      colors: Object.entries(colors)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([h, v]) => ({ hex: h, count: v.count, uses: [...v.uses] })),
      families: descByCount(families).map(([name, count]) => ({ name, count })),
      sizes: ascByPx(sizes).map(([value, count]) => ({ value, count })),
      weights: ascByPx(weights).map(([value, count]) => ({ value, count })),
      margins: ascByPx(marginVals).map(([value, count]) => ({ value, count })),
      paddings: ascByPx(paddingVals).map(([value, count]) => ({ value, count })),
      radii: ascByPx(radii).map(([value, count]) => ({ value, count })),
      a11y,
      seo,
    }
  }) as Promise<DesignData>

// --- main ---

export const audit = async (args: string[], flags: Flags) => {
  const { page, close } = await connect(flags.tab)

  const cdp = await collectCdpIssues(page)
  const data = await extractDesignData(page)

  await new Promise(r => setTimeout(r, 300))
  await cdp.cleanup()
  close()

  const { contrast, browser } = cdp
  const headingSkips = findHeadingSkips(data.a11y.headings)
  const designIssues = findDesignIssues(data)
  const a11yIssues = findA11yIssues(data.a11y, headingSkips)

  if (flags.json) {
    console.log(JSON.stringify({ ...data, contrast, browser, designIssues, a11yIssues, headingSkips }, null, 2))
    return
  }

  console.log(formatText({ data, contrast, browser, designIssues, a11yIssues, headingSkips }))
}
