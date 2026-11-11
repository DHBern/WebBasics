<script lang="ts">
	import { renderMarkdown } from '#lib/content/markdown.js';

	let { feedback, id }: { feedback: string; id: string } = $props();
</script>

<aside class="exercise-feedback" aria-labelledby={`${id}-feedback-title`}>
	<h4 id={`${id}-feedback-title`} class="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-950">
		Feedback
	</h4>
	<div class="feedback-content prose max-w-none">
		{@html renderMarkdown(feedback)}
	</div>
</aside>
