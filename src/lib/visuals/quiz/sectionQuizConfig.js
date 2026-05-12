/**
 * Section quiz routing and copy that is not in copy.json.
 * Titles/instructions still come from `copy.charts.sectionQuiz` via Archie.
 *
 * Per-kind defaults live in `*_DEFAULTS` below. Entries in
 * `SECTION_QUIZ_CONFIG` only need to specify fields that differ from those
 * defaults; `getSectionQuizConfig()` merges them in.
 */

/** @typedef {'traitRank3' | 'percentPoll' | 'tbd'} SectionQuizKind */

/**
 * @typedef {object} TraitRank3QuizConfig
 * @property {'traitRank3'} kind
 * @property {boolean} centered
 * @property {number} maxPicks
 * @property {string} yourListHeading
 * @property {string} surveyListHeading
 * @property {string} compareSubmitLabel
 * @property {string} resetLabel
 */

/**
 * @typedef {object} PercentPollQuizConfig
 * @property {'percentPoll'} kind
 * @property {boolean} centered
 * @property {string} statementEyebrow
 * @property {string} statementText
 * @property {string} pollPrompt
 * @property {string} populationLabel
 * @property {string} submitLabel
 * @property {string} tryAgainLabel
 * @property {number} surveyPct survey result percentage (0–100, whole number)
 */

/**
 * @typedef {object} TbdQuizConfig
 * @property {'tbd'} kind
 * @property {boolean} centered
 */

/** @typedef {TraitRank3QuizConfig | PercentPollQuizConfig | TbdQuizConfig} ResolvedSectionQuizConfig */

/** @type {Omit<TraitRank3QuizConfig, 'kind'>} */
const TRAIT_RANK3_DEFAULTS = {
	centered: true,
	maxPicks: 3,
	yourListHeading: "Your top three",
	surveyListHeading: "Young men's top three",
	compareSubmitLabel: "Compare with survey",
	resetLabel: "Start over",
};

/** @type {Omit<PercentPollQuizConfig, 'kind' | 'statementText' | 'surveyPct'>} */
const PERCENT_POLL_DEFAULTS = {
	centered: true,
	statementEyebrow: "Statement",
	pollPrompt:
		"What percentage of young men do you think agree with this statement?",
	populationLabel: "young men",
	submitLabel: "See survey results",
	tryAgainLabel: "Try again",
};

/** @type {Omit<TbdQuizConfig, 'kind'>} */
const TBD_DEFAULTS = {
	centered: true,
};

/** @type {string[]} */
export const SECTION_QUIZ_ORDER = [
	"The Expectations Gap",
	"Degrees of Doubt",
	"Connected but Alone",
	"Alienated and (Dis)Engaged",
];

/**
 * Per-section overrides. Only specify fields that differ from the per-kind
 * defaults above.
 * @type {Record<string,
 *   ({ kind: 'traitRank3' } & Partial<TraitRank3QuizConfig>)
 *   | ({ kind: 'percentPoll', statementText: string, surveyPct: number } & Partial<PercentPollQuizConfig>)
 *   | ({ kind: 'tbd' } & Partial<TbdQuizConfig>)
 * >}
 */
export const SECTION_QUIZ_CONFIG = {
	"The Expectations Gap": {
		kind: "traitRank3",
	},
	"Degrees of Doubt": {
		kind: "percentPoll",
		statementText:
			"Colleges in the United States are designed to benefit women more than men.",
		surveyPct: 38,
	},
	"Connected but Alone": {
		kind: "percentPoll",
		statementText:
			"Outside of work and school, I often use gaming platforms or gaming communities to interact socially.",
		surveyPct: 63,
	},
	"Alienated and (Dis)Engaged": {
		kind: "percentPoll",
		statementText:
			"Average Americans have at least some power in influencing policy change in the United States.",
		surveyPct: 47,
	},
};

/**
 * @param {string} sectionName
 * @returns {ResolvedSectionQuizConfig | null}
 */
export function getSectionQuizConfig(sectionName) {
	const key = String(sectionName ?? "").trim();
	if (!key) return null;
	const entry = SECTION_QUIZ_CONFIG[key];
	if (!entry) return null;
	switch (entry.kind) {
		case "traitRank3":
			return { ...TRAIT_RANK3_DEFAULTS, ...entry };
		case "percentPoll":
			return { ...PERCENT_POLL_DEFAULTS, ...entry };
		case "tbd":
			return { ...TBD_DEFAULTS, ...entry };
		default:
			return null;
	}
}
