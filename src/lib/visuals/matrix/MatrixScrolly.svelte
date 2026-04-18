<script>
	import Scroller from '../../components/Scroller.svelte';
	import Slide from '../../components/Slide.svelte';
	import copy from '../../data/copy.json';
	import Window from '../../components/Window.svelte';
	import Background from '../../components/Background.svelte';

	import { windowWidth } from '../../stores/global.js';

	let count = $state();
	let index = $state();
	let offset = $state();
	let progress = $state();
	let top = $state(0);
	let threshold = $state(0.5);
	let bottom = $state(1);

	let slides = copy.scroller;

	let viz = $state(null);

	let containerWidth = $state(0);
	let leftOffset = $state(0);
	let debounceTimer = null;

	function calculateOffsets() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			if ($windowWidth && viz) {
				containerWidth = viz.getBoundingClientRect().width;
				leftOffset = ($windowWidth - containerWidth) / -2;
			}
		}, 150);
	}

	$effect(() => {
		if ($windowWidth) {
			calculateOffsets();
		}
	});

	$effect(() => {
		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});
</script>

<Window />

<div id="viz" class="viz-root" bind:this={viz} style:--left-offset="{leftOffset}px">
	<Scroller {top} {threshold} {bottom} bind:count bind:index bind:offset bind:progress>
		{#snippet background()}
			<Background slideIndex={index} slideCount={count} />
		{/snippet}

		{#snippet foreground()}
			<div class="foreground-content">
				{#each slides as slide, i (slide.id)}
					<Slide {slide} isActive={i === index} />
				{/each}
			</div>
		{/snippet}
	</Scroller>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.viz-root {
		width: 100%;
	}

	.foreground-content {
		width: 100%;
	}

	:global(svelte-scroller-background) {
		overflow: hidden;
		height: 100dvh;
	}

	:global(svelte-scroller-foreground) {
		pointer-events: none;
	}

	:global(svelte-scroller-foreground .slide) {
		pointer-events: all;
	}
</style>
