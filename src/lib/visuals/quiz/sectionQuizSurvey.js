import { youngMenAgreeCollegesDesignedForWomenMore } from "$lib/visuals/quiz/sectionQuizHelpers.js";

/**
 * Survey reference value for a `percentPoll` section (whole percent), or null.
 * Add a branch when you add a new percent-poll section in `sectionQuizConfig.js`.
 * @param {string} sectionName canonical section title (e.g. from `SECTION_QUIZ_ORDER`)
 * @param {Record<string, string>[]} fullRows `questions-full.csv`
 * @returns {number | null}
 */
export function percentPollSurveyPercent(sectionName, fullRows) {
	switch (sectionName) {
		case "Degrees of Doubt":
			return youngMenAgreeCollegesDesignedForWomenMore(fullRows);
		default:
			return null;
	}
}
