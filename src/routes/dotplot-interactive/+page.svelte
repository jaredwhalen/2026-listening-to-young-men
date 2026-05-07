<script>
	import InlineVisual from "$lib/components/layout/InlineVisual.svelte";
	import InteractiveMultiDotPlot from "$lib/visuals/dotplot/InteractiveMultiDotPlot.svelte";
	import {
		ALL_RESPONDENTS_KEY,
		DEMOGRAPHIC_KEYS,
		TYPOLOGY_KEYS,
		filterRowsBySection,
		groupTopLevelQuestions,
		listSections,
		listSubpartSlices,
		parsePercentCell,
		responseRowLabel,
		topLevelQuestionMenuLabel,
	} from "$lib/visuals/dotplot/parseQuestionsFullCsv.js";
	import {
		colorForTypologyCsvColumn,
		typologyColumnToQuadrantKey,
	} from "$lib/visuals/typology/typologyDemoColors.js";
	import { typologyCopy } from "$lib/data/typologyCopy.js";
	import copy from "$lib/data/copy.json";
	import fullRows from "$lib/data/questions-full.csv";
	import { base } from "$app/paths";
	import { page } from "$app/stores";

	const DEMO_SERIES_COLORS = {
		"Young men": "var(--pa-blue)",
		"Young women": "var(--pa-light-blue)",
		"Men 35-54": "var(--pa-primary-teal)",
		"Men 55+": "var(--pa-orange)",
	};

	function sectionNameToCopyKey(sectionName) {
		// ArchieML turns object blocks into camelCase keys in `copy.json`
		// e.g. "The Expectations Gap" -> "theExpectationsGap"
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

	const chartCopy = $derived(copy.charts?.dotplotInteractive ?? {});

	const sectionParam = $derived(
		($page.url.searchParams.get("section") ?? "").trim(),
	);
	const sectionCopyKey = $derived(
		sectionParam ? sectionNameToCopyKey(sectionParam) : "",
	);

	const sectionCopy = $derived(
		sectionCopyKey ? (chartCopy.sections?.[sectionCopyKey] ?? {}) : {},
	);

	const pageTitle = $derived(
		(sectionCopy.title && String(sectionCopy.title).trim()) ||
			(chartCopy.title && String(chartCopy.title).trim()) ||
			"Interactive dot plot",
	);

	const sectionRows = $derived(
		sectionParam
			? filterRowsBySection(fullRows, sectionParam)
			: /** @type {Record<string, string>[]} */ ([]),
	);

	const topLevelGroups = $derived(groupTopLevelQuestions(sectionRows));

	let qPickerOpen = $state(false);
	/** @type {HTMLDetailsElement | null} */
	let qPickerEl = $state(null);
	/** @type {HTMLDivElement | null} */
	let qMenuEl = $state(null);

	let sPickerOpen = $state(false);
	/** @type {HTMLDetailsElement | null} */
	let sPickerEl = $state(null);
	/** @type {HTMLDivElement | null} */
	let sMenuEl = $state(null);

	let selectedQId = $state("");
	let selectedSliceKey = $state("");
	let mode = $state(/** @type {"demographic" | "typology"} */ ("typology"));

	/**
	 * @typedef {{ qId: string, label: string }} QuestionOption
	 */
	const questionOptions = $derived.by(() =>
		topLevelGroups.map((g) => ({
			qId: g.qId,
			label: topLevelQuestionMenuLabel(g, 9999),
		})),
	);

	$effect(() => {
		const opts = questionOptions;
		if (!opts.length) return;
		if (!selectedQId || !opts.some((o) => o.qId === selectedQId)) {
			selectedQId = opts[0].qId;
		}
	});

	const selectedGroup = $derived(
		topLevelGroups.find((g) => g.qId === selectedQId) ?? null,
	);

	const subpartSlices = $derived(
		selectedGroup ? listSubpartSlices(selectedGroup.rows) : [],
	);

	$effect(() => {
		const slices = subpartSlices;
		if (!slices.length) return;
		if (
			!selectedSliceKey ||
			!slices.some((s) => s.sliceKey === selectedSliceKey)
		) {
			selectedSliceKey = slices[0].sliceKey;
		}
	});

	const activeSlice = $derived(
		subpartSlices.find((s) => s.sliceKey === selectedSliceKey) ?? subpartSlices[0] ?? null,
	);

	const allSeriesKeys = $derived([...DEMOGRAPHIC_KEYS, ...TYPOLOGY_KEYS]);

	/** Preserve CSV / survey order (e.g. agree scale top to bottom). */
	const plotRows = $derived.by(() => {
		if (!activeSlice) return [];
		return activeSlice.rows.map((r) => ({
			yLabel: responseRowLabel(r),
			all: parsePercentCell(r[ALL_RESPONDENTS_KEY]),
			series: Object.fromEntries(
				allSeriesKeys.map((k) => [k, parsePercentCell(r[k])]),
			),
		}));
	});

	const seriesMeta = $derived.by(() => {
		const demo = DEMOGRAPHIC_KEYS.map((k) => ({
			key: k,
			label: k,
			group: "Demographics",
			muted: mode === "typology",
			color: DEMO_SERIES_COLORS[k] ?? "var(--color-primary)",
		}));
		const typo = TYPOLOGY_KEYS.map((k) => {
			const qk = typologyColumnToQuadrantKey(k);
			const title =
				(qk && typologyCopy.quadrantTitles?.[qk]) ||
				k.replace("/", " / ");
			return {
				key: k,
				label: title,
				group: "Typology",
				muted: mode === "demographic",
				color: colorForTypologyCsvColumn(k),
			};
		});
		return [...demo, ...typo];
	});

	const chartHeading = $derived(
		(selectedGroup?.question ?? "").trim() || selectedQId || "",
	);

	const showSlicePicker = $derived(subpartSlices.length > 1);

	const chartTitleForPlot = $derived(
		showSlicePicker && activeSlice
			? `${chartHeading} — ${activeSlice.menuLabel}`
			: chartHeading,
	);

	const headerTitle = $derived(
		(sectionCopy.title && String(sectionCopy.title).trim()) ||
			(chartCopy.title && String(chartCopy.title).trim()) ||
			"",
	);
	const headerDek = $derived(
		(sectionCopy.description && String(sectionCopy.description).trim()) ||
			(chartCopy.description && String(chartCopy.description).trim()) ||
			"",
	);
	const headerNote = $derived(
		(sectionCopy.note && String(sectionCopy.note).trim()) ||
			(chartCopy.note && String(chartCopy.note).trim()) ||
			"",
	);

	const selectedQuestionLabel = $derived(
		questionOptions.find((o) => o.qId === selectedQId)?.label ?? "",
	);
	const selectedSubpartLabel = $derived(
		activeSlice?.menuLabel ? String(activeSlice.menuLabel) : "",
	);

	function focusMenuItem(menuEl, idx) {
		if (!menuEl) return;
		const items = /** @type {HTMLButtonElement[]} */ (
			Array.from(menuEl.querySelectorAll("button.iq-title-dd-option"))
		);
		const clamped = Math.max(0, Math.min(items.length - 1, idx));
		items[clamped]?.focus();
	}

	function handleMenuKeydown(e, menuEl) {
		const items = /** @type {HTMLButtonElement[]} */ (
			Array.from(menuEl?.querySelectorAll("button.iq-title-dd-option") ?? [])
		);
		if (!items.length) return;
		const i = items.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
		if (e.key === "ArrowDown") {
			e.preventDefault();
			focusMenuItem(menuEl, (i < 0 ? 0 : i + 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			focusMenuItem(menuEl, (i < 0 ? items.length - 1 : i - 1));
		} else if (e.key === "Home") {
			e.preventDefault();
			focusMenuItem(menuEl, 0);
		} else if (e.key === "End") {
			e.preventDefault();
			focusMenuItem(menuEl, items.length - 1);
		} else if (e.key === "Escape") {
			e.preventDefault();
			// Close whichever picker owns this menu
			if (menuEl === qMenuEl) {
				qPickerOpen = false;
				if (qPickerEl) qPickerEl.open = false;
				qPickerEl?.querySelector("summary")?.focus();
			} else if (menuEl === sMenuEl) {
				sPickerOpen = false;
				if (sPickerEl) sPickerEl.open = false;
				sPickerEl?.querySelector("summary")?.focus();
			}
		}
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual
		class="dotplot-interactive-visual"
		titleText={headerTitle}
		noteText={headerNote}
	>
		{#snippet children()}
			{#if !sectionParam}
				<div class="iq-landing" role="region" aria-label="Choose a section">
					<p class="iq-landing-lede">
						Choose a section to explore the survey results.
					</p>
					<ul class="iq-landing-list">
						<li>
							<a
								class="iq-landing-link"
								href="{base}/dotplot-interactive?section=The%20Expectations%20Gap"
							>
								The Expectations Gap
							</a>
						</li>
						<li>
							<a
								class="iq-landing-link"
								href="{base}/dotplot-interactive?section=Degrees%20of%20Doubt"
							>
								Degrees of Doubt
							</a>
						</li>
						<li>
							<a
								class="iq-landing-link"
								href="{base}/dotplot-interactive?section=Connected%20but%20Alone"
							>
								Connected but Alone
							</a>
						</li>
						<li>
							<a
								class="iq-landing-link"
								href="{base}/dotplot-interactive?section=Alienated%20and%20(Dis)Engaged"
							>
								Alienated and (Dis)Engaged
							</a>
						</li>
					</ul>
				</div>
			{:else if !sectionRows.length}
				<p class="err" role="alert">
					No rows for section <strong>{sectionParam}</strong>. Known
					sections:
					{listSections(fullRows).join("; ") || "(none)"}.
				</p>
			{:else if !selectedGroup}
				<p class="err" role="alert">No questions in this section.</p>
			{:else}
				{#if headerDek}
					<p class="iq-instructions">{headerDek}</p>
				{/if}

				<div class="iq-controls">
					<div class="iq-title-picker">
						<details
							class="iq-title-dd"
							bind:this={qPickerEl}
							open={qPickerOpen}
							ontoggle={(e) => {
								qPickerOpen = e.currentTarget.open;
								if (qPickerOpen) {
									queueMicrotask(() => {
										// focus selected option by default
										const idx = questionOptions.findIndex((o) => o.qId === selectedQId);
										focusMenuItem(qMenuEl, idx < 0 ? 0 : idx);
									});
								}
							}}
						>
							<summary class="iq-title-dd-summary">
								<span class="iq-title-dd-summary-text">
									{selectedQuestionLabel || "Select a question…"}
								</span>
								<span class="iq-title-dd-chevron" aria-hidden="true">▾</span>
							</summary>
							<div
								class="iq-title-dd-menu"
								role="listbox"
								tabindex="-1"
								bind:this={qMenuEl}
								onkeydown={(e) => handleMenuKeydown(e, qMenuEl)}
							>
								{#each questionOptions as opt (opt.qId)}
									<button
										type="button"
										class="iq-title-dd-option"
										data-selected={opt.qId === selectedQId}
										onclick={() => {
											selectedQId = opt.qId;
											qPickerOpen = false;
											if (qPickerEl) qPickerEl.open = false;
										}}
									>
										{opt.label}
									</button>
								{/each}
							</div>
						</details>
						{#if showSlicePicker}
							<div class="iq-subpart-picker">
								<details
									class="iq-title-dd iq-title-dd--subpart"
									bind:this={sPickerEl}
									open={sPickerOpen}
									ontoggle={(e) => {
										sPickerOpen = e.currentTarget.open;
										if (sPickerOpen) {
											queueMicrotask(() => {
												const idx = subpartSlices.findIndex(
													(s) => s.sliceKey === selectedSliceKey,
												);
												focusMenuItem(sMenuEl, idx < 0 ? 0 : idx);
											});
										}
									}}
								>
									<summary class="iq-title-dd-summary iq-title-dd-summary--subpart">
										<span class="iq-title-dd-summary-text">
											{selectedSubpartLabel || "Select a subpart…"}
										</span>
										<span class="iq-title-dd-chevron" aria-hidden="true">▾</span>
									</summary>
									<div
										class="iq-title-dd-menu"
										role="listbox"
										tabindex="-1"
										bind:this={sMenuEl}
										onkeydown={(e) => handleMenuKeydown(e, sMenuEl)}
									>
										{#each subpartSlices as s (s.sliceKey)}
											<button
												type="button"
												class="iq-title-dd-option"
												data-selected={s.sliceKey === selectedSliceKey}
												onclick={() => {
													selectedSliceKey = s.sliceKey;
													sPickerOpen = false;
													if (sPickerEl) sPickerEl.open = false;
												}}
											>
												{s.menuLabel}
											</button>
										{/each}
									</div>
								</details>
							</div>
						{/if}
					</div>

					<div
						class="iq-field iq-field--seg"
						role="group"
						aria-label="Highlighted series"
					>
						<span class="iq-field-label">Highlight</span>
						<div class="iq-seg">
							<button
								type="button"
								class="iq-seg-btn"
								data-active={mode === "typology"}
								aria-pressed={mode === "typology"}
								onclick={() => (mode = "typology")}
							>
								Typology
							</button>
							<button
								type="button"
								class="iq-seg-btn"
								data-active={mode === "demographic"}
								aria-pressed={mode === "demographic"}
								onclick={() => (mode = "demographic")}
							>
								Demographics
							</button>
						</div>
					</div>
				</div>

				<InteractiveMultiDotPlot
					rows={plotRows}
					series={seriesMeta}
					axisBottomLabel="% selecting"
					chartTitle={chartTitleForPlot}
				/>
			{/if}
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
		line-height: 1.45;
	}

	.iq-code {
		font-size: 0.88em;
		padding: 0.08em 0.28em;
		border-radius: 0.2rem;
		background: var(--color-gray-100);
	}

	.iq-landing {
		max-width: 46rem;
		margin: 0.25rem auto 1.25rem;
		padding: 0.9rem 1rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--color-gray-100) 55%, transparent);
	}

	.iq-landing-lede {
		margin: 0 0 0.65rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 15px;
		line-height: 1.45;
		color: var(--chart-text, var(--color-text));
	}

	.iq-landing-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.35rem;
	}

	.iq-landing-link {
		display: block;
		padding: 0.55rem 0.7rem;
		border-radius: 0.6rem;
		text-decoration: none;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 16px;
		font-weight: 600;
		line-height: 1.2;
		color: var(--chart-text, var(--color-text));
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.iq-landing-link:hover {
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
	}

	.iq-landing-link:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.iq-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0.65rem 1.25rem;
		margin-bottom: 0.85rem;
	}

	.iq-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.iq-field--grow {
		flex: 1 1 14rem;
	}

	.iq-field-label {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-xs, 12px);
		font-weight: 600;
		color: var(--chart-muted, var(--color-text-muted));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.iq-select {
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--chart-radius, 3px);
		background: var(--color-surface);
		color: var(--color-text);
		min-width: 0;
		max-width: 100%;
	}

	.iq-field--seg {
		flex: 0 0 auto;
		align-self: flex-start;
		margin-top: 0.2rem;
	}

	.iq-title-picker {
		flex: 1 1 34rem;
		min-width: min(34rem, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.iq-subpart-picker {
		width: 100%;
	}

	.iq-title-dd {
		position: relative;
		width: 100%;
	}

	.iq-title-dd-summary {
		list-style: none;
		cursor: pointer;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.2rem 0 0.25rem;
		border-bottom: 1px solid var(--color-border);
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 18px;
		font-weight: 650;
		line-height: 1.25;
		color: var(--chart-text, var(--color-text));
	}

	.iq-title-dd-summary::-webkit-details-marker {
		display: none;
	}

	.iq-title-dd-summary--subpart {
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: 15px;
		font-weight: 550;
		color: var(--chart-muted, var(--color-text-muted));
		line-height: 1.3;
		padding-top: 0.1rem;
	}

	.iq-title-dd-summary-text {
		display: block;
		white-space: normal;
		word-break: break-word;
	}

	.iq-title-dd-chevron {
		flex: 0 0 auto;
		font-size: 0.95em;
		line-height: 1;
		color: var(--chart-muted, var(--color-text-muted));
		transform: translateY(2px);
	}

	.iq-title-dd[open] .iq-title-dd-chevron {
		transform: translateY(2px) rotate(180deg);
	}

	.iq-title-dd-menu {
		position: absolute;
		z-index: 20;
		left: 0;
		right: 0;
		margin-top: 0.4rem;
		max-height: 18rem;
		overflow: auto;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: 0 10px 26px rgb(0 0 0 / 0.14);
		padding: 0.35rem;
	}

	.iq-title-dd-option {
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.6rem;
		border: none;
		border-radius: 0.4rem;
		background: transparent;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 14px;
		line-height: 1.25;
		color: var(--color-text);
		cursor: pointer;
		white-space: normal;
	}

	.iq-title-dd-option:hover {
		background: var(--color-gray-100);
	}

	.iq-title-dd-option[data-selected="true"] {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 35%, transparent);
	}

	.iq-title-dd-option:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.iq-seg {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: var(--chart-radius, 3px);
		overflow: hidden;
	}

	.iq-seg-btn {
		margin: 0;
		padding: 0.32rem 0.7rem;
		font-family: var(--chart-font-body, var(--font-body));
		font-size: var(--chart-fs-sm, 14px);
		border: none;
		background: var(--color-gray-100);
		color: var(--color-text);
		cursor: pointer;
	}

	.iq-seg-btn + .iq-seg-btn {
		border-left: 1px solid var(--color-border);
	}

	.iq-seg-btn[data-active="true"] {
		background: var(--color-surface);
		font-weight: 650;
		box-shadow: inset 0 0 0 1px var(--color-primary);
	}

	.iq-seg-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* question/subpart labels are now handled by the title dropdown */

	@media (max-width: 720px) {
		.iq-field--seg {
			width: 100%;
		}

		.iq-seg {
			width: fit-content;
		}
	}

	.iq-instructions {
		max-width: 46rem;
		margin: 0.1rem auto 1rem;
		padding: 0.55rem 0.85rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
		border-radius: 0.6rem;
		background: color-mix(in srgb, var(--color-gray-100) 70%, transparent);
		font-family: var(--chart-font-body, var(--font-body));
		font-size: 14px;
		line-height: 1.45;
		color: var(--chart-muted, var(--color-text-muted));
		text-align: center;
		text-wrap: pretty;
	}
</style>
