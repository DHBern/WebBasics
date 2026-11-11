<script lang="ts">
	import { onMount } from 'svelte';
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';
	import type { SortQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { questionRevision } from '#lib/content/course.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';

	let { question }: { question: SortQuestion } = $props();
	let orderedIds = $state<string[]>([]);
	let invalidIds = $state<string[]>([]);
	let draggedItemId = '';
	let submitError = $state('');
	let restoredAnswer = $state(false);
	let practicing = $state(false);
	let practiceAnswer = $state<SubmittedAnswer>();
	let firstAttempt = $derived($progress.answers[question.id]);
	let saved = $derived(firstAttempt ? (practicing ? practiceAnswer : firstAttempt) : undefined);
	let changed = $derived($progress.changeNotices.includes(question.id));

	$effect(() => {
		if (!firstAttempt) {
			practicing = false;
			practiceAnswer = undefined;
		}
	});

	function restoreSavedOrder(placements: Record<string, string>) {
		orderedIds = question.items
			.filter((item) => placements[item.id]?.startsWith('heading-position-'))
			.sort(
				(a, b) =>
					Number(placements[a.id]?.replace('heading-position-', '')) -
					Number(placements[b.id]?.replace('heading-position-', ''))
			)
			.map((item) => item.id);
		invalidIds = question.items
			.filter((item) => placements[item.id] === 'invalid-headings')
			.map((item) => item.id);
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
		orderedIds = question.items.map((item) => item.id);
		for (let index = orderedIds.length - 1; index > 0; index--) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[orderedIds[index], orderedIds[swapIndex]] = [orderedIds[swapIndex], orderedIds[index]];
		}
	});

	function itemText(itemId: string): string {
		return question.items.find((item) => item.id === itemId)?.text ?? itemId;
	}

	function moveItem(itemId: string, index: number) {
		if (saved) return;
		const current = orderedIds.indexOf(itemId);
		if (current === -1) return;
		const next = [...orderedIds];
		next.splice(current, 1);
		next.splice(Math.max(0, Math.min(index, next.length)), 0, itemId);
		orderedIds = next;
	}

	function moveToInvalid(itemId: string) {
		if (saved || !orderedIds.includes(itemId)) return;
		orderedIds = orderedIds.filter((id) => id !== itemId);
		invalidIds = [...invalidIds, itemId];
	}

	function restoreToOrder(itemId: string) {
		if (saved || !invalidIds.includes(itemId)) return;
		invalidIds = invalidIds.filter((id) => id !== itemId);
		orderedIds = [...orderedIds, itemId];
	}

	function startDrag(event: DragEvent, itemId: string) {
		draggedItemId = itemId;
		event.dataTransfer?.setData('text/plain', itemId);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function dropBefore(event: DragEvent, targetItemId: string) {
		event.preventDefault();
		const itemId = event.dataTransfer?.getData('text/plain') || draggedItemId;
		if (itemId && itemId !== targetItemId) {
			const targetIndex = orderedIds.indexOf(targetItemId);
			const itemIndex = orderedIds.indexOf(itemId);
			moveItem(itemId, targetIndex - (itemIndex < targetIndex ? 1 : 0));
		}
		draggedItemId = '';
	}

	function dropOnInvalid(event: DragEvent) {
		event.preventDefault();
		const itemId = event.dataTransfer?.getData('text/plain') || draggedItemId;
		if (itemId) moveToInvalid(itemId);
		draggedItemId = '';
	}

	function submit() {
		if (saved) return;
		if (orderedIds.length + invalidIds.length !== question.items.length) {
			submitError = 'Place every heading in the order or invalid area before submitting.';
			return;
		}

		const placements = Object.fromEntries([
			...orderedIds.map((itemId, index) => [itemId, `heading-position-${index + 1}`]),
			...invalidIds.map((itemId) => [itemId, 'invalid-headings'])
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
</script>

<section class="exercise-card" aria-labelledby={`${question.id}-prompt`}>
	<h3 id={`${question.id}-prompt`} class="text-lg font-semibold text-slate-950">
		{@html renderInline(question.prompt)}
	</h3>
	<p class="mt-2 text-sm text-slate-600">{question.instructions}</p>
	{#if changed}
		<p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
			This question changed since your last visit, so your previous answer was cleared. Please answer the updated question.
		</p>
	{/if}

	<div class="sort-exercise-layout">
		<div>
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Order from smallest to largest</h4>
			<ol class="sort-order-list" aria-label="Heading order">
				{#each orderedIds as itemId, index (itemId)}
					{@const itemCorrect = saved && saved.placements?.[itemId] === question.answerKey[itemId]}
					<li
						class="sort-order-row"
						ondragover={(event) => event.preventDefault()}
						ondrop={(event) => dropBefore(event, itemId)}
					>
						<span class="sort-position">{index + 1}</span>
						<button
							type="button"
							class="sort-chip"
							class:answer-correct={Boolean(saved) && itemCorrect}
							class:answer-incorrect={Boolean(saved) && !itemCorrect}
							draggable={!saved}
							disabled={Boolean(saved)}
							ondragstart={(event) => startDrag(event, itemId)}
						>
							{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
							{itemText(itemId)}
						</button>
						{#if !saved}
							<div class="sort-order-controls">
								<button type="button" class="button-secondary" disabled={index === 0} onclick={() => moveItem(itemId, index - 1)} aria-label={`Move ${itemText(itemId)} up`}>Move up</button>
								<button type="button" class="button-secondary" disabled={index === orderedIds.length - 1} onclick={() => moveItem(itemId, index + 1)} aria-label={`Move ${itemText(itemId)} down`}>Move down</button>
								<button type="button" class="button-secondary" onclick={() => moveToInvalid(itemId)}>Not a heading</button>
							</div>
						{/if}
					</li>
				{/each}
			</ol>
			{#if !saved && orderedIds.length === 0}
				<button
					type="button"
					class="sort-empty-target"
					ondragover={(event) => event.preventDefault()}
					ondrop={(event) => {
						event.preventDefault();
						const itemId = event.dataTransfer?.getData('text/plain') || draggedItemId;
						if (itemId && !invalidIds.includes(itemId)) orderedIds = [...orderedIds, itemId];
					}}
				>
					Drop valid headings here
				</button>
			{/if}
		</div>

		<div
			class="sort-invalid-target"
			ondragover={(event) => event.preventDefault()}
			ondrop={dropOnInvalid}
			role="group"
			aria-label="Not valid HTML headings"
		>
			<h4 class="text-sm font-semibold text-slate-700">Not valid HTML headings</h4>
			<p class="mt-1 text-xs text-slate-500">Move elements that do not exist in HTML here.</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#each invalidIds as itemId (itemId)}
					{@const itemCorrect = saved && saved.placements?.[itemId] === question.answerKey[itemId]}
					<div class="sort-invalid-chip">
						<button
							type="button"
							class="sort-chip"
							class:answer-correct={Boolean(saved) && itemCorrect}
							class:answer-incorrect={Boolean(saved) && !itemCorrect}
							draggable={!saved}
							disabled={Boolean(saved)}
							ondragstart={(event) => startDrag(event, itemId)}
						>
							{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
							{itemText(itemId)}
						</button>
						{#if !saved}
							<button type="button" class="button-secondary" onclick={() => restoreToOrder(itemId)}>Add to order</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

	{#if !saved}
		<button class="button-primary mt-5" onclick={submit}>Submit answer</button>
	{:else}
		<p class="mt-3 text-sm font-semibold" class:text-emerald-800={saved.isCorrect} class:text-rose-800={!saved.isCorrect}>
			{saved.isCorrect ? 'Correct' : 'Not quite'}
		</p>
		{#if question.feedback}
			<div class="feedback-content prose mt-3 max-w-none">
				{@html renderMarkdown(question.feedback)}
			</div>
		{/if}
		<button class="button-secondary mt-3" onclick={tryAgain}>Try again</button>
	{/if}

	{#if firstAttempt}
		<p class="mt-3 text-xs text-slate-500">
			Your first attempt ({firstAttempt.isCorrect ? 'correct' : 'not quite'}) is saved for the JSON export. You can practise as often as you like; retries do not change that result.
		</p>
	{/if}

	{#if submitError}
		<p class="mt-3 text-sm text-rose-800" role="alert">{submitError}</p>
	{/if}
</section>
