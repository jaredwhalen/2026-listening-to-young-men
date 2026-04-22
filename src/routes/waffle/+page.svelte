<script>
	import InlineVisual from '$lib/components/layout/InlineVisual.svelte';
	import WaffleHeatmap from '$lib/visuals/waffle/WaffleHeatmap.svelte';
	import TypologyDiffHeatmap from '$lib/visuals/waffle/TypologyDiffHeatmap.svelte';
	import { buildTypologyCompareRows, TYPOLOGY_COMPARE_COLUMNS } from '$lib/visuals/waffle/buildTypologyCompareRows.js';
	import { parseWaffleCsv } from '$lib/visuals/waffle/parseWaffleCsv.js';
	import waffleRaw from '$lib/data/waffle.csv?raw';
	import copy from '$lib/data/copy.json';

	const VIEW_MODE = {
		demographics: 'demographics',
		typologies: 'typologies'
	};

	const WAFFLE_TABLE = {
		societyBelieves: 'society_believes',
		theyBelieve: 'they_believe'
	};

	const TYPOLOGIES_CHART_LABEL_RELATIONAL = 'Relational young men';
	const TYPOLOGIES_CHART_LABEL_SELF_DRIVEN = 'Self-driven young men';

	let viewMode = $state(VIEW_MODE.demographics);

	let innerWidth = $state(0);
	let isDesktop = $derived(innerWidth >= 980);

	const parsed = parseWaffleCsv(waffleRaw);

	const DEMOS = [
		'All Americans',
		'Men 18-34',
		'Women 18-34',
		'Men 35-54',
		'Men 55+',
		'Relational',
		'Self-driven'
	];

	let columns = $derived.by(() => {
		if (!parsed.ok) return DEMOS;
		const set = new Set(parsed.columns);
		const ordered = DEMOS.filter((c) => set.has(c));
		for (const c of parsed.columns) if (!ordered.includes(c)) ordered.push(c);
		return ordered;
	});

	let sortDemographics = $state(null);
	let hoverDemographics = $state(null);

	$effect(() => {
		if (!sortDemographics && columns.length) {
			sortDemographics = {
				column: columns.includes('All Americans') ? 'All Americans' : columns[0],
				dir: 'desc'
			};
		}
		if (sortDemographics && !columns.includes(sortDemographics.column) && columns.length) {
			sortDemographics = {
				column: columns.includes('All Americans') ? 'All Americans' : columns[0],
				dir: sortDemographics.dir
			};
		}
	});

	const demographicsRowsSociety = $derived.by(() => {
		if (!parsed.ok) return [];
		return parsed.rows.filter((r) => r.table === WAFFLE_TABLE.societyBelieves);
	});

	const demographicsRowsThey = $derived.by(() => {
		if (!parsed.ok) return [];
		return parsed.rows.filter((r) => r.table === WAFFLE_TABLE.theyBelieve);
	});

	const leadDemographics =
		'Percent of Americans who select each of the following as one of three traits they believe...';

	const demographicsHeatmapLabels = {
		[WAFFLE_TABLE.societyBelieves]: '...society most values in men today',
		[WAFFLE_TABLE.theyBelieve]: '...are most important for men to have today'
	};

	const leadTypologies =
	'Percent of young men who select each of the following as one of three traits they believe are most important for men today, and the percent difference in the traits they believe society values:';

	let showNumbers = $state(true);
	let traitColWidthDemographics = $state(null);
	let traitColWidthTypologies = $state(null);

	let sortTypologies = $state(null);
	let hoverTypologies = $state(null);

	const typologiesRowsRelational = $derived.by(() => {
		if (!parsed.ok) return [];
		return buildTypologyCompareRows(
			demographicsRowsThey,
			demographicsRowsSociety,
			'Relational',
			parsed.traitOrder
		);
	});

	const typologiesRowsSelfDriven = $derived.by(() => {
		if (!parsed.ok) return [];
		return buildTypologyCompareRows(
			demographicsRowsThey,
			demographicsRowsSociety,
			'Self-driven',
			parsed.traitOrder
		);
	});

	$effect(() => {
		if (!parsed.ok || viewMode !== VIEW_MODE.typologies) return;
		const cols = [...TYPOLOGY_COMPARE_COLUMNS];
		if (!sortTypologies) {
			sortTypologies = { column: 'Difference', dir: 'desc' };
		}
		if (sortTypologies && !cols.includes(sortTypologies.column)) {
			sortTypologies = { column: 'Difference', dir: sortTypologies.dir };
		}
	});
