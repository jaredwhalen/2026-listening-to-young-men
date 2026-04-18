<script>
	import InlineVisual from '$lib/components/layout/InlineVisual.svelte';
</script>

<svelte:head>
	<title>Matrix · inline</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual>
		{#snippet title()}Typology matrix{/snippet}
		{#snippet dek()}Placeholder route for the typology matrix.{/snippet}
		{#snippet children()}
			<div class="placeholder" role="status">Chart mount point</div>
		{/snippet}
	</InlineVisual>
</div>

<style lang="scss">
	.page-inner {
		width: 100%;
		padding-block: 1.5rem 2rem;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 12rem;
		border: 1px dashed var(--color-border);
		border-radius: 0.5rem;
		font-family: var(--font-body);
		font-size: 0.95rem;
		color: var(--color-text-muted);
		background: var(--color-surface);
	}
</style>
