const QUADRANT_ORDER = [
	['Trusting', 'Relational'],
	['Trusting', 'Self-driven'],
	['Distrusting', 'Relational'],
	['Distrusting', 'Self-driven']
];

/** Display order for stacked bars (left-to-right). Unknown categories sort last. */
const CATEGORY_ORDER_BY_ATTRIBUTE = {
	'Party Identification': ['Democratic', 'Independent', 'Republican', 'Other'],
	// CSV uses "No opinion" as the non-L/M/C bucket; treat as fourth logical group after Conservative.
	Ideology: ['Liberal', 'Moderate', 'Conservative', 'No opinion']
};

function sortAttributeItems(attributeName, items) {
	const order = CATEGORY_ORDER_BY_ATTRIBUTE[attributeName];
	if (!order?.length) return items;
	const rank = (cat) => {
		const i = order.indexOf(cat);
		return i === -1 ? order.length : i;
	};
	return [...items].sort((a, b) => rank(a.category) - rank(b.category));
}

export function quadrantKey(trustLevel, agency) {
	return `${trustLevel}|${agency}`;
}

/**
 * @param {Record<string, string>[]} rows from `import typology from '.../typology.csv'` (@rollup/plugin-dsv)
 * @returns {{ ok: true, quadrants: object[], columnPcts: { left: number, right: number }, rowPcts: { top: number, bottom: number } } | { ok: false, error: string }}
 */
export function parseTypologyCsv(rows) {
	try {
		if (!Array.isArray(rows) || rows.length === 0) {
			return { ok: false, error: 'typology.csv is empty or not an array (check @rollup/plugin-dsv import).' };
		}

		const byKey = new Map();

		for (const r of rows) {
			const key = quadrantKey(r.trust_level, r.agency);
			let q = byKey.get(key);
			if (!q) {
				q = {
					trustLevel: r.trust_level,
					agency: r.agency,
					quadrantPct: Number(r.quadrant_pct),
					trustPct: Number(r.trust_pct),
					agencyPct: Number(r.agency_pct),
					attributes: []
				};
				byKey.set(key, q);
			}

			const attrs = q.attributes;
			const last = attrs[attrs.length - 1];
			if (!last || last.name !== r.attribute) {
				attrs.push({ name: r.attribute, items: [] });
			}
			const bucket = attrs[attrs.length - 1].items;
			bucket.push({
				category: r.category,
				value: Number(r.value),
				note: (r.note && String(r.note).trim()) || null
			});
		}

		for (const q of byKey.values()) {
			for (const attr of q.attributes) {
				attr.items = sortAttributeItems(attr.name, attr.items);
			}
		}

		const quadrants = [];
		for (const [trust, agency] of QUADRANT_ORDER) {
			const k = quadrantKey(trust, agency);
			const q = byKey.get(k);
			if (!q) return { ok: false, error: `Missing quadrant ${k}` };
			quadrants.push(q);
		}

		const tr = byKey.get(quadrantKey('Trusting', 'Relational'));
		const ts = byKey.get(quadrantKey('Trusting', 'Self-driven'));
		const dr = byKey.get(quadrantKey('Distrusting', 'Relational'));
		if (!tr || !ts || !dr) return { ok: false, error: 'Missing axis rows' };

		return {
			ok: true,
			quadrants,
			columnPcts: { left: tr.agencyPct, right: ts.agencyPct },
			rowPcts: { top: tr.trustPct, bottom: dr.trustPct }
		};
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}
