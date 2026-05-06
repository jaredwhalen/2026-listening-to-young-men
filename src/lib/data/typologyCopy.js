/**
 * Editable copy for the typology quad (src/routes/typology).
 * Axis percentages are filled from CSV at runtime; labels here are the words only.
 */

export const typologyCopy = {
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
	 * Short paragraph per quadrant (visible in the card).
	 * Keys = quadrantKey(trust, agency).
	 */
	quadrantShortDescription: {
		'Trusting|Relational':
			'Most culturally conventional. They feel the least pressure to conform to societal expectations. In general, their views align with the American mainstream.',
		'Distrusting|Relational':
			'Most ideologically diverse group. Find it increasingly challenging to succeed as a man. They hold egalitarian views, defining a man’s success by emphasizing emotional intelligence, equal partnerships, and compromising.',
		'Trusting|Self-driven':
			'Largest group and lowest share of Latinos. They hold the most traditional views on manhood. They also show the least support for equal pay and opportunity.',
		'Distrusting|Self-driven':
			'Most educated and most racially diverse group. They hold high expectations for themselves and for men in general. They are the most vocal about the "laziness" of modern men.'
	},

	/**
	 * Longer narrative for hover tooltips (same keys as quadrantShortDescription).
	 */
	quadrantLongDescription: {
		'Trusting|Relational': `This group feels the least pressure to conform to societal expectations and remains optimistic about men’s ability to succeed in modern society. In general, their views align with the American mainstream. While they harbor some skepticism regarding the economic return on a college degree, they are less likely to believe that higher education is biased against men or conservatives. For them, affordability is a large barrier. They are less inclined to want more friends to connect with, they report lower levels of loneliness and they communicate more often with close friends. Politically, they trust the government more than other groups, and remain the least civically active.`,

		'Distrusting|Relational': `These men feel some pressure to conform to traditional masculinity and they find it increasingly challenging to succeed as a man. They define a man’s success by emphasizing emotional intelligence, equal partnerships with spouses and the ability to compromise, while also showing the strongest support for equal pay and opportunity. Although they recognize the economic value of a college degree, they view it as a significant risk. However, they are most open to reforms and trust community-based and philanthropic organizations to make higher education a safer investment. Emotionally, however, they struggle with loneliness, are less likely to have been part of a meaningful group, and desire more meaningful connections. They use social media more often than face-to-face conversations for social interactions. Their skepticism extends to the government, which they believe requires structural overhaul. Their engagement in political and civic life is moderate compared to their self-driven/distrusting peers, with fewer believing that ordinary citizens have influence.`,

		'Trusting|Self-driven': `As the largest cohort of young men, this group holds the most traditional views on manhood. They define success as being the breadwinner and decision-maker, while putting the least emphasis on equal partnership, household participation, and compromising. They also show the least support for equal pay and opportunity. Although they perceive higher education as a lower risk and are less certain that vocational training holds similar value as a college degree in today's economy, they hold stronger beliefs that higher education is biased toward women. They are more critical of reforms intended to make higher education a safer investment. Despite these institutional critiques, they feel a sense of national belonging and lower levels of loneliness. While they are less skeptical of the government’s intentions, their moderate civic participation is similar to their more skeptical relational/distrusting peers.`,

		'Distrusting|Self-driven': `This group holds high expectations for themselves and for men in general. They experience pressure to act more or less masculine and are the most vocal about the "laziness" of modern men. Their definition of men's success is unique in that they prioritize being sole provider and family decision-maker, yet they place equal value on emotional communication, household participation, and compromise. While they are the most educated group, they are highly skeptical of higher education, viewing it as an environment biased toward women and liberal ideologies. To them, pursuing a degree is a losing battle, marked by regret from graduates and financial and social impacts from those without degrees. Despite a stronger sense of national identity and group belonging, they struggle with intense loneliness and lack of deep connection. Fewer communicate often with close friends, and they are more likely than their peers to socialize via gaming platforms and online forums. Similar to their relational/distrusting peers they are highly skeptical of the government. However they are also the most politically and civically active group, possibly driven by a belief in their own influence despite their deep distrust of the system.`
	},

	/**
	 * Lucide icon component names (PascalCase), matching `lucide-svelte/icons/<kebab>` imports in TypologyQuadGrid.
	 */
	iconByAttribute: {
		Ideology: 'Scale',
		'Race/Ethnicity': 'Users',
		'Educational Attainment': 'GraduationCap',
		Age: 'Calendar'
	},

	/** Attribute heading in sentence case for display (optional overrides) */
	attributeLabels: {
		Ideology: 'Ideology',
		'Race/Ethnicity': 'Race / ethnicity',
		'Educational Attainment': 'Education',
		Age: 'Age'
	}
};
