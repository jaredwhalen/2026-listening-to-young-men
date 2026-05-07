<script>
	import { scaleLinear } from "d3-scale";
	import { tippyTooltip } from "$lib/utils/tippy.js";

	/**
	 * @typedef {{ yLabel: string, all: number | null, series: Record<string, number | null> }} DotRow
	 * @typedef {{ key: string, label: string, color: string, group?: string, muted?: boolean }} SeriesMeta
	 */

	/** @type {{ rows: DotRow[], series: SeriesMeta[], axisBottomLabel?: string, chartTitle?: string }} */
	let {
		rows = [],
		series = [],
		axisBottomLabel = "% selecting",
		chartTitle = "Response distribution by group",
	} = $props();

	let containerW = $state(0);
	let labelW = $state(0);

	const padR = 18;
	const padLMin = 168;
	const baseRowH = 32;
	const rowLabelLineH = 16;
	const axisTickH = 22;
	const padB = 45;
	const dotR = 5.5;
	const allTickHalf = 9;
	/** Stroke width (px) for “All respondents” tick on the scale */
	const allTickW = 2;

	const W = $derived(Math.max(300, containerW || 0));
	const labelMaxW = $derived(Math.min(360, Math.floor(W * 0.48)));
	const padL = $derived(Math.max(padLMin, Math.ceil(Math.min(labelW, labelMaxW) + 14)));
	const chartW = $derived(Math.max(40, W - padL - padR));

	const x = $derived(
		scaleLinear().domain([0, 100]).range([padL, padL + chartW]),
	);

	const longestLabel = $derived.by(() => {
		let best = "";
		for (const r of rows) {
			const s = r?.yLabel ?? "";
			if (s.length > best.length) best = s;
		}
		return best || "—";
	});

	const chartTop = $derived(axisTickH);
	const svgHeight = $derived(
		chartTop + Math.max(1, rows.length) * rowH + padB,
	);

	const ticks = [0, 25, 50, 75, 100];
	const tickLabelY = $derived(svgHeight - padB + 18);
	const axisTitleY = $derived(svgHeight - 6);

	function wrapWords(text, maxChars) {
		const s = String(text ?? "").replace(/\s+/g, " ").trim();
		if (!s) return ["—"];
		if (!maxChars || maxChars < 10) return [s];
		const words = s.split(" ");
		/** @type {string[]} */
		const lines = [];
		let cur = "";
		for (const w of words) {
			if (!cur) {
				cur = w;
				continue;
			}
			if ((cur + " " + w).length <= maxChars) {
				cur += " " + w;
			} else {
				lines.push(cur);
				cur = w;
			}
		}
		if (cur) lines.push(cur);
		return lines;
	}

	const rowLabelMaxChars = $derived(() => Math.floor((padL - 22) / 6.8));
	const rowLabelLines = $derived.by(() =>
		rows.map((r) => wrapWords(r?.yLabel ?? "", rowLabelMaxChars())),
	);
	const rowLabelMaxLines = $derived(
		Math.max(1, ...rowLabelLines.map((ls) => ls.length)),
	);
	const rowH = $derived(baseRowH + (rowLabelMaxLines - 1) * rowLabelLineH);

	/** Legend: highlighted series only, plus one entry for the muted family. */
	const legendEmphasized = $derived(series.filter((s) => !s.muted));
	const legendShowMutedFamily = $derived(series.some((s) => s.muted));
	/** Label for de-emphasized family (Demographics or Typology). */
	const legendMutedGroupName = $derived.by(() => {
		const m = series.find((s) => s.muted);
		return (m?.group ?? "").trim();
	});

	/** Muted dots first so highlighted dots paint on top when values overlap. */
	const seriesPaintOrder = $derived.by(() => {
		const muted = [];
		const loud = [];
		for (const s of series) {
			(s.muted ? muted : loud).push(s);
		}
		return [...muted, ...loud];
	});

	let hoveredLegendKey = $state("");

	const tippyOptions = {
		followCursor: true,
		touch: ["hold", 400],
		/** SVG cannot host HTML poppers; default appendTo (svg parent) breaks tooltips. */
		appendTo: () => document.body,
	};

	const percentFmt = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	});

	function fmtPct(n) {
		if (n == null || !Number.isFinite(n)) return "—";
		return `${percentFmt.format(n)}%`;
	}

	/**
	 * @param {string} group e.g. "Demographics" / "Typology"
	 * @param {string} label e.g. "Young men"
	 * @param {number} value
	 */
	function dotTooltip(group, label, value) {
		const wrap = document.createElement("div");
		const title = document.createElement("div");
		title.className = "everviz-tooltip-title";
		title.textContent = group?.trim() ? group.trim() : label;
		const body = document.createElement("div");
		body.textContent = group?.trim()
			? `${label}: ${fmtPct(value)}`
			: fmtPct(value);
		wrap.append(title, body);
		return wrap;
	}
