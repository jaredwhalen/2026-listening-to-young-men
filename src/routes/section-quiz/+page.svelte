<script>
	import InlineVisual from "$lib/components/layout/InlineVisual.svelte";
	import QuizChipRankPick from "$lib/visuals/quiz/components/QuizChipRankPick.svelte";
	import QuizDualColumnResults from "$lib/visuals/quiz/components/QuizDualColumnResults.svelte";
	import QuizLandingLinks from "$lib/visuals/quiz/components/QuizLandingLinks.svelte";
	import QuizPercentPoll from "$lib/visuals/quiz/components/QuizPercentPoll.svelte";
	import QuizPercentReveal from "$lib/visuals/quiz/components/QuizPercentReveal.svelte";
	import QuizStatement from "$lib/visuals/quiz/components/QuizStatement.svelte";
	import { parseWaffleCsv } from "$lib/visuals/waffle/parseWaffleCsv.js";
	import {
		traitLabelsTheyBelieve,
		youngMenTopTraitsTheyBelieve,
	} from "$lib/visuals/quiz/sectionQuizHelpers.js";
	import { percentPollReaction } from "$lib/visuals/quiz/percentPollReaction.js";
	import {
		getSectionQuizConfig,
		SECTION_QUIZ_ORDER,
	} from "$lib/visuals/quiz/sectionQuizConfig.js";
	import copy from "$lib/data/copy.json";
	import waffleRows from "$lib/data/waffle.csv";
	import { browser } from "$app/environment";
	import { base } from "$app/paths";
	import { page } from "$app/stores";

	function sectionNameToCopyKey(sectionName) {
		const raw = String(sectionName ?? "").trim();
		if (!raw) return "";
		const tokens = raw
			.replace(/&/g, " and ")
			.replace(/[()]/g, " ")
			.replace(/[^a-zA-Z0-9]+/g, " ")
			.trim()
			.split(/\s+/g)
			.filter(Boolean);
		if (!tokens.length) return "";
		return (
			tokens[0].toLowerCase() +
			tokens
				.slice(1)
				.map(
					(t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
				)
				.join("")
		);
	}

	const chartCopy = $derived(copy.charts?.sectionQuiz ?? {});

	const sectionParam = $derived(
		browser ? ($page.url.searchParams.get("section") ?? "").trim() : "",
	);

	const normalizedSection = $derived(
		sectionParam
			? SECTION_QUIZ_ORDER.find(
					(s) => s.toLowerCase() === sectionParam.toLowerCase(),
				) ?? sectionParam
			: "",
	);

	const sectionCopyKey = $derived(
		normalizedSection ? sectionNameToCopyKey(normalizedSection) : "",
	);

	const sectionCopy = $derived(
		sectionCopyKey ? (chartCopy.sections?.[sectionCopyKey] ?? {}) : {},
	);

	const quizConfig = $derived(getSectionQuizConfig(normalizedSection));

	const pageTitle = $derived(
		(sectionCopy.title && String(sectionCopy.title).trim()) ||
			(chartCopy.title && String(chartCopy.title).trim()) ||
			"Quick check-in",
	);

	const headerTitle = $derived(pageTitle);
	const headerDek = $derived(
		(sectionCopy.description && String(sectionCopy.description).trim()) ||
			(chartCopy.description && String(chartCopy.description).trim()) ||
			"",
	);

	const layoutCentered = $derived(!!quizConfig?.centered);

	const parsedWaffle = $derived(parseWaffleCsv(waffleRows));

	const traitOptions = $derived(traitLabelsTheyBelieve(parsedWaffle));
	const surveyTopTraits = $derived(
		youngMenTopTraitsTheyBelieve(parsedWaffle, 3),
	);

	const percentPollSurveyPct = $derived(
		quizConfig?.kind === "percentPoll" &&
			typeof quizConfig.surveyPct === "number"
			? quizConfig.surveyPct
			: null,
	);

	/** @type {string[]} */
	let selectedTraits = $state([]);
	let traitsRevealed = $state(false);

	let percentPollGuessPct = $state(50);
	let percentPollRevealed = $state(false);

	function resetPercentPoll() {
		percentPollGuessPct = 50;
		percentPollRevealed = false;
	}

	const percentPollGuessRounded = $derived(
		Math.round(Number(percentPollGuessPct) || 0),
	);

	function toggleTrait(t) {
		const i = selectedTraits.indexOf(t);
		if (i >= 0) {
			selectedTraits = selectedTraits.filter((x) => x !== t);
			return;
		}
		const maxPicks =
			quizConfig?.kind === "traitRank3" ? quizConfig.maxPicks : 3;
		if (selectedTraits.length >= maxPicks) return;
		selectedTraits = [...selectedTraits, t];
	}

	function resetTraitsQuiz() {
		selectedTraits = [];
		traitsRevealed = false;
	}

	function overlapCount(a, b) {
		const setB = new Set(b.map((x) => x.trait));
		return a.filter((t) => setB.has(t)).length;
	}

	const traitsOverlap = $derived(
		traitsRevealed && surveyTopTraits.length
			? overlapCount(selectedTraits, surveyTopTraits)
			: 0,
	);

	function formatTraitShare(share) {
		const pct = Math.round(Math.min(1, Math.max(0, share)) * 100);
		return `${pct}%`;
	}

	const traitLeftLines = $derived(selectedTraits);
	const traitRightLines = $derived(
		surveyTopTraits.map(
			(row) => `${row.trait} (${formatTraitShare(row.share)})`,
		),
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual
		class={`quiz-inline-root${layoutCentered ? " quiz-inline-root--centered" : ""}`}
		titleText={headerTitle}
		showBrandFooter={false}
	>
		{#snippet children()}
			{#if !sectionParam}
				<QuizLandingLinks sectionNames={SECTION_QUIZ_ORDER} basePath={base} />
			{:else if !quizConfig}
				<p class="err" role="alert">
					Unknown section <strong>{sectionParam}</strong>. Try one of:
					{SECTION_QUIZ_ORDER.join("; ")}.
				</p>
			{:else if quizConfig.kind === "tbd"}
				<div
					class="quiz-module"
					role="region"
					aria-label="Interactive section quiz"
				>
					{#if headerDek}
						<p class="quiz-instructions">{headerDek}</p>
					{/if}
					<p class="quiz-tbd-note" role="status">
						This section’s quiz is still being prepared.
					</p>
				</div>
			{:else if quizConfig.kind === "traitRank3"}
				{#if headerDek}
					<p class="quiz-instructions">{headerDek}</p>
				{/if}

				{#if !parsedWaffle.ok}
					<p class="err" role="alert">{parsedWaffle.error}</p>
				{:else}
					<div
						class="quiz-module"
						role="region"
						aria-label="Interactive section quiz"
					>
						<p
							class="quiz-status-line"
							class:quiz-status-line--secondary={traitsRevealed}
							aria-live="polite"
						>
							{#if !traitsRevealed}
								{selectedTraits.length} of {quizConfig.maxPicks} selected
							{:else if surveyTopTraits.length === quizConfig.maxPicks}
								You matched <strong>{traitsOverlap}</strong> of the survey’s top
								{quizConfig.maxPicks === 3
									? "three"
									: quizConfig.maxPicks} traits.
							{:else}
								Comparison data is unavailable.
							{/if}
						</p>

						{#if !traitsRevealed}
							<QuizChipRankPick
								options={traitOptions}
								selected={selectedTraits}
								onToggle={(trait) => {
									toggleTrait(trait);
									traitsRevealed = false;
								}}
							/>
						{/if}

						<div class="quiz-actions">
							{#if !traitsRevealed}
								<button
									type="button"
									class="quiz-btn-primary"
									disabled={selectedTraits.length !== quizConfig.maxPicks}
									onclick={() => (traitsRevealed = true)}
								>
									{quizConfig.compareSubmitLabel}
								</button>
							{:else}
								<button
									type="button"
									class="quiz-btn-text"
									onclick={resetTraitsQuiz}
								>
									{quizConfig.resetLabel}
								</button>
							{/if}
						</div>

						{#if traitsRevealed && surveyTopTraits.length === quizConfig.maxPicks}
							<QuizDualColumnResults
								leftTitle={quizConfig.yourListHeading}
								rightTitle={quizConfig.surveyListHeading}
								leftLines={traitLeftLines}
								rightLines={traitRightLines}
							/>
						{/if}
					</div>
				{/if}
			{:else if quizConfig.kind === "percentPoll"}
				{#if headerDek}
					<p class="quiz-instructions">{headerDek}</p>
				{/if}

				<div
					class="quiz-module"
					role="region"
					aria-label="Interactive section quiz"
				>
					<QuizStatement
						eyebrow={quizConfig.statementEyebrow}
						text={quizConfig.statementText}
					/>

					{#if percentPollSurveyPct == null}
						<p class="err" role="alert">
							Survey data for this question is unavailable.
						</p>
					{:else}
						{#if !percentPollRevealed}
							<QuizPercentPoll
								prompt={quizConfig.pollPrompt}
								bind:guessPct={percentPollGuessPct}
								onAdjust={() => (percentPollRevealed = false)}
							/>
						{/if}

						{#if !percentPollRevealed}
							<div class="quiz-actions">
								<button
									type="button"
									class="quiz-btn-primary"
									onclick={() => (percentPollRevealed = true)}
								>
									{quizConfig.submitLabel}
								</button>
							</div>
						{/if}

						{#if percentPollRevealed}
							{@const surveyPct = percentPollSurveyPct}
							{@const delta = percentPollGuessRounded - surveyPct}
							{@const reaction = percentPollReaction(
								delta,
								quizConfig.populationLabel,
							)}
							<QuizPercentReveal
								hook={reaction.hook}
								guessRounded={percentPollGuessRounded}
								{surveyPct}
								populationLabel={quizConfig.populationLabel}
							/>
							<div class="quiz-actions quiz-actions--after-reveal">
								<button type="button" class="quiz-btn-text" onclick={resetPercentPoll}>
									{quizConfig.tryAgainLabel}
								</button>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		{/snippet}
	</InlineVisual>
</div>

<style lang="scss">
	.page-inner {
		width: 100%;
		padding-block: 1.5rem 2rem;
	}

	:global(.quiz-inline-root--centered .inline-visual-body) {
		text-align: center;
	}

	.err {
		margin: 0;
		font-family: var(--font-body);
		color: var(--color-danger);
		line-height: 1.45;
	}

	.quiz-instructions {
		max-width: 46rem;
		margin: 0.1rem auto 1rem;
		padding: 0.55rem 0.85rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
		border-radius: 0.6rem;
		background: color-mix(in srgb, var(--color-gray-100) 70%, transparent);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		line-height: 1.5;
		color: var(--color-text);
	}

	.quiz-tbd-note {
		margin: 0;
		max-width: 40rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.quiz-module {
		max-width: 46rem;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}

	.quiz-status-line {
		margin: 0 0 0.5rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		line-height: 1.45;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.quiz-status-line--secondary {
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.quiz-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		margin-bottom: 1.25rem;
	}

	.quiz-actions--after-reveal {
		margin-top: 1rem;
		margin-bottom: 0;
	}

	.quiz-btn-primary {
		margin: 0;
		padding: 0.45rem 1rem;
		border: none;
		border-radius: var(--chart-radius, 3px);
		background: var(--color-primary);
		color: var(--color-surface);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		font-weight: 650;
		cursor: pointer;
	}

	.quiz-btn-primary:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.quiz-btn-primary:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.quiz-btn-text {
		margin: 0;
		padding: 0.35rem 0.5rem;
		border: none;
		background: transparent;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}
</style>
