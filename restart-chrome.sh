#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME_PID_FILE="${CHROME_PID_FILE:-$SCRIPT_DIR/.chrome-pid}"

if [[ -f "$CHROME_PID_FILE" ]]; then
  pid="$(cat "$CHROME_PID_FILE")"
  echo "Stopping Chrome (pid $pid)"
  kill "$pid" 2>/dev/null || true
  rm -f "$CHROME_PID_FILE"
  sleep 1
fi

exec "$SCRIPT_DIR/start-chrome.sh"
