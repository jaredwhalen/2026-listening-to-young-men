<script>
	/**
	 * @type {{
	 *   options: string[],
	 *   selected: string[],
	 *   onToggle: (trait: string) => void,
	 *   ariaLabel?: string,
	 * }}
	 */
	let { options, selected, onToggle, ariaLabel = "Choices" } = $props();

	function rankOf(t) {
		const i = selected.indexOf(t);
		return i >= 0 ? i + 1 : 0;
	}
</script>

<div class="quiz-chip-grid" role="group" aria-label={ariaLabel}>
	{#each options as trait}
		<button
			type="button"
			class="quiz-chip"
			data-selected={selected.includes(trait)}
			aria-pressed={selected.includes(trait)}
			onclick={() => onToggle(trait)}
		>
			{#if selected.includes(trait)}
				<span class="quiz-chip-rank">{rankOf(trait)}</span>
			{/if}
			<span class="quiz-chip-label">{trait}</span>
		</button>
	{/each}
</div>

<style lang="scss">
	.quiz-chip-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-bottom: 1rem;
		justify-content: center;
		max-width: 42rem;
	}

	.quiz-chip {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0;
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 13px;
		color: var(--color-text);
		cursor: pointer;
		text-align: center;
	}

	.quiz-chip[data-selected="true"] {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 35%, transparent);
	}

	.quiz-chip:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.quiz-chip-rank {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		background: var(--color-primary);
		color: var(--color-surface);
		font-size: 11px;
		font-weight: 700;
	}
</style>
