<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { hydrateProgress } from '#lib/progress.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(hydrateProgress);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
