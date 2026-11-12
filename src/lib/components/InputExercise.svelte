<script lang="ts">
	import { renderMarkdown } from '#lib/content/markdown.js';
	import { questionRevision } from '#lib/content/course.js';
	import type { InputQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';
	import ExerciseFeedback from './ExerciseFeedback.svelte';
	import ExercisePrompt from './ExercisePrompt.svelte';
	import ExerciseDebug from './ExerciseDebug.svelte';
	import ExerciseChangeAlert from './ExerciseChangeAlert.svelte';

	let { question }: { question: InputQuestion } = $props();
	let draft = $state('');
	let editing = $state(false);
	let submitError = $state('');
	let saved = $derived($progress.answers[question.id]);
	let changed = $derived($progress.changeNotices.includes(question.id));

	function edit() {
		draft = saved?.textResponse ?? '';
		submitError = '';
		editing = true;
	}

	function submit() {
		if ((saved && !editing) || !draft.trim()) return;
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
			editing = false;
			clearChangeNotice(question.id);
			submitError = '';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Your answer could not be saved.';
		}
	}
</script>

<section class="exercise-card" data-question-id={question.id} aria-labelledby={`${question.id}-prompt`}>
	<ExercisePrompt id={question.id} prompt={question.prompt} />
	<ExerciseDebug disabled={Boolean(saved) && !editing} fill={() => {
		draft = `Debug response ${Math.random().toString(36).slice(2, 8)}.`;
	}} />
	{#if question.description?.length}
		<div class="exercise-description prose max-w-none">
			{#each question.description as block}
				{@html renderMarkdown(block)}
			{/each}
		</div>
	{/if}
	<ExerciseChangeAlert {changed} />

	{#if saved && !editing}
		<p class="mt-3 whitespace-pre-wrap" role="status">Submitted response: {saved.textResponse}</p>
		<button class="button-secondary mt-2" onclick={edit}>Edit answer</button>
	{:else}
		<label class="mt-3 block text-sm font-semibold" for={`${question.id}-response`}>Your response</label>
		<textarea id={`${question.id}-response`} class="mt-1 w-full rounded-lg border border-amber-300 bg-white p-3 text-sm" rows="4" bind:value={draft}></textarea>
		<button class="button-secondary mt-2" disabled={!draft.trim()} onclick={submit}>{editing ? 'Save answer' : 'Submit response'}</button>
	{/if}
	{#if submitError}<p class="mt-2 text-sm text-rose-800" role="alert">{submitError}</p>{/if}
</section>

{#if saved && (question.feedback || question.bonusId)}
	<ExerciseFeedback feedback={question.feedback} id={question.id} bonusId={question.bonusId} />
{/if}
