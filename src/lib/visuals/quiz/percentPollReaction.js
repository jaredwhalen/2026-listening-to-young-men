/**
 * Conversational reaction for a percent guess vs survey result (whole-number delta).
 * @param {number} delta guess − survey (%)
 * @param {string} [populationLabel] e.g. "young men"
 * @returns {{ hook: string, line: string }}
 */
export function percentPollReaction(delta, populationLabel = "young men") {
	const who = populationLabel || "respondents";
	const ad = Math.abs(delta);
	if (delta === 0) {
		return {
			hook: "That's right!",
			line: `Your guess lines up with what ${who} said in our survey.`,
		};
	}
	if (ad <= 5) {
		return {
			hook: "Close!",
			line: `You're only ${ad} percentage point${ad === 1 ? "" : "s"} away from the survey result.`,
		};
	}
	if (ad <= 15) {
		const lean = delta > 0 ? "high" : "low";
		return {
			hook: "Not quite.",
			line: `You came in a little ${lean}—about ${ad} percentage points off.`,
		};
	}
	const lean = delta > 0 ? "above" : "below";
	return {
		hook: "Not quite.",
		line: `That's farther off—you were ${ad} percentage points ${lean} what ${who} said.`,
	};
}
