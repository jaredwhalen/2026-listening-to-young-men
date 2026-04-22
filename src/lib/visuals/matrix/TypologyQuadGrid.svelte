<script>
	// Avoid `lucide-svelte` package root (broken `./icons/index` under Node SSR).
	import Landmark from "lucide-svelte/icons/landmark";
	import Scale from "lucide-svelte/icons/scale";
	import Users from "lucide-svelte/icons/users";
	import GraduationCap from "lucide-svelte/icons/graduation-cap";
	import Calendar from "lucide-svelte/icons/calendar";
	import StackedBarSpark from "./StackedBarSpark.svelte";
	import { quadrantKey } from "./parseTypologyCsv.js";
	import { shortCategory } from "./formatTypologyLine.js";
	import { colorsForMatrixAttribute } from "./matrixDemoColors.js";

	const ICONS = { Landmark, Scale, Users, GraduationCap, Calendar };

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

	function bulletsForQuadrant(q) {
		const k = quadrantKey(q.trustLevel, q.agency);
		return copy.quadrantBullets?.[k] ?? [];
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
			{@const traitLines = bulletsForQuadrant(q)}
			<section class="quad-card">
				<header class="quad-head">
					<div class="quad-headline">
						<h3 class="quad-title">{titleForQuadrant(q)}</h3>
						<!-- <span class="quad-head-rule" aria-hidden="true"></span> -->
						<div class="quad-metric">
							<span class="quad-pct">{q.quadrantPct}%</span>
							<span class="quad-ctx">
								{#each copy.metricContext as line, i (i)}
									<span class="quad-ctx-line">{line}</span>
								{/each}
							</span>
						</div>
					</div>
					{#if traitLines.length}
						<ul class="quad-traits">
							{#each traitLines as line, i (i)}
								<li class="quad-traits-item">{line}</li>
							{/each}
						</ul>
					{/if}
				</header>

				<section>
					<p class="quad-sub">
						<!-- {copy.compareSubtitle} -->
					</p>
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
								<!-- {#if notes.length}
									<p class="quad-note">{notes.join(' ')}</p>
								{/if} -->
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
		--matrix-border: var(--color-border);
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
		font-family: var(--font-heading);
		font-size: clamp(0.8rem, 1.8vw, 0.95rem);
		font-weight: 650;
		color: var(--matrix-heading);
		text-align: center;
		line-height: 1.25;
	}

	.axis-pct {
		font-weight: 550;
		color: var(--color-text-muted);
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
		font-family: var(--font-heading);
		font-size: clamp(0.72rem, 1.5vw, 0.85rem);
		font-weight: 650;
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
		// background: var(--matrix-surface);
		background: var(--color-gray-100);
		// border: 1px solid var(--matrix-border);
		// border-radius: 0.45rem;
		padding: 0.95rem 1rem 1rem;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.quad-head {
		// margin-bottom: 0.55rem;
		// padding-bottom: 0.45rem;
		// border-bottom: 1px solid var(--matrix-border);
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
		font-family: var(--font-heading);
		font-size: clamp(0.95rem, 1.85vw, 1.2rem);
		font-weight: 650;
		line-height: 1.15;
		color: var(--pa-primary-teal);
		letter-spacing: 0.01em;
	}

	.quad-head-rule {
		flex: 0 0 1px;
		align-self: stretch;
		min-height: 2.4rem;
		background: var(--color-gray-300);
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
		font-family: var(--font-heading);
		font-size: clamp(1.45rem, 3.2vw, 1.95rem);
		font-weight: 700;
		line-height: 1;
		color: var(--pa-primary-teal);
		flex-shrink: 0;
	}

	.quad-ctx {
		display: flex;
		flex-direction: column;
		font-family: var(--font-body);
		font-size: 0.78rem;
		line-height: 1.22;
		color: var(--pa-primary-teal);
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

	.quad-traits {
		margin: 0 0 0.65rem;
		padding-left: 1.15rem;
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text);
	}

	.quad-traits-item {
		margin-bottom: 0.4rem;
		padding-left: 0.15rem;
	}

	.quad-traits-item:last-child {
		margin-bottom: 0;
	}

	.quad-sub {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-style: italic;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--matrix-heading-soft);
		border-top: 1px solid var(--matrix-border);
		padding-top: 0.5rem;
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
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.35;
		color: var(--color-text);
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

	.quad-note {
		grid-column: 1 / -1;
		grid-row: 3;
		margin: 0.15rem 0 0;
		font-weight: 600;
		font-style: italic;
		font-size: 0.78rem;
		line-height: 1.35;
		color: var(--matrix-emphasis);
	}

	@media (max-width: 720px) {
		.typology-quad {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto auto;
		}

		.axis-x {
			grid-column: 1;
			grid-row: 1;
		}

		.axis-y {
			grid-column: 1;
			grid-row: 2;
			border-right: none;
			padding-inline: 0;
		}

		.axis-y-inner {
			flex: none;
			flex-direction: row;
			justify-content: space-between;
			writing-mode: horizontal-tb;
			min-height: unset;
			width: 100%;
			padding-block: 0.35rem 0.45rem;
			border-bottom: 1px solid var(--matrix-border);
		}

		.axis-y-label {
			writing-mode: horizontal-tb;
			transform: none;
			white-space: normal;
		}

		.quad-grid {
			grid-column: 1;
			grid-row: 3;
			grid-template-columns: 1fr;
		}
	}
</style>
