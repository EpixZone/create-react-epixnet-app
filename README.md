# create-react-epixnet-app

Create a React project (built with Vite) that publishes as an EpixNet xite.

## Requirements

- A running EpixNet node
- Node.js 20.19+ or 22.12+ with npm
- bash and rsync (Linux, macOS, or WSL / Git Bash on Windows)

## Workflow

1. **Create a xite in EpixNet.** Open the Dashboard, open its Settings menu
   and choose **Create new xite**. Note the new address (`epix1...`). Its
   folder is `<data folder>/data/<address>/`.

2. **Generate the project**, pointing it at that xite:

   ```bash
   git clone https://github.com/EpixZone/create-react-epixnet-app.git
   create-react-epixnet-app/create-react-epixnet-app.sh my-app epix1yourxiteaddress
   ```

   The second argument can also be the path to the xite folder. The project
   directory must be new, or a fresh clone of an empty repository.

3. **Run it:**

   ```bash
   cd my-app
   npm start        # rebuilds and copies into the xite on every change
   ```

4. **Preview** at `http://127.0.0.1:42222/<address>/` and reload after each
   rebuild. If port 42222 was busy the node picked 42223 or higher; the port
   it uses is in the `ui_port` file of its data folder.

5. **Sign and publish.** Run `npm run build` for a production build, open the
   sidebar on the xite and choose **Sign & Publish**.

## The data folder

The generator looks for the xite in the node's data folder:

| System  | Data folder |
| ------- | ----------- |
| Linux   | `$XDG_DATA_HOME/EpixNet`, by default `~/.local/share/EpixNet` |
| macOS   | `~/Library/Application Support/EpixNet` |
| Windows | `%APPDATA%\EpixNet` |

Set `EPIX_DATA_DIR` (the same variable the node reads) when yours is
elsewhere, for example under WSL with the node running on Windows:

```bash
EPIX_DATA_DIR=/mnt/c/Users/you/AppData/Roaming/EpixNet ./create-react-epixnet-app.sh my-app epix1...
```

Other options: `--no-install` skips `npm install`, and `EPIXFRAME_JS=<path>`
uses another build of `epixframe.esm.js`.

## What a build changes in the xite folder

Builds go to `dist/` and are copied into the xite folder with rsync. The copy
never overwrites or deletes `content.json` (at any depth), `.sign-cache.json`
or the `data/` folder, so the signed manifest and user content survive every
build. Other files in the folder that are not part of the build are removed:
use a xite that belongs to the project.

## What the generated project contains

- `src/epixnet/epixframe.esm.js`: the [EpixFrame](https://github.com/EpixZone/epixframe)
  library, the bridge between the page and the EpixNet wrapper.
- `src/epixnet/useEpixFrame.js`: React helpers over EpixFrame:
  `useEpixFrame()` (connection, `siteInfo` and `serverInfo`, kept current
  through `setSiteInfo`), `useSiteInfo()`, `useHashRoute()`, `getEpixFrame()`
  for any API command, and `getStorage()` / `setStorage()` in place of
  `localStorage`.
- Example components: user status (xID), xite statistics and API calls.
- A Vite setup that works inside the wrapper's sandboxed frame: relative
  paths (`base: './'`), hash routing, one classic script and one stylesheet,
  everything local (no CDN, no web fonts, no service worker).

See the generated project's README for how to write a xite with it.

## Files in this repository

- `create-react-epixnet-app.sh`: the generator.
- `js/epixframe.esm.js`: copy of `dist/epixframe.esm.js` (version 1.1.0)
  from [EpixZone/epixframe](https://github.com/EpixZone/epixframe), commit
  2acba61 on its `fix/node-compat` branch. Replace it to update the copy new
  projects get.
- `js/useEpixFrame.js`: the React helpers.
- `templates/`: the project template.
