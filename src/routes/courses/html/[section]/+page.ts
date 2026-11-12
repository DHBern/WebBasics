import { error } from '@sveltejs/kit';
import { htmlSections } from '#lib/content/course.js';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
	htmlSections.map((section) => ({ section: section.id }));

export const load: PageLoad = ({ params }) => {
	const section = htmlSections.find((item) => item.id === params.section);
	if (!section) error(404, 'Course section not found.');
	return { section };
};
