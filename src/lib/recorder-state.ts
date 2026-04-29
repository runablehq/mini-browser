import { homedir } from "node:os"
import { join } from "node:path"
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs"

const STATE_FILE = join(homedir(), ".mb-recorder.json")

export interface RecorderState {
  pid: number
  path: string
  tab?: string
  fps: number
  scale: number
  startedAt: number
}

export const getStatePath = () => STATE_FILE

export const readState = () => {
  if (!existsSync(STATE_FILE)) return null
  try {
    const content = readFileSync(STATE_FILE, "utf-8")
    return JSON.parse(content) as RecorderState
  } catch {
    return null
  }
}

export const writeState = (state: RecorderState) => {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

export const clearState = () => {
  if (existsSync(STATE_FILE)) {
    unlinkSync(STATE_FILE)
  }
}

export const isProcessRunning = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
