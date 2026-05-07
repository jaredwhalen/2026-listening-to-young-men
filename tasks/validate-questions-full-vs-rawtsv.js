#!/usr/bin/env node
/**
 * Validate `src/lib/data/questions-full.csv` against the raw TSVs in `src/lib/data/raw_tsv/`.
 *
 * For each TSV:
 * - Parse it into the tidy row format (same logic as `tasks/process-dod-raw.js`)
 * - Compare expected rows/values to the rows/values present in `questions-full.csv`
 *
 * Output: mismatch summary per section.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const QUESTIONS_FULL = path.join(ROOT, "src/lib/data/questions-full.csv");
const RAW_DIR = path.join(ROOT, "src/lib/data/raw_tsv");

function csvParseLine(line) {
	/** @type {string[]} */
	const out = [];
	let i = 0;
	let cur = "";
	let inQ = false;
	while (i < line.length) {
		const ch = line[i];
		if (inQ) {
			if (ch === '"') {
				if (line[i + 1] === '"') {
					cur += '"';
					i += 2;
					continue;
				}
				inQ = false;
				i++;
				continue;
			}
			cur += ch;
			i++;
			continue;
		}
		if (ch === '"') {
			inQ = true;
			i++;
			continue;
		}
		if (ch === ",") {
			out.push(cur);
			cur = "";
			i++;
			continue;
		}
		cur += ch;
		i++;
	}
	out.push(cur);
	return out;
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
	const t = text.trim();
	const m =
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

function loadQuestionsFull() {
	const txt = fs.readFileSync(QUESTIONS_FULL, "utf8");
	const lines = txt.split(/\r?\n/).filter(Boolean);
	const header = csvParseLine(lines[0]);
	/** @type {Record<string, string>[]} */
	const rows = [];
	for (let i = 1; i < lines.length; i++) {
		const cols = csvParseLine(lines[i]);
		/** @type {Record<string, string>} */
		const r = {};
		for (let j = 0; j < header.length; j++) r[header[j]] = cols[j] ?? "";
		rows.push(r);
	}
	return { header, rows };
}

function parseTsvToTidy(tsvPath, sectionName, baseHeader) {
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

function rowKey(r) {
	return [
		r.section ?? "",
		r.qId ?? "",
		r.question ?? "",
		r.sId ?? "",
		r.subpart ?? "",
		r.response ?? "",
	].join("\u0001");
}

function main() {
	const { header: compiledHeader, rows: compiledRows } = loadQuestionsFull();

	// Base header = named cols only (questions-full.csv currently has trailing empty headers).
	const baseHeader = compiledHeader.filter((h) => String(h ?? "").trim().length);

	const tsvFiles = fs
		.readdirSync(RAW_DIR)
		.filter((f) => f.toLowerCase().endsWith(".tsv"))
		.sort((a, b) => a.localeCompare(b));

	/** @type {Record<string, Record<string, string>>} */
	const compiledByKey = {};
	for (const r of compiledRows) compiledByKey[rowKey(r)] = r;

	let anyProblems = false;

	for (const file of tsvFiles) {
		const sectionName = sectionFromFilename(file);
		const tsvPath = path.join(RAW_DIR, file);
		const { outHeader, outRows } = parseTsvToTidy(tsvPath, sectionName, baseHeader);

		const expectedKeys = new Set(outRows.map(rowKey));
		const compiledSectionKeys = new Set(
			compiledRows.filter((r) => (r.section ?? "") === sectionName).map(rowKey),
		);

		const missingInCompiled = [...expectedKeys].filter((k) => !compiledSectionKeys.has(k));
		const extraInCompiled = [...compiledSectionKeys].filter((k) => !expectedKeys.has(k));

		// Cell mismatches for rows that exist in both
		const sharedKeys = [...expectedKeys].filter((k) => compiledSectionKeys.has(k));
		const compareCols = outHeader.filter(
			(c) => !["section", "qId", "question", "sId", "subpart", "response"].includes(c),
		);

		let cellMismatches = 0;
		for (const k of sharedKeys) {
			const expected = outRows.find((r) => rowKey(r) === k);
			const got = compiledByKey[k];
			if (!expected || !got) continue;
			for (const col of compareCols) {
				const ev = String(expected[col] ?? "").trim();
				const gv = String(got[col] ?? "").trim();
				if (ev !== gv) {
					cellMismatches++;
					if (cellMismatches >= 20) break;
				}
			}
			if (cellMismatches >= 20) break;
		}

		const ok = missingInCompiled.length === 0 && extraInCompiled.length === 0 && cellMismatches === 0;
		if (!ok) anyProblems = true;

		console.log(`\n=== ${sectionName} (${file}) ===`);
		console.log(`Expected rows from TSV: ${outRows.length} (unique ${expectedKeys.size})`);
		console.log(`Compiled rows in questions-full.csv: ${compiledSectionKeys.size}`);
		console.log(`Missing rows in compiled: ${missingInCompiled.length}`);
		console.log(`Extra rows in compiled: ${extraInCompiled.length}`);
		console.log(`Cell mismatches (capped at 20): ${cellMismatches}`);
		if (missingInCompiled.length) console.log(`  First missing key: ${missingInCompiled[0]}`);
		if (extraInCompiled.length) console.log(`  First extra key: ${extraInCompiled[0]}`);
	}

	process.exitCode = anyProblems ? 2 : 0;
}

main();

