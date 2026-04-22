<script>
	import { dev } from '$app/environment';
	import { env } from '$env/dynamic/public';

	const base = dev ? '' : (env?.PUBLIC_CDN_URL ?? '');
</script>

<svelte:head>
	{#if base}
		<link rel="dns-prefetch" href={base} />
	{/if}
</svelte:head>
