#!/usr/bin/env bash
set -euo pipefail

# Resolve symlinks (e.g. when installed via npm install -g / npm link)
SOURCE="$0"
while [[ -L "$SOURCE" ]]; do
  DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"

CHROME_PORT="${CHROME_PORT:-9222}"
CHROME_PID_FILE="${CHROME_PID_FILE:-$SCRIPT_DIR/.chrome-pid}"
CHROME_USER_DATA_DIR="${CHROME_USER_DATA_DIR:-$SCRIPT_DIR/.chrome-profile}"
CHROME_BIN="${CHROME_BIN:-$(command -v google-chrome-stable || command -v google-chrome || command -v chromium-browser || command -v chromium || true)}"

if [[ -z "$CHROME_BIN" ]]; then
  echo "Chrome not found. Set CHROME_BIN." >&2
  exit 1
fi

# Already running?
if [[ -f "$CHROME_PID_FILE" ]] && kill -0 "$(cat "$CHROME_PID_FILE")" 2>/dev/null; then
  echo "Chrome already running (pid $(cat "$CHROME_PID_FILE"))"
  exit 0
fi

# Fresh profile ensures --window-size is respected (no saved window state)
rm -rf -- "$CHROME_USER_DATA_DIR"
mkdir -p "$CHROME_USER_DATA_DIR"

"$CHROME_BIN" \
  --remote-debugging-port="$CHROME_PORT" \
  --user-data-dir="$CHROME_USER_DATA_DIR" \
  --window-size=1024,768 \
  --no-first-run \
  --no-default-browser-check \
  --disable-dev-shm-usage \
  --disable-gpu \
  --no-sandbox \
  >/dev/null 2>&1 &

echo $! >"$CHROME_PID_FILE"

# Wait for CDP.
for _ in $(seq 1 40); do
  if curl -fs "http://127.0.0.1:${CHROME_PORT}/json/version" | grep -q webSocketDebuggerUrl; then
    echo "Chrome started (pid $(cat "$CHROME_PID_FILE"))"
    exit 0
  fi
  sleep 0.25
done

echo "Chrome failed to start" >&2
kill "$(cat "$CHROME_PID_FILE")" 2>/dev/null || true
rm -f "$CHROME_PID_FILE"
exit 1
