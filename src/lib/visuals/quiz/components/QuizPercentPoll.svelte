<script>
	/**
	 * @type {{
	 *   prompt: string,
	 *   sliderId?: string,
	 *   valueLabel?: string,
	 *   guessPct?: number,
	 *   onAdjust?: () => void,
	 * }}
	 */
	let {
		prompt,
		sliderId = "quiz-percent-poll-slider",
		valueLabel = "Your guess",
		guessPct = $bindable(50),
		onAdjust,
	} = $props();

	const rounded = $derived(Math.round(Number(guessPct) || 0));
	const promptId = $derived(`${sliderId}-prompt`);
</script>

<div class="quiz-poll" role="group" aria-labelledby={promptId}>
	<p id={promptId} class="quiz-poll-prompt">{prompt}</p>
	<div class="quiz-poll-row">
		<label class="quiz-poll-label" for={sliderId}>{valueLabel}</label>
		<span class="quiz-poll-value" aria-live="polite">{rounded}%</span>
	</div>
	<input
		id={sliderId}
		class="quiz-poll-range"
		type="range"
		min="0"
		max="100"
		step="1"
		bind:value={guessPct}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={rounded}
		aria-valuetext={`${rounded} percent`}
		oninput={() => onAdjust?.()}
	/>
	<div class="quiz-poll-ticks" aria-hidden="true">
		<span>0%</span>
		<span>100%</span>
	</div>
</div>

<style lang="scss">
	.quiz-poll {
		width: 100%;
		max-width: 28rem;
		margin: 0 0 1rem;
		text-align: center;
	}

	.quiz-poll-prompt {
		margin: 0 0 0.85rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		line-height: 1.45;
		color: var(--color-text);
		text-align: center;
	}

	.quiz-poll-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}

	.quiz-poll-label {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		font-weight: 600;
		color: var(--color-text);
	}

	.quiz-poll-value {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 1.15rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary);
	}

	.quiz-poll-range {
		display: block;
		width: 100%;
		height: 1.5rem;
		margin: 0;
		accent-color: var(--color-primary);
		cursor: pointer;
	}

	.quiz-poll-range:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 3px;
	}

	.quiz-poll-ticks {
		display: flex;
		justify-content: space-between;
		margin-top: 0.2rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 11px;
		color: var(--color-text-muted);
	}
</style>
