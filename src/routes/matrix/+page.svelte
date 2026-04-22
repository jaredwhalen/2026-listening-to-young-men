<script>
	import InlineVisual from '$lib/components/layout/InlineVisual.svelte';
	import TypologyQuadGrid from '$lib/visuals/matrix/TypologyQuadGrid.svelte';
	import { parseTypologyCsv } from '$lib/visuals/matrix/parseTypologyCsv.js';
	import { matrixTypologyCopy } from '$lib/data/matrixTypologyCopy.js';
	import typologyRows from '$lib/data/typology.csv';
	import copy from '$lib/data/copy.json';

	const parsed = parseTypologyCsv(typologyRows);
</script>

<svelte:head>
	<title>Matrix · typology</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual>
		{#snippet title()}{copy.charts.matrix.title || ''}{/snippet}
		{#snippet dek()}{copy.charts.matrix.description || ''}{/snippet}
		{#snippet children()}
			{#if parsed.ok}
				<TypologyQuadGrid
					quadrants={parsed.quadrants}
					columnPcts={parsed.columnPcts}
					rowPcts={parsed.rowPcts}
					copy={matrixTypologyCopy}
				/>
			{:else}
				<p class="err" role="alert">Could not load typology data: {parsed.error}</p>
			{/if}
		{/snippet}
		{#snippet note()}
			{copy.charts.matrix.note || ''}
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
