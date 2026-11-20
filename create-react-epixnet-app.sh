#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(dirname "$0")"

# Check system requirements
REQUIRED_COMMANDS="node npx perl inotifywait rsync"
MISSING_COMMANDS=""

for cmd in $REQUIRED_COMMANDS; do
  if ! [ -x "$(command -v $cmd)" ]; then
    MISSING_COMMANDS="$MISSING_COMMANDS $cmd"
  fi
done

if [ -n "$MISSING_COMMANDS" ]; then
    echo "error: The following required commands are not installed:$MISSING_COMMANDS" >&2
    echo "" >&2
    echo "To install missing dependencies on Ubuntu/Debian:" >&2
    echo "  sudo apt update" >&2
    echo "  sudo apt install -y nodejs npm inotify-tools rsync perl" >&2
    echo "" >&2
    echo "Note: If you have npm installed via Windows (e.g., nvm4w), you may need to" >&2
    echo "install the Linux version to avoid path resolution issues:" >&2
    echo "  sudo apt install -y npm" >&2
    exit 1
fi

usage() {
    echo "create-react-epixnet-app 1.1.2" >&2
    echo "Usage: $(basename "$0") project-dir epixnet-site-dir [options]" >&2
    echo "  project-dir: Path to an empty project directory (recommended: new GitHub repo)" >&2
    echo "  epixnet-site-dir: Path to new EpixNet site" >&2
    echo "  options: arguments passed to create-react-app (e.g. --typescript)" >&2
    echo "" >&2
    echo "RECOMMENDATION: Create a new GitHub repository for your project to enable" >&2
    echo "easy sharing and collaboration. The generated .env file will be ignored" >&2
    echo "by git to keep your site configuration private." >&2
    exit 1
}

# Check arguments
if [ "$#" -lt 2 ]; then
    echo -e "error: not enough arguments provided" >&2
    usage
fi
REACT_DIR="$1"
SITE_DIR="$(realpath "$2")"
if [ -z "$SITE_DIR" ] || ! [ -f "$SITE_DIR/content.json" ]; then
    echo -e "error: second argument should specify a path to a newly created EpixNet site" >&2
    usage
fi

