# Web UI Customizer (web-ui-customizer)

[简体中文](README.md) | **English**

A CloudCLI plugin that adds two things to the web UI — a **workspace hover info card** (with one-click path copy) and **theme / command-line coloring**. Every setting is off by default or keeps the native colors, so installing it changes nothing until you turn something on.

The plugin was originally named `workspace-info-card` and was renamed once the color features landed. The old `localStorage` key is still read once, so anyone who enabled the hover card early keeps their switch state after upgrading.

## Screenshots

Hover a workspace row → info card (click the card to copy the path):

![Workspace hover info card](docs/hover-card.png)

The settings live in the **Settings dialog** — a page of its own under *Plugins* (toggle + per-theme colors + live preview), so they don't take up a workspace tab:

![Settings page](docs/settings-page.png)

The plugin UI and its sidebar nav entry follow the host language (English above; 简体中文 below):

![Settings page (Chinese)](docs/settings-page-zh.png)

## Features

### 1. Workspace hover info card

| Capability | Description |
| --- | --- |
| Hover to show | Appears after the pointer rests on a workspace row for ~0.15 s, disappears when it moves away |
| Card contents | Workspace name, full path, directory creation time, last-modified time |
| Click to copy | Click anywhere on the card to copy the full path; a "Path copied" confirmation appears at the bottom of the card |
| Toggle | **Off** by default; when off the plugin stops listening for hover events and renders no card — the color settings are unaffected |

CloudCLI had no "copy workspace path" entry point; the path was only visible as a truncated two-line label in the sidebar. This feature fills that gap.

### 2. Theme colors (a separate set for light and dark)

| Group | Adjustable | Notes |
| --- | --- | --- |
| Theme colors | Accent, page background, card & popover, borders | Written into the host's CSS variables (HSL triplets) and propagated to derived variables |
| Text colors | Body text, secondary text | Also propagated to `--card-foreground` / `--popover-foreground` and similar |

Changing the accent also recomputes `--primary-foreground` (it picks a readable black or white automatically), `--ring`, and the nav highlight; the page background also updates the alpha of `--nav-glass-bg`; the card color also updates `--popover`. That way the UI never ends up half-recolored.

### 3. Command-line colors

The keyword colors inside CloudCLI's command blocks (`$ npm run build` / output / errors) are hard-coded Tailwind values rather than variables, so they get their own override group keyed by selector:

| Adjustable | Element |
| --- | --- |
| Prompt `$` | The `$` at the left edge of a command block |
| Command text | The command being run |
| Normal output | Output lines of a command that succeeded |
| Error output | Output lines of a command that failed |

> Boundary: the xterm terminal (the `Terminal` tab) is colored by the xterm theme object rather than by CSS variables, so it is **not** covered by this group.

### 4. Multilingual UI

The plugin's UI text follows **CloudCLI's own language setting** and switches instantly — no reload, no reinstall:

