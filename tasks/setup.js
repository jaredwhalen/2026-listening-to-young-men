#!/usr/bin/env node
/**
 * Post-clone personalization: package name, meta title/description, GitHub org/repo for jsDelivr.
 * Run from repo root: `npm run setup`
 */

import fs from 'fs';
import { execSync, execFileSync } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const ask = (query, defaultValue) =>
	new Promise((resolve) => {
		rl.question(`${query} [${defaultValue}] (Enter = default): `, (answer) => {
			resolve((answer ?? '').trim() || defaultValue);
		});
	});

/** Lowercase kebab-case for package.json `name`. */
function slugify(input) {
	const s = input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return s || 'project';
}

function titleFromSlug(slug) {
	return slug
		.split('-')
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

/** Escape for a double-quoted JS string literal (meta description, etc.). */
function escapeForDoubleQuotedJs(s) {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '').replace(/\n/g, '\\n');
}

function read(p) {
	return fs.readFileSync(p, 'utf8');
}

function write(p, content) {
	fs.writeFileSync(p, content, 'utf8');
}

/** Replace every occurrence of `token` with `value`. Returns whether at least one replacement ran. */
function replaceInFile(filePath, token, value) {
	let content = read(filePath);
	if (!content.includes(token)) {
		return false;
	}
	write(filePath, content.split(token).join(value));
	return true;
}

function remoteExists(remoteName) {
	try {
		execSync(`git remote get-url ${remoteName}`, { cwd: ROOT, stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

async function main() {
	console.log('Project setup — personalize this template after clone.\n');

	const cwdDefault = slugify(path.basename(ROOT));

	const npmSlug = slugify(await ask('Npm package name (kebab-case)', cwdDefault));
	const displayTitle = await ask('Page / README title', titleFromSlug(npmSlug));
	const defaultDescription = `${displayTitle} — scroll-driven interactive story.`;
	const metaDescription = await ask('Meta description (<meta name="description">)', defaultDescription);
	const ghOrg = await ask('GitHub org or user (for jsDelivr embed URL)', 'agwaterdesk');
	const ghRepo = slugify(await ask('GitHub repo name', npmSlug));

	const pkgPath = path.join(ROOT, 'package.json');
	const configPath = path.join(ROOT, 'src/lib/config/project.config.js');
	const readmePath = path.join(ROOT, 'README.md');

	for (const p of [pkgPath, configPath, readmePath]) {
		if (!fs.existsSync(p)) {
			console.error(`Missing file: ${p}`);
			process.exit(1);
		}
	}

	const escapedDescription = escapeForDoubleQuotedJs(metaDescription);

	const results = {
		'package.json → your-story-slug': replaceInFile(pkgPath, 'your-story-slug', npmSlug),
		'project.config.js → YOUR_DISPLAY_TITLE': replaceInFile(configPath, 'YOUR_DISPLAY_TITLE', displayTitle),
		'README.md → YOUR_DISPLAY_TITLE': replaceInFile(readmePath, 'YOUR_DISPLAY_TITLE', displayTitle),
		'project.config.js → YOUR_META_DESCRIPTION': replaceInFile(
			configPath,
			'YOUR_META_DESCRIPTION',
			escapedDescription
		),
		'project.config.js → YOUR_GITHUB_ORG': replaceInFile(configPath, 'YOUR_GITHUB_ORG', ghOrg),
		'project.config.js → YOUR_GITHUB_REPO': replaceInFile(configPath, 'YOUR_GITHUB_REPO', ghRepo)
	};

	const missing = Object.entries(results).filter(([, ok]) => !ok).map(([k]) => k);
	if (missing.length) {
		console.warn(
			'\nWarning: these replacements did nothing (already customized or tokens missing):\n  - ' +
				missing.join('\n  - ')
		);
	}

	console.log('\nUpdated: package.json, src/lib/config/project.config.js, README.md');

	const runInstall = (await ask('Run npm install now?', 'y')).toLowerCase().startsWith('y');
	if (runInstall) {
		console.log('\nRunning npm install…');
		execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
	}

	const addRemote = (await ask('Add git remote `origin`?', 'n')).toLowerCase().startsWith('y');
	if (addRemote) {
		if (remoteExists('origin')) {
			console.log('Remote `origin` already exists — skipped.');
		} else {
			const defaultUrl = `git@github.com:${ghOrg}/${ghRepo}.git`;
			const url = await ask('Remote URL', defaultUrl);
			execFileSync('git', ['remote', 'add', 'origin', url], { cwd: ROOT, stdio: 'inherit' });
			console.log('Added origin.');
		}
	}

	console.log('\nDone.');
	rl.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
