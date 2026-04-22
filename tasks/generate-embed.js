#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, isAbsolute, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import projectConfig from '../src/lib/config/project.config.js';

const REPO_ROOT = join(__dirname, '..');
const DIST_PATH = join(REPO_ROOT, 'dist');
const DOCS_PATH = join(REPO_ROOT, 'docs');

const JSDELIVR_BASE_URL = projectConfig.build.cdnBaseUrl.replace(/\/?$/, '/');
const EMBED_CONTAINER_ID = projectConfig.build.embedContainerId;

function printHelp() {
	console.log(`Usage: node tasks/generate-embed.js [options]

Options:
  --route <path>   SvelteKit route to embed (default: /). Example: /waffle
  --out <file>     Output HTML path (default: wordpress-embed.html for /, else wordpress-embed-<slug>.html)
  -h, --help       Show this message

Examples:
  node tasks/generate-embed.js
  node tasks/generate-embed.js --route /waffle
  npm run build:embed -- --route /waffle

Reads the matching prerendered HTML from dist/ after a local build, or from docs/ if dist/ is missing
(e.g. fresh clone). Chunk hashes must match what you commit under docs/ for the CDN (see project.config.js → build.cdnBaseUrl).
`);
}

function parseArgs(argv) {
	let route = '/';
	let outPath = null;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '-h' || a === '--help') return { help: true };
		if (a === '--route' && argv[i + 1]) {
			route = argv[++i];
			continue;
		}
		if (a.startsWith('--route=')) {
			route = a.slice('--route='.length);
			continue;
		}
		if (a === '--out' && argv[i + 1]) {
			outPath = argv[++i];
			continue;
		}
		if (a.startsWith('--out=')) {
			outPath = a.slice('--out='.length);
			continue;
		}
		console.error(`Unknown argument: ${a}`);
		return { error: true };
	}
	return { route, outPath };
}

/** Strip slashes; empty string means home `/`. */
function routeToDistSegment(route) {
	const s = String(route).trim().replace(/^\/+/, '').replace(/\/+$/g, '');
	return s;
}

/**
 * adapter-static writes flat HTML for many routes (e.g. waffle.html) or nested index.html.
 */
function resolveDistHtmlPath(baseDir, route) {
	const segment = routeToDistSegment(route);
	if (!segment) {
		const indexPath = join(baseDir, 'index.html');
		return existsSync(indexPath) ? indexPath : null;
	}
	const flat = join(baseDir, `${segment}.html`);
	if (existsSync(flat)) return flat;
	const nested = join(baseDir, segment, 'index.html');
	if (existsSync(nested)) return nested;
	return null;
}

/** Prefer fresh dist/; fall back to committed docs/ so embed generation works without a local build. */
function resolveBuiltHtmlPath(route) {
	const fromDist = resolveDistHtmlPath(DIST_PATH, route);
	if (fromDist) {
		return {
			abs: fromDist,
			label: relative(REPO_ROOT, fromDist).replace(/\\/g, '/')
		};
	}
	const fromDocs = resolveDistHtmlPath(DOCS_PATH, route);
	if (fromDocs) {
		return {
			abs: fromDocs,
			label: relative(REPO_ROOT, fromDocs).replace(/\\/g, '/')
		};
	}
	return null;
}

function defaultOutputPath(repoRoot, route) {
	const segment = routeToDistSegment(route);
	if (!segment) return join(repoRoot, 'wordpress-embed.html');
	const slug = segment.replace(/\//g, '-');
	return join(repoRoot, `wordpress-embed-${slug}.html`);
}

/** Third argument to kit.start(...) as trimmed source (node_ids, data, form, error). */
function extractKitStartOptionsBody(htmlContent) {
	const re = /kit\.start\(app,\s*\w+,\s*\{/;
	const m = htmlContent.match(re);
	if (!m) return null;
	let i = m.index + m[0].length;
	let depth = 1;
	const bodyStart = i;
	while (i < htmlContent.length && depth > 0) {
		const c = htmlContent[i];
		if (c === '{') depth++;
		else if (c === '}') depth--;
		i++;
	}
	if (depth !== 0) return null;
	return htmlContent.slice(bodyStart, i - 1).trim();
}

function extractFileInfo(htmlContent, sourceLabel) {
	const cssMatches = htmlContent.matchAll(/href="\.\/_app\/immutable\/assets\/([^"]+\.css)"/g);
	const cssFiles = [...new Set(Array.from(cssMatches, (match) => match[1]))];

	const modulepreloadMatches = htmlContent.matchAll(/href="\.\/_app\/immutable\/([^"]+\.js)"/g);
	const modulepreloadFiles = [...new Set(Array.from(modulepreloadMatches, (match) => match[1]))];

	const startMatch = htmlContent.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/);
	const appMatch = htmlContent.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/g);

	const startFile = startMatch ? startMatch[1] : null;
	const appFiles = appMatch
		? appMatch.map((x) => x.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/)[1])
		: [];
	const appFile = appFiles[appFiles.length - 1];

	const configMatch = htmlContent.match(/(__sveltekit_\w+)\s*=/);
	if (!configMatch) {
		console.error(`❌ Could not find SvelteKit configuration variable in ${sourceLabel}`);
		process.exit(1);
	}
	const configVar = configMatch[1];

	const kitOptionsBody = extractKitStartOptionsBody(htmlContent);
	if (!kitOptionsBody) {
		console.error(`❌ Could not find kit.start(app, …, { … }) hydration block in ${sourceLabel}`);
		process.exit(1);
	}

	return {
		cssFiles,
		modulepreloadFiles,
		startFile,
		appFile,
		configVar,
		kitOptionsBody
	};
}

