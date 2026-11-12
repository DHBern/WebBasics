<script lang="ts">
	import { createDebugMode } from '#lib/debug.svelte.js';

	let { fill, disabled = false }: { fill: () => void; disabled?: boolean } = $props();
	const debug = createDebugMode();
</script>

{#if debug.enabled}
	<div class="mt-4">
		<button class="button-secondary" type="button" onclick={fill} {disabled}>Debug: fill randomly</button>
		<p class="mt-2 text-xs text-slate-500">
			Debug only: fill, then submit to see feedback. Submitting saves an answer to this browser.
		</p>
	</div>
{/if}
