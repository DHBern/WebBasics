<script lang="ts">
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';
	import type { SortQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { questionRevision } from '#lib/content/course.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';

	let { question }: { question: SortQuestion } = $props();
	let draftPlacements = $state<Record<string, string>>({});
	let selectedItemId = $state('');
	let draggedItemId = '';
	let submitError = $state('');
	let saved = $derived($progress.answers[question.id]);
	let placements = $derived(saved?.placements ?? draftPlacements);
	let changed = $derived($progress.changeNotices.includes(question.id));
	const multiTargetIds = new Set(['block', 'inline', 'table-category', 'list-category', 'both-category', 'neither-category']);
	let droppableTargetIds = $derived(new Set(Object.values(question.answerKey)));

	function targetDepth(targetId: string): number {
		let depth = 0;
		let current = question.targets.find((target) => target.id === targetId);
		while (current?.parentId) {
			depth++;
			const parentId = current.parentId;
			current = question.targets.find((target) => target.id === parentId);
		}
		return depth;
	}

	function placeItem(itemId: string, targetId: string) {
		if (saved) return;
		const next = { ...draftPlacements };
		if (!multiTargetIds.has(targetId)) {
			for (const [placedId, placedTarget] of Object.entries(next)) {
				if (placedTarget === targetId && placedId !== itemId) {
					const previousTarget = next[itemId];
					if (previousTarget) next[placedId] = previousTarget;
					else delete next[placedId];
				}
			}
		}
		next[itemId] = targetId;
		draftPlacements = next;
		selectedItemId = '';
	}

	function startDrag(event: DragEvent, itemId: string) {
		draggedItemId = itemId;
		event.dataTransfer?.setData('text/plain', itemId);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function dropOn(event: DragEvent, targetId: string) {
		event.preventDefault();
		const itemId = event.dataTransfer?.getData('text/plain') || draggedItemId;
		if (itemId) placeItem(itemId, targetId);
		draggedItemId = '';
	}

	function submit() {
		if (saved) return;
		const complete = Object.keys(question.answerKey).every((itemId) => placements[itemId]);
		if (!complete) {
			submitError = 'Place every required item before submitting.';
			return;
		}
		const isCorrect = question.items.every(
			(item) => (placements[item.id] ?? '') === (question.answerKey[item.id] ?? '')
		);
		const answer: SubmittedAnswer = {
			questionId: question.id,
			revision: questionRevision(question),
			submittedAt: new Date().toISOString(),
			type: question.type,
			placements: { ...draftPlacements },
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
	{#if changed}
		<p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
			This question changed since your last visit, so your previous answer was cleared. Please answer the updated question.
		</p>
	{/if}

	<div class="mt-5 grid gap-5 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.2fr)]">
		<div>
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Items to place</h4>
			<div class="flex flex-wrap gap-2" aria-label="Items to sort">
				{#each question.items as item (item.id)}
					{@const itemTarget = placements[item.id]}
					{@const itemCorrect = saved && (saved.placements?.[item.id] ?? '') === (question.answerKey[item.id] ?? '')}
					{#if !itemTarget}
						<button
							type="button"
							class="sort-chip"
							class:sort-chip-selected={selectedItemId === item.id}
							class:answer-correct={Boolean(saved) && itemCorrect}
							class:answer-incorrect={Boolean(saved) && !itemCorrect}
							draggable={!saved}
							disabled={Boolean(saved)}
							aria-pressed={selectedItemId === item.id}
							ondragstart={(event) => startDrag(event, item.id)}
							onclick={() => (selectedItemId = selectedItemId === item.id ? '' : item.id)}
						>
							{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
							{@html renderInline(item.text)}
						</button>
					{/if}
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-500">Drag an item, or select it and then choose a destination.</p>
		</div>

		<div>
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Dropzones</h4>
			<div class="space-y-2">
				{#each question.targets as target (target.id)}
					{@const placedItems = question.items.filter((item) => placements[item.id] === target.id)}
					<div
						class="sort-target"
						role="group"
						aria-label={target.label}
						class:sort-target-child={targetDepth(target.id) > 0}
						style={`--target-depth: ${targetDepth(target.id)}`}
						ondragover={(event) => event.preventDefault()}
						ondrop={(event) => dropOn(event, target.id)}
					>
						<div class="flex min-h-11 items-center gap-2">
							<span class="text-xs text-slate-500">{target.label}</span>
							{#if droppableTargetIds.has(target.id) && placedItems.length}
								{#each placedItems as item (item.id)}
									{@const itemCorrect = saved && (saved.placements?.[item.id] ?? '') === (question.answerKey[item.id] ?? '')}
									<button
										type="button"
										class="sort-chip"
										class:answer-correct={Boolean(saved) && itemCorrect}
										class:answer-incorrect={Boolean(saved) && !itemCorrect}
										disabled={Boolean(saved)}
										draggable={!saved}
										ondragstart={(event) => startDrag(event, item.id)}
										onclick={() => {
											if (selectedItemId && selectedItemId !== item.id) placeItem(selectedItemId, target.id);
											else selectedItemId = item.id;
										}}
									>
										{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
										{@html renderInline(item.text)}
									</button>
								{/each}
							{:else if droppableTargetIds.has(target.id)}
								<button
									type="button"
									class="min-h-8 flex-1 rounded border border-dashed border-slate-300 px-2 text-left text-xs text-slate-400"
									disabled={Boolean(saved)}
									onclick={() => selectedItemId && placeItem(selectedItemId, target.id)}
								>
									{selectedItemId ? 'Place selected item here' : 'Drop or select an item'}
								</button>
							{:else}
								<span class="text-xs text-slate-400">Document container</span>
							{/if}
						</div>
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
	{/if}

	{#if submitError}
		<p class="mt-3 text-sm text-rose-800" role="alert">{submitError}</p>
	{/if}
</section>
