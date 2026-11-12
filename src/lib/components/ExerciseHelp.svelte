<script lang="ts">
	let { id, text }: { id: string; text: string } = $props();
	let container: HTMLDivElement;
	let pinned = $state(false);
	let hovered = $state(false);
	let focused = $state(false);
	let dismissed = $state(false);
	let visible = $derived(!dismissed && (pinned || hovered || focused));

	function dismiss() {
		pinned = false;
		dismissed = true;
	}
</script>

<svelte:window
	onpointerdown={(event) => {
		if (event.target instanceof Node && !container.contains(event.target)) dismiss();
	}}
	onkeydown={(event) => {
		if (event.key === 'Escape') dismiss();
	}}
/>

<div
	bind:this={container}
	class="exercise-help"
	role="group"
	aria-label="Exercise help"
	onpointerenter={(event) => {
		if (event.pointerType === 'mouse') {
			hovered = true;
			dismissed = false;
		}
	}}
	onpointerleave={() => (hovered = false)}
>
	<button
		type="button"
		class="help-trigger"
		aria-label="How to interact with this exercise"
		aria-describedby={visible ? `${id}-help` : undefined}
		aria-expanded={visible}
		onfocus={() => {
			focused = true;
			dismissed = false;
		}}
		onblur={() => {
			focused = false;
			pinned = false;
		}}
		onclick={() => {
			if (pinned) dismiss();
			else {
				pinned = true;
				dismissed = false;
			}
		}}
	>
		<span aria-hidden="true">i</span>
	</button>
	{#if visible}
		<div id={`${id}-help`} role="tooltip" class="help-tooltip">{text}</div>
	{/if}
</div>

<style>
	.exercise-help {
		position: relative;
		flex-shrink: 0;
		align-self: flex-start;
	}

	.help-trigger {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.5rem;
		color: #475569;
		cursor: pointer;
	}

	.help-trigger:hover,
	.help-trigger:focus-visible {
		background: #f1f5f9;
	}

	.help-trigger:focus-visible {
		outline: 2px solid #c2410c;
		outline-offset: 2px;
	}

	.help-trigger span {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		border: 1.5px solid currentColor;
		border-radius: 50%;
		font-family: Georgia, serif;
		font-weight: bold;
		font-style: italic;
		line-height: 1;
	}

	.help-tooltip {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 20;
		width: min(20rem, calc(100vw - 4rem));
		border: 1px solid #dbe3ec;
		border-radius: 0.75rem;
		background: white;
		padding: 0.875rem 1rem;
		box-shadow: 0 4px 16px rgb(15 23 42 / 12%);
		color: #334155;
		font-size: 0.875rem;
		line-height: 1.6;
		overflow-wrap: anywhere;
	}
</style>
