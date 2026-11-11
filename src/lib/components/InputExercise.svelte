<script lang="ts">
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';
	import { questionRevision } from '#lib/content/course.js';
	import type { InputQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';
	import ExerciseFeedback from './ExerciseFeedback.svelte';

	let { question }: { question: InputQuestion } = $props();
	let draft = $state('');
	let submitError = $state('');
	let saved = $derived($progress.answers[question.id]);
	let changed = $derived($progress.changeNotices.includes(question.id));

	function submit() {
		if (saved || !draft.trim()) return;
		const answer: SubmittedAnswer = {
			questionId: question.id,
			revision: questionRevision(question),
			submittedAt: new Date().toISOString(),
			type: question.type,
			textResponse: draft.trim(),
			isCorrect: null
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
	{#if question.description?.length}
		<div class="exercise-description prose max-w-none">
			{#each question.description as block}
				{@html renderMarkdown(block)}
			{/each}
		</div>
	{/if}
	{#if changed}
		<p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
			This question changed since your last visit, so your previous answer was cleared. Please answer the updated question.
		</p>
	{/if}
	{#if saved}
		<p class="mt-3 whitespace-pre-wrap" role="status">Submitted response: {saved.textResponse}</p>
	{:else}
		<label class="mt-3 block text-sm font-semibold" for={`${question.id}-response`}>Your response</label>
		<textarea id={`${question.id}-response`} class="mt-1 w-full rounded-lg border border-amber-300 bg-white p-3 text-sm" rows="4" bind:value={draft}></textarea>
		<button class="button-secondary mt-2" disabled={!draft.trim()} onclick={submit}>Submit response</button>
	{/if}
	{#if submitError}<p class="mt-2 text-sm text-rose-800" role="alert">{submitError}</p>{/if}
</section>

{#if saved && (question.feedback || question.bonusId)}
	<ExerciseFeedback feedback={question.feedback} id={question.id} bonusId={question.bonusId} />
{/if}
