<script lang="ts">
	import type { Snippet } from 'svelte';

	let { targetSlot }: { targetSlot: Snippet<[string]> } = $props();
</script>

<div class="syntax-diagram mt-5">
	<svg class="syntax-canvas" width="840" height="560" viewBox="0 0 840 560" role="group" aria-label="Parts of an HTML element">
		<text x="32" y="48" font-family="monospace" font-size="20" xml:space="preserve" aria-label={'<p class="editor-note">My cat is very grumpy</p>'}>
			<tspan x="32" textLength="24" lengthAdjust="spacingAndGlyphs" fill="#6366f1">&lt;p</tspan>
			<tspan x="56" textLength="12" lengthAdjust="spacingAndGlyphs">{' '}</tspan>
			<tspan x="68" textLength="60" lengthAdjust="spacingAndGlyphs" fill="#4f46e5">class</tspan>
			<tspan x="128" textLength="12" lengthAdjust="spacingAndGlyphs">=</tspan>
			<tspan x="140" textLength="156" lengthAdjust="spacingAndGlyphs" fill="#b45309">"editor-note"</tspan>
			<tspan x="296" textLength="12" lengthAdjust="spacingAndGlyphs" fill="#6366f1">&gt;</tspan>
			<tspan x="308" textLength="252" lengthAdjust="spacingAndGlyphs" fill="#334155">My cat is very grumpy</tspan>
			<tspan x="560" textLength="48" lengthAdjust="spacingAndGlyphs" fill="#6366f1">&lt;/p&gt;</tspan>
		</text>
		<g fill="none" stroke="#64748b" stroke-width="2" aria-hidden="true">
			<path d="M32 62 V74 H308 V62 M170 74 V104" />
			<path d="M308 62 V74 H560 V62 M434 74 V104" />
			<path d="M560 62 V74 H608 V62 M584 74 V90 H700 V104" />
			<path d="M32 194 V206 H608 V194 M320 206 V236" />
			<path d="M68 314 V326 H296 V314 M182 326 V356" />
			<path d="M68 434 V446 H128 V434 M98 446 V476" />
			<path d="M140 434 V446 H296 V434 M218 446 V460 H350 V476" />
		</g>
		<foreignObject x="32" y="104" width="276" height="80">
			{@render targetSlot('opening-slot')}
		</foreignObject>
		<foreignObject x="314" y="104" width="240" height="80">
			{@render targetSlot('content-slot')}
		</foreignObject>
		<foreignObject x="610" y="104" width="180" height="80">
			{@render targetSlot('closing-slot')}
		</foreignObject>
		<foreignObject x="32" y="236" width="576" height="70">
			{@render targetSlot('element-slot')}
		</foreignObject>
		<foreignObject x="68" y="356" width="228" height="70">
			{@render targetSlot('attribute-slot')}
		</foreignObject>
		<foreignObject x="8" y="476" width="180" height="80">
			{@render targetSlot('attribute-name-slot')}
		</foreignObject>
		<foreignObject x="250" y="476" width="200" height="80">
			{@render targetSlot('attribute-value-slot')}
		</foreignObject>
	</svg>
</div>

<style>
	.syntax-canvas {
		display: block;
		max-width: none;
	}
</style>
