<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { children, title, size = 'small' }: {
		children: Snippet;
		title: string;
		size?: 'small' | 'wide';
	} = $props();
	let alignment = $state(0.5);

	onMount(() => {
		alignment = Math.random();
	});
</script>

<div class="exercise-bridge" style:--alignment={alignment}>
	<div class="bridge-box" class:bridge-box-wide={size === 'wide'}>
		<h4>{title}</h4>
		{@render children()}
	</div>
</div>

<style>
	.bridge-box {
		--bridge-width: max(33.333%, min(16rem, 100%));
		width: var(--bridge-width);
		margin-left: calc((100% - var(--bridge-width)) * var(--alignment));
		border: 1px solid #dbe3ec;
		border-radius: 1rem;
		background: white;
		padding: 1.25rem;
	}

	.bridge-box-wide {
		--bridge-width: max(50%, min(16rem, 100%));
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
