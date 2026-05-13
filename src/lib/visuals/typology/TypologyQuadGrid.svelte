<script>
	// Avoid `lucide-svelte` package root (broken `./icons/index` under Node SSR).
	import Info from "lucide-svelte/icons/info";
	import Scale from "lucide-svelte/icons/scale";
	import Users from "lucide-svelte/icons/users";
	import GraduationCap from "lucide-svelte/icons/graduation-cap";
	import Calendar from "lucide-svelte/icons/calendar";
	import StackedBarSpark from "./StackedBarSpark.svelte";
	import { quadrantKey } from "./parseTypologyCsv.js";
	import { shortCategory } from "./formatTypologyLine.js";
	import {
		colorsForMatrixAttribute,
		colorForTypologyQuadrant,
	} from "./typologyDemoColors.js";
	import { evervizFloatingTooltip } from "$lib/utils/evervizFloatingTooltip.js";

	const ICONS = { Scale, Users, GraduationCap, Calendar };

	let { quadrants, columnPcts, rowPcts, copy } = $props();

	function iconForAttribute(attributeName) {
		const name = copy.iconByAttribute[attributeName] ?? "Users";
		return ICONS[name] ?? ICONS.Users;
	}

	function attributeHeading(attributeName) {
		return copy.attributeLabels[attributeName] ?? attributeName;
	}

	function titleForQuadrant(q) {
		const k = quadrantKey(q.trustLevel, q.agency);
		return copy.quadrantTitles[k] ?? `${q.agency} / ${q.trustLevel}`;
	}

	function shortDescriptionForQuadrant(q) {
		const k = quadrantKey(q.trustLevel, q.agency);
		return copy.quadrantShortDescription?.[k] ?? "";
	}

	function longDescriptionForQuadrant(q) {
		const k = quadrantKey(q.trustLevel, q.agency);
		return copy.quadrantLongDescription?.[k] ?? "";
	}

	function quadrantAccent(q) {
		return colorForTypologyQuadrant(quadrantKey(q.trustLevel, q.agency));
	}

	function summaryTooltipParams(q) {
		const long = longDescriptionForQuadrant(q);
		if (!long) return null;
		const groupTitle = titleForQuadrant(q);
		return {
			getContent: () => {
				const wrap = document.createElement("div");
				wrap.className = "matrix-typology-tooltip";
				const head = document.createElement("div");
				head.className =
					"everviz-tooltip-title matrix-typology-tooltip__title";
				head.textContent = groupTitle;
				const body = document.createElement("p");
				body.className = "matrix-typology-tooltip__body";
				body.textContent = long;
				wrap.append(head, body);
				return wrap;
			},
			accentColor: quadrantAccent(q),
			options: {
				maxWidth: 440,
				interactive: true,
				popperOptions: {
					strategy: "fixed",
				},
			},
		};
	}
</script>

