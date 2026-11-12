<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SortTarget } from '#lib/content/types.js';
	import HtmlSyntaxDiagram from './HtmlSyntaxDiagram.svelte';

	let {
		questionId,
		targets,
		targetSlot
	}: {
		questionId: string;
		targets: SortTarget[];
		targetSlot: Snippet<[string]>;
	} = $props();
</script>

{#if questionId === 'url-parts' || questionId === 'url-query-params'}
	<div class="url-exercise mt-5">
		<div class="url-string" aria-label="URL template">
			{#each targets as target (target.id)}
				{#if target.prefix}<span class="url-literal">{target.prefix}</span>{/if}
				<div class="url-drop-slot">
					<span class="sr-only">{target.label}</span>
					{@render targetSlot(target.id)}
				</div>
				{#if target.suffix}<span class="url-literal">{target.suffix}</span>{/if}
			{/each}
		</div>
	</div>
{:else if questionId === 'html-parts'}
	<HtmlSyntaxDiagram {targetSlot} />
{:else if questionId === 'body-element-tree'}
	<div class="webpage-diagram mt-5">
		<div class="webpage-invisible">
			<strong>Invisible to the user</strong>
			{@render targetSlot('invisible-target')}
		</div>
		<div class="webpage-body-frame">
			{@render targetSlot('body-target')}
			<div class="webpage-header">
				{@render targetSlot('header-target')}
				<div class="webpage-nav">
					<div class="webpage-role-label">Site navigation</div>
					{@render targetSlot('nav-target')}
				</div>
			</div>
			<div class="webpage-main">
				{@render targetSlot('main-target')}
				<div class="webpage-columns">
					<div class="webpage-article">
						{@render targetSlot('article-target')}
						<div class="webpage-section">
							{@render targetSlot('section-target')}
						</div>
					</div>
					<div class="webpage-aside">
						<div class="webpage-role-label">Related links</div>
						{@render targetSlot('aside-target')}
					</div>
				</div>
			</div>
			<div class="webpage-footer">
				{@render targetSlot('footer-target')}
			</div>
		</div>
	</div>
{:else}
	<div class="dropzone-grid mt-5" aria-label="Dropzones">
		{#each targets.filter((target) => target.id !== 'document') as target (target.id)}
			<div class="dropzone-card">
				<span class="dropzone-label">{target.label}</span>
				{@render targetSlot(target.id)}
			</div>
		{/each}
	</div>
{/if}
