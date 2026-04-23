<script>
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/fonts.css';
	import '$lib/styles/theme.css';
	import project from '$lib/config/project.js';
	import CdnPrefetch from '$lib/components/CdnPrefetch.svelte';

	let { children } = $props();

	const isColumn = project.layout.mode === 'column';
	const layoutStyle = `
		--layout-max-width: ${isColumn ? `${project.layout.maxWidthPx}px` : 'none'};
		--layout-padding-inline: ${project.layout.horizontalPadding};
	`;
</script>

<CdnPrefetch />

<svelte:head>
	<meta charset="utf-8" />
	<link rel="icon" href={favicon} />
	<title>{project.meta.title}</title>
	<meta name="description" content={project.meta.description} />

	{#if project.document.includeViewportMeta}
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	{/if}

	{#if project.document.mode === 'standalone' && project.document.includeGoogleFonts}
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link href={project.document.googleFontHref} rel="stylesheet" />
	{/if}
</svelte:head>

<div
	class="layout-root"
	data-layout={project.layout.mode}
	data-document={project.document.mode}
	style={layoutStyle}
>
	{@render children?.()}
</div>

<style>
	.layout-root {
		min-height: 100dvh;
		box-sizing: border-box;
		padding-inline: var(--layout-padding-inline);
		width: 100%;
	}

	.layout-root[data-layout='column'] {
		max-width: var(--layout-max-width);
		margin-inline: 0;
	}

	:global(html, body) {
		margin: 0;
		background: var(--color-gray-50);
		color: var(--color-text);
	}
</style>
