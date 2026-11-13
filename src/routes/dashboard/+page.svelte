<script lang="ts">
	import { strands, questionRevision } from '#lib/content/course.js';
	import { analyzeSubmissions } from '#lib/content/analysis.js';
	import PlacementSubmission from '#lib/components/PlacementSubmission.svelte';
	import { isExerciseComment, isLearnerComment } from '#lib/content/comments.js';
	import { renderDashboardMarkdown } from '#lib/content/markdown.js';
	import type { SubmissionFile, SubmissionPayload } from '#lib/content/types.js';

	type ImportedFile = {
		name: string;
		payload: SubmissionPayload | null;
		checksum: string;
		checksumValid: boolean;
		duplicate: boolean;
		includeInvalid: boolean;
		error: string;
	};

	let files = $state<ImportedFile[]>([]);
	let importError = $state('');
	let importing = $state(false);
	let sortBy = $state<'wrong' | 'course'>('wrong');
	const exerciseOrder = strands.flatMap((strand) =>
		strand.sections.flatMap((section) =>
			section.questions.map((question) => JSON.stringify([strand.id, question.id]))
		)
	);

	function isObject(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	function isStringArray(value: unknown): value is string[] {
		return Array.isArray(value) && value.every((item) => typeof item === 'string');
	}

	function isStringMap(value: unknown): value is Record<string, string> {
		return isObject(value) && Object.values(value).every((item) => typeof item === 'string');
	}

	function isQuestionAnswer(value: unknown): value is SubmissionPayload['answers'][number] {
		if (!isObject(value) || !isObject(value.response) || !isObject(value.correctResponse))
			return false;
		if (
			typeof value.questionId !== 'string' ||
			typeof value.questionRevision !== 'string' ||
			typeof value.sectionId !== 'string' ||
			typeof value.sectionTitle !== 'string' ||
			typeof value.question !== 'string' ||
			(value.type !== 'multiple-choice' &&
				value.type !== 'drag-n-drop' &&
				value.type !== 'sort' &&
				value.type !== 'input') ||
			(value.type === 'input' ? value.isCorrect !== null : typeof value.isCorrect !== 'boolean')
		) {
			return false;
		}

		if (value.description !== undefined && !isStringArray(value.description)) {
			return false;
		}
		if (
			value.targets !== undefined &&
			(!Array.isArray(value.targets) ||
				!value.targets.every(
					(target) =>
						isObject(target) &&
						typeof target.id === 'string' &&
						typeof target.label === 'string' &&
						['parentId', 'prefix', 'suffix', 'displayText'].every(
							(key) => target[key] === undefined || typeof target[key] === 'string'
						)
				))
		) {
			return false;
		}
		if (
			value.bonusResponse !== undefined &&
			(!isObject(value.bonusResponse) ||
				typeof value.bonusResponse.prompt !== 'string' ||
				typeof value.bonusResponse.response !== 'string' ||
				typeof value.bonusResponse.submittedAt !== 'string' ||
				!Number.isFinite(Date.parse(value.bonusResponse.submittedAt)))
		) {
			return false;
		}
		if (
			value.options !== undefined &&
			(!Array.isArray(value.options) ||
				!value.options.every(
					(option) =>
						isObject(option) &&
						typeof option.id === 'string' &&
						typeof option.text === 'string' &&
						typeof option.correct === 'boolean' &&
						typeof option.selected === 'boolean'
				))
		) {
			return false;
		}
		if (
			value.items !== undefined &&
			(!Array.isArray(value.items) ||
				!value.items.every(
					(item) =>
						isObject(item) &&
						typeof item.id === 'string' &&
						typeof item.text === 'string' &&
						typeof item.correctTargetId === 'string' &&
						(item.selectedTargetId === null || typeof item.selectedTargetId === 'string') &&
						typeof item.correct === 'boolean'
				))
		) {
			return false;
		}
		if (value.type === 'multiple-choice') {
			return (
				isStringArray(value.response.selectedOptionIds) &&
				isStringArray(value.correctResponse.selectedOptionIds) &&
				Array.isArray(value.options)
			);
		}
		if (value.type === 'input') {
			return (
				typeof value.response.text === 'string' &&
				typeof value.response.submittedAt === 'string' &&
				Number.isFinite(Date.parse(value.response.submittedAt))
			);
		}
		return (
			isStringMap(value.response.placements) &&
			isStringMap(value.correctResponse.placements) &&
			Array.isArray(value.items)
		);
	}

	function isSubmissionFile(value: unknown): value is SubmissionFile {
		if (!isObject(value) || !isObject(value.payload) || !isObject(value.checksum)) return false;
		const payload = value.payload;
		return (
			payload.format === 'webbasics-submission' &&
			payload.formatVersion === 1 &&
			typeof payload.strandId === 'string' &&
			typeof payload.strandTitle === 'string' &&
			typeof payload.createdAt === 'string' &&
			Number.isFinite(Date.parse(payload.createdAt)) &&
			(payload.exerciseComments === undefined ||
				(Array.isArray(payload.exerciseComments) &&
					payload.exerciseComments.every(isExerciseComment))) &&
			(payload.sectionComments === undefined ||
				(Array.isArray(payload.sectionComments) &&
					payload.sectionComments.every(isLearnerComment))) &&
			Array.isArray(payload.answers) &&
			payload.answers.every(isQuestionAnswer) &&
			value.checksum.algorithm === 'SHA-256' &&
			typeof value.checksum.value === 'string' &&
			/^[0-9a-f]{64}$/i.test(value.checksum.value)
		);
	}

	async function sha256(value: string): Promise<string> {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
		return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
			''
		);
	}

	async function importFiles(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement) || !input.files?.length) return;
		importing = true;
		importError = '';
		const added: ImportedFile[] = [];
		try {
			for (const file of Array.from(input.files)) {
				try {
					const parsed: unknown = JSON.parse(await file.text());
					if (!isSubmissionFile(parsed)) {
						added.push({
							name: file.name,
							payload: null,
							checksum: '',
							checksumValid: false,
							duplicate: false,
							includeInvalid: false,
							error: 'Unsupported or malformed submission JSON.'
						});
						continue;
					}

					const actual = await sha256(JSON.stringify(parsed.payload));
					added.push({
						name: file.name,
						payload: parsed.payload,
						checksum: parsed.checksum.value,
						checksumValid: actual === parsed.checksum.value.toLowerCase(),
						duplicate: false,
						includeInvalid: false,
						error: actual === parsed.checksum.value.toLowerCase() ? '' : 'Checksum mismatch.'
					});
				} catch (error) {
					added.push({
						name: file.name,
						payload: null,
						checksum: '',
						checksumValid: false,
						duplicate: false,
						includeInvalid: false,
						error: error instanceof Error ? error.message : 'Could not read this file.'
					});
				}
			}

			const seen = new Set(
				files.filter((file) => file.checksum).map((file) => file.checksum.toLowerCase())
			);
			for (const file of added) {
				if (file.checksum && seen.has(file.checksum.toLowerCase())) {
					file.duplicate = true;
					file.error = 'Duplicate submission; excluded from totals.';
				} else if (file.checksum) {
					seen.add(file.checksum.toLowerCase());
				}
			}
			files = [...files, ...added];
		} finally {
			importing = false;
			input.value = '';
		}
	}

	let analyzableFiles = $derived(
		files.filter(
			(file) => file.payload && !file.duplicate && (file.checksumValid || file.includeInvalid)
		)
	);

	let metrics = $derived.by(() => {
		const payloads = analyzableFiles.flatMap((file) => (file.payload ? [file.payload] : []));
		return analyzeSubmissions(payloads).sort((a, b) => {
			if (sortBy === 'course') {
				const first = exerciseOrder.indexOf(a.key);
				const second = exerciseOrder.indexOf(b.key);
				return (
					(first < 0 ? Infinity : first) - (second < 0 ? Infinity : second) ||
					a.versions[0].sectionTitle.localeCompare(b.versions[0].sectionTitle) ||
					a.versions[0].question.localeCompare(b.versions[0].question)
				);
			}
			return b.wrong - a.wrong || a.questionId.localeCompare(b.questionId);
		});
	});

	let exerciseComments = $derived(
		analyzableFiles.flatMap((file) =>
			(file.payload?.exerciseComments ?? []).map((comment) => ({
				...comment,
				file: file.name,
				strand: file.payload?.strandTitle
			}))
		)
	);
	let sectionComments = $derived(
		analyzableFiles.flatMap((file) =>
			(file.payload?.sectionComments ?? []).map((comment) => ({
				...comment,
				file: file.name,
				strand: file.payload?.strandTitle
			}))
		)
	);

	function currentQuestion(strandId: string, questionId: string) {
		const item = strands
			.find((strand) => strand.id === strandId)
			?.sections.flatMap((section) => section.questions)
			.find((question) => question.id === questionId);
		return item;
	}

	let validCount = $derived(
		files.filter((file) => file.payload && file.checksumValid && !file.duplicate).length
	);
	let invalidCount = $derived(
		files.filter((file) => file.payload && !file.checksumValid && !file.duplicate).length
	);
	let duplicateCount = $derived(files.filter((file) => file.duplicate).length);