| Host language | Plugin text |
| --- | --- |
| English | English |
| 简体中文 / 繁體中文 | Simplified / Traditional (distinguishes `zh-CN` from `zh-TW`) |
| Any other of the 15 host languages | Falls back to English (matching the host's `fallbackLng: 'en'`) |

It covers every **fixed string** in the plugin: the settings page title, toggle copy, group names, each color row's label and hint, the preview, the status line, buttons — plus the hover card's heading, field names, the "Path copied" feedback and the screen-reader `aria-label`s. Dates and times are formatted for the active locale with `Intl.DateTimeFormat`.

The **navigation entry** in the settings dialog's left rail follows the language too. That row is rendered by the host from `manifest.json`'s single-string `displayName`, which the host itself cannot translate; the plugin's resident surface rewrites that text node with a `MutationObserver` (`src/nav.ts`), so a language switch, reopening the dialog, or a React re-render all re-align it. If a future host changes how the row is rendered, the rewrite safely no-ops and the manifest string shows through — nothing breaks.

## Why the host has to cooperate

Upstream CloudCLI's plugin system has exactly one mount point: `slot: "tab"` — a plugin's UI is only `import()`ed into the browser **when the user opens its tab**. But the hover card and the global colors have to work without opening a tab, and the settings page should not occupy a workspace view; a pure plugin cannot do that.

This fork adds two extra surfaces to the host ([host-side changes](https://github.com/fu827707013/claudecodeui/blob/feat/plugin-resident-mount/docs/plugin-resident-mount.md)):

| manifest field | Effect | How this plugin uses it |
| --- | --- | --- |
| `"alwaysMount": true` | Mounts the bundle into the resident layer at app startup ([PluginHostLayer](https://github.com/fu827707013/claudecodeui/blob/feat/plugin-resident-mount/src/modules/plugins/PluginHostLayer.tsx)), independent of which tab is open | Injects the color stylesheet, runs the hover card |
| `"slot": "settings"` | Turns the plugin UI into a page inside the Settings dialog and adds an item to the left nav | The settings UI |

The same bundle uses `host.context.surface` to tell which surface it is on (`'resident' | 'settings' | 'tab'`) and renders either the card or the panel. Those are **two module instances of the same bundle**, so module scope is not shared; state is synchronized through `localStorage` plus an event.

**Check that your host supports these two fields before installing.** Upstream `siteboon/claudecodeui`'s `validateManifest` only accepts `ALLOWED_SLOTS = ['tab']`, so a manifest with `"slot": "settings"` is rejected outright and the install fails with `Invalid manifest: Invalid plugin slot: settings. Must be one of: tab` — not "installed but missing a page", but "cannot be installed at all". `alwaysMount` is not rejected upstream (it only validates required fields and the slot), but upstream has no resident layer either, so a bundle that only carries the hover card does nothing there.

So for now this plugin only works on the fork above.

## Layout

```
web-ui-customizer/
├── manifest.json          plugin manifest (slot: settings + alwaysMount: true)
├── package.json           build script and dependencies
├── scripts/build.mjs      esbuild bundling (frontend + backend)
└── src/
    ├── index.ts           entry: dispatch on host.context.surface — card in the resident layer, panel on the settings page
    ├── card.ts            hover card: row targeting, show/hide delays, click-to-copy, time cache
    ├── nav.ts             localises the settings sidebar entry (the host can only render the manifest's single string)
    ├── panel.ts           settings page: toggle, theme switch, preview, color rows
    ├── tokens.ts          adjustable token definitions: host defaults, selectors, derived variables
    ├── apply.ts           compiles settings into a single injected stylesheet (scoped per theme)
    ├── color.ts           hex ⇄ HSL triplet, readable foreground, hex normalization
    ├── clipboard.ts       clipboard (with an execCommand fallback for http pages)
    ├── prefs.ts           settings persistence + cross-surface change event
    ├── server.ts          backend: reads directory creation / modification times
    ├── types.ts           host API types
    ├── i18n/              localization: locale resolution, message tables, host-language subscription
    └── ui/                stylesheets and inline icons
```

## Development

```bash
npm install
npm run build      # emits dist/index.js and dist/server.js
npm run typecheck
npm run dev        # watch mode
```

## Installation

### 1. Install from the UI (recommended)

CloudCLI's plugin installer does exactly one thing: `git clone` → read `manifest.json` at the **repository root** → `npm install --ignore-scripts` → `npm run build`. So the root of this repository **is** the plugin — just paste the repository URL:

```
https://github.com/fu827707013/web-ui-customizer
```

Open **Settings → Plugins**, paste that URL into "Install from Git", wait for the build to finish → restart CloudCLI → turn on the switch in **Settings → Web UI Customizer**.

> The installer does not handle monorepos / multi-plugin repositories: it clones once and only looks at the repository root, so a repo that holds several plugins cannot be installed (it fails with "Cloned repository does not contain a manifest.json"). To ship several plugins, ship several repositories.

### 2. Install locally (when changing the code)

```powershell
npm run build
$target = "$env:USERPROFILE\.claude-code-ui\plugins\web-ui-customizer"
New-Item -ItemType Directory -Force $target | Out-Null
# Copy items individually: `Copy-Item -Recurse . $target` adds an extra web-ui-customizer\ level,
# and the host looks for plugins\<name>\manifest.json — one extra level and it is not found.
Copy-Item -Path manifest.json, package.json, icon.svg -Destination $target -Force
Copy-Item -Path src, scripts, dist -Destination $target -Recurse -Force
```

Then restart the CloudCLI host (the manifest list is only scanned at startup or when the plugin list is refreshed) and turn the switch on in **Settings → Web UI Customizer**.

## Implementation notes (the pitfalls)

- **One bundle, three surfaces.** The host's resident layer and the settings page each `import()` the bundle once, and module scope is not shared, so settings can only be synchronized through `localStorage` + `SETTINGS_CHANGED_EVENT`.
- **`slot: "settings"` removes the tab.** The settings page is mounted only while it is the active view and unmounted when you switch away, so plugin code never keeps running in the background. To get both the resident behavior and a settings UI, declare `alwaysMount: true` *and* `slot: "settings"` and dispatch on `surface`.
- **Colors must be a stylesheet, not inline `style`.** In the host, light colors live on `:root` and dark colors on `.dark`; inline declarations cannot be split per theme and would pin one set of colors onto both. An injected stylesheet can hold `html:not(.dark)` and `html.dark` blocks at the same time, so switching themes needs no re-application.
- **Rules need `!important`.** Selector specificity is enough (0,1,1 vs 0,1,0), but the dev server re-inserts the Tailwind stylesheet at the end of `<head>` on every hot update, and the host's code-highlight theme is also injected at render time — a rule with equal specificity that appears later wins. Custom properties and `color` both need `!important` to hold that race.
- **Command blocks have no data attributes**, so they can only be matched by the utility classes hard-coded in the component, and those class names contain a `/` — `[class~="group/cmd"]` is needed to avoid selector escaping.
- **Row targeting relies on host data attributes:** `data-cloudcli-project-path` / `data-cloudcli-project-name`, present on rows in both sidebar layouts. The plugin listens at the `document` level, so rows mounted later still match.
- **The card is attached to `document.body`, not to its own container.** The resident layer's container is zero-sized, so anything placed inside it is invisible.
- **Times are read through the host RPC proxy**, not a bare `fetch`: `/api/plugins/*` requires an authenticated session, so a bare request returns 401.
- **Creation time comes from the filesystem**, via `fs.stat` in the plugin backend; some filesystems do not report creation time, in which case the card simply omits that line instead of showing 1970.
- **A plugin cannot reach the host's `t()`.** The plugin bundle is imported dynamically as a standalone module: it has no React context and no handle on the host's i18n instance. Instead it reads the language that the host mirrors into `localStorage` (`user-preferences` → `userLanguage`) and listens for the host's `user-preferences:changed` event to switch live — a path that needs no new host API.
- **The fallback language is `en`, not Chinese.** `resolveLocale()` maps `zh-Hans` to `zh-CN` and `zh-Hant`/`zh-TW`/`zh-HK`/`zh-MO` to `zh-TW`, everything else to `en` (`navigator.language` deliberately plays no part, so it cannot fight the host setting). `en` in `messages.ts` is the base table and `MessageKey = keyof typeof en`, so a missing translation is a type error rather than Chinese leaking through at runtime.
- **`package.json` must not contain a BOM.** The host uses it to decide whether a `build` script exists, reading it with `JSON.parse(fs.readFileSync(..., 'utf-8'))` — a BOM makes the parse fail, the host treats that as "no build script", skips the build and still reports a successful install. The result is an installed plugin with no `dist/`, so neither the frontend nor the backend works. Windows editors like to add a BOM on save; both the working tree and the git blob in this repository are BOM-free.