</script>

<div class="iqdot" bind:clientWidth={containerW}>
	<div class="iqdot-legend" aria-label="Series and baseline">
		{#each legendEmphasized as s (s.key)}
			<span
				class="iqdot-legend-item"
				role="presentation"
				onmouseenter={() => (hoveredLegendKey = s.key)}
				onmouseleave={() => (hoveredLegendKey = "")}
			>
				<span class="iqdot-legend-swatch" style:background-color={s.color}></span>
				<span class="iqdot-legend-label">{s.label}</span>
			</span>
		{/each}
		{#if legendShowMutedFamily && legendMutedGroupName}
			<span class="iqdot-legend-item iqdot-legend-item--muted-family">
				<svg
					class="iqdot-legend-triad"
					width="15"
					height="13"
					viewBox="0 0 15 13"
					aria-hidden="true"
				>
					<circle cx="7.5" cy="3" r="2.2" fill="var(--iqdot-muted-dot)" />
					<circle cx="3" cy="10" r="2.2" fill="var(--iqdot-muted-dot)" />
					<circle cx="12" cy="10" r="2.2" fill="var(--iqdot-muted-dot)" />
				</svg>
				<span class="iqdot-legend-label">{legendMutedGroupName}</span>
			</span>
		{/if}
		<span class="iqdot-legend-item iqdot-legend-item--all">
			<svg
				class="iqdot-legend-all-icon"
				width="13"
				height="13"
				viewBox="0 0 13 13"
				aria-hidden="true"
			>
				<rect
					x="3"
					y="3"
					width="7"
					height="7"
					rx="1"
					transform="rotate(45 6.5 6.5)"
					fill="var(--iqdot-all-marker, #8a8a8a)"
					stroke="color-mix(in srgb, var(--iqdot-all-bar, #4a4a4a) 25%, transparent)"
					stroke-width="1"
				/>
			</svg>
			<span class="iqdot-legend-label">All respondents</span>
		</span>
	</div>

	<span
		class="iqdot-label-measure"
		style:width={`${labelMaxW}px`}
		bind:clientWidth={labelW}
		aria-hidden="true"
	>
		{longestLabel}
	</span>
	<svg
		class="iqdot-svg"
		width={W}
		height={svgHeight}
		role="img"
		aria-label={chartTitle}
	>
		{#each ticks as t (t)}
			{@const tx = x(t)}
			<line
				class="iqdot-grid"
				x1={tx}
				y1={chartTop - 4}
				x2={tx}
				y2={svgHeight - padB}
			/>
			<text class="iqdot-tick" x={tx} y={tickLabelY} text-anchor="middle">
				{t}%
			</text>
		{/each}

		<text
			class="iqdot-axis-title"
			x={padL + chartW / 2}
			y={axisTitleY}
			text-anchor="middle"
		>
			{axisBottomLabel}
		</text>

		{#each rows as row, ri (ri)}
			{@const labelLines = rowLabelLines[ri] ?? [row.yLabel]}
			{@const y = chartTop + ri * rowH + rowH / 2}
			<line
				class="iqdot-row-line"
				x1={padL}
				y1={y}
				x2={padL + chartW}
				y2={y}
			/>
			<text
				class="iqdot-row-label"
				x={padL - 8}
				y={y - ((labelLines.length - 1) * rowLabelLineH) / 2}
				text-anchor="end"
			>
				{#each labelLines as line, li (li)}
					<tspan x={padL - 8} dy={li === 0 ? 0 : rowLabelLineH}>{line}</tspan>
				{/each}
			</text>

			{#if row.all != null}
				{@const ax = x(row.all)}
				<g class="iqdot-move" style:transform={`translate(${ax}px, ${y}px)`}>
					<rect
						class="iqdot-all-diamond"
						x={-4}
						y={-4}
						width="8"
						height="8"
						rx="1"
						transform="rotate(45)"
						style:pointer-events="all"
						use:tippyTooltip={{
							getContent: () => dotTooltip("", "All respondents", row.all),
							accentColor: "var(--iqdot-all-bar)",
							options: tippyOptions,
						}}
					/>
				</g>
			{/if}

			{#each seriesPaintOrder as s (s.key)}
				{@const v = row.series[s.key]}
				{#if v != null}
					{@const cx = x(v)}
					<circle
						class="iqdot-dot"
						class:iqdot-dot--muted={s.muted}
						class:iqdot-dot--legend-hovered={hoveredLegendKey === s.key}
						class:iqdot-dot--legend-dim={Boolean(
							hoveredLegendKey && hoveredLegendKey !== s.key,
						)}
						cx={0}
						cy={y}
						r={dotR}
						fill={s.muted ? "var(--iqdot-muted-dot)" : s.color}
						stroke="var(--color-surface)"
						stroke-width="1.25"
						style:transform={`translateX(${cx}px)`}
						style:pointer-events="all"
						use:tippyTooltip={{
							getContent: () =>
								dotTooltip(s.group ?? "", s.label, v),
							accentColor: s.muted
								? "var(--iqdot-muted-dot)"
								: s.color,
							options: tippyOptions,
						}}
					/>
				{/if}
			{/each}
		{/each}
	</svg>
</div>

<style lang="scss">
	.iqdot {
		--iqdot-all-bar: #4a4a4a;
		--iqdot-all-marker: color-mix(in srgb, var(--iqdot-all-bar) 55%, white);
		--iqdot-muted-dot: #c4c4c4;
		--iqdot-muted-dot-opacity: 0.48;
		--iqdot-muted-legend-opacity: 0.52;
		--iqdot-legend-dim-opacity: 0.22;
		--iqdot-dot-hover-stroke: #111;

		position: relative;
		width: 100%;
	}

	.iqdot-label-measure {
		position: absolute;
		left: -9999px;
		top: 0;
		visibility: hidden;
		pointer-events: none;
		white-space: nowrap;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		font-weight: var(--chart-weight-regular, 400);
		line-height: 1.25;
		max-width: 16rem;
	}

	.iqdot-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.65rem 1.1rem;
		margin: 0 0 0.5rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-xs, 12px);
		color: var(--chart-text, var(--color-text));
	}

	.iqdot-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.iqdot-legend-item:has(.iqdot-legend-swatch):hover .iqdot-legend-label {
		color: var(--chart-text, var(--color-text));
	}

	.iqdot-legend-item--all {
		color: var(--chart-muted, var(--color-text-muted));
	}

	.iqdot-legend-item--muted-family .iqdot-legend-label {
		color: var(--chart-muted, var(--color-text-muted));
	}

	.iqdot-legend-triad {
		flex-shrink: 0;
		display: block;
		opacity: var(--iqdot-muted-legend-opacity, 0.52);
	}

	.iqdot-legend-swatch {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
	}

	.iqdot-legend-all-icon {
		flex-shrink: 0;
		display: block;
	}

	.iqdot-legend-label {
		line-height: 1.2;
	}

	.iqdot-svg {
		display: block;
		width: 100%;
		height: auto;
		font-family: var(--chart-font-body, var(--font-body));
	}

	.iqdot-move,
	.iqdot-dot {
		transition: transform 220ms ease;
	}

	.iqdot-grid {
		stroke: var(--chart-grid, color-mix(in srgb, var(--color-border) 70%, transparent));
		stroke-width: 1;
	}

	.iqdot-tick {
		font-size: var(--chart-fs-xs, 12px);
		fill: var(--chart-muted, var(--color-text-muted));
	}

	.iqdot-axis-title {
		font-size: var(--chart-fs-xs, 12px);
		fill: var(--chart-muted, var(--color-text-muted));
	}

	.iqdot-row-line {
		stroke: var(--chart-grid-strong, color-mix(in srgb, var(--color-border) 88%, transparent));
		stroke-width: 1;
	}

	.iqdot-row-label {
		font-size: var(--chart-fs-sm, 14px);
		fill: var(--chart-text, var(--color-text));
	}

	.iqdot-all-diamond {
		fill: var(--iqdot-all-marker);
		stroke: color-mix(in srgb, var(--iqdot-all-bar) 25%, transparent);
		stroke-width: 1;
		cursor: default;
	}

	.iqdot-all-diamond:hover {
		stroke: var(--iqdot-dot-hover-stroke);
		stroke-width: 2;
	}

	.iqdot-dot {
		cursor: default;
	}

	.iqdot-dot:hover {
		stroke: var(--iqdot-dot-hover-stroke);
		stroke-width: 2;
	}

	.iqdot-dot--legend-hovered {
		stroke: var(--iqdot-dot-hover-stroke);
		stroke-width: 2;
	}

	.iqdot-dot--legend-dim {
		opacity: var(--iqdot-legend-dim-opacity);
	}

	.iqdot-dot--muted {
		opacity: var(--iqdot-muted-dot-opacity);
	}
</style>
