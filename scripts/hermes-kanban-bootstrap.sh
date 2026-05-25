#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${GOLDEN_REPO_URL:-https://github.com/goldencollections/goldencollections-theme.git}"
REPO_DIR="${GOLDEN_REPO_DIR:-$HOME/goldencollections-theme}"
BOARD="${HERMES_KANBAN_BOARD:-goldencollections}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but was not found on PATH." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
  echo "python3 or python is required but was not found on PATH." >&2
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  mkdir -p "$(dirname "$REPO_DIR")"
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
git pull origin main

PYTHON_BIN="python3"
if ! command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python"
fi

"$PYTHON_BIN" scripts/sync-kanban-board.py import --apply-status --board "$BOARD"
"$PYTHON_BIN" scripts/sync-kanban-board.py status --board "$BOARD"

cat <<EOF

Hermes Kanban bootstrap complete.

Repo:  $REPO_DIR
Board: $BOARD

Use this at the start of future Hermes sessions:
  cd "$REPO_DIR"
  git pull origin main
  $PYTHON_BIN scripts/sync-kanban-board.py import --apply-status --board "$BOARD"
  $PYTHON_BIN scripts/sync-kanban-board.py status --board "$BOARD"
EOF
