<script lang="ts">
	import { progress, saveExerciseComment } from '#lib/progress.js';
	import ReportEditor from './ReportEditor.svelte';

	let { questionId, demo = false }: { questionId?: string; demo?: boolean } = $props();
	let dialog: HTMLDialogElement;
	const id = $props.id();
	let opened = $state(false);
</script>

<button
	type="button"
	class="exercise-report-trigger"
	aria-label={demo
		? 'Try reporting an issue (example)'
		: 'Report an issue or comment on this exercise'}
	title="Report an issue or leave a comment"
	aria-haspopup="dialog"
	onclick={() => {
		opened = true;
		dialog.showModal();
	}}
>
	<span aria-hidden="true">!</span>
	{#if questionId && $progress.exerciseComments[questionId]}<span
			class="report-saved"
			aria-hidden="true"
		></span>{/if}
</button>

<dialog bind:this={dialog} aria-labelledby={`${id}-title`} onclose={() => (opened = false)}>
	<div class="flex items-start justify-between gap-3">
		<h2 id={`${id}-title`} class="text-lg font-bold">Help improve this exercise</h2>
		<button
			type="button"
			class="button-secondary"
			aria-label="Close comment dialog"
			onclick={() => dialog.close()}>Close</button
		>
	</div>
	<p class="mt-3 text-sm text-slate-600">
		{demo
			? 'Try this example. Nothing entered here will be stored or exported.'
			: 'Your comment is optional. It stays in this browser and is included in your JSON export, not sent immediately. You can reopen this dialog to edit it.'}
	</p>
	{#if opened}
		<ReportEditor
			saved={questionId ? $progress.exerciseComments[questionId]?.text : ''}
			{demo}
			save={(text) => {
				if (!questionId) throw new Error('No exercise was specified for this comment.');
				saveExerciseComment(questionId, text);
			}}
		/>
	{/if}
</dialog>

<style>
	.exercise-report-trigger {
		position: absolute;
		right: -0.75rem;
		bottom: -0.75rem;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid #94a3b8;
		border-radius: 50%;
		background: white;
		color: #334155;
		font-size: 1.25rem;
		font-weight: 700;
		box-shadow: 0 2px 6px rgb(15 23 42 / 12%);
		cursor: pointer;
		z-index: 2;
	}
	.exercise-report-trigger:hover {
		background: #f1f5f9;
	}
	.exercise-report-trigger:focus-visible {
		outline: 2px solid #c2410c;
		outline-offset: 3px;
	}
	.report-saved {
		position: absolute;
		top: 0;
		right: 0;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: #0f766e;
	}
	dialog {
		width: min(34rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		margin: auto;
		overflow-y: auto;
		border: 1px solid #dbe3ec;
		border-radius: 1rem;
		background: white;
		padding: 1.25rem;
		color: #334155;
		box-shadow: 0 12px 40px rgb(15 23 42 / 20%);
	}
	dialog::backdrop {
		background: rgb(15 23 42 / 45%);
	}
</style>
