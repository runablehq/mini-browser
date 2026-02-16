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

CHROME_PID_FILE="${CHROME_PID_FILE:-$SCRIPT_DIR/.chrome-pid}"

if [[ -f "$CHROME_PID_FILE" ]]; then
  pid="$(cat "$CHROME_PID_FILE")"
  echo "Stopping Chrome (pid $pid)"
  kill "$pid" 2>/dev/null || true
  rm -f "$CHROME_PID_FILE"
  sleep 1
fi

exec "$SCRIPT_DIR/start-chrome.sh"
