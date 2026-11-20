#!/usr/bin/env bash
# Create a React + Vite project that builds into an EpixNet xite.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="2.0.0"

usage() {
    cat >&2 <<EOF
create-react-epixnet-app $VERSION
Usage: $(basename "$0") [--no-install] <project-dir> <xite>

  project-dir   Directory for the new project. It must not exist yet or hold
                nothing but .git, README.md, LICENSE and .gitignore (a fresh
                clone of a new GitHub repository works).
  xite          The xite to build into: its address (epix1...) or the path
                to its folder. Create the xite first in EpixNet: Dashboard,
                Settings menu, Create new xite.
  --no-install  Do not run npm install.

Environment:
  EPIX_DATA_DIR  The EpixNet data folder, when it is not in the default place:
                   Linux    \${XDG_DATA_HOME:-~/.local/share}/EpixNet
                   macOS    ~/Library/Application Support/EpixNet
                   Windows  %APPDATA%\\EpixNet
                 Under WSL with the node running on Windows, use
                 /mnt/c/Users/<you>/AppData/Roaming/EpixNet.
  EPIXFRAME_JS   Use this epixframe.esm.js instead of the bundled copy.
EOF
    exit 1
}

die() {
    echo "error: $*" >&2
    exit 1
}

INSTALL=1
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --no-install) INSTALL=0 ;;
        -h|--help) usage ;;
        -*) echo "error: unknown option $arg" >&2; usage ;;
        *) ARGS+=("$arg") ;;
    esac
done
if [ "${#ARGS[@]}" -ne 2 ]; then
    echo "error: expected a project directory and a xite" >&2
    usage
fi
PROJECT_DIR="${ARGS[0]}"
XITE="${ARGS[1]}"

# Requirements: Node 20.19+ or 22.12+ (Vite 7), npm and rsync.
MISSING=""
for cmd in node npm rsync; do
    command -v "$cmd" >/dev/null 2>&1 || MISSING="$MISSING $cmd"
done
[ -z "$MISSING" ] || die "missing required commands:$MISSING (Node.js 20.19+ with npm, and rsync)"
node -e '
const [maj, min] = process.versions.node.split(".").map(Number);
if (!((maj === 20 && min >= 19) || (maj === 22 && min >= 12) || maj > 22)) process.exit(1);
' || die "Node.js $(node -v) is too old, Vite needs 20.19+ or 22.12+"

data_root() {
    if [ -n "${EPIX_DATA_DIR:-}" ]; then
        printf '%s\n' "$EPIX_DATA_DIR"
        return
    fi
    case "$(uname -s)" in
        Darwin) printf '%s\n' "$HOME/Library/Application Support/EpixNet" ;;
        MINGW*|MSYS*|CYGWIN*) printf '%s\n' "$(cygpath -u "$APPDATA")/EpixNet" ;;
        *)
            local xdg="${XDG_DATA_HOME:-}"
            case "$xdg" in /*) ;; *) xdg="$HOME/.local/share" ;; esac
            printf '%s\n' "$xdg/EpixNet"
            ;;
    esac
}

# Resolve the xite folder: a path that exists, else an address in the data folder.
if [ -d "$XITE" ]; then
    XITE_DIR="$(cd "$XITE" && pwd)"
else
    case "$XITE" in
        */*) die "$XITE is not a folder" ;;
    esac
    DATA_ROOT="$(data_root)"
    XITE_DIR="$DATA_ROOT/data/$XITE"
    [ -d "$XITE_DIR" ] || die "no xite $XITE in $DATA_ROOT/data. Create it in EpixNet first (Dashboard, Settings menu, Create new xite), or set EPIX_DATA_DIR to your EpixNet data folder."
fi
[ -f "$XITE_DIR/content.json" ] || die "$XITE_DIR has no content.json, so it is not a xite folder"
ADDRESS="$(basename "$XITE_DIR")"
CONTENT_ADDRESS="$(node -e 'try { process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).address || "")) } catch (e) {}' "$XITE_DIR/content.json")"
if [ -n "$CONTENT_ADDRESS" ] && [ "$CONTENT_ADDRESS" != "$ADDRESS" ]; then
    echo "warning: the folder is named $ADDRESS but its content.json is for $CONTENT_ADDRESS" >&2
