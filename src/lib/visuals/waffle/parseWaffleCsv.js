function isProbablyHtmlRow(row) {
	const blob = Object.values(row ?? {})
		.map((v) => String(v ?? ''))
		.join(' ')
		.trimStart()
		.toLowerCase();
	return blob.startsWith('<!doctype html') || blob.startsWith('<html') || blob.startsWith('<style');
}

function toNumberMaybe(v) {
	if (v == null) return null;
	const s = String(v).trim().replace(/%$/, '');
	if (!s) return null;
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}

/**
 * Shape `waffle.csv` into rows/tables/columns for charts.
 * @param {Record<string, string>[]} rows from `import waffle from '.../waffle.csv'` (@rollup/plugin-dsv)
 */
export function parseWaffleCsv(rows) {
	if (!Array.isArray(rows) || rows.length === 0) {
		return { ok: false, error: '`waffle.csv` is empty or not an array (check @rollup/plugin-dsv import).' };
	}

	if (isProbablyHtmlRow(rows[0])) {
		return {
			ok: false,
			error:
				'`waffle.csv` looks like HTML (Google login / cookie wall), not CSV. Make the Google Sheet public, then run `npm run gdoc` to regenerate `src/lib/data/waffle.csv`.'
		};
	}

	const cols = Object.keys(rows[0]);
	if (!cols.includes('table') || !cols.includes('trait')) {
		return {
			ok: false,
			error: 'CSV must include `table` and `trait` columns.'
		};
	}

	const demoColumns = cols.filter((c) => c !== 'table' && c !== 'trait');

	const parsedRows = rows
		.map((d) => {
			const table = String(d.table ?? '').trim();
			const trait = String(d.trait ?? '').trim();
			const values = {};
			for (const c of demoColumns) values[c] = toNumberMaybe(d[c]);
			return { table, trait, values };
		})
		.filter((r) => r.table && r.trait);

	const tables = Array.from(new Set(parsedRows.map((r) => r.table)));
	const traitOrder = Array.from(new Set(parsedRows.map((r) => r.trait)));

	return { ok: true, rows: parsedRows, tables, columns: demoColumns, traitOrder };
}
