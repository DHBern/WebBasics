<script lang="ts">
	import CourseNavigation from '#lib/components/CourseNavigation.svelte';
	import Welcome from '#lib/content/html/welcome.svx';
</script>

<svelte:head>
	<title>HTML Questions — Welcome</title>
</svelte:head>

<div class="course-page-layout">
	<CourseNavigation />
	<main class="course-content">
		<div class="prose max-w-none">
			<Welcome />
		</div>
	</main>
</div>
