<script>
	import { TYPOLOGY_VALUE_KEYS } from './parseQuestionsCsv.js';

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

	/** ViewBox width — scales with container; generous label column avoids clipping. */
	const W = 880;
	const padL = 218;
	const padR = 16;
	const rowH = 46;
	const padB = 20;
	const chartW = W - padL - padR;

	const legendPadTop = 10;
	const legendPadBottom = 10;
	const legendBlockGap = 8;
	const legendLh = 13;
	const legendTextX = 22;
	const legendSwatchX = 9;
	const legendSwatchR = 5;
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
		const prefix = `${qId} · `;
		const wrapped = wrapLines(prefix + text, maxChars);
		return wrapped.map((ln, i) => {
			if (i === 0 && ln.startsWith(prefix)) {
				return { lead: qId, rest: ln.slice(prefix.length) };
			}
			return { lead: null, rest: ln };
		});
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
	const connectorStroke = 4;
	const dotR = 5;

	const rows = $derived(
		typologyLabels.map((label, i) => {
			const a = questionA.values[i] ?? 0;
			const b = questionB.values[i] ?? 0;
			const pctA = a * 100;
			const pctB = b * 100;
			const diff = pctB - pctA;
			const xA = padL + a * chartW;
			const xB = padL + b * chartW;
			const y = chartTop + i * rowH + rowH / 2;
			const xLeft = Math.min(xA, xB);
			const xRight = Math.max(xA, xB);
			const colorLeft = xA <= xB ? colorA : colorB;
			const colorRight = xA <= xB ? colorB : colorA;
			return {
				label,
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
</script>

<div class="dumbbell-board" style:max-width="{W}px">
	<svg
		class="dumbbell-svg"
		viewBox="0 0 {W} {svgHeight}"
		preserveAspectRatio="xMinYMid meet"
		role="img"
		aria-label="Share of young men agreeing, by typology, for two survey questions"
	>
		<title>Typology dumbbell comparison</title>

		<defs>
			{#each rows as r (r.i)}
				<linearGradient
					id="dumbbell-conn-grad-{r.i}"
					gradientUnits="userSpaceOnUse"
					x1={r.xLeft}
					y1={r.y}
					x2={r.xRight}
					y2={r.y}
				>
					<stop offset="0%" stop-color={r.colorLeft} />
					<stop offset="100%" stop-color={r.colorRight} />
				</linearGradient>
			{/each}
		</defs>

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
					{#if row.lead}
						<tspan class="dumbbell-legend-id">{row.lead}</tspan><tspan class="dumbbell-legend-sep"> · </tspan>
					{/if}<tspan>{row.rest}</tspan>
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
					{#if row.lead}
						<tspan class="dumbbell-legend-id">{row.lead}</tspan><tspan class="dumbbell-legend-sep"> · </tspan>
					{/if}<tspan>{row.rest}</tspan>
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
			{@const x = padL + t * chartW}
			<line class="dumbbell-tick-line" x1={x} y1={chartTop - 6} x2={x} y2={svgHeight - padB} />
			<text class="dumbbell-tick-label" x={x} y={svgHeight - 4} text-anchor="middle">{Math.round(t * 100)}%</text>
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
						stroke="url(#dumbbell-conn-grad-{r.i})"
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
					stroke-width="1"
				/>
				<circle
					class="dumbbell-dot"
					cx={r.xB}
					cy={r.y}
					r={dotR}
					fill={colorB}
					stroke="var(--color-surface)"
					stroke-width="1"
				/>

				<text class="dumbbell-delta" x={r.cx} y={r.y - 14} text-anchor="middle">
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
	}

	.dumbbell-svg {
		width: 100%;
		height: auto;
		display: block;
		font-family: var(--font-body);
	}

	.dumbbell-legend-text {
		fill: var(--color-text);
		font-size: 12px;
		line-height: 1.25;
	}

	.dumbbell-legend-id {
		font-weight: 700;
	}

	.dumbbell-legend-sep {
		fill: var(--color-text-muted);
		font-weight: 500;
	}

	.dumbbell-tick-line {
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.dumbbell-tick-label {
		fill: var(--color-text-muted);
		font-size: 11px;
	}

	.dumbbell-row-label {
		fill: var(--color-text);
		font-size: 12px;
		font-weight: 600;
	}

	.dumbbell-delta {
		fill: var(--color-text-muted);
		font-size: 10px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
