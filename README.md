# Listening To Young Men | Visuals

A minimal [SvelteKit](https://kit.svelte.dev/) + Svelte 5 template for embeds and stories. Output is static HTML (`adapter-static`) so you can host it anywhere or drop a generated snippet into WordPress (or another CMS) via a CDN.

## First run (after clone)

```bash
npm install
npm run setup
```

`setup` asks for an npm-safe package name, page title, meta description, and GitHub org/repo so it can fill `package.json`, `src/lib/config/project.config.js` (title, description, jsDelivr `cdnBaseUrl`), and this README heading. Re-run only if you still see `YOUR_*` / `your-story-slug` tokens.

`npm install` runs the `prepare` script (`svelte-kit sync`), which is fine with the placeholder `package.json` name until you personalize it with `setup`.

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Configuration

Edit `src/lib/config/project.config.js` (import it elsewhere as `import project from '$lib/config/project.js'`).

| Area | Purpose |
|------|---------|
| **meta** | Page `title` and `description` in the root layout. |
| **document** | `mode: 'standalone'` loads viewport meta and Google Fonts from the layout; `'inline'` skips those fonts when the host page already defines typography. Toggle `includeViewportMeta` / `includeGoogleFonts` as needed. |
| **layout** | `mode: 'column'` applies `maxWidthPx` with content aligned to the start (not centered). `mode: 'full'` is full-bleed width on the app root. `horizontalPadding` is a CSS length on that root (use `'0'` for flush edges). |
| **build** | `cdnBaseUrl` (your published `dist/` URL) and `embedContainerId` used when generating the WordPress embed file. |

## WordPress embed

Build the site, then generate the embed HTML (reads `dist/index.html` and `src/lib/config/project.config.js`):

```bash
npm run build:embed
```

This writes `dist/` and `wordpress-embed.html`. `tasks/generate-embed.js` uses `build.cdnBaseUrl` from `project.config.js`; that URL must match where `dist/` is actually hosted (for example jsDelivr’s `https://cdn.jsdelivr.net/gh/<org>/<repo>@<branch>/dist/`).

In WordPress, add a Custom HTML block and paste the contents of `wordpress-embed.html`.

### Forks, templates, and `build:embed`

If you clone this repo, use it as a GitHub template, or fork it for a new story, run **`npm run setup`** before you rely on embed output (or hand-edit the same `YOUR_*` tokens in `src/lib/config/project.config.js`). Otherwise `cdnBaseUrl` will still point at placeholder org/repo paths and the generated `wordpress-embed.html` will load the wrong assets.

Typical flow: run `setup` → commit → `npm run build:embed` → commit and push **`dist/`** (and `wordpress-embed.html` if you track it) to the branch your CDN reads (often `main`). jsDelivr and similar CDNs resolve `gh/org/repo@branch/dist/` only after those files exist on GitHub.

## Scripts

- `npm run setup` — Post-clone prompts; fills template tokens in `package.json`, `project.config.js` (title, description, CDN URL), README
- `npm run dev` — Vite dev server
- `npm run build` — Production build into `dist/`
- `npm run build:embed` — `build` then `node tasks/generate-embed.js`
- `npm run preview` — Local preview of the production build

## Project layout (source)

- `src/routes/` — `+layout.svelte` (head, layout root, theme), `+page.svelte` (home)
- `src/lib/components/` — Scroller, slides, index shell, background stub
- `src/lib/config/` — `project.config.js` and thin `project.js` re-export
- `src/lib/data/copy.json` — Slide copy (`id` + `text`)
- `tasks/setup.js` — Clone-time slug / title / GitHub URL wiring
- `tasks/generate-embed.js` — Embeds script for CMS injection
