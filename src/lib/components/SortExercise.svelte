<script lang="ts">
	import { onMount } from 'svelte';
	import { dndzone, SOURCES, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
	import { renderMarkdown } from '#lib/content/markdown.js';
	import type { SortItem, SortQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { questionRevision } from '#lib/content/course.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';
	import ExerciseFeedback from './ExerciseFeedback.svelte';
	import ExercisePrompt from './ExercisePrompt.svelte';
	import ExerciseHelp from './ExerciseHelp.svelte';
	import ExerciseDebug from './ExerciseDebug.svelte';
	import ExerciseChangeAlert from './ExerciseChangeAlert.svelte';

	let { question }: { question: SortQuestion } = $props();
	let orderedItems = $state<SortItem[]>([]);
	let invalidItems = $state<SortItem[]>([]);
	let poolItems = $state<SortItem[]>([]);
	let initialItems: SortItem[] = [];
	let submitError = $state('');
	let restoredAnswer = $state(false);
	let practicing = $state(false);
	let practiceAnswer = $state<SubmittedAnswer>();
	let firstAttempt = $derived($progress.answers[question.id]);
	let saved = $derived(firstAttempt ? (practicing ? practiceAnswer : firstAttempt) : undefined);
	let dragging = $state(false);
	let changed = $derived($progress.changeNotices.includes(question.id));

	$effect(() => {
		if (!firstAttempt) {
			practicing = false;
			practiceAnswer = undefined;
		}
	});

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
		initialItems = [...question.items];
		for (let index = initialItems.length - 1; index > 0; index--) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[initialItems[index], initialItems[swapIndex]] = [
				initialItems[swapIndex],
				initialItems[index]
			];
		}
		if (saved?.placements) {
			restoreSavedOrder(saved.placements);
			restoredAnswer = true;
			return;
		}
		orderedItems = [...initialItems];
	});

	function finalize(event: CustomEvent<DndEvent<SortItem>>, zone: 'order' | 'invalid' | 'pool') {
		const { items, info } = event.detail;
		if (zone === 'order') orderedItems = items;
		else if (zone === 'invalid') invalidItems = items;
		else poolItems = items;
		if (info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
			orderedItems = orderedItems.filter((item) => item.id !== info.id);
			invalidItems = invalidItems.filter((item) => item.id !== info.id);
			const poolIds = new Set([...poolItems.map((item) => item.id), info.id]);
			poolItems = initialItems.filter((item) => poolIds.has(item.id));
		}
		dragging = info.source === SOURCES.KEYBOARD;
	}

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
			if (!firstAttempt) saveAnswer(answer);
			else practiceAnswer = answer;
			clearChangeNotice(question.id);
			submitError = '';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Your answer could not be saved.';
		}
	}

	function tryAgain() {
		practicing = true;
		practiceAnswer = undefined;
		submitError = '';
	}

	function removeAll() {
		if (saved) tryAgain();
		orderedItems = [];
		invalidItems = [];
		poolItems = [...initialItems];
		submitError = '';
	}

	function distributeRandomly() {
		const items = [...question.items];
		for (let index = items.length - 1; index > 0; index--) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[items[index], items[swapIndex]] = [items[swapIndex], items[index]];
		}
		orderedItems = items.filter(() => Math.random() < 0.75);
		const orderedIds = new Set(orderedItems.map((item) => item.id));
		invalidItems = items.filter((item) => !orderedIds.has(item.id));
		poolItems = [];
		submitError = '';
	}
</script>

