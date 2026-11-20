#!/usr/bin/env bash
# Copy the build in dist/ into the xite folder, ready to sign.
#
#   scripts/sync-xite.sh [<xite folder>]
#
# The folder defaults to EPIX_XITE_DIR from the environment or .env.local.
# Only build output is copied. The xite's own files are never touched:
#  - content.json at any depth (the signed manifest and any includes)
#  - .sign-cache.json (the signer's cache)
#  - data/ (user content, the xite database and anything else you keep there)
# Any other file in the folder that is not in the build is removed, so point
# this at the xite that belongs to this project only.
set -euo pipefail
cd "$(dirname "$0")/.."

XITE_DIR="${1:-${EPIX_XITE_DIR:-}}"
if [ -z "$XITE_DIR" ] && [ -f .env.local ]; then
  XITE_DIR="$(sed -n 's/^EPIX_XITE_DIR=//p' .env.local | tail -n 1)"
  XITE_DIR="${XITE_DIR%\"}"; XITE_DIR="${XITE_DIR#\"}"
fi
if [ -z "$XITE_DIR" ]; then
  echo "error: no xite folder: pass it as an argument or set EPIX_XITE_DIR in .env.local" >&2
  exit 1
fi
if [ ! -f "$XITE_DIR/content.json" ]; then
  echo "error: $XITE_DIR has no content.json, so it does not look like a xite folder" >&2
  exit 1
fi
# An empty or failed build would otherwise empty the xite folder.
if [ ! -f dist/index.html ]; then
  echo "error: dist/index.html is missing, run the build first" >&2
  exit 1
fi

# -c compares contents, and leaving out -t keeps unchanged files untouched, so
# the node only sees the files a rebuild really changed. Excluded paths are
# neither copied nor deleted.
rsync -rlc --delete \
  --exclude='content.json' \
  --exclude='.sign-cache.json' \
  --exclude='/data/' \
  dist/ "$XITE_DIR"/

ADDRESS="$(basename "$(cd "$XITE_DIR" && pwd)")"
PORT=42222
UI_PORT_FILE="$XITE_DIR/../../ui_port"
if [ -f "$UI_PORT_FILE" ]; then
  PORT="$(tr -dc '0-9' < "$UI_PORT_FILE")"
  PORT="${PORT:-42222}"
fi
echo "Copied the build to $XITE_DIR"
echo "Preview: http://127.0.0.1:$PORT/$ADDRESS/ (then Sign & Publish from the sidebar)"
