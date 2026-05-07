<script>
	/** @type {{ eyebrow?: string, text: string }} */
	let { eyebrow = "Statement", text } = $props();
</script>

<p class="quiz-statement">
	<span class="quiz-statement-eyebrow">{eyebrow}</span>
	{text}
</p>

<style lang="scss">
	.quiz-statement {
		margin: 0 auto 1rem;
		padding: 0.65rem 0.85rem;
		max-width: 36rem;
		width: 100%;
		box-sizing: border-box;
		border-left: 3px solid var(--color-primary);
		background: color-mix(in srgb, var(--color-gray-100) 65%, transparent);
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 17px;
		font-weight: 550;
		line-height: 1.35;
		color: var(--color-text);
		text-align: center;
	}

	.quiz-statement-eyebrow {
		display: block;
		margin-bottom: 0.35rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
</style>
