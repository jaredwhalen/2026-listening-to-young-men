<script>
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/fonts.css';
	import '$lib/styles/theme.css';
	import project from '$lib/config/project.js';
	import CdnPrefetch from '$lib/components/CdnPrefetch.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let isEmbed = $state(false);

	const isColumn = project.layout.mode === 'column';
	const layoutStyle = `
		--layout-max-width: ${isColumn ? `${project.layout.maxWidthPx}px` : 'none'};
		--layout-padding-inline: ${project.layout.horizontalPadding};
	`;

	onMount(() => {
		// pym.js Child#sendHeight uses document.body.offsetHeight. After the parent sets a
		// tall iframe, the body often stretches to that viewport height, so reported height
		// never shrinks. We measure the real content box (.layout-root) and ping the parent.
		if (typeof window === 'undefined' || window.self === window.top) return;

		isEmbed = true;

		let disposed = false;
		let pymChild = null;
		let pollId = 0;
		/** @type {ResizeObserver | null} */
		let ro = null;

		function measureHeightPx() {
			const root = document.querySelector('.layout-root');
			if (!root) {
				return Math.ceil(document.documentElement.scrollHeight);
			}
			const br = root.getBoundingClientRect();
			const bodyStyle = window.getComputedStyle(document.body);
			const mb = parseFloat(bodyStyle.marginBottom) || 0;
			return Math.ceil(br.bottom + window.scrollY + mb);
		}

		function pingParent() {
			if (!pymChild || disposed) return;
			const h = measureHeightPx();
			pymChild.sendMessage('height', String(h));
		}

		import('pym.js').then(({ default: pym }) => {
			if (disposed) return;
			// polling: 0 — pym's interval calls the built-in sendHeight; we replace it below.
			pymChild = new pym.Child({ polling: 0 });
			if (pymChild.timerId) {
				clearInterval(pymChild.timerId);
				pymChild.timerId = null;
			}
			pymChild.sendHeight = pingParent;
			pingParent();
			pollId = window.setInterval(pingParent, 400);
			ro = new ResizeObserver(pingParent);
			ro.observe(document.documentElement);
			const root = document.querySelector('.layout-root');
			if (root) ro.observe(root);
		});

		return () => {
			disposed = true;
			if (pollId) clearInterval(pollId);
			ro?.disconnect();
			pymChild?.remove?.();
		};
	});
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
	data-embed={isEmbed}
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

	/* In an iframe, allow the document to shrink so pym can report smaller heights. */
	.layout-root[data-embed='true'] {
		min-height: auto;
	}

	.layout-root[data-layout='column'] {
		max-width: var(--layout-max-width);
		margin-inline: 0;
	}

	:global(html, body) {
		margin: 0;
		color: var(--color-text);
	}

	/*
	 * In a tall iframe, block layout can stretch html/body to the iframe viewport, which
	 * makes pym's body.offsetHeight stick at the old (large) value. Collapse that chain when
	 * the app root opts into embed mode.
	 */
	:global(html:has(.layout-root[data-embed='true'])),
	:global(html:has(.layout-root[data-embed='true']) body) {
		height: auto;
		min-height: 0;
	}
</style>
