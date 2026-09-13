# Upgit Obsidian plugin

Desktop community plugin. Source in `src/`, bundled to `main.js`.

- Plugin id: `upgit` (must not contain `obsidian`)
- Repository: `EwigMidori/upgit-obsidian`
- Desktop only: spawns the local Upgit CLI with `child_process.spawn` and an argument array (no shell)

## Commands

```bash
npm install
npm test
npm run lint
npm run build
```

## Layout

- `src/main.ts` — lifecycle, context menus, commands
- `src/settings.ts` — settings tab
- `src/runner.ts` — process spawn
- `src/upgit.ts` — args and URL parsing
- `src/markdown.ts` — image refs in notes
- `src/image.ts` — image extensions

Do not commit `main.js` or `node_modules`. GitHub releases must attach `main.js` and `manifest.json`.
