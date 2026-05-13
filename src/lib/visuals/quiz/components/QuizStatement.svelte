<script>
	/** @type {{ eyebrow?: string, text: string }} */
	let { eyebrow = "Statement", text } = $props();
</script>

<div class="quiz-statement">
	<p class="quiz-statement-eyebrow">{eyebrow}</p>
	<p class="quiz-statement-text">{text}</p>
</div>

<style lang="scss">
	.quiz-statement {
		margin: 0 auto 1rem;
		padding: 0.65rem 0.85rem;
		max-width: 36rem;
		width: 100%;
		box-sizing: border-box;
		border-left: 3px solid var(--color-primary);
		background: color-mix(in srgb, var(--color-gray-100) 65%, transparent);
		text-align: center;
	}

	.quiz-statement-eyebrow {
		margin: 0 0 0.35rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		line-height: 1.35;
	}

	.quiz-statement-text {
		margin: 0;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 17px;
		font-weight: 550;
		line-height: 1.35;
		color: var(--color-text);
	}
</style>
