<script>
	/**
	 * Horizontal stacked bar (spark width). Segments sized by numeric weight (e.g. shares summing to 100).
	 * @type {{
	 *   values: number[],
	 *   labels: string[],
	 *   colors: string[],
	 *   height?: string,
	 *   showInnerPct?: boolean,
	 *   labelMinPct?: number
	 * }}
	 */
	let {
		values = [],
		labels = [],
		colors = [],
		height = '1.3rem',
		showInnerPct = true,
		labelMinPct = 8
	} = $props();

	const numeric = $derived(values.map((v) => Math.max(0, Number(v) || 0)));
	const total = $derived(numeric.reduce((a, b) => a + b, 0));
	const weights = $derived(numeric.map((v) => (total > 0 ? Math.max(v, 1e-6) : 0)));
	const gridColumns = $derived(
		total > 0 ? weights.map((w) => `minmax(0,${w}fr)`).join(' ') : '1fr'
	);
	const ariaLabel = $derived(
		labels.length && numeric.length
			? labels.map((lab, i) => `${lab} ${numeric[i] ?? 0}%`).join(', ')
			: 'Distribution'
	);
	const segments = $derived(
		numeric.map((v, i) => ({
			color: colors[i] ?? 'var(--color-gray-400)',
			label: labels[i] ?? '',
			raw: v,
			showPct: showInnerPct && total > 0 && v >= labelMinPct
		}))
	);
	const nSegs = $derived(segments.length);
</script>

<div
	class="stacked-bar-spark"
	role="img"
	aria-label={ariaLabel}
	style:height
	style:grid-template-columns={gridColumns}
>
	{#if total > 0}
		{#each segments as seg, i (i)}
			<span
				class="seg"
				class:seg--first={i === 0}
				class:seg--last={i === nSegs - 1}
				class:seg--solo={nSegs === 1}
				style:background-color={seg.color}
				title="{seg.label}: {seg.raw}%"
			>
				{#if seg.showPct}
					<span class="seg-pct">{seg.raw}%</span>
				{/if}
			</span>
		{/each}
	{:else}
		<span class="seg seg--empty seg--first seg--last seg--solo"></span>
	{/if}
</div>

<style>
	.stacked-bar-spark {
		--bar-radius: 3px;

		display: grid;
		width: 100%;
		min-width: 0;
		border-radius: var(--bar-radius);
		overflow: hidden;
		box-shadow: inset 0 0 0 1px var(--color-border);
	}

	.seg {
		container-type: inline-size;
		container-name: bar-seg;

		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100%;
		min-width: 0;
		box-sizing: border-box;
	}

	.seg--first:not(.seg--solo) {
		border-radius: var(--bar-radius) 0 0 var(--bar-radius);
	}

	.seg--last:not(.seg--solo) {
		border-radius: 0 var(--bar-radius) var(--bar-radius) 0;
	}

	.seg--solo {
		border-radius: var(--bar-radius);
	}

	.seg-pct {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-xs, 11px);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: var(--color-white);
		
		padding: 0 0.12rem;
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		pointer-events: none;
	}

	/* Hide in-bar % when the slice is too narrow (no ellipsis — clip or omit). */
	@container bar-seg (max-width: 2.65rem) {
		.seg-pct {
			display: none;
		}
	}

	.seg--empty {
		background: var(--color-gray-200);
	}
</style>