<div class="typology-quad" aria-label="Young men typology, two by two matrix">
	<div class="axis axis-x" aria-hidden="true">
		<span class="axis-x-label axis-x-left">
			{copy.axis.columnLeft}
			<span class="axis-pct">({columnPcts.left}%)</span>
		</span>
		<span class="axis-x-label axis-x-right">
			{copy.axis.columnRight}
			<span class="axis-pct">({columnPcts.right}%)</span>
		</span>
	</div>

	<div class="axis axis-y" aria-hidden="true">
		<div class="axis-y-inner">
			<span class="axis-y-label axis-y-top">
				{copy.axis.rowTop}
				<span class="axis-pct">({rowPcts.top}%)</span>
			</span>
			<span class="axis-y-label axis-y-bottom">
				{copy.axis.rowBottom}
				<span class="axis-pct">({rowPcts.bottom}%)</span>
			</span>
		</div>
	</div>

	<div class="quad-grid">
		{#each quadrants as q (quadrantKey(q.trustLevel, q.agency))}
			{@const accent = quadrantAccent(q)}
			{@const summaryShort = shortDescriptionForQuadrant(q)}
			{@const tipParams = summaryTooltipParams(q)}
			<section class="quad-card">
				<header class="quad-head">
					<div class="quad-headline">
						<h3 class="quad-title" style:color={accent}>
							{titleForQuadrant(q)}
						</h3>
						<div class="quad-metric">
							<span class="quad-pct" style:color={accent}
								>{q.quadrantPct}%</span
							>
							<span class="quad-ctx" style:color={accent}>
								{#each copy.metricContext as line, i (i)}
									<span class="quad-ctx-line">{line}</span>
								{/each}
							</span>
						</div>
					</div>
					{#if summaryShort}
						<p class="quad-summary">
							{@html summaryShort}{#if tipParams}{" "}<button
									type="button"
									class="quad-info-tip"
									style:color={accent}
									aria-label={`Full description: ${titleForQuadrant(q)}`}
									use:evervizFloatingTooltip={tipParams}
									><span class="quad-info-tip-label"
										>More info</span
									><Info
										size={14}
										strokeWidth={2}
										aria-hidden="true"
									/></button
								>{/if}
						</p>
					{/if}
				</header>

				<section>
					<ul class="quad-list">
						{#each q.attributes as attr (attr.name)}
							{@const Icon = iconForAttribute(attr.name)}
							{@const notes = attr.items
								.map((i) => i.note)
								.filter(Boolean)}
							{@const stackVals = attr.items.map((i) => i.value)}
							{@const stackLabs = attr.items.map((i) =>
								shortCategory(i.category),
							)}
							{@const stackCols = colorsForMatrixAttribute(
								attr.name,
								attr.items,
							)}
							<li class="quad-item">
								<span class="quad-icon" aria-hidden="true">
									<Icon size={20} strokeWidth={1.55} />
								</span>
								<strong class="quad-attr"
									>{attributeHeading(attr.name)}</strong
								>
								<div class="quad-bar-wrap">
									<StackedBarSpark
										values={stackVals}
										labels={stackLabs}
										colors={stackCols}
										height="1.2rem"
									/>
								</div>
								<div class="spark-legend" aria-hidden="true">
									{#each attr.items as item, j (item.category)}
										<span class="spark-legend-item">
											<span
												class="spark-legend-swatch"
												style:background-color={stackCols[
													j
												]}
											></span>
											<span class="spark-legend-text"
												>{shortCategory(
													item.category,
												)}</span
											>
										</span>
									{/each}
								</div>
							</li>
						{/each}
					</ul>
				</section>
			</section>
		{/each}
	</div>
</div>

<style lang="scss">
	.typology-quad {
		--matrix-heading: var(--color-primary);
		--matrix-heading-soft: var(--color-primary-muted);
		--matrix-emphasis: var(--color-accent);
		--matrix-surface: var(--color-gray-50);
		--matrix-border: var(--chart-border, var(--color-border));
		--matrix-col-gap: 0.75rem;

		width: 100%;
		display: grid;
		grid-template-columns: minmax(2.75rem, 3.25rem) minmax(0, 1fr);
		grid-template-rows: auto minmax(0, 1fr);
		gap: var(--matrix-col-gap, 0.45rem);
		align-items: stretch;
	}

	.axis-x {
		grid-column: 2;
		grid-row: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--matrix-col-gap);
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--matrix-border);
	}

	.axis-x-label {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-sm, 12.5px);
		font-weight: var(--chart-weight-semibold, 650);
		color: var(--matrix-heading);
		text-align: center;
		line-height: 1.25;
	}

	.axis-pct {
		font-weight: 550;
		color: var(--chart-muted, var(--color-text-muted));
		font-size: 0.9em;
	}

	.axis-y {
		grid-column: 1;
		grid-row: 2;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding-inline: 0.35rem 0.25rem;
		border-right: 1px solid var(--matrix-border);
		min-height: 0;
	}

	.axis-y-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		align-items: center;
		min-height: 0;
		padding-block: 0.15rem;
	}

	.axis-y-label {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-sm, 12.5px);
		font-weight: var(--chart-weight-semibold, 650);
		color: var(--matrix-heading);
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		text-align: center;
		line-height: 1.2;
		white-space: nowrap;
	}

	.quad-grid {
		grid-column: 2;
		grid-row: 2;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.65rem var(--matrix-col-gap);
		min-width: 0;
	}

	.quad-card {
		box-sizing: border-box;
		background: var(--color-gray-100);
		padding: 0.95rem 1rem 1rem;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	/** One row: typology name | rule | share + context (editorial-style color split). */
	.quad-headline {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
		margin-bottom: 0.5rem;
	}

	.quad-title {
		margin: 0;
		min-width: 0;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-lg, 16px);
		font-weight: var(--chart-weight-semibold, 650);
		line-height: 1.15;
		color: var(--color-primary);
		letter-spacing: 0.01em;
	}

	.quad-metric {
		display: flex;
		flex-wrap: nowrap;
		align-items: flex-end;
		gap: 0.4rem 0.55rem;
		flex: 1 1 38%;
		min-width: 0;
		justify-content: flex-end;
	}

	.quad-pct {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: clamp(1.45rem, 3.2vw, 1.95rem);
		font-weight: var(--chart-weight-bold, 700);
		line-height: 1;
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.quad-ctx {
		display: flex;
		flex-direction: column;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-xs, 11px);
		line-height: 1.22;
		color: var(--color-primary);
		text-transform: none;
		padding-bottom: 0.08rem;
		text-align: left;
	}

	.quad-ctx-line {
		display: block;
	}

	.quad-ctx-line:last-child {
		font-style: italic;
	}

	.quad-summary {
		margin: 0 0 0.65rem;
		padding: 0;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 12.5px);
		line-height: 1.45;
		color: var(--chart-text, var(--color-text));
	}

	/*
	 * "More info" CTA flows at the end of the short summary like an inline link,
	 * colored with the quadrant accent. Tooltip content is unchanged.
	 */
	.quad-info-tip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin: 0 0 0 0.15rem;
		padding: 0;
		border: none;
		background: transparent;
		font-family: inherit;
		font-size: inherit;
		font-weight: 650;
		line-height: inherit;
		cursor: pointer;
		vertical-align: baseline;
		transition: text-decoration-color 0.12s ease;
	}

	.quad-info-tip-label {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
		text-decoration-color: color-mix(
			in srgb,
			currentColor 50%,
			transparent
		);
	}

	.quad-info-tip:hover .quad-info-tip-label,
	.quad-info-tip:focus-visible .quad-info-tip-label {
		text-decoration-color: currentColor;
	}

	.quad-info-tip:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: 2px;
	}

	:global(.everviz-floating-tooltip .matrix-typology-tooltip__title) {
		font-size: 13px;
		font-weight: 800;
		line-height: 1.25;
		margin: 0 0 0.35rem;
		letter-spacing: 0.01em;
	}

	:global(.everviz-floating-tooltip .matrix-typology-tooltip__body) {
		margin: 0;
		font-weight: 400;
		font-size: 12px;
		line-height: 1.4;
	}

	/**
	 * One column template for all demo rows: icon, label track (= max-content of
	 * longest label, e.g. Party identification), then bar track (1fr). Subgrid on
	 * each `li` ties every row to these tracks so all bars match within the card;
	 * with equal-width quad cards, bar width matches across the four quadrants too.
	 */
	.quad-list {
		margin: 0.35rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: auto max-content minmax(0, 1fr);
		column-gap: 0.5rem;
		row-gap: 0.42rem;
	}

	.quad-item {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		grid-template-rows: auto auto auto;
		row-gap: 0.2rem;
		align-items: center;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 12.5px);
		line-height: 1.35;
		color: var(--chart-text, var(--color-text));
		min-width: 0;
	}

	@supports not (grid-template-columns: subgrid) {
		.quad-list {
			display: flex;
			flex-direction: column;
			gap: 0.42rem;
		}

		.quad-item {
			grid-column: unset;
			grid-template-columns: auto minmax(9.5rem, max-content) minmax(
					0,
					1fr
				);
		}
	}

	.quad-icon {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--matrix-heading-soft);
		flex-shrink: 0;
	}

	.quad-attr {
		grid-column: 2;
		grid-row: 1;
		margin: 0;
		font-weight: 650;
		line-height: 1.2;
		text-align: start;
		min-width: 0;
	}

	.quad-bar-wrap {
		grid-column: 3;
		grid-row: 1;
		min-width: 0;
		width: 100%;
	}

	.spark-legend {
		grid-column: 2 / -1;
		grid-row: 2;
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem 0.5rem;
		font-size: 0.75rem;
		line-height: 1.35;
		color: var(--color-text-muted);
		justify-content: end;
	}

	.spark-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
	}

	.spark-legend-swatch {
		width: 0.48rem;
		height: 0.48rem;
		border-radius: 2px;
		flex-shrink: 0;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
	}

	.spark-legend-text {
		white-space: nowrap;
	}

	@media (max-width: 720px) {
		.typology-quad {
			grid-template-columns: 1fr;
			grid-template-rows: auto;
		}

		/* Once cards stack, hide axis labels entirely. */
		.axis-x,
		.axis-y {
			display: none;
		}

		.quad-grid {
			grid-column: 1;
			grid-row: 1;
			grid-template-columns: 1fr;
		}
	}
</style>
