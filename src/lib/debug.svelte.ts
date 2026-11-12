import { onMount } from 'svelte';
import { page } from '$app/state';

export function createDebugMode() {
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
	const enabled = $derived(mounted && page.url.searchParams.get('debug') === '1');
	return {
		get enabled() {
			return enabled;
		},
		get query() {
			return enabled ? '?debug=1' : '';
		}
	};
}
