<script>
	import { scaleLinear } from 'd3-scale';
	import { TYPOLOGY_VALUE_KEYS } from './parseQuestionsCsv.js';
	import { tippyTooltip } from '$lib/utils/tippy.js';

	/**
	 * @type {{
	 *   typologyLabels?: string[],
	 *   questionA: { qId: string, text: string, values: number[] },
	 *   questionB: { qId: string, text: string, values: number[] },
	 *   colorA?: string,
	 *   colorB?: string
	 * }}
	 */
	let {
		typologyLabels = TYPOLOGY_VALUE_KEYS,
		questionA,
		questionB,
		colorA = 'var(--pa-blue)',
		colorB = 'var(--pa-primary-teal)'
	} = $props();

	let containerW = $state(0);
	let labelW = $state(0);

	/**
	 * Fixed font sizes (CSS px). We keep fonts stable; the *layout* responds.
	 * This is achieved by drawing in a pixel-based SVG (no viewBox scaling).
	 */
	const padR = 16;
	const padLMin = 170;

	const W = $derived(Math.max(320, containerW || 0));
	const rowH = 54;
	const padB = 20;
	const longestLabel = $derived.by(() => {
		let best = '';
		for (const s of typologyLabels) if ((s?.length ?? 0) > best.length) best = s ?? '';
		return best;
	});

	const padL = $derived(Math.max(padLMin, Math.ceil(labelW + 18)));
	const chartW = $derived(Math.max(10, W - padL - padR));

	const legendPadTop = 10;
	const legendPadBottom = 10;
	const legendBlockGap = 8;
	const legendLh = 16;
	const legendTextX = 22;
	const legendSwatchX = 9;
	const legendSwatchR = 6;
	const ruleAfterLegend = 10;

	/**
	 * @param {string} str
	 * @param {number} maxChars
	 * @returns {string[]}
	 */
	function wrapLines(str, maxChars) {
		const cap = Math.max(24, maxChars);
		const words = str.trim().split(/\s+/);
		/** @type {string[]} */
		const out = [];
		let line = '';
		for (const w of words) {
			if (!w) continue;
			if (w.length > cap) {
				if (line) {
					out.push(line);
					line = '';
				}
				for (let i = 0; i < w.length; i += cap) out.push(w.slice(i, i + cap));
				continue;
			}
			const next = line ? `${line} ${w}` : w;
			if (next.length <= cap) line = next;
			else {
				if (line) out.push(line);
				line = w;
			}
		}
		if (line) out.push(line);
		return out.length ? out : [''];
	}

	/**
	 * @param {string} qId
	 * @param {string} text
	 * @param {number} maxChars
	 */
	function legendRows(qId, text, maxChars) {
		const wrapped = wrapLines(text, maxChars);
		return wrapped.map((ln) => ({ lead: null, rest: ln }));
	}

	const legendMaxChars = $derived(Math.floor((W - legendTextX - 8) / 6.8));

	const rowsA = $derived(legendRows(questionA.qId, questionA.text, legendMaxChars));
	const rowsB = $derived(legendRows(questionB.qId, questionB.text, legendMaxChars));

	const legendH = $derived(
		legendPadTop +
			rowsA.length * legendLh +
			legendBlockGap +
			rowsB.length * legendLh +
			legendPadBottom
	);

	const chartTop = $derived(legendH + ruleAfterLegend);

	const svgHeight = $derived(chartTop + typologyLabels.length * rowH + padB);

	const swatchCyA = $derived(legendPadTop + (rowsA.length * legendLh) / 2);
	const blockBTop = $derived(legendPadTop + rowsA.length * legendLh + legendBlockGap);
	const swatchCyB = $derived(blockBTop + (rowsB.length * legendLh) / 2);

	/** Connector thickness in user units — same for every row. */
	const connectorStroke = 3.5;
	const dotR = 6.5;

	/**
	 * Labels sometimes arrive with numbered prefixes (e.g. "1. Foo").
	 * Keep the layout, but display the clean text.
	 * @param {string} s
	 */
	function displayLabel(s) {
		return String(s ?? '').replace(/^\s*\d+\s*[\.\)\-:]\s*/u, '');
	}

	const x = $derived(scaleLinear().domain([0, 1]).range([padL, padL + chartW]));

	const rows = $derived(
		typologyLabels.map((label, i) => {
			const a = questionA.values[i] ?? 0;
			const b = questionB.values[i] ?? 0;
			const pctA = a * 100;
			const pctB = b * 100;
			const diff = pctB - pctA;
			const xA = x(a);
			const xB = x(b);
			const y = chartTop + i * rowH + rowH / 2;
			const xLeft = Math.min(xA, xB);
			const xRight = Math.max(xA, xB);
			const colorLeft = xA <= xB ? colorA : colorB;
			const colorRight = xA <= xB ? colorB : colorA;
			return {
				label: displayLabel(label),
				i,
				a,
				b,
				pctA,
				pctB,
				diff,
				xA,
				xB,
				cx: (xA + xB) / 2,
				y,
				xLeft,
				xRight,
				colorLeft,
				colorRight
			};
		})
	);

	const ticks = [0, 0.25, 0.5, 0.75, 1];

	const percentFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
	function fmtPct(v) {
		return `${percentFmt.format((v ?? 0) * 100)}%`;
	}

	function dotTooltipContent(typologyLabel, seriesLabel, pctText) {
		const wrap = document.createElement('div');
		const title = document.createElement('div');
		title.className = 'everviz-tooltip-title';
		title.textContent = typologyLabel;
		const body = document.createElement('div');
		body.textContent = `${seriesLabel}: ${pctText}`;
		wrap.append(title, body);
		return wrap;
	}
