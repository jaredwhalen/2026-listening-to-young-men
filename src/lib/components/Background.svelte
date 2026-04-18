<script>
	let { slideIndex = 0, slideCount = 0 } = $props();

	let humanIndex = $derived(
		typeof slideIndex === 'number' && slideIndex >= 0 ? slideIndex + 1 : null
	);
	let label = $derived(
		humanIndex != null && slideCount > 0 ? `${humanIndex} of ${slideCount}` : '—'
	);

	$effect(() => {
		if (typeof slideIndex !== 'number' || slideCount <= 0) return;
		console.log(`[Background] ${slideIndex + 1} of ${slideCount}`);
	});
</script>

<div class="background-root">
	<div class="sticky-strip" role="status" aria-live="polite">
		{label}
	</div>
</div>

<style>
	.background-root {
		width: 100%;
		height: 100%;
		min-height: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		background: var(--color-gray-200);
	}

	.sticky-strip {
		position: sticky;
		top: 0;
		z-index: 2;
		margin: 0;
		padding: 0.35rem 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.75rem;
		color: var(--color-gray-800);
		background: var(--color-gray-300);
		border-bottom: 1px solid var(--color-border);
	}
</style>
