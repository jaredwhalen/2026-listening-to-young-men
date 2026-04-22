/**
 * Matrix typology — colors per CSV `attribute` and `category`.
 * Add or edit entries here; any category not listed uses `DEFAULT_MATRIX_STACK_PALETTE`
 * in order (only for unmapped segments).
 *
 * Attribute names must match `typology.csv` (e.g. "Party Identification", "Ideology").
 */

/** Used when an attribute has no entry, or a category is missing from that attribute’s map. */
export const DEFAULT_MATRIX_STACK_PALETTE = [
	'var(--pa-blue)',
	'var(--pa-light-blue)',
	'var(--pa-primary-teal)',
	'var(--pa-green)',
	'var(--pa-orange)',
	'var(--pa-gold)',
	'var(--pa-purple)',
	'var(--pa-red)'
];

/**
 * @type {Record<string, Record<string, string>>}
 * Outer key = attribute name. Inner key = category label from CSV.
 */
export const MATRIX_DEMO_CATEGORY_COLORS = {
	'Party Identification': {
		Democratic: 'var(--pa-blue)',
		Independent: 'var(--pa-light-blue)',
		Republican: 'var(--pa-primary-teal)',
		Other: 'var(--color-gray-400)'
	},
	'Ideology': {
		Liberal: 'var(--pa-blue)',
		Moderate: 'var(--pa-light-blue)',
		Conservative: 'var(--pa-primary-teal)',
		'No opinion': 'var(--color-gray-400)'
	},
	
};

/**
 * @param {string} attributeName
 * @param {{ category: string }[]} items ordered as in the bar (e.g. after CSV sort)
 * @returns {string[]}
 */
export function colorsForMatrixAttribute(attributeName, items) {
	const byCategory = MATRIX_DEMO_CATEGORY_COLORS[attributeName];
	let defaultIndex = 0;
	return items.map(({ category }) => {
		const mapped = byCategory?.[category];
		if (mapped) return mapped;
		const c =
			DEFAULT_MATRIX_STACK_PALETTE[defaultIndex % DEFAULT_MATRIX_STACK_PALETTE.length];
		defaultIndex += 1;
		return c;
	});
}
