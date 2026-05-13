<script>
	import { scaleLinear } from "d3-scale";
	import { evervizFloatingTooltip } from "$lib/utils/evervizFloatingTooltip.js";

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

	const svgFigureLabel = $derived(
		`Response dot plot: ${chartTitle}. Horizontal scale zero to one hundred percent; ${axisBottomLabel}.`,
	);

	let containerW = $state(0);
	let labelW = $state(0);

	const padR = 18;
	const padLMin = 168;
	const baseRowH = 44;
	const rowLabelLineH = 16;
	const axisTickH = 22;
	const padB = 45;
	/** 20px diameter */
	const dotR = 10;
	const allDiamondHalf = 8;

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

	/**
	 * Legend or plot hover: highlight one series (or all-respondents) by dimming
	 * everything else to 10% opacity. Empty string = no focus.
	 * @type {'' | string}
	 */
	let hoveredFocus = $state("");

	const ALL_FOCUS_KEY = "__all__";

	function legendEnter(key) {
		hoveredFocus = key;
	}

	function legendLeave() {
		hoveredFocus = "";
	}

	const tooltipOptions = {
		followCursor: true,
		appendTo: () => document.body,
		popperOptions: { strategy: 'fixed' },
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
	<div class="iqdot-legend" aria-label="Chart legend">
		{#each legendEmphasized as s (s.key)}
			<span
				class="iqdot-legend-item"
				role="presentation"
				onmouseenter={() => legendEnter(s.key)}
				onmouseleave={legendLeave}
			>
				<span class="iqdot-legend-swatch" style:background-color={s.color}></span>
				<span class="iqdot-legend-label">{s.label.replaceAll(" ", "")}</span>
			</span>
		{/each}
		{#if legendShowMutedFamily && legendMutedGroupName}
			<span
				class="iqdot-legend-item iqdot-legend-item--muted-family"
				role="presentation"
			>
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
		<span
			class="iqdot-legend-item iqdot-legend-item--all"
			role="presentation"
			onmouseenter={() => legendEnter(ALL_FOCUS_KEY)}
			onmouseleave={legendLeave}
		>
			<svg
				class="iqdot-legend-all-icon"
				width="16"
				height="16"
				viewBox="0 0 16 16"
				aria-hidden="true"
			>
				<rect
					x="3"
					y="3"
					width="10"
					height="10"
					rx="1.25"
					transform="rotate(45 8 8)"
					fill="var(--iqdot-all-marker, #8a8a8a)"
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
		aria-label={svgFigureLabel}
	>
		{#each ticks as t (t)}
			{@const tx = x(t)}
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
				x={0}
				y={y - ((labelLines.length - 1) * rowLabelLineH) / 2}
				text-anchor="start"
			>
				{#each labelLines as line, li (li)}
					<tspan x={0} dy={li === 0 ? 0 : rowLabelLineH}>{line}</tspan>
				{/each}
			</text>

			{#if row.all != null}
				{@const ax = x(row.all)}
				<g class="iqdot-move" style:transform={`translate(${ax}px, ${y}px)`}>
					<rect
						class="iqdot-all-diamond"
						class:iqdot-all-diamond--focus-dim={Boolean(
							hoveredFocus && hoveredFocus !== ALL_FOCUS_KEY,
						)}
						role="img"
						aria-label="All respondents"
						x={-allDiamondHalf}
						y={-allDiamondHalf}
						width={allDiamondHalf * 2}
						height={allDiamondHalf * 2}
						rx="1.25"
						transform="rotate(45)"
						style:pointer-events="all"
						onmouseenter={() => legendEnter(ALL_FOCUS_KEY)}
						onmouseleave={legendLeave}
						use:evervizFloatingTooltip={{
							getContent: () => dotTooltip("", "All respondents", row.all),
							accentColor: "var(--iqdot-all-bar)",
							options: tooltipOptions,
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
						class:iqdot-dot--focus-dim={Boolean(
							hoveredFocus &&
								(hoveredFocus === ALL_FOCUS_KEY ||
									hoveredFocus !== s.key),
						)}
						role="img"
						aria-label={`${s.label}: ${fmtPct(v)}`}
						cx={0}
						cy={y}
						r={dotR}
						fill={s.muted ? "var(--iqdot-muted-dot)" : s.color}
						style:transform={`translateX(${cx}px)`}
						style:pointer-events="all"
						onmouseenter={() => legendEnter(s.key)}
						onmouseleave={legendLeave}
						use:evervizFloatingTooltip={{
							getContent: () =>
								dotTooltip(s.group ?? "", s.label, v),
							accentColor: s.muted
								? "var(--iqdot-muted-dot)"
								: s.color,
							options: tooltipOptions,
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
		--iqdot-muted-legend-opacity: 0.52;
		--iqdot-axis-fill: rgb(23 23 23 / 0.7);
		--iqdot-grid-line: #e6e6e6;
		--iqdot-dot-opacity: 0.75;
		--iqdot-focus-dim-opacity: 0.1;

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
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-sm, 14px);
		font-weight: var(--chart-weight-regular, 400);
		line-height: 1.25;
		max-width: 16rem;
	}

	.iqdot-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
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

	.iqdot-legend-triad,
	.iqdot-legend-swatch,
	.iqdot-legend-all-icon {
		opacity: var(--iqdot-dot-opacity);
	}

	.iqdot-legend-swatch {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.iqdot-legend-triad,
	.iqdot-legend-all-icon {
		flex-shrink: 0;
		display: block;
	}

	.iqdot-legend-label {
		line-height: 1.2;
		font-family: var(--chart-font-heading);
	}

	.iqdot-svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.iqdot-move,
	.iqdot-dot {
		transition:
			transform 220ms ease,
			opacity 0.15s ease;
	}

	.iqdot-tick {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-xs, 12px);
		fill: var(--iqdot-axis-fill);
	}

	.iqdot-axis-title {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-xs, 12px);
		fill: var(--iqdot-axis-fill);
	}

	.iqdot-row-line {
		stroke: var(--iqdot-grid-line);
		stroke-width: 1;
	}

	.iqdot-row-label {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-sm, 14px);
		fill: var(--chart-text, var(--color-text));
	}

	.iqdot-all-diamond {
		fill: var(--iqdot-all-marker);
		stroke: none;
		cursor: default;
		opacity: var(--iqdot-dot-opacity);
		transition: opacity 0.15s ease;
	}

	.iqdot-all-diamond--focus-dim {
		opacity: var(--iqdot-focus-dim-opacity);
	}

	.iqdot-dot {
		cursor: default;
		opacity: var(--iqdot-dot-opacity);
	}

	.iqdot-dot--focus-dim {
		opacity: var(--iqdot-focus-dim-opacity);
	}
</style>
