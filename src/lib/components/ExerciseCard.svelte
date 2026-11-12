<script lang="ts">
	import type { CourseItem } from '#lib/content/types.js';
	import MultipleChoice from './MultipleChoice.svelte';
	import DragAndDropExercise from './DragAndDropExercise.svelte';
	import SortExercise from './SortExercise.svelte';
	import InputExercise from './InputExercise.svelte';

	let {
		question,
		targetWidth = 'full'
	}: { question?: CourseItem; targetWidth?: 'short' | 'full' } = $props();
</script>

{#if question?.type === 'multiple-choice'}
	<MultipleChoice {question} />
{:else if question?.type === 'drag-n-drop'}
	<DragAndDropExercise {question} {targetWidth} />
{:else if question?.type === 'sort'}
	<SortExercise {question} />
{:else if question?.type === 'input'}
	<InputExercise {question} />
{:else if question?.type === 'lesson'}
	<aside class="my-5 rounded-xl border border-sky-200 bg-sky-50 p-5 text-sky-950">
		<h3 class="font-semibold">{question.title}</h3>
		<p class="mt-2">{question.text}</p>
	</aside>
{/if}
