<script lang="ts">
	let {
		saved = '',
		save,
		demo = false
	}: {
		saved?: string;
		save: (text: string) => void;
		demo?: boolean;
	} = $props();
	const id = $props.id();
	let draft = $state('');
	let editing = $state(false);
	let error = $state('');
	let status = $state('');
	let text = $derived(editing ? draft : saved);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		status = '';
		try {
			if (demo) {
				status = 'Example only: this comment was not saved.';
				return;
			}
			save(text);
			editing = false;
			status = text.trim() ? 'Comment saved in this browser.' : 'Comment removed.';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Your comment could not be saved.';
		}
	}
</script>

<form onsubmit={submit}>
	<label for={id} class="mt-3 block text-sm font-semibold">Your comment (optional)</label>
	<textarea
		{id}
		class="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900"
		rows="4"
		value={text}
		oninput={(event) => {
			draft = event.currentTarget.value;
			editing = true;
			status = '';
		}}></textarea>
	<p class="mt-2 text-xs text-slate-600">
		Bugs, suggestions, and comments on difficulty are welcome. Please do not include personal
		information. Save an empty comment to remove a previously saved one.
	</p>
	<button type="submit" class="button-secondary mt-3"
		>{saved ? 'Save changes' : 'Save comment'}</button
	>
	{#if status}<p class="mt-2 text-sm text-slate-600" role="status">{status}</p>{/if}
	{#if error}<p class="mt-2 text-sm text-rose-800" role="alert">{error}</p>{/if}
</form>
