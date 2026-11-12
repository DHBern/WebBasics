<script lang="ts">
	import { createDebugMode } from '#lib/debug.svelte.js';
	import CourseNavigation from '#lib/components/CourseNavigation.svelte';
	import ExercisePath from '#lib/components/ExercisePath.svelte';
	import UrlStructure from '#lib/content/html/sections/url-structure.svx';
	import Comments from '#lib/content/html/sections/comments.svx';
	import BasicSyntax from '#lib/content/html/sections/basic-syntax.svx';
	import WebpageStructure from '#lib/content/html/sections/webpage-structure.svx';
	import SemanticHtml from '#lib/content/html/sections/semantic-html.svx';
	import FormattingText from '#lib/content/html/sections/formatting-text.svx';
	import ListsTables from '#lib/content/html/sections/lists-tables.svx';
	import Links from '#lib/content/html/sections/links.svx';
	import Images from '#lib/content/html/sections/images.svx';
	import FormsButtons from '#lib/content/html/sections/forms-buttons.svx';
	import Embeddings from '#lib/content/html/sections/embeddings.svx';
	import { downloadSubmission } from '#lib/content/submission.js';
	import { htmlSections, requiredQuestionList } from '#lib/content/course.js';
	import { progress } from '#lib/progress.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let downloadError = $state('');
	let downloading = $state(false);
	const debug = createDebugMode();
	const sectionComponents = {
		'url-structure': UrlStructure,
		comments: Comments,
		'basic-syntax': BasicSyntax,
		'webpage-structure': WebpageStructure,
		'semantic-html': SemanticHtml,
		'formatting-text': FormattingText,
		'lists-tables': ListsTables,
		links: Links,
		images: Images,
		'forms-buttons': FormsButtons,
		embeddings: Embeddings
	} satisfies Record<string, typeof UrlStructure>;
	let Content = $derived(sectionComponents[data.section.id as keyof typeof sectionComponents]);
	let currentIndex = $derived(htmlSections.findIndex((section) => section.id === data.section.id));
	let nextSection = $derived(htmlSections[currentIndex + 1]);
	let previousSection = $derived(htmlSections[currentIndex - 1]);
	let answeredCount = $derived(requiredQuestionList.filter((question) => $progress.answers[question.id]).length);
	let complete = $derived(requiredQuestionList.every((question) => $progress.answers[question.id]));

	async function exportResults() {
		downloading = true;
		downloadError = '';
		try {
			await downloadSubmission();
		} catch (error) {
			downloadError = error instanceof Error ? error.message : 'The submission could not be exported.';
		} finally {
			downloading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.section.title} — HTML Questions</title>
</svelte:head>

<div class="course-page-layout">
	<CourseNavigation activeSection={data.section.id} />
	<main class="course-content">
		<div class="mb-8 flex items-center justify-between gap-4">
			<a class="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-950" href="/courses/html/welcome/">
				← Course introduction
			</a>
			<p class="text-sm text-slate-500">{answeredCount} of {requiredQuestionList.length} questions answered</p>
		</div>
		{#key data.section.id}
			<ExercisePath navigation={sectionNavigation} navigationTitle={nextSection ? 'Next section' : 'Export your answers'}>
				<Content />
			</ExercisePath>
		{/key}
		{#if previousSection}
			<div class="mt-10 border-t border-slate-200 pt-6">
				<a class="button-secondary" href={`/courses/html/${previousSection.id}/${debug.query}`}>← Previous section</a>
			</div>
		{/if}
	</main>
</div>

{#snippet sectionNavigation()}
	{#if nextSection}
		<a class="button-primary" href={`/courses/html/${nextSection.id}/${debug.query}`}>Next section →</a>
	{:else}
		<div class="flex flex-col items-start gap-2">
			<button class="button-primary" disabled={!complete || downloading} onclick={exportResults}>
				{downloading ? 'Preparing JSON…' : 'Download completed answers (.json)'}
			</button>
			<p class="m-0 text-xs text-slate-500">
				{#if complete}
					All questions answered.
				{:else}
					Answer all {requiredQuestionList.length} required questions to enable export.
				{/if}
			</p>
			{#if downloadError}<p class="m-0 text-sm text-rose-800" role="alert">{downloadError}</p>{/if}
		</div>
	{/if}
{/snippet}
