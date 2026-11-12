<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { progress } from '#lib/progress.js';
	import ExerciseBridge from './ExerciseBridge.svelte';

	type PathNode = {
		elements: HTMLElement[];
		questionId?: string;
		bridgeBox?: HTMLElement;
	};
	type PathLine = { d: string; questionId?: string };

	let { children, navigation, navigationTitle }: {
		children: Snippet;
		navigation: Snippet;
		navigationTitle: string;
	} = $props();
	let root: HTMLDivElement;
	let content: HTMLDivElement;
	let lines = $state<PathLine[]>([]);
	const attachments = new WeakMap<Element, { top: number; bottom: number }>();

	function attachment(element: Element, edge: 'top' | 'bottom') {
		let points = attachments.get(element);
		if (!points) {
			points = { top: 0.25 + Math.random() * 0.5, bottom: 0.25 + Math.random() * 0.5 };
			attachments.set(element, points);
		}
		return points[edge];
	}

	function pathNodes() {
		const nodes: PathNode[] = [];
		let loose: PathNode | undefined;
		for (const element of content.children) {
			if (!(element instanceof HTMLElement)) continue;
			if (element.matches('.exercise-card')) {
				nodes.push({ elements: [element], questionId: element.dataset.questionId });
				loose = undefined;
			} else if (element.matches('.exercise-feedback') && nodes.at(-1)?.questionId) {
				nodes.at(-1)?.elements.push(element);
			} else if (element.matches('.exercise-bridge')) {
				const bridgeBox = element.querySelector<HTMLElement>('.bridge-box') ?? element;
				nodes.push({ elements: [element], bridgeBox });
				loose = undefined;
			} else if (nodes.length) {
				if (!loose) {
					loose = { elements: [] };
					nodes.push(loose);
				}
				loose.elements.push(element);
			}
		}
		return nodes;
	}

	function bounds(node: PathNode) {
		const first = (node.bridgeBox ?? node.elements[0]).getBoundingClientRect();
		const last = (node.bridgeBox ?? node.elements.at(-1)!).getBoundingClientRect();
		const left = Math.min(...node.elements.map((element) => element.getBoundingClientRect().left));
		const right = Math.max(...node.elements.map((element) => element.getBoundingClientRect().right));
		return node.bridgeBox ? first : { left, right, width: right - left, top: first.top, bottom: last.bottom };
	}

	function curve(x1: number, y1: number, x2: number, y2: number) {
		const middle = (y1 + y2) / 2;
		return `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`;
	}

	function updateLines() {
		const origin = root.getBoundingClientRect();
		const nodes = pathNodes();
		lines = nodes.slice(0, -1).map((source, index) => {
			const target = nodes[index + 1];
			const from = bounds(source);
			const to = bounds(target);
			const fromRatio = source.bridgeBox ? 0.5 : attachment(source.elements[0], 'bottom');
			const toRatio = target.bridgeBox ? 0.5 : attachment(target.elements[0], 'top');
			return {
				questionId: source.questionId,
				d: curve(
					from.left + from.width * fromRatio - origin.left,
					from.bottom - origin.top,
					to.left + to.width * toRatio - origin.left,
					to.top - origin.top
				)
			};
		});
	}

	onMount(() => {
		let frame = 0;
		const scheduleUpdate = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(updateLines);
		};
		const resizeObserver = new ResizeObserver(scheduleUpdate);
		const observeChildren = () => {
			resizeObserver.disconnect();
			resizeObserver.observe(root);
			for (const element of content.children) resizeObserver.observe(element);
			for (const box of content.querySelectorAll(':scope > .exercise-bridge .bridge-box')) {
				resizeObserver.observe(box);
			}
			scheduleUpdate();
		};
		const mutationObserver = new MutationObserver(observeChildren);
		mutationObserver.observe(content, { childList: true });
		window.addEventListener('resize', scheduleUpdate);
		observeChildren();

		return () => {
			cancelAnimationFrame(frame);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener('resize', scheduleUpdate);
		};
	});
</script>

<div bind:this={root} class="exercise-path">
	<svg class="exercise-path-lines" width="100%" height="100%" aria-hidden="true">
		{#each lines as line}
			{@const pending = Boolean(line.questionId && !$progress.answers[line.questionId])}
			<path
				d={line.d}
				fill="none"
				stroke={pending ? '#94a3b8' : 'black'}
				stroke-dasharray={pending ? '7 7' : undefined}
				stroke-width="2"
			/>
		{/each}
	</svg>
	<div bind:this={content} class="exercise-path-content prose max-w-none">
		{@render children()}
		<ExerciseBridge title={navigationTitle}>
			<p>Continue when you are ready.</p>
			<div class="bridge-navigation">{@render navigation()}</div>
		</ExerciseBridge>
	</div>
</div>
