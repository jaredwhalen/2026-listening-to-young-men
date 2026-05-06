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
	import { page } from "$app/stores";

	const DEMO_SERIES_COLORS = {
		"Young men": "var(--pa-blue)",
		"Young women": "var(--pa-light-blue)",
		"Men 35-54": "var(--pa-primary-teal)",
		"Men 55+": "var(--pa-orange)",
	};

	const chartCopy = $derived(copy.charts?.dotplotInteractive ?? {});

	const pageTitle = $derived(
		(chartCopy.title && String(chartCopy.title).trim()) ||
			"Interactive dot plot",
	);

	const sectionParam = $derived(
		($page.url.searchParams.get("section") ?? "").trim(),
	);

	const sectionRows = $derived(
		sectionParam
			? filterRowsBySection(fullRows, sectionParam)
			: /** @type {Record<string, string>[]} */ ([]),
	);

	const topLevelGroups = $derived(groupTopLevelQuestions(sectionRows));

	let selectedQId = $state("");
	let selectedSliceKey = $state("");
	let mode = $state(/** @type {"demographic" | "typology"} */ ("demographic"));

	$effect(() => {
		const gs = topLevelGroups;
		if (!gs.length) return;
		if (!selectedQId || !gs.some((g) => g.qId === selectedQId)) {
			selectedQId = gs[0].qId;
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
		subpartSlices.find((s) => s.sliceKey === selectedSliceKey) ??
			subpartSlices[0] ??
			null,
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
		(chartCopy.title && String(chartCopy.title).trim()) || "",
	);
	const headerDek = $derived(
		(chartCopy.description && String(chartCopy.description).trim()) || "",
	);
	const headerNote = $derived(
		(chartCopy.note && String(chartCopy.note).trim()) || "",
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="page-inner">
	<InlineVisual titleText={headerTitle} dekText={headerDek} noteText={headerNote}>
		{#snippet children()}
			{#if !sectionParam}
				<p class="err" role="alert">
					Missing <code class="iq-code">section</code> query parameter (e.g.
					<code class="iq-code">?section=The%20Expectations%20Gap</code>).
				</p>
			{:else if !sectionRows.length}
				<p class="err" role="alert">
					No rows for section <strong>{sectionParam}</strong>. Known sections:
					{listSections(fullRows).join("; ") || "(none)"}.
				</p>
			{:else if !selectedGroup}
				<p class="err" role="alert">No questions in this section.</p>
			{:else}
				<div class="iq-controls">
					<label class="iq-field iq-field--grow">
						<span class="iq-field-label">Question</span>
						<select class="iq-select" bind:value={selectedQId}>
							{#each topLevelGroups as g (g.qId)}
								<option value={g.qId}>{topLevelQuestionMenuLabel(g)}</option>
							{/each}
						</select>
					</label>

					{#if showSlicePicker}
						<label class="iq-field iq-field--grow">
							<span class="iq-field-label">Subpart</span>
							<select class="iq-select" bind:value={selectedSliceKey}>
								{#each subpartSlices as s (s.sliceKey)}
									<option value={s.sliceKey}>{s.menuLabel}</option>
								{/each}
							</select>
						</label>
					{/if}

					<div class="iq-field iq-field--seg" role="group" aria-label="Highlighted series">
						<span class="iq-field-label">Highlight</span>
						<div class="iq-seg">
							<button
								type="button"
								class="iq-seg-btn"
								data-active={mode === "demographic"}
								aria-pressed={mode === "demographic"}
								onclick={() => (mode = "demographic")}
							>
								Demographics
							</button>
							<button
								type="button"
								class="iq-seg-btn"
								data-active={mode === "typology"}
								aria-pressed={mode === "typology"}
								onclick={() => (mode = "typology")}
							>
								Typology
							</button>
						</div>
					</div>
				</div>

				<p class="iq-question">{chartHeading}</p>

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

	.iq-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1rem;
		margin-bottom: 0.75rem;
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
	}

	.iq-seg {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: var(--chart-radius, 3px);
		overflow: hidden;
	}

	.iq-seg-btn {
		margin: 0;
		padding: 0.35rem 0.75rem;
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

	.iq-question {
		margin: 0 0 0.5rem;
		font-family: var(--chart-font-heading, var(--font-heading));
		font-size: var(--chart-fs-md, 18px);
		font-weight: var(--chart-weight-semibold, 600);
		line-height: 1.3;
		color: var(--chart-text, var(--color-text));
	}
</style>
