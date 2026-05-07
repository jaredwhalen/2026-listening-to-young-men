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
| **build** | `cdnBaseUrl` (URL of the **committed** static output, usually `docs/` on GitHub + jsDelivr) and `embedContainerId` for the WordPress embed generator. |

## WordPress embed

Build the site, then generate the embed HTML (reads `dist/` or `docs/` and `src/lib/config/project.config.js`):

```bash
npm run build:embed
```

This writes `dist/` (gitignored) and regenerates `wordpress-embed.html` (gitignored by default). `tasks/generate-embed.js` uses `build.cdnBaseUrl`; that URL must match where you **publish** the same hashed assets (this repo uses committed **`docs/`**, e.g. `https://cdn.jsdelivr.net/gh/<org>/<repo>@<branch>/docs/`). Typical order: `npm run build` → copy `dist/` → `docs/` → run `node tasks/generate-embed.js` (uses `dist/` when it exists, so hashes align with what you commit) → commit `docs/`.

In WordPress, add a Custom HTML block and paste the contents of `wordpress-embed.html`.

### Forks, templates, and `build:embed`

If you clone this repo, use it as a GitHub template, or fork it for a new story, run **`npm run setup`** before you rely on embed output (or hand-edit the same `YOUR_*` tokens in `src/lib/config/project.config.js`). Otherwise `cdnBaseUrl` will still point at placeholder org/repo paths and the generated `wordpress-embed.html` will load the wrong assets.

Typical flow: run `setup` → `npm run build` → copy **`dist/`** into **`docs/`** → `node tasks/generate-embed.js` → commit and push **`docs/`** on the branch jsDelivr reads (often `main`).

## Scripts

- `npm run setup` — Post-clone prompts; fills template tokens in `package.json`, `project.config.js` (title, description, CDN URL), README
- `npm run dev` — Vite dev server
- `npm run build` — Production build into `dist/`
- `npm run build:embed` — `build` then `node tasks/generate-embed.js`
- `npm run preview` — Local preview of the production build
- `npm run everviz:sync` — Sync Everviz charts from a Google Sheet manifest into Everviz (creates/updates + emits `.everviz/report.md`)
  - One chart only: `npm run everviz:sync -- --key="Figure 1.2"` or `npm run everviz:sync -- --chart-id=622316` (chart id must exist in `.everviz/chart-map.json`)
- `npm run everviz:delete-mapped` — Delete every chart listed in `.everviz/chart-map.json` (dry-run unless you pass `--yes`)

## Everviz chart automation

This repo includes a small sync script that reads a **manifest tab** in a Google Sheet and then, for each row, reads a **data tab** (also CSV-exported) and creates/updates an Everviz chart.

### Required environment variables

- `GOOGLE_SHEET_ID`: Google Sheets spreadsheet id (the long id in the URL)
- `GOOGLE_MANIFEST_GID`: The `gid` of the manifest tab (optional if you use `GOOGLE_MANIFEST_SHEET_NAME`)
- `GOOGLE_MANIFEST_SHEET_NAME`: The manifest tab name (optional if you use `GOOGLE_MANIFEST_GID`)
- `EVERVIZ_TEAM_ID`: Your Everviz team id
- `EVERVIZ_API_KEY`: An Everviz API key (sent as `X-API-Key`)

Optional:

- `EVERVIZ_THEME_ID`: Default theme id if a row doesn’t specify one
- `EVERVIZ_SCALE_DECIMAL_FRACTIONS`: `0` to skip multiplying 0–1 data values by 100 before upload (default: on). Per-row: `scale_decimal_fractions` in the manifest.
- `EVERVIZ_DRY_RUN=1`: Parse everything + write report, but don’t create/update charts
- `EVERVIZ_SYNC_KEY`: Same as `--key` — sync a single manifest row
- `EVERVIZ_SYNC_CHART_ID`: Same as `--chart-id` — sync the chart with that Everviz id (must be in `chart-map.json`)
- `GOOGLE_USE_AUTH=1`: Use Google Sheets API auth (recommended for non-public sheets)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to a service account JSON file (standard Google env var)
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Inline service account JSON (stringified). Useful in CI.

### Manifest schema (tab CSV columns)

Column names are case-insensitive; spaces are normalized to underscores by the script.

- **`key`** (required): Human identifier for the chart (e.g. `Figure 1.2`). The script will slugify it internally (e.g. `figure_1_2`) for idempotency.
- **`enabled`** (optional, default true): `true/false` to include/exclude this row
- **`title`** (optional, default `key`): Chart title
- **`description`** (optional): Shown as the chart subtitle
- **`source`** (optional): Ignored by default; every chart uses a fixed caption + credits (see below). Override with `options_json` if needed.
- **`chart_type`** (optional, default `column`): Highcharts chart type (`bar`, `column`, `line`, `pie`, etc.)
- **`theme_id`** (optional): Everviz theme id for this chart (overrides `EVERVIZ_THEME_ID`)
- **`data_sheet_name`** (optional, default `key`): The sheet tab name that contains the CSV data for this chart
- **`data_gid`** (optional): The `gid` of the data tab (legacy fallback if you prefer gids)
- **`series_mapping_json`** (optional): JSON string for Highcharts data module `seriesMapping`
- **`options_json`** (optional): JSON string that is deep-merged into the Highcharts `options` object (overrides defaults below)
- **`scale_decimal_fractions`** (optional, default true): If your numeric columns use fractions like `0.46` for 46%, the sync multiplies those values by **100** before sending CSV so the Y axis can use `{value}%`. Values already greater than 1 are left as-is.

**Defaults applied to every chart** (before `options_json`): series colors `#2f2ca8`, `#de6a40`, `#318793`, `#b34cdb`; **Y axis hidden**; **legend above** the chart; **data labels** `{y:.0f}%` on series; **tooltip** with `%` on values; **caption** “Source: Public Agenda Survey of American Men, conducted November 4–18, 2025.”; **credits** “Public Agenda” linking to [publicagenda.org](https://publicagenda.org/); values are still scaled 0–100 when using fractional sheet data (see below).

**Percent values in the sheet:** Everviz/Highcharts does **not** interpret `0.5` as 50% by itself—`{value}%` would show `0.5%`. Use the scaling above or store values as `0–100` in the sheet.

The data tab should be laid out as a normal CSV table; the script sends the full tab as `options.data.csv` (after optional scaling).

### Locked charts (skip sync)

Put manifest keys in **`.everviz/locked.csv`** (column `key`, one figure per row) to **never** create or update those charts from the sync—useful after manual edits in Everviz. Example:

```csv
key
Figure 1.5
Figure 1.6
```

Single-chart sync (`--key` / `--chart-id`) fails with a clear error if that chart is locked; remove it from `locked.csv` first.


## Project layout (source)

- `src/routes/` — `+layout.svelte` (head, layout root, theme), `+page.svelte` (home)
- `src/lib/components/` — Scroller, slides, index shell, background stub
- `src/lib/config/` — `project.config.js` and thin `project.js` re-export
- `src/lib/data/copy.json` — Slide copy (`id` + `text`)
- `tasks/setup.js` — Clone-time slug / title / GitHub URL wiring
- `tasks/generate-embed.js` — Embeds script for CMS injection
