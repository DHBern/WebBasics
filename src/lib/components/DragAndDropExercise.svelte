<script lang="ts">
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';
	import type { DragAndDropQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { isPlacementCorrect, questionRevision } from '#lib/content/course.js';
	import { onMount } from 'svelte';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';

	let { question }: { question: DragAndDropQuestion } = $props();
	let draftPlacements = $state<Record<string, string>>({});
	let selectedItemId = $state('');
	let shuffledItems = $state<DragAndDropQuestion['items']>([]);
	let shuffleReady = $state(false);
	let draggedItemId = '';
	let submitError = $state('');
	let saved = $derived($progress.answers[question.id]);
	let placements = $derived(saved?.placements ?? draftPlacements);
	let changed = $derived($progress.changeNotices.includes(question.id));
	const multiTargetIds = new Set(['block', 'inline', 'table-category', 'list-category', 'both-category', 'neither-category', 'invisible-target']);

	onMount(() => {
		shuffledItems = [...question.items];
		if (!$progress.answers[question.id]) {
			for (let index = shuffledItems.length - 1; index > 0; index--) {
				const swapIndex = Math.floor(Math.random() * (index + 1));
				[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
			}
		}
		shuffleReady = true;
	});

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
			saveAnswer(answer);
			clearChangeNotice(question.id);
			submitError = '';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Your answer could not be saved.';
		}
	}
</script>

{#snippet targetSlot(targetId: string)}
	{@const target = question.targets.find((candidate) => candidate.id === targetId)}
	{@const placedItems = shuffledItems.filter((item) => placements[item.id] === targetId)}
	<div
		class="sort-target"
		role="group"
		aria-label={target?.label ?? 'Dropzone'}
		ondragover={(event) => event.preventDefault()}
		ondrop={(event) => dropOn(event, targetId)}
	>
		{#if placedItems.length}
			{#each placedItems as item (item.id)}
				{@const itemCorrect = saved && isPlacementCorrect(question, item.id, saved.placements?.[item.id] ?? '')}
				<button
					type="button"
					class="sort-chip"
					class:answer-correct={Boolean(saved) && itemCorrect}
					class:answer-incorrect={Boolean(saved) && !itemCorrect}
					disabled={Boolean(saved)}
					draggable={!saved}
					ondragstart={(event) => startDrag(event, item.id)}
					onclick={() => {
						if (selectedItemId && selectedItemId !== item.id) placeItem(selectedItemId, targetId);
						else selectedItemId = item.id;
					}}
				>
					{#if saved}<span aria-hidden="true">{itemCorrect ? '✓' : '✗'}</span>{/if}
					{item.text}
				</button>
			{/each}
		{:else}
			<button
				type="button"
				class="drop-placeholder"
				class:url-placeholder={question.id === 'url-parts'}
				aria-label={`Drop ${target?.label ?? 'item'} here`}
				disabled={Boolean(saved)}
				onclick={() => selectedItemId && placeItem(selectedItemId, targetId)}
			>
				{question.id === 'url-parts' ? '___' : 'Drop here'}
			</button>
		{/if}
	</div>
{/snippet}

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

	{#if !shuffleReady}
		<p class="mt-5 text-sm text-slate-500" role="status">Preparing shuffled items…</p>
	{:else}
		<div class="mt-5">
			<h4 class="mb-2 text-sm font-semibold text-slate-700">Items to place</h4>
			<div class="flex flex-wrap gap-2" aria-label="Items to place">
				{#each shuffledItems as item (item.id)}
					{@const itemTarget = placements[item.id]}
					{#if !itemTarget}
						<button
							type="button"
							class="sort-chip"
							class:sort-chip-selected={selectedItemId === item.id}
							draggable={!saved}
							disabled={Boolean(saved)}
							aria-pressed={selectedItemId === item.id}
							ondragstart={(event) => startDrag(event, item.id)}
							onclick={() => (selectedItemId = selectedItemId === item.id ? '' : item.id)}
						>
							{item.text}
						</button>
					{/if}
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-500">Drag an item, or select it and then choose a destination.</p>
		</div>

		{#if question.id === 'url-parts'}
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
		<div class="syntax-diagram mt-5">
			<div class="syntax-code" aria-label="HTML example">
				<span class="syntax-token syntax-opening">&lt;p</span>
				<span class="syntax-token syntax-space"> </span>
				<span class="syntax-token syntax-attribute">class</span>
				<span class="syntax-token">=</span>
				<span class="syntax-token syntax-value">"editor-note"</span>
				<span class="syntax-token syntax-opening">&gt;</span>
				<span class="syntax-token syntax-space"> </span>
				<span class="syntax-token syntax-content">My cat is very grumpy</span>
				<span class="syntax-token syntax-closing">&lt;/p&gt;</span>
			</div>
			<div class="syntax-bracket-grid">
				<div class="syntax-bracket syntax-bracket-opening">{@render targetSlot('opening-slot')}</div>
				<div class="syntax-bracket syntax-bracket-closing">{@render targetSlot('closing-slot')}</div>
				<div class="syntax-bracket syntax-bracket-content">{@render targetSlot('content-slot')}</div>
				<div class="syntax-bracket syntax-bracket-element">{@render targetSlot('element-slot')}</div>
				<div class="syntax-bracket syntax-bracket-attribute">{@render targetSlot('attribute-slot')}</div>
				<div class="syntax-bracket syntax-bracket-name">{@render targetSlot('attribute-name-slot')}</div>
				<div class="syntax-bracket syntax-bracket-value">{@render targetSlot('attribute-value-slot')}</div>
			</div>
		</div>
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
								<div class="webpage-heading">
									<div class="webpage-role-label">Main heading</div>
									{@render targetSlot('h1-target')}
								</div>
								<div class="webpage-paragraph">
									<div class="webpage-role-label">Paragraph</div>
									{@render targetSlot('p-target')}
								</div>
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
