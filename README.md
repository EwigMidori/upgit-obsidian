# Upgit

Upload images from Obsidian with the [Upgit](https://github.com/pluveto/upgit) CLI. Right-click an image in the file explorer or on an image embed in the editor, then choose **Upload with Upgit**.

This plugin is desktop-only. It runs your local `upgit` binary and does not bundle credentials. Hosting, rename rules, and tokens stay in Upgit's own `config.toml`.

## Requirements

1. Install [Upgit](https://github.com/pluveto/upgit) and confirm `upgit path/to/image.png` prints a URL in a terminal.
2. Keep `config.toml` next to the binary (or pass `--application-path` via extra arguments if you store it elsewhere).

## Install

### Community plugins (after listing)

1. Open **Settings → Community plugins**.
2. Select **Browse**, search for **Upgit**, then install and enable it.

### Manual

1. Download `main.js` and `manifest.json` from [Releases](https://github.com/EwigMidori/upgit-obsidian/releases).
2. Place them in `<vault>/.obsidian/plugins/upgit/`.
3. Enable **Upgit** under **Settings → Community plugins**.

## Setup

1. Open **Settings → Upgit**.
2. Set **Upgit executable** to the absolute path of the binary, for example `E:\Software\upgit_win_amd64\upgit.exe`.
3. Leave it empty to use `upgit` from `PATH`. On Windows the plugin also looks for `E:\Software\upgit_win_amd64\upgit.exe` when that file exists.

Optional:

- **Extra arguments** — extra CLI flags, split on whitespace (`--uploader github`).
- **Replace links in the active note** — swap `![[image.png]]` or `![](image.png)` for `![](https://...)`.
- **Copy URL to clipboard** — on by default.
- **Delete local file after upload** — passes `--clean`. Off by default.

## Usage

- File explorer: right-click one or more image files → **Upload with Upgit**.
- Editor: right-click an image wikilink, Markdown image, or `<img src>` → **Upload with Upgit**.
- Command palette: **Upgit: Upload image from the editor**.

The plugin calls Upgit with `--output stdout --format url`. When the executable path is absolute, it also passes `--application-path` so Upgit can find `config.toml` beside the binary.

## Privacy

Images you upload go wherever your Upgit uploader is configured to send them (GitHub, S3, SM.MS, and others). Public GitHub repositories make raw URLs world-readable. This plugin does not add telemetry.

## Development

```bash
npm install
npm test
npm run lint
npm run build
```

Copy `main.js` and `manifest.json` into `<vault>/.obsidian/plugins/upgit/` to try a local build.

## License

MIT. See [LICENSE](LICENSE).
