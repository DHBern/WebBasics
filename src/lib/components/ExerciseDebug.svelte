<script lang="ts">
	import { createDebugMode } from '#lib/debug.svelte.js';

	let { fill, disabled = false }: { fill: () => void; disabled?: boolean } = $props();
	const debug = createDebugMode();
</script>

{#if debug.enabled}
	<button class="button-secondary bg-blue-100" type="button" onclick={fill} {disabled}>Debug: fill randomly</button>
{/if}
