#!/usr/bin/env node
/**
 * Sync Everviz charts from a Google Sheet manifest + per-chart data tabs.
 *
 * Requirements (env):
 * - GOOGLE_SHEET_ID: The spreadsheet ID
 * - GOOGLE_MANIFEST_GID: The GID of the manifest tab (CSV export)
 * - EVERVIZ_TEAM_ID: Everviz team ID
 * - EVERVIZ_API_KEY: Everviz API key (sent as X-API-Key)
 *
 * Optional (env):
 * - EVERVIZ_THEME_ID: Default theme id if not in manifest row
 * - EVERVIZ_SCALE_DECIMAL_FRACTIONS: "0" to send sheet values as-is (no ×100 on 0–1 columns)
 * - EVERVIZ_DRY_RUN: "1" to skip any writes to Everviz
 * - EVERVIZ_SYNC_KEY: Manifest `key` (e.g. Figure 1.2) — process only that row
 * - EVERVIZ_SYNC_CHART_ID: Everviz numeric chart_id from chart-map — process only that row
 *
 * CLI (overrides env when passed):
 * - --key=Figure 1.2
 * - --chart-id=622316
 *
 * Charts listed in `.everviz/locked.csv` are never created or updated (manual edits preserved).
 */

// Load .env if present (Node doesn't do this automatically).
import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { csvParse, csvFormat, csvFormatRows } from 'd3-dsv';
import { google } from 'googleapis';

const ROOT = process.cwd();
const EVERVIZ_STATE_DIR = path.join(ROOT, '.everviz');
const EVERVIZ_MAP_PATH = path.join(EVERVIZ_STATE_DIR, 'chart-map.json');
const LOCKED_CSV_PATH = path.join(EVERVIZ_STATE_DIR, 'locked.csv');
const REPORT_PATH = path.join(EVERVIZ_STATE_DIR, 'report.md');
const REPORT_CSV_PATH = path.join(EVERVIZ_STATE_DIR, 'report.csv');

/** Default series colors (first series → first color, etc.). */
const DEFAULT_SERIES_COLORS = ['#2f2ca8', '#de6a40', '#318793', '#38aad6'];

const DEFAULT_CAPTION_HTML =
	'<b>Source</b>: Public Agenda Survey of American Men, conducted November 4–18, 2025.';
const DEFAULT_CREDITS_HREF = 'https://publicagenda.org/';

