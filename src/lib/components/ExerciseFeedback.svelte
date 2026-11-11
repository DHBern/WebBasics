<script lang="ts">
	import { renderMarkdown } from '#lib/content/markdown.js';
	import { progress, saveBonusResponse } from '#lib/progress.js';

	let {
		feedback,
		id,
		bonusPrompt
	}: { feedback: string; id: string; bonusPrompt?: string } = $props();
	let bonusDraft = $state('');
	let bonusError = $state('');
	let bonusResponse = $derived($progress.answers[id]?.bonusResponse);

	function submitBonus() {
		if (!bonusPrompt || !bonusDraft.trim()) return;
		try {
			saveBonusResponse(id, bonusDraft.trim());
			bonusDraft = '';
			bonusError = '';
		} catch (error) {
			bonusError =
				error instanceof Error ? error.message : 'Your bonus response could not be saved.';
		}
	}
</script>

<aside class="exercise-feedback" aria-labelledby={`${id}-feedback-title`}>
	<h4 id={`${id}-feedback-title`} class="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-950">
		Feedback
	</h4>
	<div class="feedback-content prose max-w-none">
		{@html renderMarkdown(feedback)}
	</div>
	{#if bonusPrompt}
		<div class="feedback-bonus mt-4">
			<h5 class="font-bold">Bonus</h5>
			<p class="mt-1">{bonusPrompt}</p>
			{#if bonusResponse}
				<p class="mt-3 rounded-lg bg-white/70 p-3 whitespace-pre-wrap" role="status">
					Submitted response: {bonusResponse}
				</p>
			{:else}
				<label class="mt-3 block text-sm font-semibold" for={`${id}-bonus-response`}>
					Your response
				</label>
				<textarea
					id={`${id}-bonus-response`}
					class="mt-1 w-full rounded-lg border border-amber-300 bg-white p-3 text-sm"
					rows="4"
					bind:value={bonusDraft}
				></textarea>
				<button
					class="button-secondary mt-2"
					disabled={!bonusDraft.trim()}
					onclick={submitBonus}
				>
					Submit bonus response
				</button>
			{/if}
			{#if bonusError}
				<p class="mt-2 text-sm text-rose-800" role="alert">{bonusError}</p>
			{/if}
		</div>
	{/if}
</aside>
