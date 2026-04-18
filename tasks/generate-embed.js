#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import projectConfig from '../src/lib/config/project.config.js';

const DIST_PATH = join(__dirname, '..', 'dist');
const INDEX_HTML_PATH = join(DIST_PATH, 'index.html');
const OUTPUT_PATH = join(__dirname, '..', 'wordpress-embed.html');

const JSDELIVR_BASE_URL = projectConfig.build.cdnBaseUrl.replace(/\/?$/, '/');
const EMBED_CONTAINER_ID = projectConfig.build.embedContainerId;

function extractFileInfo(htmlContent) {
	const cssMatch = htmlContent.match(/href="\.\/_app\/immutable\/assets\/([^"]+\.css)"/);
	const cssFile = cssMatch ? cssMatch[1] : null;

	const modulepreloadMatches = htmlContent.matchAll(/href="\.\/_app\/immutable\/([^"]+\.js)"/g);
	const modulepreloadFiles = Array.from(modulepreloadMatches).map((match) => match[1]);

	const startMatch = htmlContent.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/);
	const appMatch = htmlContent.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/g);

	const startFile = startMatch ? startMatch[1] : null;
	const appFiles = appMatch
		? appMatch.map((m) => m.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/)[1])
		: [];
	const appFile = appFiles[appFiles.length - 1];

	const configMatch = htmlContent.match(/(__sveltekit_\w+)\s*=/);
	if (!configMatch) {
		console.error('❌ Could not find SvelteKit configuration variable in dist/index.html');
		process.exit(1);
	}
	const configVar = configMatch[1];

	return {
		cssFile,
		modulepreloadFiles,
		startFile,
		appFile,
		configVar
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

function generateEmbedHTML(info) {
	const { cssFile, modulepreloadFiles, startFile, appFile, configVar } = info;

	return `<!-- WordPress embed bundle (see src/lib/config/project.config.js → build) -->
<!--
1. npm run build:embed
2. Commit and push the dist/ folder (or your CDN source)
3. Paste this block into a Custom HTML block

CDN base: ${JSDELIVR_BASE_URL}
-->

<link href="${JSDELIVR_BASE_URL}_app/immutable/assets/${cssFile}" rel="stylesheet">

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
				node_ids: [0, 2],
				data: [null, null],
				form: null,
				error: null
			});
		})
		.catch((error) => {
			console.error('Svelte app failed to load:', error);
			container.innerHTML = '<p>Error loading app. Check the CDN URL in src/lib/config/project.config.js and that dist/ is published.</p>';
		});
})();
</script>`;
}

function main() {
	console.log('🔍 Checking for dist/index.html...');

	if (!existsSync(INDEX_HTML_PATH)) {
		console.error('❌ dist/index.html not found. Run "npm run build" first.');
		process.exit(1);
	}

	const htmlContent = readFileSync(INDEX_HTML_PATH, 'utf-8');
	const fileInfo = extractFileInfo(htmlContent);
	const embedHTML = generateEmbedHTML(fileInfo);

	writeFileSync(OUTPUT_PATH, embedHTML);

	console.log('✅ wordpress-embed.html written');
	console.log(`   CDN: ${JSDELIVR_BASE_URL}`);
	console.log(`   Container: #${EMBED_CONTAINER_ID}`);
}

main();
