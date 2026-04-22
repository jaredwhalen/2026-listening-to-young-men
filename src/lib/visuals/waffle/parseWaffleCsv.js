import { csvParse } from 'd3-dsv';

function isProbablyHtml(raw) {
	const s = String(raw ?? '').trimStart().toLowerCase();
	return s.startsWith('<!doctype html') || s.startsWith('<html') || s.startsWith('<style');
}

function toNumberMaybe(v) {
	if (v == null) return null;
	const s = String(v).trim().replace(/%$/, '');
	if (!s) return null;
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}

/** Parse `waffle.csv`: `table`, `trait`, then demo columns (numeric values). */
export function parseWaffleCsv(rawCsv) {
	if (typeof rawCsv !== 'string' || rawCsv.trim().length === 0) {
		return { ok: false, error: '`waffle.csv` is empty or missing.' };
	}

	if (isProbablyHtml(rawCsv)) {
		return {
			ok: false,
			error:
				'`waffle.csv` looks like HTML (Google login / cookie wall), not CSV. Make the Google Sheet public, then run `npm run gdoc` to regenerate `src/lib/data/waffle.csv`.'
		};
	}

	let parsed;
	try {
		parsed = csvParse(rawCsv);
	} catch (e) {
		return {
			ok: false,
			error: `Could not parse CSV: ${e instanceof Error ? e.message : String(e)}`
		};
	}

	const cols = parsed.columns ?? [];
	if (!cols.includes('table') || !cols.includes('trait')) {
		return {
			ok: false,
			error: 'CSV must include `table` and `trait` columns.'
		};
	}

	const demoColumns = cols.filter((c) => c !== 'table' && c !== 'trait');

	const rows = parsed
		.map((d) => {
			const table = String(d.table ?? '').trim();
			const trait = String(d.trait ?? '').trim();
			const values = {};
			for (const c of demoColumns) values[c] = toNumberMaybe(d[c]);
			return { table, trait, values };
		})
		.filter((r) => r.table && r.trait);

	const tables = Array.from(new Set(rows.map((r) => r.table)));
	const traitOrder = Array.from(new Set(rows.map((r) => r.trait)));

	return { ok: true, rows, tables, columns: demoColumns, traitOrder };
}

