<script>
	import InlineVisual from '$lib/components/layout/InlineVisual.svelte';
</script>

<svelte:head>
	<title>Waffle</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual>
		{#snippet title()}Waffle chart{/snippet}
		{#snippet dek()}Placeholder route for the waffle visualization.{/snippet}
		{#snippet children()}
			<div class="placeholder" role="status">Chart mount point</div>
		{/snippet}
		{#snippet note()}Add data notes and links when the graphic is implemented.{/snippet}
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
