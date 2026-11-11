<script lang="ts">
	import { renderMarkdown } from '#lib/content/markdown.js';
	import type { DragAndDropQuestion, SortItem, SubmittedAnswer } from '#lib/content/types.js';
	import { dndzone, SOURCES, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
	import { isPlacementCorrect, questionRevision } from '#lib/content/course.js';
	import { onMount, untrack } from 'svelte';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';
	import HtmlSyntaxDiagram from './HtmlSyntaxDiagram.svelte';
	import ExerciseFeedback from './ExerciseFeedback.svelte';
	import ExercisePrompt from './ExercisePrompt.svelte';

	let { question }: { question: DragAndDropQuestion } = $props();
	let draftPlacements = $state<Record<string, string>>({});
	let selectedItemId = $state('');
	let shuffledItems = $state<DragAndDropQuestion['items']>([]);
	let shuffleReady = $state(false);
	let zones = $state<Record<string, SortItem[]>>({});
	let submitError = $state('');
	let dragging = $state(false);
	let practicing = $state(false);
	let practiceAnswer = $state<SubmittedAnswer>();
	let firstAttempt = $derived($progress.answers[question.id]);
	let saved = $derived(firstAttempt ? (practicing ? practiceAnswer : firstAttempt) : undefined);
	let placements = $derived(saved?.placements ?? draftPlacements);
	let changed = $derived($progress.changeNotices.includes(question.id));
	const multiTargetIds = new Set(['block', 'inline', 'table-category', 'list-category', 'both-category', 'neither-category', 'invisible-target']);

	$effect(() => {
		if (!firstAttempt) {
			practicing = false;
			practiceAnswer = undefined;
		}
	});

	$effect(() => {
		saved;
		if (shuffleReady) untrack(syncZones);
	});

	onMount(() => {
		shuffledItems = [...question.items];
		if (!$progress.answers[question.id]) {
			for (let index = shuffledItems.length - 1; index > 0; index--) {
				const swapIndex = Math.floor(Math.random() * (index + 1));
				[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
			}
		}
		shuffleReady = true;
		syncZones();
	});

	function syncZones() {
		zones = Object.fromEntries(
			['pool', ...question.targets.map((target) => target.id)].map((id) => [
				id,
				shuffledItems.filter((item) => (placements[item.id] ?? 'pool') === id)
			])
		);
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
		syncZones();
	}

	function consider(event: CustomEvent<DndEvent<SortItem>>, targetId: string) {
		zones = { ...zones, [targetId]: event.detail.items };
		dragging = event.detail.info.trigger !== TRIGGERS.DRAG_STOPPED;
	}

	function finalize(event: CustomEvent<DndEvent<SortItem>>, targetId: string) {
		if (!saved && [TRIGGERS.DROPPED_INTO_ZONE, TRIGGERS.DROPPED_OUTSIDE_OF_ANY].includes(event.detail.info.trigger)) {
			const itemId = event.detail.info.id;
			if (targetId === 'pool' || event.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
				const next = { ...draftPlacements };
				delete next[itemId];
				draftPlacements = next;
			} else {
				placeItem(itemId, targetId);
			}
		}
		syncZones();
		dragging = event.detail.info.source === SOURCES.KEYBOARD;
	}

	function submit() {
		if (saved || dragging) return;
		const complete = Object.keys(question.answerKey).every((itemId) => placements[itemId]);
		if (!complete) {
			submitError = 'Place every required item before submitting.';
			return;
		}
		const isCorrect = question.items.every((item) =>
			isPlacementCorrect(question, item.id, placements[item.id] ?? '')
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
			if (!firstAttempt) saveAnswer(answer);
			else practiceAnswer = answer;
			clearChangeNotice(question.id);
			submitError = '';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Your answer could not be saved.';
		}
	}

	function tryAgain() {
		draftPlacements = { ...saved?.placements };
		selectedItemId = '';
		submitError = '';
		practicing = true;
		practiceAnswer = undefined;
	}

	function removeAll() {
		if (saved) tryAgain();
		draftPlacements = {};
		selectedItemId = '';
		submitError = '';
		syncZones();
	}
</script>

{#snippet targetSlot(targetId: string)}
	{@const target = question.targets.find((candidate) => candidate.id === targetId)}
	{@const placedItems = zones[targetId] ?? []}
	<div
		class="sort-target"
		role="group"
		aria-label={target?.label ?? 'Dropzone'}
	>
		<div
			class="exercise-dnd-zone flex flex-wrap gap-2"
			use:dndzone={{ items: placedItems, type: question.id, dragDisabled: Boolean(saved), morphDisabled: true, centreDraggedOnCursor: true, delayTouchStart: true }}
			onconsider={(event) => consider(event, targetId)}
			onfinalize={(event) => finalize(event, targetId)}
			aria-label={target?.label ?? 'Dropzone'}
		>
			{#each placedItems as item (item.id)}
				{@const itemCorrect = saved && isPlacementCorrect(question, item.id, saved.placements?.[item.id] ?? '')}
				<button
					type="button"
					class="sort-chip"
					class:answer-correct={Boolean(saved) && itemCorrect}
					class:answer-incorrect={Boolean(saved) && !itemCorrect}
					disabled={Boolean(saved)}
					onclick={() => {
						if (selectedItemId && selectedItemId !== item.id) placeItem(selectedItemId, targetId);
						else selectedItemId = item.id;
					}}
				>
					{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
					{item.text}
				</button>
			{/each}
		</div>
		{#if !placedItems.length}
			<button
				type="button"
				class="drop-placeholder dnd-placeholder"
				class:url-placeholder={question.id === 'url-parts'}
				aria-label={`Drop ${target?.label ?? 'item'} here`}
				disabled={Boolean(saved)}
				onclick={() => selectedItemId && placeItem(selectedItemId, targetId)}
			>
				{target?.displayText ?? (question.id === 'url-parts' ? '___' : 'Drop here')}
			</button>
		{/if}
	</div>
{/snippet}

<section class="exercise-card" aria-labelledby={`${question.id}-prompt`}>
	<ExercisePrompt id={question.id} prompt={question.prompt} />
	<div class="exercise-description prose mt-2 max-w-none text-sm text-slate-600">
		{#each Array.isArray(question.instructions) ? question.instructions : [question.instructions] as block}
			{@html renderMarkdown(block)}
		{/each}
	</div>
	{#if changed}
		<p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
			This question changed since your last visit, so your previous answer was cleared. Please answer the updated question.
		</p>
	{/if}

	{#if !shuffleReady}
		<p class="mt-5 text-sm text-slate-500" role="status">Preparing shuffled items…</p>
	{:else}
		<div class="mt-5">
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Items to place</h4>
			<div
				class="exercise-dnd-zone flex flex-wrap gap-2"
				aria-label="Items to place"
				use:dndzone={{ items: zones.pool ?? [], type: question.id, dragDisabled: Boolean(saved), morphDisabled: true, centreDraggedOnCursor: true, delayTouchStart: true }}
				onconsider={(event) => consider(event, 'pool')}
				onfinalize={(event) => finalize(event, 'pool')}
			>
				{#each zones.pool ?? [] as item (item.id)}
						<button
							type="button"
							class="sort-chip"
							class:sort-chip-selected={selectedItemId === item.id}
							disabled={Boolean(saved)}
							aria-pressed={selectedItemId === item.id}
							onclick={() => (selectedItemId = selectedItemId === item.id ? '' : item.id)}
						>
							{item.text}
						</button>
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-500">Drag an item, or select it and then choose a destination. Drop outside a destination to return an item here. To drag with the keyboard, press Space, use the arrow keys or Tab, then press Space to drop.</p>
		</div>

		{#if question.id === 'url-parts' || question.id === 'url-query-params'}
			<div class="url-exercise mt-5">
			<div class="url-string" aria-label="URL template">
				{#each question.targets as target (target.id)}
					{#if target.prefix}<span class="url-literal">{target.prefix}</span>{/if}
					<div class="url-drop-slot">
						<span class="sr-only">{target.label}</span>
						{@render targetSlot(target.id)}
					</div>
					{#if target.suffix}<span class="url-literal">{target.suffix}</span>{/if}
				{/each}
			</div>
		</div>
		{:else if question.id === 'html-parts'}
			<HtmlSyntaxDiagram {targetSlot} />
		{:else if question.id === 'body-element-tree'}
		<div class="webpage-diagram mt-5">
			<div class="webpage-invisible">
				<strong>Invisible to the user</strong>
				{@render targetSlot('invisible-target')}
			</div>
			<div class="webpage-body-frame">
				<div class="webpage-role-label">Page body</div>
				{@render targetSlot('body-target')}
				<div class="webpage-header">
					<div class="webpage-role-label">Site header</div>
					{@render targetSlot('header-target')}
					<div class="webpage-nav">
						<div class="webpage-role-label">Site navigation</div>
						{@render targetSlot('nav-target')}
					</div>
				</div>
				<div class="webpage-main">
					<div class="webpage-role-label">Primary content</div>
					{@render targetSlot('main-target')}
					<div class="webpage-columns">
						<div class="webpage-article">
							<div class="webpage-role-label">Article content</div>
							{@render targetSlot('article-target')}
							<div class="webpage-section">
								<div class="webpage-role-label">Article section</div>
								{@render targetSlot('section-target')}
							</div>
						</div>
						<div class="webpage-aside">
							<div class="webpage-role-label">Related links</div>
							{@render targetSlot('aside-target')}
						</div>
					</div>
				</div>
				<div class="webpage-footer">
					<div class="webpage-role-label">Footer details</div>
					{@render targetSlot('footer-target')}
				</div>
			</div>
		</div>
		{:else}
			<div class="dropzone-grid mt-5" aria-label="Dropzones">
				{#each question.targets.filter((target) => target.id !== 'document') as target (target.id)}
					<div class="dropzone-card">
						<span class="dropzone-label">{target.label}</span>
						{@render targetSlot(target.id)}
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="mt-5 flex flex-wrap gap-2">
		{#if saved}
			<button class="button-secondary" disabled={dragging} onclick={tryAgain}>Try again</button>
		{/if}
		<button class="button-secondary" disabled={dragging || !shuffleReady} onclick={removeAll}>Remove all</button>
	</div>

	{#if !saved}
		<button class="button-primary mt-5" disabled={dragging} onclick={submit}>Submit answer</button>
	{:else}
		<p class="mt-3 text-sm font-semibold" class:text-emerald-800={saved.isCorrect} class:text-rose-800={!saved.isCorrect}>
			{saved.isCorrect ? 'Correct' : 'Not quite'}
		</p>
	{/if}

	{#if firstAttempt}
		<p class="mt-3 text-xs text-slate-500">
			Your first attempt has been saved for the JSON export so we can discuss it during our consultation hour. Feel free to practise as often as you like afterwards.
		</p>
	{/if}

	{#if submitError}
		<p class="mt-3 text-sm text-rose-800" role="alert">{submitError}</p>
	{/if}
</section>
{#if saved && (question.feedback || question.bonusId)}
	<ExerciseFeedback feedback={question.feedback} id={question.id} bonusId={question.bonusId} />
{/if}