</script>

<div class="dumbbell-board" bind:clientWidth={containerW}>
	<span class="dumbbell-label-measure" bind:clientWidth={labelW} aria-hidden="true"
		>{longestLabel}</span
	>
	<svg
		class="dumbbell-svg"
		width={W}
		height={svgHeight}
		role="img"
		aria-label="Share of young men agreeing, by typology, for two survey questions"
	>
		<g class="dumbbell-legend" aria-label="Questions compared in this chart">
			<circle
				cx={legendSwatchX}
				cy={swatchCyA}
				r={legendSwatchR}
				fill={colorA}
				stroke="rgb(0 0 0 / 0.12)"
				stroke-width="1"
			/>
			{#each rowsA as row, i (i)}
				<text
					class="dumbbell-legend-text"
					x={legendTextX}
					y={legendPadTop + (i + 0.5) * legendLh}
					dominant-baseline="middle"
				>
					<tspan>{row.rest}</tspan>
				</text>
			{/each}

			<circle
				cx={legendSwatchX}
				cy={swatchCyB}
				r={legendSwatchR}
				fill={colorB}
				stroke="rgb(0 0 0 / 0.12)"
				stroke-width="1"
			/>
			{#each rowsB as row, i (`b-${i}`)}
				<text
					class="dumbbell-legend-text"
					x={legendTextX}
					y={blockBTop + (i + 0.5) * legendLh}
					dominant-baseline="middle"
				>
					<tspan>{row.rest}</tspan>
				</text>
			{/each}
		</g>

		<line
			class="dumbbell-legend-rule"
			x1="0"
			y1={legendH}
			x2={W}
			y2={legendH}
			stroke="var(--color-border)"
			stroke-width="1"
		/>

		{#each ticks as t (t)}
			{@const tx = x(t)}
			<line
				class="dumbbell-tick-line"
				x1={tx}
				y1={chartTop - 6}
				x2={tx}
				y2={svgHeight - padB}
			/>
			<text class="dumbbell-tick-label" x={tx} y={svgHeight - 4} text-anchor="middle"
				>{Math.round(t * 100)}%</text
			>
		{/each}

		{#each rows as r (r.i)}
			<g aria-label="{r.label}: question {questionA.qId} {r.pctA.toFixed(0)} percent, question {questionB.qId} {r.pctB.toFixed(0)} percent; gap {r.diff >= 0 ? '+' : ''}{r.diff.toFixed(0)} points">
				<text class="dumbbell-row-label" x={padL - 10} y={r.y} text-anchor="end" dominant-baseline="middle">
					{r.label}
				</text>

				{#if r.xRight - r.xLeft > 0.5}
					<line
						x1={r.xA}
						y1={r.y}
						x2={r.xB}
						y2={r.y}
						class="dumbbell-connector"
						stroke-width={connectorStroke}
						stroke-linecap="round"
					/>
				{/if}

				<circle
					class="dumbbell-dot"
					cx={r.xA}
					cy={r.y}
					r={dotR}
					fill={colorA}
					stroke="var(--color-surface)"
					stroke-width="1.5"
					use:tippyTooltip={{
						getContent: () =>
							dotTooltipContent(r.label, questionA.text, fmtPct(r.a)),
						accentColor: colorA,
						options: { followCursor: true, touch: ['hold', 400] }
					}}
				/>
				<circle
					class="dumbbell-dot"
					cx={r.xB}
					cy={r.y}
					r={dotR}
					fill={colorB}
					stroke="var(--color-surface)"
					stroke-width="1.5"
					use:tippyTooltip={{
						getContent: () =>
							dotTooltipContent(r.label, questionB.text, fmtPct(r.b)),
						accentColor: colorB,
						options: { followCursor: true, touch: ['hold', 400] }
					}}
				/>

				<text class="dumbbell-delta" x={r.cx} y={r.y - 16} text-anchor="middle">
					{r.diff >= 0 ? '+' : ''}{r.diff.toFixed(0)} pts
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.dumbbell-board {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		margin-inline: auto;
		/* Prevent mobile browsers from auto-scaling text */
		text-size-adjust: 100%;
		-webkit-text-size-adjust: 100%;
		position: relative;
	}

	.dumbbell-svg {
		width: 100%;
		height: auto;
		display: block;
		font-family: var(--chart-font-body, var(--font-body));
		max-width: none;
	}

	.dumbbell-label-measure {
		position: absolute;
		visibility: hidden;
		pointer-events: none;
		left: -9999px;
		top: -9999px;
		white-space: nowrap;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-md, 14.5px);
		font-weight: var(--chart-weight-semibold, 650);
		line-height: 1;
	}

	.dumbbell-legend-text {
		fill: var(--chart-text, var(--color-text));
		font-size: var(--chart-fs-sm, 12.5px);
		line-height: 1.25;
	}

	.dumbbell-tick-line {
		stroke: var(--chart-grid, color-mix(in srgb, var(--color-border) 70%, transparent));
		stroke-width: 1;
	}

	.dumbbell-tick-label {
		fill: var(--chart-muted, var(--color-text-muted));
		font-size: var(--chart-fs-xs, 11px);
	}

	.dumbbell-row-label {
		fill: var(--chart-text, var(--color-text));
		font-size: var(--chart-fs-md, 14.5px);
		font-weight: var(--chart-weight-semibold, 650);
	}

	.dumbbell-delta {
		fill: var(--chart-muted, var(--color-text-muted));
		font-size: var(--chart-fs-xs, 11px);
		font-weight: var(--chart-weight-semibold, 650);
		font-variant-numeric: tabular-nums;
	}

	.dumbbell-legend-rule {
		stroke: var(--chart-grid-strong, color-mix(in srgb, var(--color-border) 90%, transparent));
	}

	.dumbbell-connector {
		stroke: var(--chart-grid-strong, color-mix(in srgb, var(--color-border) 90%, transparent));
		opacity: 0.95;
	}
</style>
