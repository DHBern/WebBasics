<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	let container: HTMLDivElement;
	let box: HTMLDivElement;
	let alignment = $state(0.5);
	let paths = $state<string[]>([]);

	onMount(() => {
		alignment = Math.random();
		const previousAttachment = 0.25 + Math.random() * 0.5;
		const nextAttachment = 0.25 + Math.random() * 0.5;
		let frame = 0;

		function updatePaths() {
			const previous = container.previousElementSibling;
			const next = container.nextElementSibling;
			if (!previous || !next) return;
			const origin = container.getBoundingClientRect();
			const bridge = box.getBoundingClientRect();
			const before = previous.getBoundingClientRect();
			const after = next.getBoundingClientRect();
			const curve = (x1: number, y1: number, x2: number, y2: number) => {
				const middle = (y1 + y2) / 2;
				return `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`;
			};
			const center = bridge.left + bridge.width / 2 - origin.left;
			paths = [
				curve(
					before.left + before.width * previousAttachment - origin.left,
					before.bottom - origin.top,
					center,
					bridge.top - origin.top
				),
				curve(
					center,
					bridge.bottom - origin.top,
					after.left + after.width * nextAttachment - origin.left,
					after.top - origin.top
				)
			];
		}

		function scheduleUpdate() {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(updatePaths);
		}

		const observer = new ResizeObserver(scheduleUpdate);
		observer.observe(container);
		observer.observe(box);
		if (container.parentElement) observer.observe(container.parentElement);
		window.addEventListener('resize', scheduleUpdate);
		scheduleUpdate();

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener('resize', scheduleUpdate);
		};
	});
</script>

<div bind:this={container} class="exercise-bridge" style:--alignment={alignment}>
	<svg class="bridge-lines" width="100%" height="100%" aria-hidden="true">
		{#each paths as path}
			<path d={path} fill="none" stroke="black" stroke-width="2" />
		{/each}
	</svg>
	<div bind:this={box} class="bridge-box">
		{@render children()}
	</div>
</div>

<style>
	.exercise-bridge {
		position: relative;
		margin-block: clamp(9rem, 18vw, 15rem);
	}

	.bridge-lines {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}

	.bridge-box {
		position: relative;
		width: max(33.333%, min(16rem, 100%));
		margin-left: calc((100% - max(33.333%, min(16rem, 100%))) * var(--alignment));
		border: 1px solid black;
		border-radius: 1rem;
		background: white;
		padding: 1.25rem;
	}
</style>
