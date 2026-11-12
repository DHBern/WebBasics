<script lang="ts">
	import { getContext, onDestroy, onMount, untrack, type Snippet } from 'svelte';
	import { sectionEndKey, type SectionEnd } from './section-end.js';

	let {
		children,
		final = false,
		generated = false
	}: { children?: Snippet; final?: boolean; generated?: boolean } = $props();
	const sectionEnd = getContext<SectionEnd | undefined>(sectionEndKey);
	let alignment = $state(0.5);

	if (untrack(() => final && !generated) && sectionEnd) {
		sectionEnd.state.finalBridges += 1;
		onDestroy(() => (sectionEnd.state.finalBridges -= 1));
	}

	onMount(() => {
		alignment = Math.random();
	});
</script>

<div class="exercise-bridge" class:exercise-bridge-final={final} style:--alignment={alignment}>
	<div class="bridge-box">
		{@render children?.()}
		{#if final && sectionEnd}
			<div class="bridge-navigation">{@render sectionEnd.navigation()}</div>
		{/if}
	</div>
</div>

<style>
	.bridge-box {
		width: max(33.333%, min(16rem, 100%));
		margin-left: calc((100% - max(33.333%, min(16rem, 100%))) * var(--alignment));
		border: 1px solid black;
		border-radius: 1rem;
		background: white;
		padding: 1.25rem;
	}

	.bridge-box > :global(:first-child) {
		margin-top: 0;
	}

	.bridge-box > :global(:last-child) {
		margin-bottom: 0;
	}

	.bridge-navigation :global(a.button-primary) {
		display: inline-block;
		color: white;
		text-decoration: none;
	}

	.bridge-navigation:not(:first-child) {
		margin-top: 1rem;
	}
</style>
