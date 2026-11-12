<script lang="ts">
	import type { PlacementQuestion, SortTarget, SubmissionPayload } from '#lib/content/types.js';
	import { questionRevision } from '#lib/content/course.js';
	import PlacementLayout from './PlacementLayout.svelte';

	let {
		answer,
		current
	}: {
		answer: SubmissionPayload['answers'][number];
		current?: PlacementQuestion;
	} = $props();
	let items = $derived(answer.items ?? []);
	let matchingCurrent = $derived(
		current && questionRevision(current) === answer.questionRevision ? current : undefined
	);
	let hasLayout = $derived(Boolean(answer.targets || matchingCurrent));
	let targets = $derived<SortTarget[]>(
		answer.targets ??
			matchingCurrent?.targets ??
			[
				...new Set(
					items
						.flatMap((item) => [item.correctTargetId, item.selectedTargetId])
						.filter((id): id is string => Boolean(id))
				)
			].map((id) => ({ id, label: id }))
	);
	let unplaced = $derived(items.filter((item) => !item.selectedTargetId));
	let unknown = $derived(
		items.filter(
			(item) =>
				item.selectedTargetId && !targets.some((target) => target.id === item.selectedTargetId)
		)
	);
	let ordered = $derived(
		items
			.filter((item) => item.selectedTargetId?.startsWith('heading-position-'))
			.sort(
				(a, b) =>
					Number(a.selectedTargetId?.replace('heading-position-', '')) -
					Number(b.selectedTargetId?.replace('heading-position-', ''))
			)
	);
</script>

{#snippet chip(item: NonNullable<SubmissionPayload['answers'][number]['items']>[number])}
	<span
		class="sort-chip"
		class:answer-correct={item.correct}
		class:answer-incorrect={!item.correct}
	>
		<span aria-hidden="true">{item.correct ? '✓' : '✗'}</span>
		{item.text}
		<span class="sr-only">{item.correct ? 'Correct placement' : 'Incorrect placement'}</span>
	</span>
{/snippet}

{#snippet targetSlot(targetId: string)}
	{@const placed = items.filter((item) => item.selectedTargetId === targetId)}
	<div class="sort-target" class:sort-target-short={answer.questionId === 'body-element-tree'}>
		<div class="exercise-dnd-zone flex flex-wrap gap-2">
			{#each placed as item (item.id)}
				{@render chip(item)}
			{/each}
			{#if !placed.length}<span class="text-xs text-slate-500">Empty</span>{/if}
		</div>
	</div>
{/snippet}

<div class="submission-preview">
	{#if answer.type === 'sort'}
		<div class="sort-exercise-layout">
			<div>
				<h5 class="text-sm font-semibold">Order from smallest to largest</h5>
				<ol class="sort-order-list">
					{#each ordered as item (item.id)}
						<li class="sort-order-row">
							<span class="sort-position"
								>{item.selectedTargetId?.replace('heading-position-', '')}</span
							>
							{@render chip(item)}
						</li>
					{/each}
				</ol>
			</div>
			<div class="sort-invalid-target">
				<h5 class="text-sm font-semibold">Not valid HTML headings</h5>
				{@render targetSlot('invalid-headings')}
			</div>
		</div>
	{:else}
		{#if !hasLayout}
			<p class="text-xs text-amber-800">
				This older export has no matching layout snapshot. Target IDs are shown instead of current
				labels.
			</p>
		{/if}
		<PlacementLayout questionId={hasLayout ? answer.questionId : ''} {targets} {targetSlot} />
	{/if}
	{#if unplaced.length}
		<h5 class="mt-3 text-sm font-semibold">Unplaced items</h5>
		<div class="flex flex-wrap gap-2">
			{#each unplaced as item (item.id)}{@render chip(item)}{/each}
		</div>
	{/if}
	{#if unknown.length}
		<h5 class="mt-3 text-sm font-semibold">Other destinations</h5>
		{#each unknown as item (item.id)}
			<p>{@render chip(item)} → {item.selectedTargetId}</p>
		{/each}
	{/if}
</div>

<style>
	.submission-preview {
		zoom: 0.65;
	}
	.submission-preview :global(.sort-chip) {
		cursor: default;
	}
	.submission-preview :global(.sort-order-row + .sort-order-row) {
		border-top: 1px solid #dbe3ec;
		padding-top: 0.5rem;
	}
</style>
