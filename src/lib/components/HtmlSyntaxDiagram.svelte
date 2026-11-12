<script lang="ts">
	import type { Snippet } from 'svelte';

	let { targetSlot }: { targetSlot: Snippet<[string]> } = $props();

	const tokens = [
		{ text: '<button ', color: '#6366f1' },
		{ text: 'class', color: '#4f46e5' },
		{ text: '=', color: '#334155' },
		{ text: '"link--external text_large"', color: '#b45309' },
		{ text: ' ', color: '#334155' },
		{ text: 'style', color: '#4f46e5' },
		{ text: '=', color: '#334155' },
		{ text: '"border: 2px solid black;"', color: '#b45309' },
		{ text: ' ', color: '#334155' },
		{ text: 'disabled', color: '#4f46e5' },
		{ text: '>', color: '#6366f1' },
		{ text: 'Click me', color: '#334155' },
		{ text: '</button>', color: '#6366f1' }
	];
	const cellWidth = 9.6;
	const spans = tokens.map((token, index) => {
		const x =
			32 + tokens.slice(0, index).reduce((sum, part) => sum + part.text.length * cellWidth, 0);
		return { ...token, x, width: token.text.length * cellWidth };
	});
	const end = (index: number) => spans[index].x + spans[index].width;
	const brackets = [
		{
			id: 'class-attribute-slot',
			start: spans[1].x,
			end: end(3),
			y: 170,
			above: true,
			x: 80,
			boxY: 70,
			width: 280
		},
		{
			id: 'style-attribute-slot',
			start: spans[5].x,
			end: end(7),
			y: 170,
			above: true,
			x: 410,
			boxY: 70,
			width: 250
		},
		{
			id: 'disabled-slot',
			start: spans[9].x,
			end: end(9),
			y: 170,
			above: true,
			x: 750,
			boxY: 70,
			width: 230
		},
		{
			id: 'class-name-slot',
			start: spans[1].x,
			end: end(1),
			y: 310,
			above: true,
			x: 25,
			boxY: 210,
			width: 190
		},
		{
			id: 'class-names-slot',
			start: spans[3].x,
			end: end(3),
			y: 310,
			above: true,
			x: 230,
			boxY: 210,
			width: 180
		},
		{
			id: 'style-name-slot',
			start: spans[5].x,
			end: end(5),
			y: 310,
			above: true,
			x: 425,
			boxY: 210,
			width: 190
		},
		{
			id: 'style-value-slot',
			start: spans[7].x,
			end: end(7),
			y: 310,
			above: true,
			x: 630,
			boxY: 210,
			width: 220
		},
		{
			id: 'opening-slot',
			start: spans[0].x,
			end: end(10) - 2,
			y: 390,
			above: false,
			x: 280,
			boxY: 420,
			width: 250
		},
		{
			id: 'content-slot',
			start: spans[11].x + 2,
			end: end(11) - 2,
			y: 390,
			above: false,
			x: 750,
			boxY: 420,
			width: 140
		},
		{
			id: 'closing-slot',
			start: spans[12].x + 2,
			end: end(12),
			y: 390,
			above: false,
			x: 900,
			boxY: 420,
			width: 160
		},
		{
			id: 'element-slot',
			start: spans[0].x,
			end: end(12),
			y: 560,
			above: false,
			x: 390,
			boxY: 590,
			width: 260
		}
	];
</script>

<div class="syntax-diagram mt-5">
	<svg
		class="syntax-canvas"
		width="1080"
		height="680"
		viewBox="0 0 1080 680"
		role="group"
		aria-label="Parts of an HTML button element"
	>
		<text
			x="32"
			y="350"
			font-family="monospace"
			font-size="16"
			xml:space="preserve"
			aria-label={tokens.map((token) => token.text).join('')}
		>
			{#each spans as token}
				<tspan
					x={token.x}
					textLength={token.width}
					lengthAdjust="spacingAndGlyphs"
					fill={token.color}>{token.text}</tspan
				>
			{/each}
		</text>
		{#each brackets as bracket (bracket.id)}
			{@const midpoint = (bracket.start + bracket.end) / 2}
			{@const boxCenter = bracket.x + bracket.width / 2}
			{@const tipY = bracket.y + (bracket.above ? 12 : -12)}
			{@const boxEdge = bracket.above ? bracket.boxY + 80 : bracket.boxY}
			{@const elbowY = (bracket.y + boxEdge) / 2}
			<path
				d={`M${bracket.start} ${tipY} V${bracket.y} H${bracket.end} V${tipY} M${midpoint} ${bracket.y} V${elbowY} H${boxCenter} V${boxEdge}`}
				fill="none"
				stroke="#64748b"
				stroke-width="2"
				aria-hidden="true"
			/>
			<foreignObject x={bracket.x} y={bracket.boxY} width={bracket.width} height="80">
				{@render targetSlot(bracket.id)}
			</foreignObject>
		{/each}
	</svg>
</div>

<style>
	.syntax-canvas {
		display: block;
		max-width: none;
	}
</style>
