/** Waffle table key for "traits they believe are most important". */
export const WAFFLE_TABLE_THEY_BELIEVE = "they_believe";

/** Demographic column in `waffle.csv` for young men. */
export const WAFFLE_COL_YOUNG_MEN = "Men 18-34";

/**
 * @param {unknown} parsed
 * @returns {parsed is { ok: true, rows: { table: string, trait: string, values: Record<string, number | null> }[] }}
 */
function isParsedWaffleOk(parsed) {
	return (
		typeof parsed === "object" &&
		parsed !== null &&
		"ok" in parsed &&
		/** @type {{ ok: unknown }} */ (parsed).ok === true &&
		"rows" in parsed &&
		Array.isArray(/** @type {{ rows: unknown }} */ (parsed).rows)
	);
}

/**
 * Top N traits by share among young men (`they_believe` × `Men 18-34`).
 * Values in CSV are 0–1; returned `share` is 0–1.
 * @param {unknown} parsed result of `parseWaffleCsv`
 * @param {number} n
 * @returns {{ trait: string, share: number }[]}
 */
export function youngMenTopTraitsTheyBelieve(parsed, n = 3) {
	if (!isParsedWaffleOk(parsed)) return [];
	const rows = parsed.rows.filter((r) => r.table === WAFFLE_TABLE_THEY_BELIEVE);
	const col = WAFFLE_COL_YOUNG_MEN;
	const scored = rows
		.map((r) => {
			const raw = r.values[col];
			const share =
				typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
			return { trait: r.trait, share };
		})
		.filter((x) => x.trait);
	scored.sort(
		(a, b) =>
			b.share - a.share || a.trait.localeCompare(b.trait, "en"),
	);
	return scored.slice(0, Math.max(0, n));
}

/**
 * All trait labels for the they_believe table (stable CSV order).
 * @param {unknown} parsed
 * @returns {string[]}
 */
export function traitLabelsTheyBelieve(parsed) {
	if (!isParsedWaffleOk(parsed)) return [];
	const seen = new Set();
	const out = [];
	for (const r of parsed.rows) {
		if (r.table !== WAFFLE_TABLE_THEY_BELIEVE) continue;
		const t = r.trait;
		if (!t || seen.has(t)) continue;
		seen.add(t);
		out.push(t);
	}
	return out;
}