function requireEnv(name) {
	const v = process.env[name];
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

function readJsonIfExists(p, fallback) {
	try {
		return JSON.parse(fs.readFileSync(p, 'utf8'));
	} catch {
		return fallback;
	}
}

function ensureDir(p) {
	if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function asBool(v, defaultValue = false) {
	if (v == null || v === '') return defaultValue;
	const s = String(v).trim().toLowerCase();
	if (['1', 'true', 'yes', 'y'].includes(s)) return true;
	if (['0', 'false', 'no', 'n'].includes(s)) return false;
	return defaultValue;
}

function maybeJson(v) {
	if (!v) return null;
	try {
		return JSON.parse(v);
	} catch (e) {
		throw new Error(`Invalid JSON: ${String(e?.message || e)}\nValue:\n${v}`);
	}
}

function deepMerge(target, source) {
	if (!source || typeof source !== 'object') return target;
	if (!target || typeof target !== 'object') return source;
	for (const [k, v] of Object.entries(source)) {
		if (Array.isArray(v)) {
			target[k] = v.slice();
		} else if (v && typeof v === 'object') {
			target[k] = deepMerge(target[k] ?? {}, v);
		} else {
			target[k] = v;
		}
	}
	return target;
}

async function fetchText(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${url}`);
	const arrayBuffer = await res.arrayBuffer();
	return new TextDecoder('utf-8').decode(arrayBuffer);
}

function hasGoogleAuthEnv() {
	return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

async function getSheetsClient() {
	// If GOOGLE_APPLICATION_CREDENTIALS is set, googleapis will read that file.
	// Otherwise accept JSON inline via GOOGLE_SERVICE_ACCOUNT_JSON.
	const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
		? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
		: undefined;

	const auth = new google.auth.GoogleAuth({
		credentials,
		scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
	});
	return google.sheets({ version: 'v4', auth });
}

function valuesToCsv(values) {
	// `values` is a 2D array of cell values.
	// Convert to strings, preserving empties.
	const rows = (values ?? []).map((r) => (r ?? []).map((c) => (c == null ? '' : String(c))));
	return csvFormatRows(rows);
}

async function fetchSheetTabCsvAuthed({ sheets, sheetId, sheetName }) {
	// Read the entire tab by name using the Sheets API.
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: sheetName
	});
	return valuesToCsv(res.data.values || []);
}

function googleSheetCsvUrl({ sheetId, gid }) {
	const base = 'https://docs.google.com';
	const post = `spreadsheets/u/1/d/${sheetId}/export?format=csv&id=${sheetId}&gid=${gid}`;
	return `${base}/${post}`;
}

function googleSheetCsvUrlBySheetName({ sheetId, sheetName }) {
	// Uses the "gviz" CSV export which supports addressing tabs by name.
	// This avoids needing to look up gids via the Sheets API.
	const enc = encodeURIComponent(sheetName);
	return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${enc}`;
}

function evervizRequest(teamId, apiKey) {
	const endpoint = 'https://api.everviz.com';
	return async (method, path, bodyObj) => {
		const r = {
			method,
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': apiKey
			}
		};
		if (bodyObj !== undefined) r.body = JSON.stringify(bodyObj);
		const res = await fetch(endpoint + path, r);
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(
				`Everviz ${method.toUpperCase()} ${path} failed: ${res.status} ${res.statusText}\n${text}`
			);
		}
		return await res.json();
	};
}