</script>

<svelte:head>
	<title>Waffle</title>
</svelte:head>

<svelte:window bind:innerWidth={innerWidth} />

<div class="page-inner">
	<InlineVisual>
		{#snippet title()}{copy.charts.waffle.title || ''} {/snippet}
		{#snippet dek()}{copy.charts.waffle.description || ''}{/snippet}
		{#snippet children()}
			<div class="controls-bar">
				<div class="control-cluster">
					<span class="control-label" id="waffle-view-label">View</span>
					<div
						class="control-pill"
						role="group"
						aria-labelledby="waffle-view-label"
					>
						<button
							type="button"
							class="control-pill-btn"
							class:control-pill-btn--on={viewMode === VIEW_MODE.demographics}
							aria-pressed={viewMode === VIEW_MODE.demographics}
							onclick={() => (viewMode = VIEW_MODE.demographics)}
						>
							Demographics
						</button>
						<button
							type="button"
							class="control-pill-btn"
							class:control-pill-btn--on={viewMode === VIEW_MODE.typologies}
							aria-pressed={viewMode === VIEW_MODE.typologies}
							onclick={() => (viewMode = VIEW_MODE.typologies)}
						>
							Typologies
						</button>
					</div>
				</div>
				{#if parsed.ok}
					<div class="control-cluster">
						<span class="control-label" id="waffle-values-label">Values</span>
						<div
							class="control-pill"
							role="group"
							aria-labelledby="waffle-values-label"
						>
							<button
								type="button"
								class="control-pill-btn"
								class:control-pill-btn--on={showNumbers}
								aria-pressed={showNumbers}
								onclick={() => (showNumbers = true)}
							>
								Show
							</button>
							<button
								type="button"
								class="control-pill-btn"
								class:control-pill-btn--on={!showNumbers}
								aria-pressed={!showNumbers}
								onclick={() => (showNumbers = false)}
							>
								Hide
							</button>
						</div>
					</div>
				{/if}
			</div>

			{#if !parsed.ok}
				<section class="error" role="status">
					<h2 class="error-title">Couldn’t load the CSV</h2>
					<p class="error-body">{parsed.error}</p>
					<p class="error-body">
						If this project uses Google Sheets as the source, ensure the sheet is publicly accessible, then run
						<code>npm run gdoc</code> to regenerate <code>src/lib/data/waffle.csv</code>.
					</p>
				</section>
			{:else if viewMode === VIEW_MODE.typologies}
				<p class="waffle-lead">{leadTypologies}</p>
				<div
					class="compare compare--typologies"
					style:--trait-col={traitColWidthTypologies ? `${traitColWidthTypologies}px` : undefined}
				>
					<section class="chart chart--left" aria-label={TYPOLOGIES_CHART_LABEL_RELATIONAL}>
						<p class="chart-label">{TYPOLOGIES_CHART_LABEL_RELATIONAL}</p>
						<TypologyDiffHeatmap
							rows={typologiesRowsRelational}
							showNumbers={showNumbers}
							activeHover={isDesktop ? hoverTypologies : null}
							onHoverChange={isDesktop ? (next) => (hoverTypologies = next) : undefined}
							sortColumn={sortTypologies?.column ?? null}
							sortDir={sortTypologies?.dir ?? 'desc'}
							onSort={(next) => (sortTypologies = next)}
							onTraitColWidth={(px) => {
								traitColWidthTypologies =
									traitColWidthTypologies == null ? px : Math.max(traitColWidthTypologies, px);
							}}
						/>
					</section>
					<section class="chart chart--right" aria-label={TYPOLOGIES_CHART_LABEL_SELF_DRIVEN}>
						<p class="chart-label">{TYPOLOGIES_CHART_LABEL_SELF_DRIVEN}</p>
						<TypologyDiffHeatmap
							rows={typologiesRowsSelfDriven}
							showNumbers={showNumbers}
							activeHover={isDesktop ? hoverTypologies : null}
							onHoverChange={isDesktop ? (next) => (hoverTypologies = next) : undefined}
							sortColumn={sortTypologies?.column ?? null}
							sortDir={sortTypologies?.dir ?? 'desc'}
							onSort={(next) => (sortTypologies = next)}
							onTraitColWidth={(px) => {
								traitColWidthTypologies =
									traitColWidthTypologies == null ? px : Math.max(traitColWidthTypologies, px);
							}}
						/>
					</section>
				</div>
			{:else}
				<p class="waffle-lead">{leadDemographics}</p>
				<div
					class="compare"
					style:--trait-col={traitColWidthDemographics ? `${traitColWidthDemographics}px` : undefined}
				>
					<section
						class="chart chart--left"
						aria-label={`Demographics: ${demographicsHeatmapLabels[WAFFLE_TABLE.societyBelieves]}`}
					>
						<p class="chart-label">{demographicsHeatmapLabels[WAFFLE_TABLE.societyBelieves]}</p>
						<WaffleHeatmap
							rows={demographicsRowsSociety}
							columns={columns}
							gapAfter={5}
							valueSuffix="%"
							showNumbers={showNumbers}
							activeHover={isDesktop ? hoverDemographics : null}
							onHoverChange={isDesktop ? (next) => (hoverDemographics = next) : undefined}
							sortColumn={sortDemographics?.column ?? null}
							sortDir={sortDemographics?.dir ?? 'desc'}
							onSort={(next) => (sortDemographics = next)}
							onTraitColWidth={(px) => {
								traitColWidthDemographics =
									traitColWidthDemographics == null ? px : Math.max(traitColWidthDemographics, px);
							}}
						/>
					</section>
					<section
						class="chart chart--right"
						aria-label={`Demographics: ${demographicsHeatmapLabels[WAFFLE_TABLE.theyBelieve]}`}
					>
						<p class="chart-label">{demographicsHeatmapLabels[WAFFLE_TABLE.theyBelieve]}</p>
						<WaffleHeatmap
							rows={demographicsRowsThey}
							columns={columns}
							gapAfter={5}
							valueSuffix="%"
							showNumbers={showNumbers}
							activeHover={isDesktop ? hoverDemographics : null}
							onHoverChange={isDesktop ? (next) => (hoverDemographics = next) : undefined}
							sortColumn={sortDemographics?.column ?? null}
							sortDir={sortDemographics?.dir ?? 'desc'}
							onSort={(next) => (sortDemographics = next)}
							onTraitColWidth={(px) => {
								traitColWidthDemographics =
									traitColWidthDemographics == null ? px : Math.max(traitColWidthDemographics, px);
							}}
						/>
					</section>
				</div>
			{/if}
		{/snippet}
		{#snippet note()}
			{copy.charts.waffle.note || ''}
		{/snippet}
	</InlineVisual>
</div>

<style lang="scss">
	@import '../../lib/visuals/waffle/waffle-visual-shared.css';

	.page-inner {
		width: 100%;
		padding-block: 1.5rem 2rem;
	}

	.controls-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.85rem 1.5rem;
		margin-bottom: 1rem;
	}

	.control-cluster {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem 0.65rem;
	}

	.control-label {
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		line-height: 1;
		flex-shrink: 0;
	}

	.control-pill {
		display: inline-flex;
		padding: 0.12rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-border) 35%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
		gap: 0.1rem;
	}

	.control-pill-btn {
		appearance: none;
		border: 0;
		margin: 0;
		padding: 0.38rem 0.9rem;
		border-radius: 999px;
		font-family: var(--font-body);
		font-size: 0.78rem;
		line-height: 1.15;
		color: var(--color-text-muted);
		background: transparent;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 0.12s ease,
			color 0.12s ease,
			box-shadow 0.12s ease;
	}

	.control-pill-btn--on {
		background: var(--color-surface);
		color: var(--color-text);
		font-weight: 650;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}

	.control-pill-btn:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-primary) 60%, white);
		outline-offset: 2px;
	}

	.compare {
		display: grid;
		/* gap: 3rem; */
		/* Fallback trait column width; JS will set a tighter px value */
		--trait-col: clamp(8rem, 18vw, 13rem);
	}

	@media (min-width: 980px) {
		.compare {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}

	.chart-label {
		margin: 0 0 0.5rem;
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 650;
		color: var(--color-text);
		text-align: center;
	}

	.error {
		padding: 1rem;
		font-family: var(--font-body);
		border: 1px solid color-mix(in srgb, var(--color-accent-2) 35%, var(--color-border));
	}

	.error-title {
		margin: 0 0 0.4rem;
		font-family: var(--font-body);
		font-weight: 650;
		color: var(--color-text);
	}

	.error-body {
		margin: 0.25rem 0 0;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
</style>
