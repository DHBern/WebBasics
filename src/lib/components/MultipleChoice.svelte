<script lang="ts">
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';
	import type { MultipleChoiceQuestion, SubmittedAnswer } from '#lib/content/types.js';
	import { questionRevision } from '#lib/content/course.js';
	import { clearChangeNotice, progress, saveAnswer } from '#lib/progress.js';
	import ExerciseFeedback from './ExerciseFeedback.svelte';

	let { question }: { question: MultipleChoiceQuestion } = $props();
	let draftSelectedIds = $state<string[]>([]);
	let submitError = $state('');
	let saved = $derived($progress.answers[question.id]);
	let selectedIds = $derived(saved?.selectedOptionIds ?? draftSelectedIds);
	let changed = $derived($progress.changeNotices.includes(question.id));

	function toggle(optionId: string) {
		draftSelectedIds = draftSelectedIds.includes(optionId)
			? draftSelectedIds.filter((id) => id !== optionId)
			: [...draftSelectedIds, optionId];
	}

	function submit() {
		if (saved) return;
		const selected = new Set(selectedIds);
		const isCorrect = question.options.every(
			(option) => selected.has(option.id) === option.correct
		);
		const answer: SubmittedAnswer = {
			questionId: question.id,
			revision: questionRevision(question),
			submittedAt: new Date().toISOString(),
			type: question.type,
			selectedOptionIds: question.options.filter((option) => selected.has(option.id)).map((option) => option.id),
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

		<fieldset class="mt-4 space-y-2" disabled={Boolean(saved)}>
			<legend class="sr-only">Select all correct answers</legend>
			{#each question.options as option (option.id)}
				{@const selected = selectedIds.includes(option.id)}
				{@const matches = saved ? selected === option.correct : false}
				<label
					class="answer-option"
					class:answer-correct={Boolean(saved) && matches}
					class:answer-incorrect={Boolean(saved) && !matches}
				>
					{#if saved}
						<span class="answer-icon" aria-hidden="true">{matches ? '✓' : '✗'}</span>
					{:else}
						<input
							type="checkbox"
							checked={selected}
							onchange={() => toggle(option.id)}
						/>
					{/if}
					<span>{@html renderInline(option.text)}</span>
					{#if saved}
						<span class="sr-only">{matches ? 'Correct' : 'Incorrect'}</span>
					{/if}
				</label>
			{/each}
		</fieldset>

		{#if !saved}
			<button class="button-primary mt-4" onclick={submit}>Submit answer</button>
		{:else}
			<p class="mt-3 text-sm font-semibold" class:text-emerald-800={saved.isCorrect} class:text-rose-800={!saved.isCorrect}>
				{saved.isCorrect ? 'Correct' : 'Not quite'}
			</p>
		{/if}

		{#if submitError}
			<p class="mt-3 text-sm text-rose-800" role="alert">{submitError}</p>
		{/if}
</section>

{#if saved && question.feedback}
	<ExerciseFeedback feedback={question.feedback} id={question.id} bonusPrompt={question.bonusPrompt} />
{/if}
