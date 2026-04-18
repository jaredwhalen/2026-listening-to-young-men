<script>
	const routes = [
		{ href: '/matrix-scrolly', label: 'Matrix (scrolly)' },
		{ href: '/matrix', label: 'Matrix (inline)' },
		{ href: '/waffle', label: 'Waffle' },
		{ href: '/dotplot', label: 'Dot plot' },
		{ href: '/dotplot-interactive', label: 'Dot plot (interactive)' }
	];
</script>

<svelte:head>
	<title>Visuals index</title>
</svelte:head>

<div class="hub">
	<h1 class="hub-title">Project visuals</h1>
	<p class="hub-dek">Each graphic lives at its own route for development and embedding.</p>
	<nav aria-label="Visual routes">
		<ul class="hub-list">
			{#each routes as item}
				<li><a href={item.href}>{item.label}</a></li>
			{/each}
		</ul>
	</nav>
</div>

<style lang="scss">
	.hub {
		max-width: 36rem;
		padding-block: 2rem;
	}

	.hub-title {
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 650;
		color: var(--color-text);
	}

	.hub-dek {
		margin: 0 0 1.5rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.hub-list {
		margin: 0;
		padding: 0;
		list-style: none;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.6;
	}

	.hub-list a {
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.hub-list a:hover {
		color: var(--color-primary-muted);
	}

	.hub-list li + li {
		margin-top: 0.35rem;
	}
</style>