<section
	class="exercise-card"
	data-question-id={question.id}
	aria-labelledby={`${question.id}-prompt`}
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<ExercisePrompt id={question.id} prompt={question.prompt} />
		</div>
		<ExerciseHelp
			id={question.id}
			text="Drag to reorder or move between areas. With the keyboard, press Space to pick up an item, use arrow keys to reorder or Tab to change area, then press Space to drop."
		/>
	</div>
	<ExerciseDebug fill={distributeRandomly} disabled={Boolean(saved) || dragging} />
	<div class="exercise-description prose max-w-none">
		{#each Array.isArray(question.instructions) ? question.instructions : [question.instructions] as block}
			{@html renderMarkdown(block)}
		{/each}
	</div>
	<ExerciseChangeAlert {changed} />

	<div class="mt-5">
		<h4 class="mb-2 text-sm font-semibold text-slate-700">Items to place</h4>
		<div
			class="exercise-dnd-zone flex flex-wrap gap-2"
			aria-label="Items to place"
			use:dndzone={{
				items: poolItems,
				type: question.id,
				dragDisabled: Boolean(saved),
				morphDisabled: true,
				centreDraggedOnCursor: true,
				delayTouchStart: true
			}}
			onconsider={(event) => {
				poolItems = event.detail.items;
				dragging = event.detail.info.trigger !== TRIGGERS.DRAG_STOPPED;
			}}
			onfinalize={(event) => finalize(event, 'pool')}
		>
			{#each poolItems as item (item.id)}
				<div class="sort-chip">{item.text}</div>
			{/each}
		</div>
		<p class="mt-2 text-xs text-slate-500">Drop outside a destination to return an item here.</p>
	</div>

	<div class="sort-exercise-layout">
		<div>
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Order from smallest to largest</h4>
			<ol
				class="sort-order-list exercise-dnd-zone"
				aria-label="Heading order"
				use:dndzone={{
					items: orderedItems,
					type: question.id,
					dragDisabled: Boolean(saved),
					morphDisabled: true,
					centreDraggedOnCursor: true,
					delayTouchStart: true
				}}
				onconsider={(event) => {
					orderedItems = event.detail.items;
					dragging = event.detail.info.trigger !== TRIGGERS.DRAG_STOPPED;
				}}
				onfinalize={(event) => finalize(event, 'order')}
			>
				{#each orderedItems as item, index (item.id)}
					{@const itemCorrect =
						saved && saved.placements?.[item.id] === question.answerKey[item.id]}
					<li class="sort-order-row">
						<span class="sort-position">{index + 1}</span>
						<span
							class="sort-chip"
							class:answer-correct={Boolean(saved) && itemCorrect}
							class:answer-incorrect={Boolean(saved) && !itemCorrect}
						>
							{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
							{item.text}
						</span>
					</li>
				{/each}
			</ol>
			{#if !orderedItems.length}<p class="mt-2 text-xs text-slate-500">
					Drop valid headings here.
				</p>{/if}
		</div>

		<div class="sort-invalid-target">
			<h4 class="text-sm font-semibold text-slate-700">Not valid HTML headings</h4>
			<p class="mt-1 text-xs text-slate-500">Move elements that do not exist in HTML here.</p>
			<div
				class="exercise-dnd-zone mt-3 flex flex-wrap gap-2"
				aria-label="Not valid HTML headings"
				use:dndzone={{
					items: invalidItems,
					type: question.id,
					dragDisabled: Boolean(saved),
					morphDisabled: true,
					centreDraggedOnCursor: true,
					delayTouchStart: true
				}}
				onconsider={(event) => {
					invalidItems = event.detail.items;
					dragging = event.detail.info.trigger !== TRIGGERS.DRAG_STOPPED;
				}}
				onfinalize={(event) => finalize(event, 'invalid')}
			>
				{#each invalidItems as item (item.id)}
					{@const itemCorrect =
						saved && saved.placements?.[item.id] === question.answerKey[item.id]}
					<div
						class="sort-chip"
						class:answer-correct={Boolean(saved) && itemCorrect}
						class:answer-incorrect={Boolean(saved) && !itemCorrect}
					>
						{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
						{item.text}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-5 flex flex-wrap gap-2">
		{#if saved}
			<button class="button-secondary" disabled={dragging} onclick={tryAgain}>Try again</button>
		{/if}
		<button class="button-secondary" disabled={dragging} onclick={removeAll}>Remove all</button>
	</div>

	{#if !saved}
		<button class="button-primary mt-5" disabled={dragging} onclick={submit}>Submit answer</button>
	{:else}
		<p
			class="mt-3 text-sm font-semibold"
			class:text-emerald-800={saved.isCorrect}
			class:text-rose-800={!saved.isCorrect}
		>
			{saved.isCorrect ? 'Correct' : 'Not quite'}
		</p>
	{/if}

	{#if firstAttempt}
		<p class="mt-3 text-xs text-slate-500">
			Your first attempt has been saved for the JSON export so we can discuss it during our
			consultation hour. Feel free to practise as often as you like afterwards.
		</p>
	{/if}

	{#if submitError}
		<p class="mt-3 text-sm text-rose-800" role="alert">{submitError}</p>
	{/if}
</section>
{#if saved && (question.feedback || question.bonusId)}
	<ExerciseFeedback feedback={question.feedback} id={question.id} bonusId={question.bonusId} />
{/if}