</script>

<svelte:head>
	<title>Instructor analysis — WebBasics</title>
	<meta
		name="description"
		content="Analyze anonymized course submissions locally in your browser."
	/>
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-900">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
			<a href="/" class="text-lg font-bold tracking-tight">WebBasics</a>
			<a
				class="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-950"
				href="/"
			>
				← Courses
			</a>
		</div>
	</header>
	<div class="mx-auto max-w-7xl px-6 py-10">
		<p class="text-sm font-semibold tracking-widest text-orange-700 uppercase">Instructor tools</p>
		<h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Submission analysis</h1>
		<p class="mt-4 max-w-3xl leading-relaxed text-slate-600">
			Upload multiple JSON submissions to compare question and option error rates. Files are read
			and analyzed in this browser only; they are not sent to a server or saved by this dashboard.
		</p>
		<p
			class="mt-3 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
		>
			The SHA-256 checksum detects accidental corruption only. Because the app is static, a student
			can edit a file and calculate a new checksum; this is not tamper-proof verification.
		</p>

		<section class="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label for="submission-files" class="block font-semibold">Upload student JSON files</label>
			<p class="mt-1 text-sm text-slate-600">
				Multiple submissions can be selected at once. Exact duplicate files are excluded.
			</p>
			<input
				id="submission-files"
				class="mt-4 block w-full max-w-xl rounded-lg border border-slate-300 p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold"
				type="file"
				accept=".json,application/json"
				multiple
				onchange={importFiles}
				disabled={importing}
			/>
			{#if importing}<p class="mt-2 text-sm text-slate-600" role="status">Reading files…</p>{/if}
			{#if importError}<p class="mt-2 text-sm text-rose-800" role="alert">{importError}</p>{/if}
		</section>

		<div class="mt-6 grid gap-4 sm:grid-cols-3">
			<div class="summary-card"><span>Valid submissions</span><strong>{validCount}</strong></div>
			<div class="summary-card"><span>Invalid checksums</span><strong>{invalidCount}</strong></div>
			<div class="summary-card"><span>Duplicates</span><strong>{duplicateCount}</strong></div>
		</div>

		{#if files.some((file) => !file.checksumValid || file.duplicate)}
			<section class="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
				<h2 class="font-semibold">Files requiring attention</h2>
				<ul class="mt-3 space-y-3">
					{#each files.filter((file) => !file.checksumValid || file.duplicate) as file, index (file.name + index)}
						<li
							class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm"
						>
							<span><strong>{file.name}</strong> — {file.error}</span>
							{#if file.payload && !file.checksumValid && !file.duplicate}
								<label class="inline-flex items-center gap-2">
									<input type="checkbox" bind:checked={file.includeInvalid} />
									Include in analysis anyway
								</label>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="mt-8" aria-labelledby="section-comments-title">
			<h2 id="section-comments-title" class="text-2xl font-bold">Section comments</h2>
			{#if sectionComments.length}
				<ul class="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4">
					{#each sectionComments as comment, index (index)}
						<li class="py-4">
							<h3 class="font-semibold">{comment.title}</h3>
							<p class="mt-2 whitespace-pre-wrap break-words">{comment.text}</p>
							<p class="mt-2 text-xs text-slate-500">
								{comment.strand} · {comment.file} · Updated: {comment.updatedAt} · ID: {comment.targetId}
							</p>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm text-slate-600">No section comments in the included submissions.</p>
			{/if}
		</section>

		<section class="mt-8" aria-labelledby="exercise-comments-title">
			<h2 id="exercise-comments-title" class="text-2xl font-bold">Exercise comments</h2>
			{#if exerciseComments.length}
				<ul class="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4">
					{#each exerciseComments as comment, index (index)}
						<li class="py-4">
							<div class="prose max-w-none font-semibold">
								{@html renderDashboardMarkdown(comment.title)}
							</div>
							<p class="mt-2 whitespace-pre-wrap break-words">{comment.text}</p>
							<p class="mt-2 text-xs text-slate-500">
								{comment.strand} · {comment.sectionTitle} · {comment.file} · Updated: {comment.updatedAt}
								· ID: {comment.targetId} · Revision: {comment.revision}
							</p>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm text-slate-600">No exercise comments in the included submissions.</p>
			{/if}
		</section>

		<section class="mt-8">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 class="text-2xl font-bold">Exercise results</h2>
					<p class="mt-1 text-sm text-slate-600">
						Results are grouped by question ID within each course, with separate revision
						breakdowns. Each revision keeps its original grading, options, and any submitted Bonus
						text responses. Wrong subtasks are summed across all submissions, and exercises are
						ranked by this total or by course order. Each gallery card represents one anonymous
						submission, not an identified student. Dates refer to JSON exports, not answer times.
					</p>
				</div>
				<label class="text-sm font-medium">
					Sort by
					<select
						class="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1"
						bind:value={sortBy}
					>
						<option value="wrong">Wrong subtasks</option>
						<option value="course">Section and exercise order</option>
					</select>
				</label>
			</div>

			{#if !metrics.length}
				<p
					class="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600"
				>
					Upload valid submissions to see aggregate results.
				</p>
			{:else}
				<div class="mt-5 space-y-4">
					{#each metrics as metric (metric.key)}
						{@const current = currentQuestion(metric.strandId, metric.questionId)}
						{@const latest = metric.versions[0]}
						<details class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
							<summary
								class="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 p-4 text-sm"
							>
								<div class="min-w-0">
									<span class="block text-xs font-semibold text-orange-700"
										>{latest.sectionTitle} · {latest.type}</span
									>
									<div class="prose mt-1 max-w-none font-semibold text-slate-900">
										{@html renderDashboardMarkdown(current?.prompt ?? latest.question)}
									</div>
									<span class="mt-1 block text-xs text-slate-500"
										>ID: {metric.questionId} · {metric.versions.length} revision(s)</span
									>
									{#if metric.versions.some((version) => !current || questionRevision(current) !== version.revision)}
										<span class="mt-1 block text-xs font-semibold text-amber-800"
											>Includes historical or unavailable versions — expand for export dates</span
										>
									{/if}
								</div>
								<span class="text-right font-semibold"
									>{metric.gradedAttempts ? `${metric.wrong} wrong subtasks` : 'Ungraded'}</span
								>
								<span class="text-right text-slate-500">{metric.attempts} tries</span>
							</summary>
							{#each metric.versions as version (version.revision + version.type)}
								{@const outdated = current && questionRevision(current) !== version.revision}
								<div class="border-t border-slate-200 bg-slate-50 px-4 py-4">
									<h3 class="text-sm font-semibold">
										Revision {version.revision}
										<span class={outdated || !current ? 'text-amber-800' : 'text-emerald-800'}>
											— {outdated
												? 'Outdated question/options'
												: current
													? 'Current version'
													: 'Question no longer available in this course'}
										</span>
									</h3>
									<div class="prose mt-2 max-w-none text-sm font-medium">
										{@html renderDashboardMarkdown(version.question)}
									</div>
									{#if version.description?.length}
										<div class="prose mt-2 max-w-none text-sm">
											{#each version.description as block}
												{@html renderDashboardMarkdown(block)}
											{/each}
										</div>
									{/if}
									<p class="mt-1 text-xs text-slate-600">
										Exported: <time datetime={version.firstExportedAt}
											>{version.firstExportedAt}</time
										>
										{#if version.firstExportedAt !== version.lastExportedAt}
											to <time datetime={version.lastExportedAt}>{version.lastExportedAt}</time>
										{/if}
									</p>
									{#if version.type === 'sort' || version.type === 'drag-n-drop'}
										<p class="mt-2 text-sm">
											{version.wrong} wrong subtasks · {version.attempts} tries
										</p>
										<h4 class="mt-4 text-sm font-semibold">Student placements</h4>
										<div class="placement-gallery mt-3">
											{#each version.placementResponses as response, index (index)}
												<article class="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
													<h5 class="text-sm font-semibold">Submission {response.submission}</h5>
													<p class="mb-2 text-xs text-slate-500">Exported: {response.exportedAt}</p>
													<PlacementSubmission
														answer={response.answer}
														current={current?.type === 'sort' || current?.type === 'drag-n-drop'
															? current
															: undefined}
													/>
												</article>
											{/each}
										</div>
									{:else if version.type === 'multiple-choice'}
										<p class="mt-2 text-sm">
											{version.wrong} wrong subtasks · {version.attempts} tries
										</p>
										<h4 class="mt-4 text-sm font-semibold">Option selections</h4>
										{#if version.items.length}
											<ul class="mt-3 divide-y divide-slate-200">
												{#each version.items as item (item.id)}
													<li
														class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
													>
														<div class="prose min-w-0 max-w-none">
															{@html renderDashboardMarkdown(item.text)}
														</div>
														<span class="font-semibold">
															<span
																class={item.correctOption ? 'text-emerald-800' : 'text-rose-800'}
																>{item.checked} checked</span
															>
															/
															<span
																class={item.correctOption ? 'text-rose-800' : 'text-emerald-800'}
																>{item.attempts - item.checked} unchecked</span
															>
														</span>
													</li>
												{/each}
											</ul>
										{:else}
											<p class="mt-2 text-sm text-slate-600">
												This question has no individually analyzable choices/items.
											</p>
										{/if}
									{:else}
										<h4 class="mt-4 text-sm font-semibold">Text responses (ungraded)</h4>
										<ul class="mt-2 divide-y divide-slate-200">
											{#each version.textResponses as response, index (`${response.submittedAt}-${index}`)}
												<li class="py-3 text-sm">
													<p class="whitespace-pre-wrap">{response.response}</p>
													<p class="mt-2 text-xs text-slate-600">
														Submitted: {response.submittedAt}
													</p>
												</li>
											{/each}
										</ul>
									{/if}
									{#if version.bonusResponses.length}
										<h4 class="mt-5 text-sm font-semibold">Bonus text responses</h4>
										<ul class="mt-2 divide-y divide-slate-200">
											{#each version.bonusResponses as bonus, index (`${bonus.submittedAt}-${index}`)}
												<li class="py-3 text-sm">
													<div class="prose max-w-none font-semibold">
														{@html renderDashboardMarkdown(bonus.prompt)}
													</div>
													<p class="mt-1 whitespace-pre-wrap">{bonus.response}</p>
													<p class="mt-2 text-xs text-slate-600">Submitted: {bonus.submittedAt}</p>
												</li>
											{/each}
										</ul>
									{/if}
								</div>
							{/each}
						</details>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</main>

<style>
	.placement-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: 1rem;
	}

	.placement-gallery article {
		overflow-x: auto;
	}
</style>
