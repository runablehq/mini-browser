import { build } from "esbuild"

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/mb.js",
  banner: { js: "#!/usr/bin/env node" },
  external: ["puppeteer-core"],
})

console.log("Built dist/mb.js")
