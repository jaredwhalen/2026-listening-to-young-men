<script>
	import InlineVisual from '$lib/components/layout/InlineVisual.svelte';
	import TypologyQuadGrid from '$lib/visuals/typology/TypologyQuadGrid.svelte';
	import { parseTypologyCsv } from '$lib/visuals/typology/parseTypologyCsv.js';
	import { typologyCopy } from '$lib/data/typologyCopy.js';
	import typologyRows from '$lib/data/typology.csv';
	import copy from '$lib/data/copy.json';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	const parsed = parseTypologyCsv(typologyRows);

	/**
	 * Static export view: hide “More info” and show brand mark on each quadrant.
	 * Query param is read in the browser only (not available during prerender).
	 */
	const staticView = $derived(
		browser ? $page.url.searchParams.has('static') : false,
	);
</script>

<svelte:head>
	<title>Typology</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual>
		{#snippet title()}{copy.charts.typology.title || ''}{/snippet}
		{#snippet dek()}{copy.charts.typology.description || ''}{/snippet}
		{#snippet children()}
			{#if parsed.ok}
				<TypologyQuadGrid
					quadrants={parsed.quadrants.slice(0, 4)}
					columnPcts={parsed.columnPcts}
					rowPcts={parsed.rowPcts}
					copy={typologyCopy}
					staticView={staticView}
				/>
			{:else}
				<p class="err" role="alert">Could not load typology data: {parsed.error}</p>
			{/if}
		{/snippet}
		{#snippet note()}
			{copy.charts.typology.note || ''}
		{/snippet}
	</InlineVisual>
</div>

<style lang="scss">
	.page-inner {
		width: 100%;
		padding-block: 1.5rem 2rem;
	}

	.err {
		margin: 0;
		font-family: var(--font-body);
		color: var(--color-danger);
	}
</style>
