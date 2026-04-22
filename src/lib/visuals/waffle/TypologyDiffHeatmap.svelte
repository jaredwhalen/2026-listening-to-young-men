<script>
	import { scaleLinear } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { flip } from 'svelte/animate';
	import { tick } from 'svelte';
	import { tippyTooltip } from '$lib/utils/tippy.js';
	import { TYPOLOGY_COMPARE_COLUMNS } from '$lib/visuals/waffle/buildTypologyCompareRows.js';

	const THEY = TYPOLOGY_COMPARE_COLUMNS[0];
	const SOC = TYPOLOGY_COMPARE_COLUMNS[1];
	const DIF = TYPOLOGY_COMPARE_COLUMNS[2];

	let {
		rows,
		sortColumn: controlledSortColumn,
		sortDir: controlledSortDir,
		onSort,
		showNumbers = false,
		activeHover = null,
		onHoverChange,
		onTraitColWidth
	} = $props();

	const compareColumns = TYPOLOGY_COMPARE_COLUMNS;

	let internalSortColumn = $state(null);
	let internalSortDir = $state('desc');

	let sortColumn = $derived(controlledSortColumn ?? internalSortColumn);
	let sortDir = $derived(controlledSortDir ?? internalSortDir);

	let hovered = $state(null);

	/** Local hover wins so the pointer cell stays primary before parent state echoes back. */
	let activeTrait = $derived(hovered?.trait ?? activeHover?.trait ?? null);
	let activeColumn = $derived(hovered?.column ?? activeHover?.column ?? null);

	function isPeerSyncedCell(trait, column) {
		return activeTrait != null && activeColumn != null && trait === activeTrait && column === activeColumn;
	}

	let heatmapEl = $state(null);
	let traitColW = $state(null);
	let traitRaf = null;

	const colorMain = scaleLinear()
		.domain([0, 1])
		.range(['#ffffff', '#16a34a'])
		.clamp(true)
		.interpolate(interpolateRgb);

	let maxMain = $derived.by(() => {
		let m = 0;
		for (const r of rows) {
			for (const c of [THEY, SOC]) {
				const v = r.values?.[c];
				if (typeof v === 'number' && Number.isFinite(v)) m = Math.max(m, v);
			}
		}
		return m;
	});

	let maxAbsDiff = $derived.by(() => {
		let m = 0;
		for (const r of rows) {
			const v = r.values?.[DIF];
			if (typeof v === 'number' && Number.isFinite(v)) m = Math.max(m, Math.abs(v));
		}
		return m;
	});

	/** Symmetric ± domain so mid tones aren’t washed out (typical gap spread about ±28–40 pp). */
	const DIFF_SCALE_FLOOR = 0.4;

	let fillMain = $derived.by(() => {
		const scale = scaleLinear().domain([0, Math.max(0.01, maxMain)]).range([0, 1]).clamp(true);
		return (v) => colorMain(scale(v));
	});

	let toneMain = $derived.by(() => {
		const scale = scaleLinear().domain([0, Math.max(0.01, maxMain)]).range([0, 1]).clamp(true);
		return (v) => scale(v);
	});

	let diffScale = $derived.by(() => {
		const d = Math.max(DIFF_SCALE_FLOOR, maxAbsDiff, 1e-6);
		return scaleLinear().domain([-d, d]).range([0, 1]).clamp(true);
	});

	function diffFill(v) {
		if (v == null || !Number.isFinite(v)) return '#ffffff';
		const t = diffScale(v);
		if (t <= 0.5) return interpolateRgb('#f87171', '#ffffff')(t / 0.5);
		return interpolateRgb('#ffffff', '#15803d')((t - 0.5) / 0.5);
	}

	function diffTone(v) {
		if (v == null || !Number.isFinite(v)) return 0;
		return diffScale(v);
	}

	let orderedTraits = $derived.by(() => Array.from(new Set(rows.map((r) => r.trait))));

	let byTrait = $derived.by(() => {
		const m = new Map();
		for (const r of rows) m.set(r.trait, r);
		return m;
	});

	const percentFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
	const diffFmt = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
		signDisplay: 'exceptZero'
	});

	function formatPercent(v) {
		if (v == null || !Number.isFinite(v)) return '—';
		return `${percentFmt.format(v * 100)}%`;
	}

	function formatDiff(v) {
		if (v == null || !Number.isFinite(v)) return '—';
		return `${diffFmt.format(v * 100)} pp`;
	}

	/** Signed gap in percentage points (grid + tooltips). */
	function formatGapDisplay(v) {
		if (v == null || !Number.isFinite(v)) return '—';
		return `${diffFmt.format(v * 100)} pp`;
	}

	function formatCell(col, v) {
		if (col === DIF) return formatDiff(v);
		return formatPercent(v);
	}

	function columnHeaderLabel(col) {
		if (col === THEY) return 'What they value';
		if (col === SOC) return 'What they believe society values';
		if (col === DIF) return 'Gap';
		return col;
	}

	function cellBg(col, v) {
		if (v == null || !Number.isFinite(v)) return '#ffffff';
		if (col === DIF) return diffFill(v);
		return fillMain(v);
	}

	function pillTextColor(col, v) {
		if (v == null || !Number.isFinite(v)) return 'var(--color-text)';
		if (col === DIF) {
			const t = diffTone(v);
			if (t <= 0.44) return '#7f1d1d';
			if (t >= 0.78) return '#ffffff';
			return 'var(--color-text)';
		}
		return toneMain(v) >= 0.6 ? '#ffffff' : 'var(--color-text)';
	}

	function gapTextColor(v) {
		if (v == null || !Number.isFinite(v)) return 'var(--color-text-muted)';
		if (v > 0) return '#15803d';
		if (v < 0) return '#b91c1c';
		return 'var(--color-text-muted)';
	}

	const gridDataCols = `minmax(0, 1fr) minmax(0, 1fr) minmax(3.25rem, max-content)`;

	$effect(() => {
		if (controlledSortColumn != null) return;
		if (!internalSortColumn || !compareColumns.includes(internalSortColumn)) {
			internalSortColumn = DIF;
		}
	});

	let sortedTraits = $derived.by(() => {
		if (!sortColumn) return orderedTraits;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...orderedTraits].sort((a, b) => {
			const ra = byTrait.get(a);
			const rb = byTrait.get(b);
			const va = ra?.values?.[sortColumn];
			const vb = rb?.values?.[sortColumn];
			const na = typeof va === 'number' && Number.isFinite(va) ? va : -Infinity;
			const nb = typeof vb === 'number' && Number.isFinite(vb) ? vb : -Infinity;
			if (na === nb) return a.localeCompare(b);
			return (na - nb) * dir;
		});
	});

	function toggleSort(c) {
		const next =
			sortColumn === c
				? { column: c, dir: sortDir === 'desc' ? 'asc' : 'desc' }
				: { column: c, dir: 'desc' };

		if (onSort) {
			onSort(next);
			return;
		}

		internalSortColumn = next.column;
		internalSortDir = next.dir;
	}

	function onEnter(_event, trait, column) {
		hovered = { trait, column };
		onHoverChange?.({ trait, column });
	}

	function onLeave() {
		hovered = null;
		onHoverChange?.(null);
	}

	function tooltipContent(trait, column) {
		const wrap = document.createElement('div');
		wrap.className = 'waffle-tooltip waffle-tooltip--typology';

		const title = document.createElement('div');
		title.className = 'waffle-tooltip-title';
		title.textContent = trait;

		const list = document.createElement('ul');
		list.className = 'waffle-tooltip-list';

		const row = byTrait.get(trait);
		for (const c of TYPOLOGY_COMPARE_COLUMNS) {
			const v = row?.values?.[c] ?? null;
			const li = document.createElement('li');
			li.className = 'waffle-tooltip-item';
			if (c === DIF) li.classList.add('waffle-tooltip-item--gap');
			if (c === column) li.dataset.current = 'true';

			const demo = document.createElement('span');
			demo.className = 'waffle-tooltip-demo';
			demo.textContent = columnHeaderLabel(c);

			const pill = document.createElement('span');
			pill.className = 'waffle-tooltip-pill';
			pill.textContent = formatCell(c, v);
			pill.style.backgroundColor = cellBg(c, v);
			pill.style.color = pillTextColor(c, v);

			li.append(demo, pill);
			list.append(li);
		}

		wrap.append(title, list);
		return wrap;
	}

	function measureTraitWidth() {
		if (!heatmapEl) return;
		const els = heatmapEl.querySelectorAll('.trait');
		if (!els.length) return;
		let max = 0;
		for (const el of els) max = Math.max(max, el.scrollWidth);
		if (max <= 0) return;
		const next = Math.ceil(max);
		if (traitColW !== next) traitColW = next;
		onTraitColWidth?.(next);
	}

	function scheduleTraitMeasure() {
		if (traitRaf != null) cancelAnimationFrame(traitRaf);
		traitRaf = requestAnimationFrame(() => {
			traitRaf = null;
			measureTraitWidth();
		});
	}

	$effect(() => {
		if (!heatmapEl) return;
		orderedTraits;
		(async () => {
			await tick();
			scheduleTraitMeasure();
		})();
		return () => {
			if (traitRaf != null) cancelAnimationFrame(traitRaf);
		};
	});

	$effect(() => {
		if (!heatmapEl) return;
		if (typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => scheduleTraitMeasure());
		ro.observe(heatmapEl);
		return () => ro.disconnect();
	});
