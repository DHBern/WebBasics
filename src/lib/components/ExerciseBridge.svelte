<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { children, title }: { children: Snippet; title: string } = $props();
	let alignment = $state(0.5);

	onMount(() => {
		alignment = Math.random();
	});
</script>

<div class="exercise-bridge" style:--alignment={alignment}>
	<div class="bridge-box">
		<h4>{title}</h4>
		{@render children()}
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

	.bridge-box :global(a.button-primary) {
		display: inline-block;
		color: white;
		text-decoration: none;
	}
</style>
