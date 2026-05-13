<script>
	/**
	 * @type {{
	 *   leftTitle: string,
	 *   rightTitle: string,
	 *   leftLines: string[],
	 *   rightLines: string[],
	 *   ariaLabel?: string,
	 * }}
	 */
	let {
		leftTitle,
		rightTitle,
		leftLines,
		rightLines,
		ariaLabel = "Quiz results comparison",
	} = $props();
</script>

<div class="quiz-dual-results" role="region" aria-label={ariaLabel}>
	<div class="quiz-dual-col">
		<h2 class="quiz-dual-heading">{leftTitle}</h2>
		<ol class="quiz-dual-list">
			{#each leftLines as line}
				<li>{line}</li>
			{/each}
		</ol>
	</div>
	<div class="quiz-dual-col">
		<h2 class="quiz-dual-heading">{rightTitle}</h2>
		<ol class="quiz-dual-list">
			{#each rightLines as line}
				<li>{line}</li>
			{/each}
		</ol>
	</div>
</div>

<style lang="scss">
	.quiz-dual-results {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem 1.25rem;
		margin-bottom: 0.75rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.65rem;
		background: color-mix(in srgb, var(--color-gray-100) 40%, var(--color-surface));
		width: 100%;
		max-width: 40rem;
		text-align: center;
	}

	@media (max-width: 640px) {
		.quiz-dual-results {
			grid-template-columns: 1fr;
		}
	}

	.quiz-dual-heading {
		margin: 0 0 0.4rem;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 15px;
		font-weight: 650;
		color: var(--color-text);
	}

	.quiz-dual-list {
		margin: 0;
		padding-left: 0;
		list-style-position: inside;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		line-height: 1.45;
		color: var(--color-text);
	}
</style>
