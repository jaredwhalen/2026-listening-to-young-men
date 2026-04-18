<script>
	/** @type {{ children?: import('svelte').Snippet; title?: import('svelte').Snippet; dek?: import('svelte').Snippet; note?: import('svelte').Snippet; class?: string }} */
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
</article>

<style>
	.inline-visual {
		box-sizing: border-box;
		width: 100%;
	}

	.inline-visual-header {
		margin: 0 0 0.75rem;
	}

	.inline-visual-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(1.25rem, 2.5vw, 1.75rem);
		font-weight: 650;
		line-height: 1.2;
		color: var(--color-text);
	}

	.inline-visual-dek {
		margin: 0 0 1.25rem;
		max-width: 42rem;
		font-family: var(--font-body);
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--color-text-muted);
	}

	.inline-visual-body {
		width: 100%;
	}

	.inline-visual-note {
		margin: 1.25rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
</style>
