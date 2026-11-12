<script lang="ts">
	import { strands } from '#lib/content/course.js';
</script>

<svelte:head>
	<title>WebBasics — Repetitorium</title>
	<meta name="description" content="Interactive HTML, CSS, and web concepts review." />
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-900">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
			<a href="/" class="text-lg font-bold tracking-tight">WebBasics</a>
			<a
				class="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-950"
				href="/dashboard/"
			>
				Instructor analysis
			</a>
		</div>
	</header>
	<section class="mx-auto max-w-7xl px-6 py-16 sm:py-24">
		<p class="text-sm font-semibold tracking-widest text-orange-700 uppercase">
			Digital skills review
		</p>
		<h1 class="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
			Choose a course strand.
		</h1>
		<p class="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
			Review concepts in short sections. Your answers are saved in this browser and can be exported
			when a strand is complete.
		</p>
		<div class="mt-12 grid gap-5 md:grid-cols-3">
			{#each strands as strand (strand.id)}
				<article class="strand-card">
					<p class="text-sm font-semibold text-orange-700">
						{strand.sections.length ? `${strand.sections.length} sections` : 'Coming soon'}
					</p>
					<h2 class="mt-3 text-xl font-bold">{strand.title}</h2>
					<p class="mt-3 text-sm leading-relaxed text-slate-600">{strand.description}</p>
					{#if strand.id === 'html'}
						<a class="button-primary mt-6 inline-flex" href="/courses/html/welcome/">Open course</a>
					{:else}
						<span class="mt-6 inline-block text-sm font-medium text-slate-500"
							>Not available yet</span
						>
					{/if}
				</article>
			{/each}
		</div>
	</section>
</main>
