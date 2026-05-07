#!/usr/bin/env node
/**
 * Convert a section TSV into the tidy `questions-full.csv`-style format,
 * preserving the base column structure of `questions-full.csv` and appending any
 * additional columns from the TSV to the right (even if empty for many rows).
 *
 * Usage:
 *   node tasks/process-dod-raw.js "<input.tsv>" "<Section Name>" "<output.csv>"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const BASE_CSV = path.join(ROOT, "src/lib/data/questions-full.csv");

const [RAW_TSV, SECTION_NAME, OUT_CSV] = process.argv.slice(2);
if (!RAW_TSV || !SECTION_NAME || !OUT_CSV) {
	console.error(
		'Usage: node tasks/process-dod-raw.js "<input.tsv>" "<Section Name>" "<output.csv>"',
	);
	process.exit(1);
}

function readFirstLine(p) {
	const txt = fs.readFileSync(p, "utf8");
	const idx = txt.indexOf("\n");
	return (idx === -1 ? txt : txt.slice(0, idx)).replace(/\r$/, "");
}

function splitCsvHeader(line) {
	// Existing file unfortunately ends with ",," (empty header names).
	// Keep only named columns as the "base structure" we extend.
	return line
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length);
}

function parseCell(v) {
	const s = String(v ?? "").trim();
	if (!s) return "";
	const lower = s.toLowerCase();
	if (lower === "na" || lower === "*" || lower === "—" || lower === "-" || lower === "n>75")
		return "";
	// Normalize percents like "29%" -> "29"
	if (/^-?\d+(\.\d+)?%$/.test(s)) return s.replace(/%$/, "");
	return s;
}

function csvEscape(v) {
	const s = String(v ?? "");
	if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function parseQuestionLine(text) {
	// Examples:
	// "Q11. Compared with 10 years ago, ...?"
	// "Q9_3. Which of the following statements ...?"
	// "Q6_1. Your mother or female guardian"
	// Also supports letter suffixes like Q18B / Q7A_5 / Q7B.
	const m = /^Q([0-9]+[0-9A-Za-z]*(?:_[0-9A-Za-z]+)?)\.\s*(.+)\s*$/.exec(
		text.trim(),
	);
	if (!m) return null;
	return { qId: `Q${m[1]}`, question: m[2].trim() };
}

function main() {
	const baseHeader = splitCsvHeader(readFirstLine(BASE_CSV));
	const rawLines = fs.readFileSync(RAW_TSV, "utf8").split(/\r?\n/);
	if (!rawLines.length) throw new Error("Empty raw TSV");

	// Raw header has a leading tab before the first column.
	const rawHeader = rawLines[0].split("\t").map((s) => s.trim());
	const rawCols = rawHeader.filter((s) => s.length);

	// Determine which raw columns are "new" vs base.
	const baseSet = new Set(baseHeader);
	const extraCols = rawCols.filter((c) => !baseSet.has(c));

	const outHeader = [...baseHeader, ...extraCols];

	let topQ = /** @type {{ qId: string, question: string } | null} */ (null);
	let subQ = /** @type {{ sId: string, subpart: string } | null} */ (null);

	const outRows = [];
	for (let i = 1; i < rawLines.length; i++) {
		const line = rawLines[i];
		if (!line || !line.trim()) continue;

		const cells = line.split("\t");
		const first = (cells[0] ?? "").trim();
		const restNonEmpty = cells.slice(1).some((c) => String(c ?? "").trim().length);

		// Question / subquestion line
		if (first.startsWith("Q") && !restNonEmpty) {
			const q = parseQuestionLine(first);
			if (!q) continue;

			// If it’s a subpart of the current top question (e.g. Q6_1 under Q6)
			if (topQ && q.qId.startsWith(`${topQ.qId}_`)) {
				subQ = { sId: q.qId, subpart: q.question };
			} else {
				topQ = q;
				subQ = null;
			}
			continue;
		}

		// Data row
		if (!topQ) continue;

		const response = first;
		const rawMap = new Map();
		// cells[1...] aligns with rawCols[0...]
		for (let ci = 1; ci < Math.max(cells.length, rawCols.length + 1); ci++) {
			const colName = rawCols[ci - 1];
			if (!colName) continue;
			rawMap.set(colName, parseCell(cells[ci] ?? ""));
		}

		const row = /** @type {Record<string, string>} */ ({});
		row.section = SECTION_NAME;
		row.qId = topQ.qId;
		row.question = topQ.question;
		row.sId = subQ?.sId ?? "";
		row.subpart = subQ?.subpart ?? "";
		row.response = response;

		for (const col of outHeader) {
			if (col in row) continue;
			row[col] = rawMap.get(col) ?? "";
		}

		outRows.push(row);
	}

	const lines = [];
	lines.push(outHeader.map(csvEscape).join(","));
	for (const r of outRows) {
		lines.push(outHeader.map((h) => csvEscape(r[h] ?? "")).join(","));
	}

	fs.writeFileSync(OUT_CSV, lines.join("\n") + "\n", "utf8");
	console.log(`Wrote ${outRows.length} rows to ${path.relative(ROOT, OUT_CSV)}`);
	console.log(`Header columns: ${outHeader.length} (base ${baseHeader.length} + extra ${extraCols.length})`);
}

main();

