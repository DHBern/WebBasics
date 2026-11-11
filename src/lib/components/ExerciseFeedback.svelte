<script lang="ts">
	import { renderMarkdown } from '#lib/content/markdown.js';
	import { getQuestion } from '#lib/content/course.js';
	import ExerciseCard from './ExerciseCard.svelte';

	let { feedback, id, bonusId }: { feedback?: string | string[]; id: string; bonusId?: string } = $props();
	let bonus = $derived(bonusId ? getQuestion(bonusId) : undefined);
</script>

<aside class="exercise-feedback" aria-labelledby={`${id}-feedback-title`}>
	<h4 id={`${id}-feedback-title`} class="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-950">
		{feedback ? 'Feedback' : 'Bonus'}
	</h4>
	{#if feedback}
		<div class="feedback-content prose max-w-none">
			{#each Array.isArray(feedback) ? feedback : [feedback] as block}
				{@html renderMarkdown(block)}
			{/each}
		</div>
	{/if}
	{#if bonusId}
		<div class="feedback-bonus mt-4">
			{#if feedback}<h5 class="font-bold">Bonus</h5>{/if}
			{#if bonus}
				<ExerciseCard question={bonus} />
			{:else}
				<p role="alert">Bonus exercise "{bonusId}" could not be found.</p>
			{/if}
		</div>
	{/if}
</aside>