function containerAttributes() {
	const { mode, maxWidthPx, horizontalPadding } = projectConfig.layout;
	const styles = ['width:100%', 'box-sizing:border-box', `padding-inline:${horizontalPadding}`];
	if (mode === 'column') {
		styles.push(`max-width:${maxWidthPx}px`, 'margin-inline:0');
	}
	return `id="${EMBED_CONTAINER_ID}" style="${styles.join(';')}"`;
}

function generateEmbedHTML(info, meta) {
	const { cssFiles, modulepreloadFiles, startFile, appFile, configVar, kitOptionsBody } = info;
	const { route, sourceHtmlRelative } = meta;

	const cssLinks = cssFiles
		.map((file) => `<link href="${JSDELIVR_BASE_URL}_app/immutable/assets/${file}" rel="stylesheet">`)
		.join('\n');

	return `<!-- WordPress embed bundle (see src/lib/config/project.config.js → build) -->
<!--
Route: ${route}
Source: ${sourceHtmlRelative}
1. npm run build:embed${route === '/' ? '' : ` -- --route ${route}`}
2. Commit and push the static build your CDN serves (this repo: copy dist/ → docs/, then commit docs/)
3. Paste this block into a Custom HTML block

CDN base: ${JSDELIVR_BASE_URL}
-->

${cssLinks}

${modulepreloadFiles.map((file) => `<link rel="modulepreload" href="${JSDELIVR_BASE_URL}_app/immutable/${file}">`).join('\n')}

<div ${containerAttributes()}>
	<div class="demo svelte-vfho01">
		<p>Loading…</p>
	</div>
</div>

<script>
(function () {
	const BASE_URL = "${JSDELIVR_BASE_URL}";
	window.${configVar} = { base: BASE_URL };

	const container = document.getElementById("${EMBED_CONTAINER_ID}");

	Promise.all([
		import(BASE_URL + '_app/immutable/entry/${startFile}'),
		import(BASE_URL + '_app/immutable/entry/${appFile}')
	])
		.then(([kit, app]) => {
			kit.start(app, container, {
${kitOptionsBody
	.split(/\r?\n/)
	.map((line) => '\t\t\t\t' + line.trim())
	.join('\n')}
			});
		})
		.catch((error) => {
			console.error('Svelte app failed to load:', error);
			container.innerHTML = '<p>Error loading app. Check the CDN URL in src/lib/config/project.config.js (build.cdnBaseUrl) and that the committed static files (e.g. docs/) match this embed.</p>';
		});
})();
</script>`;
}

function main() {
	const parsed = parseArgs(process.argv.slice(2));
	if (parsed.help) {
		printHelp();
		process.exit(0);
	}
	if (parsed.error) {
		printHelp();
		process.exit(1);
	}

	const repoRoot = REPO_ROOT;
	const route = parsed.route.startsWith('/') ? parsed.route : `/${parsed.route}`;

	const built = resolveBuiltHtmlPath(route);

	console.log(`🔍 Resolving built HTML for route "${route}"…`);

	if (!built) {
		const segment = routeToDistSegment(route);
		console.error(
			`❌ No prerendered HTML for "${route}". Tried dist/ and docs/ (${segment}.html or ${segment}/index.html). Run "npm run build", or sync dist → docs.`
		);
		process.exit(1);
	}

	const htmlContent = readFileSync(built.abs, 'utf-8');
	const sourceLabel = built.label;
	const fileInfo = extractFileInfo(htmlContent, sourceLabel);

	if (!fileInfo.cssFiles.length) {
		console.error(`❌ No stylesheet links found in ${sourceLabel}`);
		process.exit(1);
	}
	if (!fileInfo.startFile || !fileInfo.appFile) {
		console.error(`❌ Could not resolve entry chunks in ${sourceLabel}`);
		process.exit(1);
	}

	const outputPath = parsed.outPath
		? isAbsolute(parsed.outPath)
			? parsed.outPath
			: join(repoRoot, parsed.outPath)
		: defaultOutputPath(repoRoot, route);
	const embedHTML = generateEmbedHTML(fileInfo, { route, sourceHtmlRelative: built.label });

	writeFileSync(outputPath, embedHTML);

	const outRel = relative(repoRoot, outputPath);
	const outLog = outRel.startsWith('..') || isAbsolute(outRel) ? outputPath : outRel;
	console.log(`✅ ${outLog} written`);
	console.log(`   Source: ${sourceLabel}`);
	console.log(`   CDN: ${JSDELIVR_BASE_URL}`);
	console.log(`   Container: #${EMBED_CONTAINER_ID}`);
}

main();
