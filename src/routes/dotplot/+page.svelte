<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import InlineVisual from '$lib/components/layout/InlineVisual.svelte';
	import TypologyDumbbellBoard from '$lib/visuals/dotplot/TypologyDumbbellBoard.svelte';
	import {
		parseQuestionsCsv,
		findQuestionById
	} from '$lib/visuals/dotplot/parseQuestionsCsv.js';
	import questionsRows from '$lib/data/questions.csv';
	import copy from '$lib/data/copy.json';

	const parsed = parseQuestionsCsv(questionsRows);

	/** `copy.json` is generated (e.g. `npm run gdoc`); add `charts.dotplot` in the doc to populate title/dek/note. */
	const dotplotCopy = copy.charts?.dotplot ?? {};

	const qIdPair = $derived.by(() => {
		if (!browser) return [];
		const params = $page.url.searchParams;
		const fromQid = params.getAll('qId').map((s) => s.trim()).filter(Boolean);
		if (fromQid.length >= 2) return [fromQid[0], fromQid[1]];
		const a = params.get('q1')?.trim();
		const b = params.get('q2')?.trim();
		if (a && b) return [a, b];
		return [];
	});

	const questionA = $derived(
		parsed.ok && qIdPair.length >= 2 ? findQuestionById(parsed.questions, qIdPair[0]) : null
	);
	const questionB = $derived(
		parsed.ok && qIdPair.length >= 2 ? findQuestionById(parsed.questions, qIdPair[1]) : null
	);

	const validIds = $derived(parsed.ok ? parsed.questions.map((q) => q.qId).join(', ') : '');
</script>

<svelte:head>
	<title>Dot plot · typology comparison</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual>
		{#snippet title()}{dotplotCopy.title || ''}{/snippet}
		{#snippet dek()}{dotplotCopy.description || ''}{/snippet}
		{#snippet children()}
			{#if !parsed.ok}
				<p class="err" role="alert">{parsed.error}</p>
			{:else if qIdPair.length < 2}
				<section class="dotplot-hint" aria-labelledby="dotplot-hint-title">
					<h2 id="dotplot-hint-title" class="dotplot-hint-title">Two question IDs required</h2>
					<p class="dotplot-hint-body">
						Add two <code class="dotplot-code">qId</code> values from <code class="dotplot-code">questions.csv</code>, e.g.
						<a class="dotplot-link" href="/dotplot?qId=1&qId=2"><code>/dotplot?qId=1&qId=2</code></a>.
						Alternatively use <code class="dotplot-code">q1</code> and <code class="dotplot-code">q2</code>.
					</p>
					<p class="dotplot-hint-meta">Available IDs: <strong>{validIds}</strong></p>
				</section>
			{:else if !questionA || !questionB}
				<section class="dotplot-hint" aria-labelledby="dotplot-miss-title">
					<h2 id="dotplot-miss-title" class="dotplot-hint-title">Question not found</h2>
					<p class="dotplot-hint-body">
						No row for qId <strong>{qIdPair[0]}</strong> and/or <strong>{qIdPair[1]}</strong>. Check
						<code class="dotplot-code">questions.csv</code>.
					</p>
					<p class="dotplot-hint-meta">Available IDs: <strong>{validIds}</strong></p>
				</section>
			{:else}
				<TypologyDumbbellBoard
					questionA={{
						qId: questionA.qId,
						text: questionA.question,
						values: questionA.values
					}}
					questionB={{
						qId: questionB.qId,
						text: questionB.question,
						values: questionB.values
					}}
				/>
			{/if}
		{/snippet}
		{#snippet note()}
			{dotplotCopy.note || ''}
		{/snippet}
	</InlineVisual>
</div>

<style lang="scss">
	.page-inner {
		width: 100%;
		padding-block: 1.5rem 2rem;
	}

	.err {
		margin: 0;
		font-family: var(--font-body);
		color: var(--color-danger);
	}

	.dotplot-hint {
		box-sizing: border-box;
		max-width: 40rem;
		padding: 1rem 1.15rem;
		border: 1px solid var(--color-border);
		border-radius: 0.45rem;
		background: var(--color-surface);
		font-family: var(--font-body);
	}

	.dotplot-hint-title {
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 650;
		color: var(--color-text);
	}

	.dotplot-hint-body {
		margin: 0 0 0.65rem;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.dotplot-hint-meta {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.dotplot-code {
		font-size: 0.85em;
		padding: 0.1em 0.35em;
		border-radius: 0.2rem;
		background: var(--color-gray-100);
		color: var(--color-text);
	}

	.dotplot-link {
		color: var(--color-accent);
		text-decoration: none;
	}

	.dotplot-link:hover {
		text-decoration: underline;
	}
</style>
