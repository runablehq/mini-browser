import { spawn } from "node:child_process"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import type { Flags } from "../lib/flags"
import {
  readState,
  writeState,
  clearState,
  isProcessRunning,
} from "../lib/recorder-state"

const DEFAULT_FPS = 30
const DEFAULT_SCALE = 1

const getDaemonPath = () => {
  // In compiled mode, both mb.js and recorder-daemon.js are in dist/
  const currentFile = fileURLToPath(import.meta.url)
  return resolve(dirname(currentFile), "recorder-daemon.js")
}

interface StartInput {
  path: string
  tab: number
  fps: number
  scale: number
}

const start = async ({ path, tab, fps, scale }: StartInput) => {
  const existing = readState()
  if (existing && isProcessRunning(existing.pid)) {
    throw new Error(
      `Already recording to ${existing.path}. Run 'mb record stop' first.`
    )
  }

  // Clear stale state if process is dead
  if (existing) clearState()

  const outputPath = resolve(path)
  const ext = outputPath.split(".").pop()?.toLowerCase()
  if (!ext || !["webm", "mp4", "gif"].includes(ext)) {
    throw new Error("Output file must end in .webm, .mp4, or .gif")
  }

  if (fps <= 0) throw new Error("--fps must be a positive number")
  if (scale <= 0) throw new Error("--scale must be a positive number")

  const config = { path: outputPath, tab, fps, scale }
  const daemonPath = getDaemonPath()

  const child = spawn(process.execPath, [daemonPath], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      MB_RECORDER_CONFIG: JSON.stringify(config),
    },
  })

  child.unref()

  if (!child.pid) {
    throw new Error("Failed to spawn recorder daemon")
  }

  writeState({
    pid: child.pid,
    path: outputPath,
    tab,
    fps,
    scale,
    startedAt: Date.now(),
  })

  // Give daemon time to start and catch errors
  await new Promise((r) => setTimeout(r, 2000))

  // Verify it's still running
  if (!isProcessRunning(child.pid)) {
    clearState()
    throw new Error("Recorder daemon failed to start. Is Chrome running?")
  }

  console.log(`Recording to ${outputPath}`)
}

const stop = async () => {
  const state = readState()
  if (!state) {
    throw new Error("No recording in progress")
  }

  if (!isProcessRunning(state.pid)) {
    clearState()
    throw new Error("Recording process died unexpectedly")
  }

  // Send SIGTERM to daemon
  process.kill(state.pid, "SIGTERM")

  // Wait for process to exit
  const maxWait = 10000
  const startTime = Date.now()
  while (isProcessRunning(state.pid) && Date.now() - startTime < maxWait) {
    await new Promise((r) => setTimeout(r, 100))
  }

  if (isProcessRunning(state.pid)) {
    // Force kill if still running
    process.kill(state.pid, "SIGKILL")
    clearState()
    throw new Error("Recorder did not stop gracefully, force killed")
  }

  clearState()
  console.log(state.path)
}

const status = () => {
  const state = readState()
  if (!state || !isProcessRunning(state.pid)) {
    if (state) clearState()
    console.log("Not recording")
    return
  }

  const elapsed = ((Date.now() - state.startedAt) / 1000).toFixed(1)
  console.log(`Recording to ${state.path} (${elapsed}s elapsed)`)
}

export const record = async (args: string[], flags: Flags) => {
  const [subcommand, ...rest] = args

  switch (subcommand) {
    case "start": {
      const path = rest[0]
      if (!path) {
        throw new Error("Usage: mb record start <file.webm|mp4|gif> [--fps N] [--scale N]")
      }
      await start({
        path,
        tab: flags.tab,
        fps: flags.fps ?? DEFAULT_FPS,
        scale: flags.scale ?? DEFAULT_SCALE,
      })
      break
    }
    case "stop":
      await stop()
      break
    case "status":
      status()
      break
    default:
      throw new Error(
        "Usage: mb record <start|stop|status>\n" +
        "  start <file>  Start recording\n" +
        "  stop          Stop recording and save\n" +
        "  status        Check recording status"
      )
  }
}
