<script>
	/**
	 * @type {{ sectionNames: string[], basePath: string }}
	 * `basePath` is the app base (e.g. from `$app/paths` base), without trailing slash.
	 */
	let { sectionNames, basePath } = $props();
</script>

<div class="quiz-landing" role="region" aria-label="Section quiz menu">
	<p class="quiz-landing-lede">Choose a report section for a quick interactive check-in.</p>
	<ul class="quiz-landing-list">
		{#each sectionNames as name}
			<li>
				<a
					class="quiz-landing-link"
					href="{basePath}/section-quiz?section={encodeURIComponent(name)}"
				>
					{name}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	.quiz-landing {
		max-width: 46rem;
		margin: 0.25rem auto 1.25rem;
		padding: 0.9rem 1rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--color-gray-100) 55%, transparent);
	}

	.quiz-landing-lede {
		margin: 0 0 0.75rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 1rem;
		line-height: 1.45;
		color: var(--color-text);
	}

	.quiz-landing-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.quiz-landing-link {
		display: block;
		padding: 0.45rem 0.6rem;
		border-radius: 0.45rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		color: var(--color-primary);
		text-decoration: none;
	}

	.quiz-landing-link:hover {
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
	}
</style>
