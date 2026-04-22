export const TYPOLOGY_COMPARE_COLUMNS = [
	'They believe',
	'Society believes',
	'Difference'
];

/** Build one typology slice: they believe vs society believes for the typology column, plus they − society (same 0–1 scale as CSV). */
export function buildTypologyCompareRows(theyRows, societyRows, typologyColumn, traitOrder) {
	const sMap = new Map(societyRows.map((r) => [r.trait, r]));
	const tMap = new Map(theyRows.map((r) => [r.trait, r]));

	const traits =
		traitOrder.length > 0
			? traitOrder
			: Array.from(new Set([...sMap.keys(), ...tMap.keys()])).sort((a, b) => a.localeCompare(b));

	const [THEY, SOC, DIF] = TYPOLOGY_COMPARE_COLUMNS;

	return traits.map((trait) => {
		const sv = sMap.get(trait)?.values?.[typologyColumn];
		const tv = tMap.get(trait)?.values?.[typologyColumn];
		let diff = null;
		if (typeof sv === 'number' && Number.isFinite(sv) && typeof tv === 'number' && Number.isFinite(tv)) {
			diff = tv - sv;
		}
		return {
			table: 'typology_compare',
			trait,
			values: {
				[THEY]: typeof tv === 'number' && Number.isFinite(tv) ? tv : null,
				[SOC]: typeof sv === 'number' && Number.isFinite(sv) ? sv : null,
				[DIF]: diff
			}
		};
	});
}
