/**
 * Section quiz routing and copy that is not in copy.json.
 * Titles/instructions still come from `copy.charts.sectionQuiz` via Archie.
 */

/** @typedef {'traitRank3' | 'percentPoll' | 'tbd'} SectionQuizKind */

/**
 * @typedef {object} TraitRank3QuizConfig
 * @property {'traitRank3'} kind
 * @property {boolean} [centered]
 * @property {number} maxPicks
 * @property {string} yourListHeading
 * @property {string} surveyListHeading
 * @property {string} compareSubmitLabel
 * @property {string} resetLabel
 */

/**
 * @typedef {object} PercentPollQuizConfig
 * @property {'percentPoll'} kind
 * @property {boolean} [centered]
 * @property {string} statementEyebrow
 * @property {string} statementText
 * @property {string} pollPrompt
 * @property {string} populationLabel
 * @property {string} submitLabel
 * @property {string} tryAgainLabel
 */

/**
 * @typedef {object} TbdQuizConfig
 * @property {'tbd'} kind
 * @property {boolean} [centered]
 */

/** @type {string[]} */
export const SECTION_QUIZ_ORDER = [
	"The Expectations Gap",
	"Degrees of Doubt",
	"Connected but Alone",
	"Alienated and (Dis)Engaged",
];

/** @type {Record<string, TraitRank3QuizConfig | PercentPollQuizConfig | TbdQuizConfig>} */
export const SECTION_QUIZ_CONFIG = {
	"The Expectations Gap": {
		kind: "traitRank3",
		centered: true,
		maxPicks: 3,
		yourListHeading: "Your top three",
		surveyListHeading: "Young men's top three",
		compareSubmitLabel: "Compare with survey",
		resetLabel: "Start over",
	},
	"Degrees of Doubt": {
		kind: "percentPoll",
		centered: true,
		statementEyebrow: "Statement",
		statementText:
			"Colleges in the United States are designed to benefit women more than men",
		pollPrompt:
			"What percentage of young men do you think somewhat or strongly agree with this statement?",
		populationLabel: "young men",
		submitLabel: "See survey results",
		tryAgainLabel: "Try again",
	},
	"Connected but Alone": { kind: "tbd", centered: false },
	"Alienated and (Dis)Engaged": { kind: "tbd", centered: false },
};

/**
 * @param {string} sectionName
 * @returns {TraitRank3QuizConfig | PercentPollQuizConfig | TbdQuizConfig | null}
 */
export function getSectionQuizConfig(sectionName) {
	const key = String(sectionName ?? "").trim();
	if (!key) return null;
	return SECTION_QUIZ_CONFIG[key] ?? null;
}
