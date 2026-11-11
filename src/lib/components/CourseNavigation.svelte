<script lang="ts">
	import { resetProgress, progress, progressError } from '#lib/progress.js';
	import { htmlSections, requiredQuestionList, bonusQuestionIds } from '#lib/content/course.js';
	import type { Question } from '#lib/content/types.js';

	let { activeSection = '' }: { activeSection?: string } = $props();
	let navigationOpen = $state(false);

	function sectionQuestions(sectionId: string): Question[] {
		const section = htmlSections.find((item) => item.id === sectionId);
		return section?.questions.filter((item): item is Question => item.type !== 'lesson' && !bonusQuestionIds.has(item.id)) ?? [];
	}

	function reset() {
		if (window.confirm('Reset all answers saved in this browser? You will be able to answer every question again.')) {
			resetProgress();
		}
	}
</script>

<aside class="course-sidebar">
	<div class="flex items-center justify-between gap-3">
		<a class="font-bold text-slate-950" href="/">WebBasics</a>
		<button
			class="mobile-nav-toggle"
			type="button"
			aria-expanded={navigationOpen}
			aria-controls="course-navigation-panel"
			onclick={() => (navigationOpen = !navigationOpen)}
		>
			{navigationOpen ? 'Close menu' : 'Course menu'}
		</button>
	</div>
	<div class="mt-5 flex items-center justify-between gap-2">
		<a class="text-sm font-semibold text-slate-700 hover:text-orange-700" href="/courses/html/welcome/">
			HTML Questions
		</a>
		<span class="text-xs text-slate-500">{requiredQuestionList.filter((question) => $progress.answers[question.id]).length}/{requiredQuestionList.length}</span>
	</div>
	<div id="course-navigation-panel" class="course-nav-panel" class:course-nav-panel-open={navigationOpen}>
		<nav class="mt-3 space-y-1" aria-label="HTML course sections">
			<a
				class="section-link"
				class:section-link-active={activeSection === ''}
				href="/courses/html/welcome/"
				aria-current={activeSection === '' ? 'page' : undefined}
			>
				<span>Welcome</span>
			</a>
			{#each htmlSections as section (section.id)}
				{@const questions = sectionQuestions(section.id)}
				{@const multipleChoiceCount = questions.filter((question) => question.type === 'multiple-choice').length}
				{@const dragAndDropCount = questions.filter((question) => question.type === 'drag-n-drop').length}
				{@const sortCount = questions.filter((question) => question.type === 'sort').length}
				{@const answered = questions.filter((question) => $progress.answers[question.id]).length}
				<a
					class="section-link"
					class:section-link-active={activeSection === section.id}
					href={`/courses/html/${section.id}/`}
					aria-current={activeSection === section.id ? 'page' : undefined}
				>
					<span class="min-w-0 flex-1">
						<span class="block">{section.title}</span>
						<span class="mt-1 block text-xs text-slate-500">{answered}/{questions.length} answered</span>
					</span>
					<span class="flex shrink-0 flex-col items-end gap-1 text-[10px] text-slate-500">
						{#if multipleChoiceCount}<span>{multipleChoiceCount} MCQ</span>{/if}
						{#if dragAndDropCount}<span>{dragAndDropCount} drag-n-drop</span>{/if}
						{#if sortCount}<span>{sortCount} sort</span>{/if}
					</span>
				</a>
			{/each}
		</nav>
		<a class="mt-5 block text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-950" href="/dashboard/">
			Instructor analysis
		</a>
		<button class="button-secondary mt-4 w-full text-sm" onclick={reset}>Reset progress</button>
		{#if $progressError}
			<p class="mt-3 text-xs text-rose-800" role="alert">{$progressError}</p>
		{/if}
	</div>
</aside>
