<script>
	import MatrixScrolly from '$lib/visuals/matrix/MatrixScrolly.svelte';
</script>

<svelte:head>
	<title>Matrix · scrolly</title>
</svelte:head>

<div class="page-inner page-inner--full">
	<MatrixScrolly />
</div>

<style lang="scss">
	.page-inner {
		width: 100%;
	}

	.page-inner--full {
		margin-inline: calc(-1 * var(--layout-padding-inline, 0px));
		width: calc(100% + 2 * var(--layout-padding-inline, 0px));
		max-width: none;
	}
</style>
