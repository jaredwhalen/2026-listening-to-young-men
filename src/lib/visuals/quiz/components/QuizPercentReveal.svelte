<script>
	/**
	 * @type {{
	 *   hook: string,
	 *   guessRounded: number,
	 *   surveyPct: number,
	 *   populationLabel: string,
	 * }}
	 */
	let { hook, guessRounded, surveyPct, populationLabel } = $props();
</script>

<div class="quiz-reveal" role="status">
	<p class="quiz-reveal-hook">{hook}</p>
	<p class="quiz-reveal-lead">
		You guessed <strong>{guessRounded}%</strong>. In our survey,
		<strong>{surveyPct}%</strong> of <strong>{populationLabel}</strong> said
		they agree with the statement.
	</p>
</div>

<style lang="scss">
	.quiz-reveal {
		padding: 0.85rem 1rem;
		border-radius: 0.65rem;
		border: 1px solid
			color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(
			in srgb,
			var(--color-primary) 8%,
			var(--color-surface)
		);
		max-width: 36rem;
		width: 100%;
		box-sizing: border-box;
		text-align: center;
	}

	.quiz-reveal-hook {
		margin: 0 0 0.5rem;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 1.2rem;
		font-weight: 650;
		line-height: 1.3;
		color: var(--color-primary);
	}

	.quiz-reveal-lead {
		margin: 0;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		line-height: 1.5;
		color: var(--color-text);
	}
</style>
