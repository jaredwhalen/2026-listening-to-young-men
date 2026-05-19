#!/usr/bin/env node
/**
 * Capture each `.quad-card` on `/typology?static` for social sharing (high-DPR PNGs).
 *
 * Prerequisites
 *   1. `npm run build && npm run preview` (default base URL http://127.0.0.1:4173)
 *   2. `npx playwright install chromium` once after `npm install`
 *
 * Usage
 *   npm run screenshot:typology-quads
 *   node tasks/screenshot-typology-quads.mjs --url=http://127.0.0.1:4173 --base-path=/repo-name
 *
 * Env (optional)
 *   BASE_PATH — app base path (leading slash, no trailing slash), same as build
 *
 * Writes: static/images/typology-quad-{slug}.png
 *
 * "Logical" layout: wide desktop viewport so cards match the 2×2 grid; deviceScaleFactor
 * increases bitmap resolution (e.g. 2 ≈ 2× pixel density) for sharp social crops.
 */

import { mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

/** CSS pixels — wide enough for the typology matrix + margins */
const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 1100;

/** Device pixel ratio for output bitmaps (2 is a good default for social). */
const DEVICE_SCALE =
	parseInt(String(process.env.SCREENSHOT_DPR ?? "2"), 10) || 2;

const DEFAULT_URL = "http://127.0.0.1:4173";
const DEFAULT_OUT_DIR = join(REPO_ROOT, "static", "images");

function parseArgs(argv) {
	let url = process.env.SCREENSHOT_URL ?? DEFAULT_URL;
	let basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
	let outDir = DEFAULT_OUT_DIR;

	for (const a of argv) {
		if (a.startsWith("--url=")) url = a.slice(6).replace(/\/$/, "");
		else if (a.startsWith("--base-path="))
			basePath = a.slice(12).trim().replace(/\/$/, "") || "";
		else if (a.startsWith("--out=")) outDir = join(REPO_ROOT, a.slice(6));
		else if (a === "--help" || a === "-h") {
			console.log(`Usage: node tasks/screenshot-typology-quads.mjs [options]

Options:
  --url=          Site origin (default ${DEFAULT_URL} or SCREENSHOT_URL)
  --base-path=    SvelteKit base path, e.g. /repo (default from BASE_PATH env)
  --out=          Output directory relative to repo root (default static/images)

Env:
  BASE_PATH       Same as Vite/SvelteKit build base
  SCREENSHOT_URL  Default origin for --url
  SCREENSHOT_DPR  Device scale factor (default 2)

Run preview first: npm run build && npm run preview
`);
			process.exit(0);
		}
	}

	if (basePath && !basePath.startsWith("/")) basePath = `/${basePath}`;
	return { url, basePath, outDir };
}

function slugFromTitle(title) {
	return String(title ?? "card")
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "") || "card";
}

async function pathExists(p) {
	try {
		await access(p, fsConstants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function ensurePlaywrightBrowserPath() {
	const p = process.env.PLAYWRIGHT_BROWSERS_PATH;
	// Cursor sandboxes sometimes set this to a partial/wrong-arch bundle; drop it so
	// Playwright uses the default cache (~/.cache/ms-playwright) from `npx playwright install`.
	if (p && p.includes("cursor-sandbox-cache")) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
}

async function main() {
	ensurePlaywrightBrowserPath();
	const { chromium } = await import("playwright");

	const { url, basePath, outDir } = parseArgs(process.argv.slice(2));
	const target = `${url}${basePath}/typology?static`;

	await mkdir(outDir, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
		deviceScaleFactor: DEVICE_SCALE,
	});
	const page = await context.newPage();

	console.log(`Navigating to ${target} …`);
	await page.goto(target, { waitUntil: "load", timeout: 120_000 });

	// Hydration: ?static is applied in the browser only
	await page.waitForSelector(".quad-card.quad-card--static", {
		timeout: 60_000,
	});
	await page.waitForSelector(".quad-brand-mark img", { timeout: 30_000 });

	const cards = page.locator(".typology-quad .quad-card");
	const n = await cards.count();
	if (n !== 4) {
		throw new Error(`Expected 4 .quad-card elements, found ${n}`);
	}

	for (let i = 0; i < n; i++) {
		const card = cards.nth(i);
		const title = await card.locator(".quad-title").first().textContent();
		const slug = slugFromTitle(title);
		const filePath = join(outDir, `typology-quad-${slug}.png`);

		await card.screenshot({
			path: filePath,
			type: "png",
			animations: "disabled",
		});

		const ok = await pathExists(filePath);
		if (!ok) throw new Error(`Failed to write ${filePath}`);
		console.log(`Wrote ${filePath} (${title?.trim()})`);
	}

	await browser.close();
	console.log(`Done. ${n} files in ${outDir} (viewport ${VIEWPORT_WIDTH}×${VIEWPORT_HEIGHT} CSS px, DPR ${DEVICE_SCALE}).`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
