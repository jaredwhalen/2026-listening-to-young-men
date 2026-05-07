#!/usr/bin/env node
/**
 * Rebuild `src/lib/data/questions-full.csv` from the TSV sources in `src/lib/data/raw_tsv/`.
 *
 * - Preserves the base column order from the existing `questions-full.csv` (named headers only)
 * - Appends any additional columns encountered in any TSV to the right
 * - Writes all rows in tidy format: one row per response option
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QUESTIONS_FULL = path.join(ROOT, "src/lib/data/questions-full.csv");
const RAW_DIR = path.join(ROOT, "src/lib/data/raw_tsv");

function csvEscape(v) {
	const s = String(v ?? "");
	if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function readFirstLine(p) {
	const txt = fs.readFileSync(p, "utf8");
	const idx = txt.indexOf("\n");
	return (idx === -1 ? txt : txt.slice(0, idx)).replace(/\r$/, "");
}

function splitCsvHeader(line) {
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
	if (/^-?\d+(\.\d+)?%$/.test(s)) return s.replace(/%$/, "");
	return s;
}

function parseQuestionLine(text) {
	// Supports:
	// - "Q11. Text..."
	// - "Q24_10 Text..." (missing dot)
	// - "Q18B. Text..."
	const t = text.trim();
	let m =
		/^Q([0-9]+[0-9A-Za-z]*(?:_[0-9A-Za-z]+)?)\.\s*(.+)\s*$/.exec(t) ??
		/^Q([0-9]+[0-9A-Za-z]*(?:_[0-9A-Za-z]+)?)\s+(.+)\s*$/.exec(t);
	if (!m) return null;
	return { qId: `Q${m[1]}`, question: m[2].trim() };
}

function sectionFromFilename(filename) {
	const base = filename.replace(/\.tsv$/i, "");
	if (base === "Expectations Gap") return "The Expectations Gap";
	return base;
}

function parseTsv(tsvPath, sectionName, baseHeader) {
	const rawLines = fs.readFileSync(tsvPath, "utf8").split(/\r?\n/);
	const rawHeader = rawLines[0].split("\t").map((s) => s.trim());
	const rawCols = rawHeader.filter((s) => s.length);
	const baseSet = new Set(baseHeader);
	const extraCols = rawCols.filter((c) => !baseSet.has(c));
	const outHeader = [...baseHeader, ...extraCols];

	let topQ = null;
	let subQ = null;
	/** @type {Record<string, string>[]} */
	const outRows = [];

	for (let i = 1; i < rawLines.length; i++) {
		const line = rawLines[i];
		if (!line || !line.trim()) continue;
		const cells = line.split("\t");
		const first = (cells[0] ?? "").trim();
		const restNonEmpty = cells.slice(1).some((c) => String(c ?? "").trim().length);

		if (first.startsWith("Q") && !restNonEmpty) {
			const q = parseQuestionLine(first);
			if (!q) continue;
			if (topQ && q.qId.startsWith(`${topQ.qId}_`)) subQ = { sId: q.qId, subpart: q.question };
			else {
				topQ = q;
				subQ = null;
			}
			continue;
		}

		if (!topQ) continue;

		const rawMap = new Map();
		for (let ci = 1; ci < Math.max(cells.length, rawCols.length + 1); ci++) {
			const colName = rawCols[ci - 1];
			if (!colName) continue;
			rawMap.set(colName, parseCell(cells[ci] ?? ""));
		}

		/** @type {Record<string, string>} */
		const row = {};
		row.section = sectionName;
		row.qId = topQ.qId;
		row.question = topQ.question;
		row.sId = subQ?.sId ?? "";
		row.subpart = subQ?.subpart ?? "";
		row.response = first;

		for (const col of outHeader) {
			if (col in row) continue;
			row[col] = rawMap.get(col) ?? "";
		}
		outRows.push(row);
	}

	return { outHeader, outRows };
}

function main() {
	const baseHeader = splitCsvHeader(readFirstLine(QUESTIONS_FULL));

	const files = fs
		.readdirSync(RAW_DIR)
		.filter((f) => f.toLowerCase().endsWith(".tsv"))
		.sort((a, b) => a.localeCompare(b));

	/** @type {string[]} */
	let finalHeader = baseHeader.slice();
	/** @type {Record<string, string>[]} */
	const finalRows = [];

	for (const file of files) {
		const sectionName = sectionFromFilename(file);
		const tsvPath = path.join(RAW_DIR, file);
		const { outHeader, outRows } = parseTsv(tsvPath, sectionName, baseHeader);
		for (const h of outHeader) if (!finalHeader.includes(h)) finalHeader.push(h);
		finalRows.push(...outRows);
	}

	const lines = [];
	lines.push(finalHeader.map(csvEscape).join(","));
	for (const r of finalRows) {
		lines.push(finalHeader.map((h) => csvEscape(r[h] ?? "")).join(","));
	}

	fs.writeFileSync(QUESTIONS_FULL, lines.join("\n") + "\n", "utf8");
	console.log(`Rebuilt questions-full.csv with ${finalRows.length} rows`);
	console.log(`Header columns: ${finalHeader.length}`);
}

main();

