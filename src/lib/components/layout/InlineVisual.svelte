<script>
	let { children, title, dek, note, class: className = '' } = $props();
</script>

<article class="inline-visual {className}">
	{#if title}
		<header class="inline-visual-header">
			<h1 class="inline-visual-title">{@render title()}</h1>
		</header>
	{/if}

	{#if dek}
		<p class="inline-visual-dek">{@render dek()}</p>
	{/if}

	<div class="inline-visual-body">
		{@render children?.()}
	</div>

	{#if note}
		<aside class="inline-visual-note">{@render note()}</aside>
	{/if}

	<footer class="inline-visual-footer">
		<a class="inline-visual-brand" href="https://publicagenda.org/" target="_blank" rel="noreferrer">
			Public Agenda
		</a>
	</footer>
</article>

<style>
	.inline-visual {
		box-sizing: border-box;
		width: 100%;

		/* ----------------------------
		 * Chart theme tokens
		 * These cascade into all chart components inside InlineVisual.
		 * Match Everviz charts used alongside this project:
		 * - Titles: FeatureDisplay-Medium-Web
		 * - All chart UI/labels: founders-grotesk-regular
		 * ---------------------------- */
		--chart-font-body: founders-grotesk-regular, 'Founders Grotesk', system-ui,
			sans-serif;
		--chart-font-heading: FeatureDisplay-Medium-Web, 'Feature', system-ui,
			sans-serif;

		/* Brand accent */
		--chart-brand: var(--color-primary);

		/* Typography (from Everviz DOM snapshot) */
		--chart-fs-xs: 12px; /* data labels + small UI */
		--chart-fs-sm: 14px; /* axis/category labels */
		--chart-fs-md: 18px; /* subtitle / larger UI */
		--chart-fs-lg: 26px; /* title */
		--chart-fs-xl: 26px; /* keep same */

		--chart-weight-regular: 400;
		--chart-weight-semibold: 600;
		--chart-weight-bold: 700;

		/* Neutral UI */
		--chart-text: #000000;
		--chart-muted: #666666;
		--chart-surface: #ffffff;
		--chart-border: #cccccc;
		--chart-grid: #e6e6e6;
		--chart-grid-strong: #cccccc;
		--chart-axis: #3333333d;

		/* Geometry */
		--chart-radius: 3px;
		--chart-cell-radius: 0.15rem;
		--chart-cell-h: 2rem;
		--chart-gap-col: 0.9rem;
	}

	.inline-visual-header {
		margin: 0 0 0.75rem;
	}

	.inline-visual-title {
		margin: 0;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: clamp(1.6rem, 2.6vw, var(--chart-fs-lg, 26px));
		font-weight: var(--chart-weight-bold, 700);
		line-height: 1.2;
		color: var(--chart-brand, var(--color-primary));
	}

	.inline-visual-dek {
		margin: 0 0 1.25rem;
		max-width: 42rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--color-text-muted);
	}

	.inline-visual-body {
		width: 100%;
	}

	/* Force sans-serif chart label anywhere we opt in */
	.inline-visual :global(.chart-label-sans) {
		font-family: founders-grotesk-regular, 'Founders Grotesk', system-ui, sans-serif !important;
	}

	.inline-visual-note {
		margin: 1.25rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.inline-visual-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.75rem;
	}

	.inline-visual-brand {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 11px;
		line-height: 1;
		color: color-mix(
			in srgb,
			var(--chart-brand, var(--color-primary)) 85%,
			var(--chart-muted, var(--color-text-muted))
		);
		text-decoration: none;
	}

	.inline-visual-brand:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
