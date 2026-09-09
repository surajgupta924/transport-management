#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/.tools/mongodb/bin/mongod"
DATA="$ROOT/.tools/mongo-data"
LOG="$ROOT/.tools/mongo-logs/mongod.log"

if [[ ! -x "$BIN" ]]; then
  echo "MongoDB binary not found at $BIN"
  echo "Install MongoDB Community locally, or place binaries under .tools/mongodb/"
  exit 1
fi

mkdir -p "$DATA" "$(dirname "$LOG")"
if pgrep -f "$BIN" >/dev/null 2>&1; then
  echo "MongoDB already running"
  exit 0
fi

"$BIN" --dbpath "$DATA" --logpath "$LOG" --port 27017 --bind_ip 127.0.0.1 --fork
echo "MongoDB started on 127.0.0.1:27017"
