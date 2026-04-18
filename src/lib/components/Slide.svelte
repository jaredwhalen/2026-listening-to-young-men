<script>
	let { slide, isActive } = $props();

	let lines = $derived(
		slide.text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
	);
</script>

<section class="slide" class:active={isActive}>
	<div class="slide-content">
		{#each lines as line}
			<p class="slide-text">{@html line}</p>
		{/each}
	</div>
</section>

<style>
	.slide {
		height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 0 1rem 0;
	}

	.slide:first-of-type {
		padding-top: 50vh;
	}

	.slide:last-of-type {
		padding-bottom: 50vh;
	}

	.slide-content {
		width: 100%;
		max-width: 36rem;
		padding: 1rem;
		font-family: var(--font-body);
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}

	.slide-text {
		font-size: 1.1rem;
		line-height: 1.55;
		margin: 0 0 0.75rem 0;
		color: var(--color-text);
	}

	.slide-text:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		.slide {
			height: 150vh;
			padding: 0 0.75rem;
		}

		.slide-text {
			font-size: 1rem;
		}
	}
</style>
