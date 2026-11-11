<script lang="ts">
	import { onMount } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';
	import type { SortItem, SortQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { questionRevision } from '#lib/content/course.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';

	let { question }: { question: SortQuestion } = $props();
	let orderedItems = $state<SortItem[]>([]);
	let invalidItems = $state<SortItem[]>([]);
	let submitError = $state('');
	let restoredAnswer = $state(false);
	let dragging = $state(false);
	let saved = $derived($progress.answers[question.id]);
	let changed = $derived($progress.changeNotices.includes(question.id));

	function restoreSavedOrder(placements: Record<string, string>) {
		orderedItems = question.items
			.filter((item) => placements[item.id]?.startsWith('heading-position-'))
			.sort(
				(a, b) =>
					Number(placements[a.id]?.replace('heading-position-', '')) -
					Number(placements[b.id]?.replace('heading-position-', ''))
			);
		invalidItems = question.items.filter((item) => placements[item.id] === 'invalid-headings');
	}

	$effect(() => {
		if (!saved?.placements || restoredAnswer) return;
		restoredAnswer = true;
		restoreSavedOrder(saved.placements);
	});

	onMount(() => {
		if (saved?.placements) {
			restoreSavedOrder(saved.placements);
			restoredAnswer = true;
			return;
		}
		orderedItems = [...question.items];
		for (let index = orderedItems.length - 1; index > 0; index--) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[orderedItems[index], orderedItems[swapIndex]] = [orderedItems[swapIndex], orderedItems[index]];
		}
	});

	function submit() {
		if (saved || dragging) return;
		if (orderedItems.length + invalidItems.length !== question.items.length) {
			submitError = 'Place every heading in the order or invalid area before submitting.';
			return;
		}

		const placements = Object.fromEntries([
			...orderedItems.map((item, index) => [item.id, `heading-position-${index + 1}`]),
			...invalidItems.map((item) => [item.id, 'invalid-headings'])
		]);
		const isCorrect = question.items.every(
			(item) => placements[item.id] === question.answerKey[item.id]
		);
		const answer: SubmittedAnswer = {
			questionId: question.id,
			revision: questionRevision(question),
			submittedAt: new Date().toISOString(),
			type: question.type,
			placements,
			isCorrect
		};
		try {
			saveAnswer(answer);
			clearChangeNotice(question.id);
			submitError = '';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Your answer could not be saved.';
		}
	}
</script>

<section class="exercise-card" aria-labelledby={`${question.id}-prompt`}>
	<h3 id={`${question.id}-prompt`} class="text-lg font-semibold text-slate-950">
		{@html renderInline(question.prompt)}
	</h3>
	<p class="mt-2 text-sm text-slate-600">{question.instructions}</p>
	<p class="mt-2 text-xs text-slate-500">Drag to reorder or move between areas. With the keyboard, press Space to pick up an item, use arrow keys to reorder or Tab to change area, then press Space to drop.</p>
	{#if changed}
		<p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
			This question changed since your last visit, so your previous answer was cleared. Please answer the updated question.
		</p>
	{/if}

	<div class="sort-exercise-layout">
		<div>
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Order from smallest to largest</h4>
			<ol
				class="sort-order-list exercise-dnd-zone"
				aria-label="Heading order"
				use:dndzone={{ items: orderedItems, type: question.id, dragDisabled: Boolean(saved), morphDisabled: true, centreDraggedOnCursor: true, delayTouchStart: true }}
				onconsider={(event) => { orderedItems = event.detail.items; dragging = true; }}
				onfinalize={(event) => { orderedItems = event.detail.items; dragging = false; }}
			>
				{#each orderedItems as item, index (item.id)}
					{@const itemCorrect = saved && saved.placements?.[item.id] === question.answerKey[item.id]}
					<li class="sort-order-row">
						<span class="sort-position">{index + 1}</span>
						<span class="sort-chip" class:answer-correct={Boolean(saved) && itemCorrect} class:answer-incorrect={Boolean(saved) && !itemCorrect}>
							{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
							{item.text}
						</span>
					</li>
				{/each}
			</ol>
			{#if !orderedItems.length}<p class="mt-2 text-xs text-slate-500">Drop valid headings here.</p>{/if}
		</div>

		<div class="sort-invalid-target">
			<h4 class="text-sm font-semibold text-slate-700">Not valid HTML headings</h4>
			<p class="mt-1 text-xs text-slate-500">Move elements that do not exist in HTML here.</p>
			<div
				class="exercise-dnd-zone mt-3 flex flex-wrap gap-2"
				aria-label="Not valid HTML headings"
				use:dndzone={{ items: invalidItems, type: question.id, dragDisabled: Boolean(saved), morphDisabled: true, centreDraggedOnCursor: true, delayTouchStart: true }}
				onconsider={(event) => { invalidItems = event.detail.items; dragging = true; }}
				onfinalize={(event) => { invalidItems = event.detail.items; dragging = false; }}
			>
				{#each invalidItems as item (item.id)}
					{@const itemCorrect = saved && saved.placements?.[item.id] === question.answerKey[item.id]}
					<div class="sort-chip" class:answer-correct={Boolean(saved) && itemCorrect} class:answer-incorrect={Boolean(saved) && !itemCorrect}>
						{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
						{item.text}
					</div>
				{/each}
			</div>
		</div>
	</div>

	{#if !saved}
		<button class="button-primary mt-5" disabled={dragging} onclick={submit}>Submit answer</button>
	{:else}
		<p class="mt-3 text-sm font-semibold" class:text-emerald-800={saved.isCorrect} class:text-rose-800={!saved.isCorrect}>
			{saved.isCorrect ? 'Correct' : 'Not quite'}
		</p>
		{#if question.feedback}
			<div class="feedback-content prose mt-3 max-w-none">
				{@html renderMarkdown(question.feedback)}
			</div>
		{/if}
	{/if}

	{#if submitError}
		<p class="mt-3 text-sm text-rose-800" role="alert">{submitError}</p>
	{/if}
</section>