function evervizEmbedFallbackFromUuid(uuid) {
	if (!uuid) return { iframe: { remote: '', embedCode: '' }, inject: { remote: '', embedCode: '' } };
	const iframeRemote = `https://app.everviz.com/embed/${uuid}`;
	const injectRemote = `https://app.everviz.com/inject/${uuid}`;
	return {
		iframe: {
			remote: iframeRemote,
			embedCode: `<iframe src="${iframeRemote}" style="width:100%;height:500px;border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
		},
		inject: {
			remote: injectRemote,
			embedCode: `<script src="${injectRemote}"></script>`
		}
	};
}

function evervizEditUrl({ chartId, chartType }) {
	// Example:
	// https://app.everviz.com/edit/610940?editor&panel=chart_customize&type=scatter_chart
	const t = String(chartType || '').trim();
	const typeParam = t ? (t.endsWith('_chart') ? t : `${t}_chart`) : '';
	const qs = new URLSearchParams({
		editor: '',
		panel: 'chart_customize',
		...(typeParam ? { type: typeParam } : {})
	});
	return `https://app.everviz.com/edit/${chartId}?${qs.toString()}`;
}

function csvEscape(v) {
	const s = String(v ?? '');
	if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function resolveThemeId(row) {
	// Default to 71 unless overridden (matches the docs' `theme.id` usage).
	const n = Number(row.theme_id || process.env.EVERVIZ_THEME_ID || 71);
	return Number.isFinite(n) && n > 0 ? n : 71;
}

/**
 * Highcharts/Everviz does not treat 0.5 as "50%" automatically — `{value}%` shows "0.5%".
 * Scale values in (0, 1] on non-first columns to 0–100 so axis format `{value}%` reads correctly.
 * Values already > 1 or non-numeric cells are left unchanged.
 */
function scaleFractionCsvToPercent(csv) {
	const rows = csvParse(csv);
	if (!rows.length) return csv;
	const cols = rows.columns;
	if (!cols?.length) return csv;

	for (const row of rows) {
		for (let i = 1; i < cols.length; i++) {
			const col = cols[i];
			const raw = row[col];
			if (raw == null || raw === '') continue;
			const s = String(raw).trim().replace(/%/g, '');
			const n = Number(s);
			if (!Number.isFinite(n)) continue;
			if (n > 0 && n <= 1) row[col] = String(n * 100);
		}
	}
	return csvFormat(rows, cols);
}

function shouldScaleDecimalFractions(row) {
	return asBool(row.scale_decimal_fractions ?? row.scale_fractions, asBool(process.env.EVERVIZ_SCALE_DECIMAL_FRACTIONS, true));
}

function buildBaseEvervizPayload(row, csv) {
	const title = row.title ?? row.name ?? row.key;
	const chartType = row.chart_type ?? row.type ?? 'column';
	const themeId = resolveThemeId(row);

	const seriesMapping = maybeJson(row.series_mapping_json) ?? undefined;
	const optionsOverride = maybeJson(row.options_json) ?? null;

	// Keep the Everviz payload minimal and doc-aligned:
	// { options, settings, theme } + settings.dataProvider = options.data
	const options = {
		chart: { type: chartType },
		title: { text: title },
		data: {
			csv,
			...(seriesMapping ? { seriesMapping } : {})
		}
	};

	// Optional metadata (still minimal, but supports your manifest fields).
	if (row.description) options.subtitle = { text: row.description };

	// Brand defaults (theme unreliable via API): colors, legend, hidden Y axis, % labels + tooltip.
	const chartDefaults = {
		colors: DEFAULT_SERIES_COLORS.slice(),
		caption: {
			enabled: true,
			useHTML: true,
			text: DEFAULT_CAPTION_HTML,
			align: 'left'
		},
		credits: {
			enabled: true,
			// `href` is required or Everviz/Highcharts keeps the default (everviz.com).
			text: 'Public Agenda',
			href: DEFAULT_CREDITS_HREF,
			style: { color: '#318793' }
		},
		chart: {
			spacingTop: 24
		},
		legend: {
			align: 'center',
			verticalAlign: 'top',
			layout: 'horizontal',
			x: 0,
			y: 0
		},
		yAxis: {
			visible: false,
			labels: { enabled: false },
			title: { text: null },
			gridLineWidth: 0,
			lineWidth: 0,
			minorGridLineWidth: 0,
			tickLength: 0
		},
		tooltip: {
			shared: true,
			headerFormat: '<span style="font-size: 11px">{point.key}</span><br/>',
			// `valueSuffix` is ignored when `pointFormat` is set; keep % in the template.
			pointFormat:
				'<span style="color:{series.color}">\u25cf</span> {series.name}: <b>{point.y:.0f}%</b><br/>'
		},
		plotOptions: {
			series: {
				dataLabels: {
					enabled: true,
					format: '{y:.0f}%'
				}
			}
		}
	};
	let mergedOptions = deepMerge(options, chartDefaults);
	mergedOptions = optionsOverride ? deepMerge(mergedOptions, optionsOverride) : mergedOptions;

	const data = {
		options: mergedOptions,
		settings: {},
		theme: { id: themeId }
	};

	// Important for now: dataProvider must point at the data config.
	data.settings.dataProvider = data.options.data;
	return data;
}

function slugKey(input) {
	// Snake-case-ish stable key: Figure 1.2 -> figure_1_2
	return String(input ?? '')
		.trim()
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

/** Slugs of figures to skip (never push to Everviz). One column `key` or first column. */
function readLockedSlugs() {
	if (!fs.existsSync(LOCKED_CSV_PATH)) return new Set();
	const text = fs.readFileSync(LOCKED_CSV_PATH, 'utf8').trim();
	if (!text) return new Set();
	const rows = csvParse(text);
	const set = new Set();
	for (const r of rows) {
		const raw =
			r.key ?? r.figure ?? r.chart_key ?? (Object.keys(r).length ? r[Object.keys(r)[0]] : null);
		if (raw == null || raw === '') continue;
		const s = slugKey(String(raw).trim());
		if (s) set.add(s);
	}
	return set;
}

/**
 * When set, only the manifest row matching this slug (e.g. figure_1_2) is synced.
 * `--chart-id` resolves via chart-map.json; `--key` uses the same slug as the manifest key.
 */
function parseSingleChartFilter(argv, chartMap) {
	let keyArg = process.env.EVERVIZ_SYNC_KEY?.trim() || null;
	let chartIdArg = (() => {
		const raw = process.env.EVERVIZ_SYNC_CHART_ID;
		if (raw == null || raw === '') return null;
		const n = Number(raw);
		return Number.isFinite(n) ? n : null;
	})();

	for (const arg of argv) {
		if (arg.startsWith('--key=')) {
			const v = arg.slice(6).trim();
			if (v) keyArg = v;
		} else if (arg.startsWith('--chart-id=')) {
			const n = Number(arg.slice('--chart-id='.length));
			if (Number.isFinite(n)) chartIdArg = n;
		}
	}

	let filterSlug = null;

	if (chartIdArg != null) {
		const found = Object.entries(chartMap.charts ?? {}).find(
			([, v]) => Number(v?.chart_id) === chartIdArg
		);
		if (!found) {
			throw new Error(
				`--chart-id=${chartIdArg} not found in .everviz/chart-map.json. ` +
					`Use --key="Figure 1.2" (your manifest key) for a row that is not in the map yet, or run a full sync once.`
			);
		}
		filterSlug = found[0];
	}

	if (keyArg) {
		const fromKey = slugKey(keyArg);
		if (!fromKey) {
			throw new Error(`--key produced an empty slug: "${keyArg}"`);
		}
		if (filterSlug && fromKey !== filterSlug) {
			throw new Error(
				`--key "${keyArg}" (slug ${fromKey}) does not match --chart-id ${chartIdArg} (slug ${filterSlug}).`
			);
		}
		filterSlug = fromKey;
	}

	return filterSlug;
}

async function main() {
	const sheetId = requireEnv('GOOGLE_SHEET_ID');
	const manifestGid = process.env.GOOGLE_MANIFEST_GID;
	const manifestSheetName = process.env.GOOGLE_MANIFEST_SHEET_NAME;
	if (!manifestGid && !manifestSheetName) {
		throw new Error('Missing GOOGLE_MANIFEST_GID or GOOGLE_MANIFEST_SHEET_NAME');
	}
	const teamId = requireEnv('EVERVIZ_TEAM_ID');
	const apiKey = requireEnv('EVERVIZ_API_KEY');
	const dryRun = asBool(process.env.EVERVIZ_DRY_RUN, false);
	const useGoogleAuth = asBool(process.env.GOOGLE_USE_AUTH, hasGoogleAuthEnv());

	ensureDir(EVERVIZ_STATE_DIR);

	const chartMap = readJsonIfExists(EVERVIZ_MAP_PATH, { charts: {} });
	if (!chartMap.charts) chartMap.charts = {};

	const request = evervizRequest(teamId, apiKey);
	const sheets = useGoogleAuth ? await getSheetsClient() : null;

	let manifestCsv = '';
	if (useGoogleAuth) {
		const name = manifestSheetName || '__manifest__';
		manifestCsv = await fetchSheetTabCsvAuthed({ sheets, sheetId, sheetName: name });
	} else {
		const manifestUrl = manifestSheetName
			? googleSheetCsvUrlBySheetName({ sheetId, sheetName: manifestSheetName })
			: googleSheetCsvUrl({ sheetId, gid: manifestGid });
		manifestCsv = await fetchText(manifestUrl);
	}
	const manifestRowsRaw = csvParse(manifestCsv);
	const manifestRows = manifestRowsRaw.map((r) => {
		// Normalize keys to lower snake-ish.
		const out = {};
		for (const [k, v] of Object.entries(r)) {
			const nk = String(k)
				.trim()
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');
			out[nk] = typeof v === 'string' ? v.trim() : v;
		}
		return out;
	});

	const filterSlug = parseSingleChartFilter(process.argv.slice(2), chartMap);
	if (filterSlug) {
		console.log(`Single-chart mode: ${filterSlug}`);
	}

	const lockedSlugs = readLockedSlugs();
	if (lockedSlugs.size) {
		console.log(`Locked charts (skipped): ${lockedSlugs.size} entries in ${path.relative(ROOT, LOCKED_CSV_PATH)}`);
	}

	const results = [];

	for (const row of manifestRows) {
		const enabled = asBool(row.enabled, true);
		if (!enabled) continue;

		const humanKey = row.key || row.chart_key || row.slug;
		if (!humanKey)
			throw new Error(`Manifest row missing key/chart_key/slug. Row: ${JSON.stringify(row)}`);
		const key = slugKey(humanKey);
		if (!key) throw new Error(`Manifest row key produced empty slug. key="${humanKey}"`);

		if (filterSlug && key !== filterSlug) continue;

		if (lockedSlugs.has(key)) {
			if (filterSlug === key) {
				throw new Error(
					`"${humanKey}" is in ${path.relative(ROOT, LOCKED_CSV_PATH)} — remove it from locked.csv to sync this chart.`
				);
			}
			console.log(`Skip locked: ${humanKey}`);
			continue;
		}

		const chartType = row.chart_type ?? row.type ?? 'column';

		// Data tab lookup:
		// - preferred: data tab has the same name as the key (e.g. "Figure 1.2")
		// - optional override: data_sheet_name
		// - fallback: data_gid (legacy)
		const dataSheetName = row.data_sheet_name || row.sheet_name || humanKey;
		const dataGid = row.data_gid || row.gid;
		let chartCsv = '';
		if (useGoogleAuth) {
			chartCsv = await fetchSheetTabCsvAuthed({ sheets, sheetId, sheetName: dataSheetName });
		} else {
			const dataUrl = dataGid
				? googleSheetCsvUrl({ sheetId, gid: dataGid })
				: googleSheetCsvUrlBySheetName({ sheetId, sheetName: dataSheetName });
			chartCsv = await fetchText(dataUrl);
		}
		const chartCsvForEverviz = shouldScaleDecimalFractions(row)
			? scaleFractionCsvToPercent(chartCsv)
			: chartCsv;
		const data = buildBaseEvervizPayload({ ...row, key, human_key: humanKey }, chartCsvForEverviz);

		const existing = chartMap.charts[key];
		let chartId = existing?.chart_id ?? null;
		let uuid = existing?.uuid ?? null;
		let embed = null;

		if (dryRun) {
			results.push({
				key: humanKey,
				title: row.title || row.name || key,
				chart_type: chartType,
				chart_id: chartId || '(new)',
				uuid: uuid || '(unknown)',
				embed: '(dry-run)',
				link: uuid ? `https://app.everviz.com/chart/${uuid}` : '',
				edit_link: chartId ? evervizEditUrl({ chartId, chartType }) : ''
			});
			continue;
		}

		if (!chartId) {
			const created = await request('post', `/team/${teamId}/chart`, {
				data: JSON.stringify(data),
				referenced: 0,
				name: row.title || row.name || humanKey
			});

			chartId = created.chart_id ?? created.id ?? created.chartId ?? created?.chart?.chart_id;
			uuid = created.uuid ?? created?.chart?.uuid ?? created?.chart_uuid;

			if (!chartId) {
				throw new Error(
					`Everviz create response did not include chart_id. Key="${key}". Response: ${JSON.stringify(created)}`
				);
			}
		} else {
			// Update chart options/config.
			await request('post', `/team/${teamId}/chart/${chartId}`, { data });
		}

		// Note: We intentionally do not call GET /chart/:id here.
		// Some Everviz API access groups allow create/update but forbid reading charts (403).
		// We rely on the payload we send to /chart/:id to carry csv + theme.

		const fallbackEmbed = evervizEmbedFallbackFromUuid(uuid);

		// Grab embed info (script + iframe code). Some teams/api keys lack permission for this endpoint.
		try {
			embed = await request('get', `/team/${teamId}/chart/${chartId}/embed`);
		} catch (e) {
			embed = fallbackEmbed;
			console.warn(
				`Warning: could not fetch embed info for chart_id=${chartId} (key="${humanKey}"). Using fallback embed URLs.\n${String(
					e?.message || e
				)}`
			);
		}

		chartMap.charts[key] = {
			chart_id: chartId,
			uuid: uuid || null,
			title: row.title || row.name || key,
			human_key: humanKey,
			updated_at: new Date().toISOString()
		};

		results.push({
			key: humanKey,
			title: row.title || row.name || key,
			chart_type: chartType,
			chart_id: chartId,
			uuid: uuid || '',
			link: uuid ? `https://app.everviz.com/chart/${uuid}` : '',
			edit_link: chartId ? evervizEditUrl({ chartId, chartType }) : '',
			embed_iframe: embed?.iframe?.embedCode ?? embed?.iframe?.remote ?? fallbackEmbed?.iframe?.remote ?? '',
			embed_inject: embed?.inject?.embedCode ?? embed?.inject?.remote ?? fallbackEmbed?.inject?.remote ?? ''
		});
	}

	if (filterSlug && results.length === 0) {
		if (lockedSlugs.has(filterSlug)) {
			throw new Error(
				`Single-chart slug "${filterSlug}" is in ${path.relative(ROOT, LOCKED_CSV_PATH)} — remove it there to sync.`
			);
		}
		throw new Error(
			`Single-chart mode: no manifest row matched slug "${filterSlug}". Check the manifest key column (e.g. Figure 1.2).`
		);
	}

	fs.writeFileSync(EVERVIZ_MAP_PATH, JSON.stringify(chartMap, null, 2), 'utf8');

	// Markdown report.
	const lines = [];
	lines.push('# Everviz sync report');
	lines.push('');
	lines.push(`Generated: ${new Date().toISOString()}`);
	lines.push('');
	lines.push('| key | title | chart_type | chart_id | link | iframe embed | inject embed |');
	lines.push('|---|---|---|---:|---|---|---|');
	for (const r of results) {
		const link = r.link ? `[open](${r.link})` : '';
		const edit = r.edit_link ? `[edit](${r.edit_link})` : '';
		lines.push(
			`| ${escapePipes(r.key)} | ${escapePipes(r.title)} | ${escapePipes(
				r.chart_type ?? ''
			)} | ${escapePipes(String(r.chart_id ?? ''))} | ${link} ${edit} | ${escapePipes(
				r.embed_iframe ?? ''
			)} | ${escapePipes(r.embed_inject ?? '')} |`
		);
	}
	lines.push('');
	fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

	// CSV report (for quick spreadsheet import).
	const csvHeader = [
		'key',
		'title',
		'chart_type',
		'chart_id',
		'uuid',
		'view_link',
		'edit_link',
		'iframe_embed',
		'inject_embed'
	];
	const csvLines = [csvHeader.join(',')];
	for (const r of results) {
		csvLines.push(
			[
				r.key,
				r.title,
				r.chart_type ?? '',
				r.chart_id ?? '',
				r.uuid ?? '',
				r.link ?? '',
				r.edit_link ?? '',
				r.embed_iframe ?? '',
				r.embed_inject ?? ''
			].map(csvEscape).join(',')
		);
	}
	fs.writeFileSync(REPORT_CSV_PATH, csvLines.join('\n') + '\n', 'utf8');

	console.log(`Wrote ${path.relative(ROOT, EVERVIZ_MAP_PATH)}`);
	console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);
	console.log(`Wrote ${path.relative(ROOT, REPORT_CSV_PATH)}`);
}

function escapePipes(s) {
	return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br/>');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

