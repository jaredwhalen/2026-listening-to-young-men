/** Subpart ID (e.g. Q23_1); empty when the question has no grid split. */
export const SID_KEY = "sId";

/** Human-readable subpart / grid line label (e.g. trait wording). */
export const SUBPART_KEY = "subpart";

export const RESPONSE_KEY = "response";

export const ALL_RESPONDENTS_KEY = "All Respondents";

/** Column keys for breakout series (must match questions-full.csv headers). */
export const DEMOGRAPHIC_KEYS = [
	"Young men",
	"Young women",
	"Men 35-54",
	"Men 55+",
];

export const TYPOLOGY_KEYS = [
	"Relational/trusting",
	"Relational/distrusting",
	"Self-driven/trusting",
	"Self-driven/distrusting",
];

/**
 * @param {unknown} v
 * @returns {number | null} 0–100, or null if missing / suppressed
 */
export function parsePercentCell(v) {
	if (v == null) return null;
	const s = String(v).trim();
	if (s === "" || s === "*" || s === "—" || s === "-") return null;
	const n = Number(s);
	if (!Number.isFinite(n)) return null;
	return Math.min(100, Math.max(0, n));
}

/**
 * @param {Record<string, string>[]} rows
 * @returns {string[]}
 */
export function listSections(rows) {
	const out = new Set();
	for (const r of rows) {
		const s = (r.section ?? "").trim();
		if (s) out.add(s);
	}
	return [...out].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {Record<string, string>[]} rows
 * @param {string} sectionQuery
 * @returns {Record<string, string>[]}
 */
export function filterRowsBySection(rows, sectionQuery) {
	const q = (sectionQuery ?? "").trim().toLowerCase();
	if (!q) return [];
	return rows.filter((r) => (r.section ?? "").trim().toLowerCase() === q);
}

/**
 * Stable key for one response scale within a question (one chart slice).
 * Uses `sId` + `subpart` so slices stay distinct even when labels repeat.
 * @param {Record<string, string>} row
 * @returns {string}
 */
export function subpartSliceKey(row) {
	const sid = (row[SID_KEY] ?? "").trim();
	const sp = (row[SUBPART_KEY] ?? "").trim();
	return `${sid}\u0001${sp}`;
}

/**
 * @param {string} sid
 * @param {string} sp
 * @returns {string}
 */
function sliceMenuLabel(sid, sp) {
	if (sp) return sp.length > 96 ? `${sp.slice(0, 95)}…` : sp;
	if (sid) return sid;
	return "All responses";
}

/**
 * Split a question’s rows into distinct subpart / grid slices (e.g. Q23_1 vs Q23_2).
 * @param {Record<string, string>[]} rows all rows for one `qId`
 * @returns {{ sliceKey: string, menuLabel: string, rows: Record<string, string>[] }[]}
 */
export function listSubpartSlices(rows) {
	/** @type {Map<string, { sliceKey: string, menuLabel: string, rows: Record<string, string>[] }>} */
	const map = new Map();
	for (const r of rows) {
		const sliceKey = subpartSliceKey(r);
		let g = map.get(sliceKey);
		if (!g) {
			const sid = (r[SID_KEY] ?? "").trim();
			const sp = (r[SUBPART_KEY] ?? "").trim();
			g = {
				sliceKey,
				menuLabel: sliceMenuLabel(sid, sp),
				rows: [],
			};
			map.set(sliceKey, g);
		}
		g.rows.push(r);
	}
	return [...map.values()].sort((a, b) =>
		a.sliceKey.localeCompare(b.sliceKey),
	);
}

/**
 * Group all rows for one top-level survey question (`qId`).
 * @param {Record<string, string>[]} sectionRows
 * @returns {{ qId: string, question: string, rows: Record<string, string>[] }[]}
 */
export function groupTopLevelQuestions(sectionRows) {
	/** @type {Map<string, { qId: string, question: string, rows: Record<string, string>[] }>} */
	const map = new Map();
	for (const r of sectionRows) {
		const qId = (r.qId ?? "").trim();
		if (!qId) continue;
		let g = map.get(qId);
		if (!g) {
			g = { qId, question: (r.question ?? "").trim(), rows: [] };
			map.set(qId, g);
		}
		g.rows.push(r);
		const qtext = (r.question ?? "").trim();
		if (qtext.length > g.question.length) g.question = qtext;
	}
	return [...map.values()].sort((a, b) => a.qId.localeCompare(b.qId));
}

/**
 * @param {{ question: string, qId: string }} g
 * @param {number} [maxLen]
 * @returns {string}
 */
export function topLevelQuestionMenuLabel(g, maxLen = 100) {
	let s = (g.question ?? "").replace(/\s+/g, " ").trim();
	if (!s) s = g.qId;
	if (s.length > maxLen) s = `${s.slice(0, maxLen - 1)}…`;
	return s;
}

/**
 * Sort rows by all-respondents share descending.
 * @param {Record<string, string>[]} rows
 * @returns {Record<string, string>[]}
 */
export function sortRowsByAllRespondentsDesc(rows) {
	return [...rows].sort((a, b) => {
		const pa = parsePercentCell(a[ALL_RESPONDENTS_KEY]);
		const pb = parsePercentCell(b[ALL_RESPONDENTS_KEY]);
		if (pa == null && pb == null) return 0;
		if (pa == null) return 1;
		if (pb == null) return -1;
		return pb - pa;
	});
}

/** Y-axis label when a single subpart slice is selected (subpart chosen in UI). */
export function responseRowLabel(row) {
	const resp = (row[RESPONSE_KEY] ?? "").trim();
	return resp || "—";
}

/**
 * Left-axis label: optional `subpart` text + response option (full-question view).
 * @param {Record<string, string>} row
 * @param {number} [maxDetail]
 * @returns {string}
 */
export function rowChartLabel(row, maxDetail = 52) {
	const detail = (row[SUBPART_KEY] ?? "").trim();
	const resp = (row[RESPONSE_KEY] ?? "").trim();
	if (detail && resp) {
		const d =
			detail.length > maxDetail
				? `${detail.slice(0, maxDetail - 1)}…`
				: detail;
		return `${d} · ${resp}`;
	}
	if (resp) return resp;
	if (detail) return detail.length > 72 ? `${detail.slice(0, 71)}…` : detail;
	return "—";
}