EXTRA_ARGS=("${@:3}")
if (( ${#EXTRA_ARGS[@]} )); then
    echo "The following arguments will be passed to create-react-app: $EXTRA_ARGS"
fi

# Create new react app in empty directory
npx create-react-app "$REACT_DIR" "${EXTRA_ARGS[@]}"

# Copy content.json from site to React project, which will be copied on every build
cp "$SITE_DIR/content.json" "$REACT_DIR/public/content.json"

# Symlink content.json to src dir to determine site's address
# Typescript won't allow inclusion of files from a non-src dir by default
EPIXNET_LIBS="$REACT_DIR/src/epixnet"
mkdir -p "$EPIXNET_LIBS"
ln -s ../../public/content.json "$EPIXNET_LIBS/content.json"

# Copy and extend ZeroFrame class for react
ZEROFRAME_JS="$EPIXNET_LIBS/zeroframe.js"

# Find ZeroFrame.js - try site directory first, then fallback to template
ZEROFRAME_SOURCE=""
if [ -f "$SITE_DIR/js/ZeroFrame.js" ]; then
    ZEROFRAME_SOURCE="$SITE_DIR/js/ZeroFrame.js"
else
    # Look for ZeroFrame.js in EpixNet data directory (template or other sites)
    ZEROFRAME_SOURCE=$(find "$(dirname "$SITE_DIR")" -name "ZeroFrame.js" -type f | head -1)
    if [ -z "$ZEROFRAME_SOURCE" ]; then
        echo "error: Could not find ZeroFrame.js in site directory or EpixNet installation" >&2
        echo "This usually happens with newly created sites. You may need to:" >&2
        echo "1. Copy ZeroFrame.js from another EpixNet site, or" >&2
        echo "2. Use an existing site that already has the js/ directory" >&2
        exit 1
    fi
    echo "Using ZeroFrame.js from: $ZEROFRAME_SOURCE"
fi

echo -e "import meta from './content.json'\n" | cat - "$ZEROFRAME_SOURCE" > "$ZEROFRAME_JS"
cat "$SCRIPT_DIR/js/ReactZeroFrame.js" >> "$ZEROFRAME_JS"

# Copy example site configuration component
cp "$SCRIPT_DIR/js/SiteConfig.example.js" "$REACT_DIR/src/SiteConfig.example.js"

# Replace default React App.js and App.css with EpixNet-specific versions
if [ -f "$SCRIPT_DIR/templates/src/App.js" ]; then
    cp "$SCRIPT_DIR/templates/src/App.js" "$REACT_DIR/src/App.js"
    echo "Replaced default App.js with EpixNet-specific template"
fi

if [ -f "$SCRIPT_DIR/templates/src/App.css" ]; then
    cp "$SCRIPT_DIR/templates/src/App.css" "$REACT_DIR/src/App.css"
    echo "Replaced default App.css with EpixNet-specific styles"
fi

# Copy EpixNet example components
if [ -d "$SCRIPT_DIR/templates/src/components" ]; then
    cp -r "$SCRIPT_DIR/templates/src/components" "$REACT_DIR/src/"
    echo "Copied EpixNet example components"
fi

# Copy project README with epixnet-specific instructions
cp "$SCRIPT_DIR/templates/PROJECT_README.md" "$REACT_DIR/README.md"

# Copy custom build scripts
cp -r "$SCRIPT_DIR/scripts/." "$REACT_DIR/scripts"
echo -e "SITE_DIR=$SITE_DIR\n" >> "$REACT_DIR/scripts/config"

# Fix shebang lines to use bash instead of sh for compatibility
sed -i '1s|#!/usr/bin/env sh|#!/usr/bin/env bash|' "$REACT_DIR/scripts/start"
sed -i '1s|#!/usr/bin/env sh|#!/usr/bin/env bash|' "$REACT_DIR/scripts/build"

# Create .env file with site data location
cat > "$REACT_DIR/.env" <<EOF
# EpixNet Site Configuration
# This file contains the path to your EpixNet site data and is ignored by git
REACT_APP_SITE_DATA_PATH=$SITE_DIR
REACT_APP_SITE_ADDRESS=$(basename "$SITE_DIR")
EOF

# Ensure .env is in .gitignore (create-react-app should already include this, but let's be sure)
if [ -f "$REACT_DIR/.gitignore" ]; then
    if ! grep -q "^\.env$" "$REACT_DIR/.gitignore"; then
        echo ".env" >> "$REACT_DIR/.gitignore"
    fi
    if ! grep -q "^\.env\.\*$" "$REACT_DIR/.gitignore"; then
        echo ".env.*" >> "$REACT_DIR/.gitignore"
    fi
fi
PACKAGE_JSON="$REACT_DIR/package.json"
node > "$PACKAGE_JSON.dst" <<EOF
const fs = require('fs');
const package = JSON.parse(fs.readFileSync('$PACKAGE_JSON'));
package.homepage = "./"; // Generate relative URIs for built files
package.scripts.start = "./scripts/start";
package.scripts.build = "./scripts/build";
console.log(JSON.stringify(package, null, 2));
EOF
mv "$PACKAGE_JSON.dst" "$PACKAGE_JSON"

## Patch webpack to enable hot reloading with EpixNet
# Write development builds to dist/
perl -i -0pe 's/(quiet: true,\n)(\s*)/$1$2writeToDisk: true,\n$2/gs' "$REACT_DIR/node_modules/react-scripts/config/webpackDevServer.config.js"
# Enable relative URLs for development builds
perl -i -0pe 's/const (publicUrl|publicPath) = .+?;/const $1 = "\.\/";/gs' "$REACT_DIR/node_modules/react-scripts/config/webpack.config.js"
# Hot reloading client of webpack connects to the same origin as the current webpage by default
perl -i -pe "s/window.location.protocol/'http'/" "$REACT_DIR/node_modules/react-dev-utils/webpackHotDevClient.js"
perl -i -pe "s/window.location.hostname/'127.0.0.1'/" "$REACT_DIR/node_modules/react-dev-utils/webpackHotDevClient.js"
perl -i -pe "s/window.location.port/3000/" "$REACT_DIR/node_modules/react-dev-utils/webpackHotDevClient.js"

echo \
"create-react-epixnet-app created a new react project at the following location: $REACT_DIR
The generated project has been configured to deploy to $SITE_DIR

CONFIGURATION:
- Site data path has been saved to .env file (ignored by git)
- Environment variables available in your React app:
  * REACT_APP_SITE_DATA_PATH: $SITE_DIR
  * REACT_APP_SITE_ADDRESS: $(basename "$SITE_DIR")

EPIXNET FEATURES INCLUDED:
- EpixNet-specific App.js template with ZeroFrame API integration
- Example components demonstrating common EpixNet patterns:
  * UserInfo: Authentication status and certificate management
  * SiteStats: Real-time site statistics and network information
  * ApiExample: Interactive examples of EpixNet API calls
- Pre-configured ZeroFrame API access via zeroFrame object
- Site configuration access through environment variables

NEXT STEPS:
1. Initialize a git repository in your project directory:
   cd $REACT_DIR && git init
2. Create a new GitHub repository and push your code to share it
3. The .env file will be ignored by git to keep your local paths private
4. Explore the example components in src/components/ to learn EpixNet patterns
5. Check src/SiteConfig.example.js for site configuration examples

You can run the following scripts inside your react project:
npm run start      build and deploy a development version with hot reloading
npm run build      build and deploy a production version of your site"

