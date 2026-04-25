<script>
	import { scaleLinear } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { flip } from 'svelte/animate';
	import { tick } from 'svelte';
	import { tippyTooltip } from '$lib/utils/tippy.js';

	let {
		rows,
		columns,
		traitOrder,
		gapAfter = 5,
		valueSuffix = '%',
		showTraits = true,
		sortColumn: controlledSortColumn,
		sortDir: controlledSortDir,
		onSort,
		showNumbers = false,
		activeHover = null,
		onHoverChange,
		onTraitColWidth
	} = $props();

	let internalSortColumn = $state(null);
	let internalSortDir = $state('desc');

	let sortColumn = $derived(controlledSortColumn ?? internalSortColumn);
	let sortDir = $derived(controlledSortDir ?? internalSortDir);

	let hovered = $state(null);

	/** Shared hover from parent keeps row/column emphasis in sync across both heatmaps. */
	let activeTrait = $derived(activeHover?.trait ?? hovered?.trait ?? null);
	let activeColumn = $derived(activeHover?.column ?? hovered?.column ?? null);
	let hasLocalHover = $derived(hovered != null);

	/** Extra outline on the chart that is *not* under the pointer (both charts still get row/column borders). */
	function isPeerSyncedCell(trait, column) {
		return (
			!hasLocalHover &&
			activeTrait != null &&
			activeColumn != null &&
			trait === activeTrait &&
			column === activeColumn
		);
	}

	let heatmapEl = $state(null);
	let headersEl = $state(null);
	let colHeaderH = $state(null);
	let traitColW = $state(null);
	let measureRaf = null;
	let traitRaf = null;


	const colorRamp = scaleLinear()
		.domain([0, 1])
		.range(['#ffffff', '#16a34a'])
		.clamp(true)
		.interpolate(interpolateRgb);

	let maxValue = $derived.by(() => {
		let m = 0;
		for (const r of rows) {
			for (const c of columns) {
				const v = r.values?.[c];
				if (typeof v === 'number' && Number.isFinite(v)) m = Math.max(m, v);
			}
		}
		return m;
	});

	let fill = $derived.by(() => {
		const scale = scaleLinear().domain([0, Math.max(0.01, maxValue)]).range([0, 1]).clamp(true);
		return (v) => colorRamp(scale(v));
	});

	let tone = $derived.by(() => {
		const scale = scaleLinear().domain([0, Math.max(0.01, maxValue)]).range([0, 1]).clamp(true);
		return (v) => scale(v);
	});

	let orderedTraits = $derived.by(() => {
		if (traitOrder?.length) return traitOrder;
		return Array.from(new Set(rows.map((r) => r.trait)));
	});

	let byTrait = $derived.by(() => {
		const m = new Map();
		for (const r of rows) m.set(r.trait, r);
		return m;
	});

	function tooltipRowsFor(trait) {
		const row = byTrait.get(trait);
		return [...columns]
			.map((c) => ({ c, v: row?.values?.[c] ?? null }))
			.sort((a, b) => {
				const na = typeof a.v === 'number' && Number.isFinite(a.v) ? a.v : -Infinity;
				const nb = typeof b.v === 'number' && Number.isFinite(b.v) ? b.v : -Infinity;
				if (nb !== na) return nb - na;
				return a.c.localeCompare(b.c);
			});
	}

	const percentFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

	function formatPercent(v) {
		if (v == null || !Number.isFinite(v)) return '—';
		return `${percentFmt.format(v * 100)}${valueSuffix}`;
	}

	function cellBg(v) {
		return v == null ? '#ffffff' : fill(v);
	}

	function pillTextColor(v) {
		if (v == null) return 'var(--color-text)';
		return tone(v) >= 0.6 ? '#ffffff' : 'var(--color-text)';
	}

	$effect(() => {
		// Set a default only in uncontrolled mode
		if (controlledSortColumn != null) return;
		if (!internalSortColumn || !columns.includes(internalSortColumn)) {
			internalSortColumn = columns.includes('All Americans') ? 'All Americans' : columns[0] ?? null;
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
		wrap.className = 'waffle-tooltip';

		const title = document.createElement('div');
		title.className = 'waffle-tooltip-title';
		title.textContent = trait;

		const list = document.createElement('ul');
		list.className = 'waffle-tooltip-list';

		for (const { c, v } of tooltipRowsFor(trait)) {
			const li = document.createElement('li');
			li.className = 'waffle-tooltip-item';
			if (c === column) li.dataset.current = 'true';

			const demo = document.createElement('span');
			demo.className = 'waffle-tooltip-demo';
			demo.textContent = c;

			const pill = document.createElement('span');
			pill.className = 'waffle-tooltip-pill';
			pill.textContent = formatPercent(v);
			pill.style.backgroundColor = cellBg(v);
			pill.style.color = pillTextColor(v);

			li.append(demo, pill);
			list.append(li);
		}

		wrap.append(title, list);
		return wrap;
	}

	function measureHeaderHeight() {
		if (!headersEl) return;
		const labels = headersEl.querySelectorAll('.col-header-text');
		if (!labels.length) return;

		let max = 0;
		for (const el of labels) {
			const rect = el.getBoundingClientRect();
			max = Math.max(max, rect.height);
		}

		// Add a little breathing room for focus rings and small font changes.
		// If we measured before layout settled (0), keep previous value.
		if (max <= 0) return;
		const next = Math.ceil(max + 8);
		if (colHeaderH !== next) colHeaderH = next;
	}

	function scheduleMeasure() {
		if (measureRaf != null) cancelAnimationFrame(measureRaf);
		measureRaf = requestAnimationFrame(() => {
			measureRaf = requestAnimationFrame(() => {
				measureRaf = null;
				measureHeaderHeight();
			});
		});
	}

	function measureTraitWidth() {
		if (!heatmapEl) return;
		const els = heatmapEl.querySelectorAll('.trait');
		if (!els.length) return;
		let max = 0;
		for (const el of els) {
			// scrollWidth is resilient to subpixel rounding and ignores transforms
			max = Math.max(max, el.scrollWidth);
		}
		if (max <= 0) return;
		const next = Math.ceil(max); // breathing room for text + focus rings
		if (traitColW !== next) traitColW = next;
		if (typeof onTraitColWidth === 'function') onTraitColWidth(next);
	}

	function scheduleTraitMeasure() {
		if (traitRaf != null) cancelAnimationFrame(traitRaf);
		traitRaf = requestAnimationFrame(() => {
			traitRaf = null;
			measureTraitWidth();
		});
	}

	$effect(() => {
		if (!headersEl) return;
		// Re-measure on column changes / reflow. Use tick + double-rAF to ensure
		// the rotated text has a settled layout box before measuring.
		columns;
		gapAfter;

		(async () => {
			await tick();
			scheduleMeasure();
		})();

		return () => {
			if (measureRaf != null) cancelAnimationFrame(measureRaf);
		};
	});

	$effect(() => {
		if (!heatmapEl) return;
		// Re-measure when the trait set changes (sorting, filtering, etc.)
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

		const ro = new ResizeObserver(() => {
			scheduleMeasure();
			scheduleTraitMeasure();
		});
		// Observe the root width changes; do NOT observe headersEl, since we
		// mutate header height via `--col-header-h` (can cause feedback loops).
		ro.observe(heatmapEl);

		return () => ro.disconnect();
	});
</script>

<div
	class="heatmap"
	role="application"
	bind:this={heatmapEl}
	style:--col-header-h={colHeaderH ? `${colHeaderH}px` : undefined}
	style:--trait-col-effective={traitColW ? `${traitColW}px` : undefined}
>
	<div
		class="col-headers"
		bind:this={headersEl}
		style:grid-template-columns={`${showTraits ? 'var(--trait-col-effective)' : '0px'} ${columns
			.map((_, i) =>
				i === gapAfter ? 'var(--gap-col) minmax(0, 1fr)' : 'minmax(0, 1fr)'
			)
			.join(' ')}`}
	>
		<div class="corner" aria-hidden="true"></div>
		{#each columns as c, i (c)}
			{#if i === gapAfter}
				<div class="gap" aria-hidden="true"></div>
			{/if}
			<button
				type="button"
				class="col-header"
				aria-label={`Sort by ${c}${sortColumn === c ? ` (${sortDir})` : ''}`}
				aria-pressed={sortColumn === c}
				data-active={activeColumn === c}
				onclick={() => toggleSort(c)}
			>
				<span class="col-header-text">{c}</span>
			</button>
		{/each}
	</div>

	<div class="rows">
		{#each sortedTraits as trait (trait)}
			{@const row = byTrait.get(trait)}
			<div
				class="row"
				animate:flip={{ duration: 250 }}
				data-active={activeTrait === trait ? 'true' : 'false'}
				style:grid-template-columns={`${showTraits ? 'var(--trait-col-effective)' : '0px'} ${columns
					.map((_, i) =>
						i === gapAfter ? 'var(--gap-col) minmax(0, 1fr)' : 'minmax(0, 1fr)'
					)
					.join(' ')}`}
			>
				{#if showTraits}
					<div class="trait waffle-trait chart-label-sans">{trait}</div>
				{:else}
					<div class="trait waffle-trait waffle-trait--spacer chart-label-sans" aria-hidden="true"></div>
				{/if}
				{#each columns as c, i (c)}
					{#if i === gapAfter}
						<div class="gap" aria-hidden="true"></div>
					{/if}
					{@const v = row?.values?.[c] ?? null}
					<button
						type="button"
						class="cell"
						aria-label={`${trait} · ${c}: ${formatPercent(v)}`}
						use:tippyTooltip={{
							getContent: () => tooltipContent(trait, c),
							accentColor: '#000000',
							options: {
								followCursor: true,
								touch: ['hold', 400]
							}
						}}
						style:background-color={cellBg(v)}
						data-active-row={activeTrait === trait}
						data-active-col={activeColumn === c}
						data-peer-sync={isPeerSyncedCell(trait, c)}
						onmouseenter={(e) => onEnter(e, trait, c)}
						onfocus={(e) => onEnter(e, trait, c)}
						onmouseleave={onLeave}
						onblur={onLeave}
					>
						{#if showNumbers && v != null}
							<span class="cell-number">{formatPercent(v)}</span>
						{/if}
					</button>
				{/each}
			</div>
		{/each}
	</div>

</div>

<style>
	@import './waffle-visual-shared.css';

	.heatmap {
		/* Default trait column width; can be overridden by inline `--trait-col-effective` */
		--trait-col-effective: var(--trait-col, clamp(8rem, 18vw, 13rem));
		--cell-h: var(--chart-cell-h, 2rem);
		--gap-col: var(--chart-gap-col, 0.9rem);
		/* Rotated column labels extend past the last column; reserve space so they aren’t clipped */
		--heatmap-pad-inline-end: clamp(1.25rem, 2rem, 3.25rem);
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
		color: var(--chart-muted, var(--color-text-muted));
		height: var(--col-header-h, 7.1rem);
		width: 100%;
		min-width: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		overflow: visible;
		position: relative;
	}

	.col-header-text {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-xs, 11px);
		line-height: 1.1;
		white-space: nowrap;
		position: absolute;
		left: 50%;
		bottom: 0;
		/* Anchor the *start* of the label at the column center, then rotate */
		transform: rotate(-45deg);
		transform-origin: 0% 100%;
		text-align: left;
	}

	.col-header[aria-pressed='true'] .col-header-text {
		color: var(--chart-text, var(--color-text));
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.col-header[data-active='true'] .col-header-text {
		color: var(--chart-text, var(--color-text));
		font-weight: var(--chart-weight-semibold, 650);
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

	/* Ensure active row label bolding always applies (avoid @import scoping surprises) */
	.row[data-active='true'] .waffle-trait {
		font-weight: var(--chart-weight-semibold, 650);
	}

	.gap {
		width: var(--gap-col);
	}

	.cell {
		position: relative;
		width: 100%;
		min-width: 0;
		height: var(--cell-h);
		border: 1px solid color-mix(in srgb, var(--chart-border, var(--color-border)) 80%, transparent);
		border-radius: var(--chart-cell-radius, 0.15rem);
		padding: 0;
		display: inline-block;
		cursor: default;
		transition:
			border-color 80ms ease-out,
			border-width 80ms ease-out;
	}

	.cell[data-active-row='true'],
	.cell[data-active-col='true'] {
		border-color: var(--color-gray-500);
	}

	.cell[data-peer-sync='true'] {
		outline: 2px solid var(--color-gray-600);
		outline-offset: -1px;
	}

	.cell:hover {
		border-color: var(--color-gray-900);
		border-width: 2px;
	}

	.cell-number {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-xs, 11px);
		line-height: 1;
		color: color-mix(in srgb, var(--chart-text, var(--color-text)) 75%, transparent);
		mix-blend-mode: multiply;
		user-select: none;
		pointer-events: none;
	}

	.cell:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	:global(.waffle-tooltip) {
		width: 18rem;
		pointer-events: none;
	}

	:global(.waffle-tooltip-title) {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-md, 14.5px);
		font-weight: var(--chart-weight-semibold, 650);
		line-height: 1.2;
		color: var(--chart-text, var(--color-text));
		margin-bottom: 0.45rem;
	}

	:global(.waffle-tooltip-list) {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.25rem;
	}

	:global(.waffle-tooltip-item) {
		display: flex;
		gap: 0.75rem;
		justify-content: space-between;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 12.5px);
		color: var(--chart-muted, var(--color-text-muted));
	}

	:global(.waffle-tooltip-item[data-current='true']) {
		font-weight: var(--chart-weight-semibold, 650);
		color: var(--chart-text, var(--color-text));
	}

	:global(.waffle-tooltip-item[data-current='true'] .waffle-tooltip-pill) {
		font-weight: 650;
	}

	:global(.waffle-tooltip-demo) {
		max-width: 12rem;
	}

	:global(.waffle-tooltip-pill) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 3.25rem;
		padding: 0.15rem 0.4rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--chart-border, var(--color-border)) 70%, transparent);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 12.5px);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
</style>

