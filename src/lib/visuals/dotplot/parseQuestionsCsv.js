/**
 * Column keys in questions.csv for the four typology cells (row order = matrix quadrants).
 */
export const TYPOLOGY_VALUE_KEYS = [
	'Relational / Trusting',
	'Relational / Distrusting',
	'Self-driven / Trusting',
	'Self-driven / Distrusting'
];

/**
 * @typedef {{ section: string, qId: string, question: string, values: number[] }} QuestionRow
 */

/**
 * @param {Record<string, string>[]} rows from `import questions from '.../questions.csv'`
 * @returns {{ ok: true, questions: QuestionRow[] } | { ok: false, error: string }}
 */
export function parseQuestionsCsv(rows) {
	try {
		if (!Array.isArray(rows) || rows.length === 0) {
			return { ok: false, error: 'questions.csv is empty or not an array.' };
		}

		const questions = rows.map((r) => {
			const values = TYPOLOGY_VALUE_KEYS.map((k) => {
				const raw = r[k];
				const v = Number(raw);
				return Number.isFinite(v) ? v : NaN;
			});
			return {
				section: String(r.section ?? '').trim(),
				qId: String(r.qId ?? '').trim(),
				question: String(r.question ?? '').trim(),
				values
			};
		});

		const bad = questions.find((q) => q.values.some((v) => !Number.isFinite(v)));
		if (bad) {
			return {
				ok: false,
				error: `Missing or invalid typology value for question qId=${bad.qId}. Check CSV column headers match TYPOLOGY_VALUE_KEYS.`
			};
		}

		return { ok: true, questions };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}

/**
 * @param {QuestionRow[]} questions
 * @param {string | number} qId
 */
export function findQuestionById(questions, qId) {
	const id = String(qId).trim();
	return questions.find((q) => q.qId === id) ?? null;
}
