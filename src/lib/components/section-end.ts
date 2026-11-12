import type { Snippet } from 'svelte';

export const sectionEndKey = Symbol('section-end');

export type SectionEnd = {
	navigation: Snippet;
	state: { finalBridges: number };
};