fi

# The project directory: new, or a fresh clone.
if [ -e "$PROJECT_DIR" ]; then
    [ -d "$PROJECT_DIR" ] || die "$PROJECT_DIR exists and is not a directory"
    for entry in "$PROJECT_DIR"/* "$PROJECT_DIR"/.[!.]* "$PROJECT_DIR"/..?*; do
        [ -e "$entry" ] || continue
        case "$(basename "$entry")" in
            .git|README.md|LICENSE|.gitignore) ;;
            *) die "$PROJECT_DIR is not empty ($(basename "$entry")); use a new directory" ;;
        esac
    done
fi
mkdir -p "$PROJECT_DIR"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
case "$PROJECT_DIR/" in
    "$XITE_DIR"/*) die "the project directory cannot be inside the xite folder" ;;
esac

EPIXFRAME_SOURCE="${EPIXFRAME_JS:-$SCRIPT_DIR/js/epixframe.esm.js}"
[ -f "$EPIXFRAME_SOURCE" ] || die "$EPIXFRAME_SOURCE not found"

# Project files.
TEMPLATES="$SCRIPT_DIR/templates"
cp -R "$TEMPLATES/src" "$TEMPLATES/public" "$TEMPLATES/scripts" "$PROJECT_DIR/"
cp "$TEMPLATES/index.html" "$TEMPLATES/vite.config.js" "$PROJECT_DIR/"
cp "$TEMPLATES/PROJECT_README.md" "$PROJECT_DIR/README.md"
chmod +x "$PROJECT_DIR/scripts/sync-xite.sh"
mkdir -p "$PROJECT_DIR/src/epixnet"
cp "$EPIXFRAME_SOURCE" "$PROJECT_DIR/src/epixnet/epixframe.esm.js"
cp "$SCRIPT_DIR/js/useEpixFrame.js" "$PROJECT_DIR/src/epixnet/useEpixFrame.js"

# .gitignore: keep what a clone already has, add the lines we need.
touch "$PROJECT_DIR/.gitignore"
while IFS= read -r line; do
    [ -n "$line" ] || continue
    grep -qxF -- "$line" "$PROJECT_DIR/.gitignore" || printf '%s\n' "$line" >> "$PROJECT_DIR/.gitignore"
done < "$TEMPLATES/gitignore"

# package.json named after the project directory.
NAME="$(basename "$PROJECT_DIR" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g; s/^[._-]*//')"
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
pkg.name = process.argv[2] || pkg.name;
fs.writeFileSync(process.argv[3], JSON.stringify(pkg, null, 2) + "\n");
' "$TEMPLATES/package.json" "$NAME" "$PROJECT_DIR/package.json"

# Where to copy builds. .env.local is ignored by git (*.local), so the local
# path stays out of the repository and out of the bundle (only VITE_*
# variables reach the browser).
cat > "$PROJECT_DIR/.env.local" <<EOF
# The xite folder that npm run build / npm start copy the build into.
EPIX_XITE_DIR=$XITE_DIR
EOF

if [ "$INSTALL" = 1 ]; then
    (cd "$PROJECT_DIR" && npm install)
fi

INSTALL_HINT=""
[ "$INSTALL" = 1 ] || INSTALL_HINT="
  npm install"

# The node writes the UI port it chose to ui_port in its data folder; it is
# 42222 unless that port was busy.
PORT=42222
if [ -f "$XITE_DIR/../../ui_port" ]; then
    PORT="$(tr -dc '0-9' < "$XITE_DIR/../../ui_port")"
    PORT="${PORT:-42222}"
fi

cat <<EOF

Created $PROJECT_DIR
Builds are copied into $XITE_DIR
(set in .env.local, which git ignores). The xite's content.json,
.sign-cache.json and data/ folder are never overwritten.

Next steps:
  cd $PROJECT_DIR$INSTALL_HINT
  npm start        rebuild and copy on every change (development build)
  npm run build    production build, copied into the xite

Preview:  http://127.0.0.1:$PORT/$ADDRESS/
When it looks right, run npm run build, open the sidebar on that page and
choose Sign & Publish.
EOF
