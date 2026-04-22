/**
 * Editable copy for the matrix typology quad (src/routes/matrix).
 * Axis percentages are filled from CSV at runtime; labels here are the words only.
 */

export const matrixTypologyCopy = {
	axis: {
		rowTop: 'Trusting',
		rowBottom: 'Distrusting',
		columnLeft: 'Relational',
		columnRight: 'Self-driven'
	},

	/** Small caps / subtitle under the headline metric */
	compareSubtitle: 'Demographics',

	/** Lines stacked to the right of the vertical rule (after the big %) */
	metricContext: ['of young', 'men'],

	/**
	 * Section titles per quadrant. Keys must match Trusting|Relational, etc.
	 * (same as parseTypologyCsv quadrantKey)
	 */
	quadrantTitles: {
		'Trusting|Relational': 'Relational / Trusting',
		'Trusting|Self-driven': 'Self-driven / Trusting',
		'Distrusting|Relational': 'Relational / Distrusting',
		'Distrusting|Self-driven': 'Self-driven / Distrusting'
	},

	/**
	 * Short takeaways per quadrant (shown above “Demographic snapshot”).
	 * Keys = quadrantKey(trust, agency).
	 */
	quadrantBullets: {
		'Trusting|Relational': [
			'Least likely to feel pressure to act more or less masculine, and least likely to say it is becoming harder for men to succeed today.',
			'Their view of success for young men lines up most closely with how Americans define success overall.'
		],
		'Distrusting|Relational': [
			'Many feel pressure to act more masculine and are very likely to say men face greater challenges succeeding today.',
			'Most likely to value emotional communication, equal partnership, and compromise as measures of a man\'s success.'
		],
		'Trusting|Self-driven': [
			'Most traditional in how they define success for men.',
			'Least likely to agree with equal pay and equal opportunity.'
		],
		'Distrusting|Self-driven': [
			'Most likely to feel pressure to act more or less masculine and to say it is harder for men to succeed today.',
			'Most likely to say men are less motivated and lazier today.'
		]
	},

	/**
	 * Lucide icon component names (PascalCase), matching `lucide-svelte/icons/<kebab>` imports in TypologyQuadGrid.
	 */
	iconByAttribute: {
		'Party Identification': 'Landmark',
		Ideology: 'Scale',
		'Race/Ethnicity': 'Users',
		'Educational Attainment': 'GraduationCap',
		Age: 'Calendar'
	},

	/** Attribute heading in sentence case for display (optional overrides) */
	attributeLabels: {
		'Party Identification': 'Party identification',
		Ideology: 'Ideology',
		'Race/Ethnicity': 'Race / ethnicity',
		'Educational Attainment': 'Education',
		Age: 'Age'
	}
};
