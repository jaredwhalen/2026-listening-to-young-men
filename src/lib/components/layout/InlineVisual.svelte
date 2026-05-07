<script>
	/**
	 * Optional plain-text header fields (e.g. from copy.json). Use when you cannot pass snippets.
	 * If both `title` and `titleText` are set, the snippet wins.
	 */
	let {
		children,
		title,
		dek,
		note,
		titleText = "",
		dekText = "",
		noteText = "",
		/** When false, the “Public Agenda” footer link is omitted (e.g. compact quizzes). */
		showBrandFooter = true,
		class: className = "",
	} = $props();
</script>

<article class="inline-visual {className}">
	{#if title}
		<header class="inline-visual-header">
			<h1 class="inline-visual-title">{@render title()}</h1>
		</header>
	{:else if titleText}
		<header class="inline-visual-header">
			<h1 class="inline-visual-title">{titleText}</h1>
		</header>
	{/if}

	{#if dek}
		<p class="inline-visual-dek">{@render dek()}</p>
	{:else if dekText}
		<p class="inline-visual-dek">{dekText}</p>
	{/if}

	<div class="inline-visual-body">
		{@render children?.()}
	</div>

	{#if note}
		<aside class="inline-visual-note">{@render note()}</aside>
	{:else if noteText}
		<aside class="inline-visual-note">{@html noteText}</aside>
	{/if}

	{#if showBrandFooter}
		<footer class="inline-visual-footer">
			<a
				class="inline-visual-brand"
				href="https://publicagenda.org/"
				target="_blank"
				rel="noreferrer"
			>
				Public Agenda
			</a>
		</footer>
	{/if}
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
		--chart-font-body: founders-grotesk-regular, "Founders Grotesk",
			system-ui, sans-serif;
		--chart-font-heading: FeatureDisplay-Medium-Web, "Feature", system-ui,
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
		text-align: center;
	}

	.inline-visual-dek {
		max-width: 42rem;
		font-size: 14px;
		font-family: FeatureDisplay-Regular-Web;
		font-style: italic;
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--chart-brand, var(--color-primary));
		text-align: center;
		margin: 0 auto 1.25rem;
	}

	.inline-visual-body {
		width: 100%;
	}

	/* Force sans-serif chart label anywhere we opt in */
	.inline-visual :global(.chart-label-sans) {
		font-family: founders-grotesk-regular, "Founders Grotesk", system-ui,
			sans-serif !important;
	}

	.inline-visual-note {
		margin: 1.25rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 14px;
		font-family: FeatureDisplay-Regular-Web;
		font-style: italic;
		color: var(--chart-brand, var(--color-primary));
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
