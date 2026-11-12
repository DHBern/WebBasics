<script lang="ts">
	import type { Question } from '#lib/content/types.js';
	import MultipleChoice from './MultipleChoice.svelte';
	import DragAndDropExercise from './DragAndDropExercise.svelte';
	import SortExercise from './SortExercise.svelte';
	import InputExercise from './InputExercise.svelte';

	let { question, targetWidth = 'full' }: { question?: Question; targetWidth?: 'short' | 'full' } =
		$props();
</script>

{#if question?.type === 'multiple-choice'}
	<MultipleChoice {question} />
{:else if question?.type === 'drag-n-drop'}
	<DragAndDropExercise {question} {targetWidth} />
{:else if question?.type === 'sort'}
	<SortExercise {question} />
{:else if question?.type === 'input'}
	<InputExercise {question} />
{/if}
