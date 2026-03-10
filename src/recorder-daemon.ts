#!/usr/bin/env node
/**
 * Recorder daemon process - spawned by `mb record start`
 * Stays alive and records until SIGTERM is received
 */
import { connect } from "./lib/browser"
import { clearState, writeState, readState } from "./lib/recorder-state"

interface DaemonConfig {
  path: string
  tab: number
  fps: number
  scale: number
}

const main = async () => {
  const configEnv = process.env.MB_RECORDER_CONFIG
  if (!configEnv) {
    process.exit(1)
  }

  const config: DaemonConfig = JSON.parse(configEnv)
  const { page, close } = await connect(config.tab)

  // Bring tab to front to ensure Chrome sends screencast frames
  await page.bringToFront()

  // Warm up CDP screencast to trigger initial frame
  // (page.screencast waits for first frame which won't come without activity)
  const client = await page.createCDPSession()
  await client.send("Page.startScreencast", { format: "png" })
  await client.send("Page.stopScreencast")
  await client.detach()

  const recorder = await page.screencast({
    path: config.path as `${string}.webm` | `${string}.mp4` | `${string}.gif`,
    fps: config.fps,
    scale: config.scale,
  })

  let stopping = false

  const stop = async () => {
    if (stopping) return
    stopping = true
    try {
      await recorder.stop()
      await close()
      clearState()
    } catch {
      // Ignore errors during cleanup
    }
    process.exit(0)
  }

  page.browser().on("disconnected", stop)

  process.on("SIGTERM", stop)
  process.on("SIGINT", stop)

  // Keep process alive
  setInterval(() => {}, 60000)
}

main().catch(() => {
  clearState()
  process.exit(1)
})
