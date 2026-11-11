<script lang="ts">
	import { renderInline, renderMarkdown } from '#lib/content/markdown.js';

	let { id, prompt }: { id: string; prompt: string } = $props();
</script>

{#if prompt.includes('\n')}
	<div id={`${id}-prompt`} class="exercise-description prose max-w-none">
		{@html renderMarkdown(prompt)}
	</div>
{:else}
	<h3 id={`${id}-prompt`} class="text-lg font-semibold text-slate-950">
		{@html renderInline(prompt)}
	</h3>
{/if}
