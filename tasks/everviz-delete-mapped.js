#!/usr/bin/env node
/**
 * Delete every Everviz chart listed in `.everviz/chart-map.json`.
 *
 * Safety:
 * - Defaults to dry-run.
 * - Requires `--yes` to actually delete.
 *
 * Env:
 * - EVERVIZ_TEAM_ID
 * - EVERVIZ_API_KEY
 *
 * Outputs:
 * - `.everviz/delete-report.csv`
 */

import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ROOT = process.cwd();
const EVERVIZ_STATE_DIR = path.join(ROOT, '.everviz');
const EVERVIZ_MAP_PATH = path.join(EVERVIZ_STATE_DIR, 'chart-map.json');
const DELETE_REPORT_CSV_PATH = path.join(EVERVIZ_STATE_DIR, 'delete-report.csv');

function requireEnv(name) {
	const v = process.env[name];
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

function readJson(p) {
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
	fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function ensureDir(p) {
	if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function csvEscape(v) {
	const s = String(v ?? '');
	if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function evervizRequest(apiKey) {
	const endpoint = 'https://api.everviz.com';
	return async (method, path) => {
		const res = await fetch(endpoint + path, {
			method,
			headers: {
				'X-API-Key': apiKey,
				'Content-Type': 'application/json'
			}
		});
		const text = await res.text().catch(() => '');
		let json = null;
		try {
			json = text ? JSON.parse(text) : null;
		} catch {
			// ignore
		}
		return { ok: res.ok, status: res.status, statusText: res.statusText, text, json };
	};
}

async function main() {
	const teamId = requireEnv('EVERVIZ_TEAM_ID');
	const apiKey = requireEnv('EVERVIZ_API_KEY');

	const yes = process.argv.includes('--yes');
	ensureDir(EVERVIZ_STATE_DIR);

	if (!fs.existsSync(EVERVIZ_MAP_PATH)) {
		throw new Error(`Missing ${path.relative(ROOT, EVERVIZ_MAP_PATH)}`);
	}

	const map = readJson(EVERVIZ_MAP_PATH);
	const entries = Object.entries(map?.charts ?? {});
	if (!entries.length) {
		console.log('No charts found in chart-map.json');
		return;
	}

	// Interactive safety prompt unless --yes provided.
	let shouldDelete = yes;
	if (!shouldDelete) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		const ask = (q) => new Promise((resolve) => rl.question(q, (a) => resolve(String(a ?? '').trim())));

		console.log(`Found ${entries.length} chart(s) in ${path.relative(ROOT, EVERVIZ_MAP_PATH)}.`);
		const choice = await ask('Choose: (1) dry-run  (2) delete charts\n> ');
		if (choice === '2') {
			const confirm = await ask('Type DELETE to confirm deletion\n> ');
			shouldDelete = confirm === 'DELETE';
		}

		rl.close();
	}

	const request = evervizRequest(apiKey);

	const rows = [];
	for (const [slug, info] of entries) {
		const chartId = info?.chart_id;
		const uuid = info?.uuid ?? '';
		const title = info?.title ?? '';
		const humanKey = info?.human_key ?? '';

		if (!chartId) {
			rows.push({ slug, humanKey, chartId: '', uuid, title, action: 'skip', status: '', message: 'missing chart_id' });
			continue;
		}

		if (!shouldDelete) {
			rows.push({ slug, humanKey, chartId, uuid, title, action: 'dry-run', status: '', message: '' });
			continue;
		}

		const r = await request('delete', `/team/${teamId}/chart/${chartId}`);
		const ok = r.ok && (r.json?.ok === true || r.status === 200);
		rows.push({
			slug,
			humanKey,
			chartId,
			uuid,
			title,
			action: 'delete',
			status: String(r.status),
			message: ok ? 'ok' : (r.json?.message ? JSON.stringify(r.json.message) : (r.text || r.statusText))
		});
	}

	const header = ['slug', 'human_key', 'chart_id', 'uuid', 'title', 'action', 'status', 'message'];
	const csv = [header.join(',')].concat(
		rows.map((r) =>
			[
				r.slug,
				r.humanKey,
				r.chartId,
				r.uuid,
				r.title,
				r.action,
				r.status,
				r.message
			].map(csvEscape).join(',')
		)
	);
	fs.writeFileSync(DELETE_REPORT_CSV_PATH, csv.join('\n') + '\n', 'utf8');

	console.log(`Wrote ${path.relative(ROOT, DELETE_REPORT_CSV_PATH)}`);
	if (!shouldDelete) {
		console.log('Dry run only. Re-run and choose (2) to delete, or pass --yes.');
		return;
	}

	// Clear the map after deletion attempts (so the next sync starts clean).
	writeJson(EVERVIZ_MAP_PATH, { charts: {} });
	console.log(`Cleared ${path.relative(ROOT, EVERVIZ_MAP_PATH)}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