</script>

<div
	class="typologies-heatmap"
	role="application"
	bind:this={heatmapEl}
	style:--trait-col-effective={traitColW ? `${traitColW}px` : undefined}
>
	<div
		class="col-headers"
		style:grid-template-columns={`var(--trait-col-effective) ${gridDataCols}`}
	>
		<div class="corner" aria-hidden="true"></div>
		{#each compareColumns as c (c)}
			<button
				type="button"
				class="col-header"
				class:col-header--gap={c === DIF}
				aria-label={`Sort by ${columnHeaderLabel(c)}${sortColumn === c ? ` (${sortDir})` : ''}`}
				aria-pressed={sortColumn === c}
				onclick={() => toggleSort(c)}
			>
				<span class="col-header-text">{columnHeaderLabel(c)}</span>
			</button>
		{/each}
	</div>

	<div class="rows">
		{#each sortedTraits as trait (trait)}
			{@const row = byTrait.get(trait)}
			<div
				class="row"
				animate:flip={{ duration: 250 }}
				data-active={activeTrait === trait}
				style:grid-template-columns={`var(--trait-col-effective) ${gridDataCols}`}
			>
				<div class="trait waffle-trait">{trait}</div>
				{#each compareColumns as c (c)}
					{@const v = row?.values?.[c] ?? null}
					{#if c === DIF}
						<button
							type="button"
							class="gap"
							data-peer-sync={isPeerSyncedCell(trait, c)}
							aria-label={`${trait} · ${columnHeaderLabel(c)}: ${formatGapDisplay(v)}`}
							use:tippyTooltip={{
								getContent: () => tooltipContent(trait, c),
								options: {
									theme: 'light-border waffle',
									followCursor: true,
									touch: ['hold', 400]
								}
							}}
							onmouseenter={(e) => onEnter(e, trait, c)}
							onfocus={(e) => onEnter(e, trait, c)}
							onmouseleave={onLeave}
							onblur={onLeave}
						>
							<span class="gap-value" style:color={gapTextColor(v)}>{formatGapDisplay(v)}</span>
						</button>
					{:else}
						<button
							type="button"
							class="cell"
							data-peer-sync={isPeerSyncedCell(trait, c)}
							aria-label={`${trait} · ${columnHeaderLabel(c)}: ${formatPercent(v)}`}
							use:tippyTooltip={{
								getContent: () => tooltipContent(trait, c),
								options: {
									theme: 'light-border waffle',
									followCursor: true,
									touch: ['hold', 400]
								}
							}}
							style:background-color={cellBg(c, v)}
							onmouseenter={(e) => onEnter(e, trait, c)}
							onfocus={(e) => onEnter(e, trait, c)}
							onmouseleave={onLeave}
							onblur={onLeave}
						>
							{#if showNumbers && v != null}
								<span class="cell-number">{formatPercent(v)}</span>
							{/if}
						</button>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	@import './waffle-visual-shared.css';

	.typologies-heatmap {
		--trait-col-effective: var(--trait-col, clamp(8rem, 18vw, 13rem));
		--cell-h: 2rem;
		--heatmap-pad-inline-end: clamp(0.75rem, 2vw, 1.5rem);
		width: 100%;
		box-sizing: border-box;
		padding-inline-end: var(--heatmap-pad-inline-end);
		position: relative;
	}

	.col-headers {
		display: grid;
		align-items: end;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.corner {
		height: 1px;
	}

	.col-header {
		appearance: none;
		border: 0;
		background: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		color: var(--color-text-muted);
		width: 100%;
		min-width: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.col-header-text {
		font-family: var(--font-body);
		font-size: 0.72rem;
		line-height: 1.15;
		text-align: center;
		white-space: normal;
		max-width: 100%;
	}

	.col-header--gap .col-header-text {
		font-size: 0.68rem;
		line-height: 1.1;
	}

	.col-header[aria-pressed='true'] .col-header-text {
		color: var(--color-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.col-header:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.rows {
		display: grid;
		gap: 0.35rem;
	}

	.row {
		display: grid;
		align-items: center;
		gap: 0.25rem;
	}

	.cell {
		position: relative;
		width: 100%;
		min-width: 0;
		height: var(--cell-h);
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
		border-radius: 0.15rem;
		padding: 0;
		display: inline-block;
		cursor: default;
		transition:
			border-color 80ms ease-out,
			border-width 80ms ease-out;
	}

	.cell:hover {
		border-color: var(--color-gray-900);
		border-width: 2px;
	}

	.cell[data-peer-sync='true'] {
		outline: 2px solid var(--color-gray-600);
		outline-offset: -1px;
	}

	.cell-number {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-body);
		font-size: 0.62rem;
		line-height: 1.1;
		color: color-mix(in srgb, var(--color-text) 75%, transparent);
		mix-blend-mode: multiply;
		user-select: none;
		pointer-events: none;
		padding-inline: 0.1rem;
		text-align: center;
	}

	.cell:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.gap {
		appearance: none;
		border: 0;
		background: transparent;
		margin: 0;
		padding: 0 0.15rem;
		width: 100%;
		min-width: 0;
		min-height: var(--cell-h);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
		border-radius: 0.15rem;
		transition: background-color 80ms ease-out;
	}

	.gap:hover {
		background: color-mix(in srgb, var(--color-border) 22%, transparent);
	}

	.gap[data-peer-sync='true'] {
		outline: 2px solid var(--color-gray-600);
		outline-offset: 2px;
	}

	.gap:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.gap-value {
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
		letter-spacing: -0.02em;
		user-select: none;
		pointer-events: none;
	}

	:global(.tippy-box[data-theme~='waffle']) {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
	}

	:global(.tippy-box[data-theme~='waffle'] .tippy-content) {
		padding: 0.6rem 0.65rem;
	}

	:global(.tippy-box[data-theme~='waffle'] > .tippy-arrow::before) {
		color: var(--color-surface);
	}

	:global(.tippy-box[data-theme~='waffle'] > .tippy-arrow) {
		color: var(--color-surface);
	}

	:global(.waffle-tooltip) {
		width: 16rem;
		pointer-events: none;
	}

	:global(.waffle-tooltip--typology) {
		width: 14rem;
	}

	:global(.waffle-tooltip-title) {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 650;
		line-height: 1.2;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	:global(.waffle-tooltip--typology .waffle-tooltip-title) {
		font-size: 0.8rem;
		margin-bottom: 0.32rem;
		line-height: 1.15;
	}

	:global(.waffle-tooltip-list) {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.25rem;
	}

	:global(.waffle-tooltip--typology .waffle-tooltip-list) {
		gap: 0.18rem;
	}

	:global(.waffle-tooltip-item) {
		display: flex;
		gap: 0.75rem;
		justify-content: space-between;
		align-items: center;
		font-family: var(--font-body);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	:global(.waffle-tooltip--typology .waffle-tooltip-item) {
		font-size: 0.72rem;
		gap: 0.5rem;
		min-height: 1.35rem;
	}

	:global(.waffle-tooltip-item--gap) {
		margin-top: 0.4rem;
		padding-top: 0.35rem;
		border-top: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
	}

	:global(.waffle-tooltip-item[data-current='true']) {
		font-weight: 650;
		color: var(--color-text);
	}

	:global(.waffle-tooltip-item[data-current='true'] .waffle-tooltip-pill) {
		font-weight: 650;
	}

	:global(.waffle-tooltip-demo) {
		max-width: 10rem;
	}

	:global(.waffle-tooltip--typology .waffle-tooltip-demo) {
		max-width: 8.5rem;
		font-size: 0.72rem;
		line-height: 1.15;
	}

	:global(.waffle-tooltip-pill) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 3.25rem;
		padding: 0.15rem 0.4rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
		font-family: var(--font-body);
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	:global(.waffle-tooltip--typology .waffle-tooltip-pill) {
		flex-shrink: 0;
		box-sizing: border-box;
		min-width: 3.1rem;
		min-height: 1.35rem;
		height: 1.35rem;
		padding: 0 0.42rem;
		font-size: 0.72rem;
		line-height: 1;
	}

	@media (max-width: 640px) {
		.typologies-heatmap {
			--cell-h: 1.35rem;
		}

		.gap-value {
			font-size: 0.65rem;
		}
	}
</style>
