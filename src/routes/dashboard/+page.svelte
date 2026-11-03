<script lang="ts">
	import { strands } from '#lib/content/course.js';
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

	type ItemMetric = {
		id: string;
		text: string;
		attempts: number;
		wrong: number;
	};

	type QuestionMetric = {
		key: string;
		questionId: string;
		revision: string;
		sectionTitle: string;
		question: string;
		type: string;
		attempts: number;
		wrong: number;
		items: ItemMetric[];
	};

	let files = $state<ImportedFile[]>([]);
	let importError = $state('');
	let importing = $state(false);
	let sortColumn = $state<'wrong' | 'rate'>('wrong');

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
		if (!isObject(value) || !isObject(value.response) || !isObject(value.correctResponse)) return false;
		if (
			typeof value.questionId !== 'string' ||
			typeof value.questionRevision !== 'string' ||
			typeof value.sectionId !== 'string' ||
			typeof value.sectionTitle !== 'string' ||
			typeof value.question !== 'string' ||
			(value.type !== 'multiple-choice' && value.type !== 'sort') ||
			typeof value.isCorrect !== 'boolean'
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
		return isStringMap(value.response.placements) && isStringMap(value.correctResponse.placements) && Array.isArray(value.items);
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
			Array.isArray(payload.answers) &&
			payload.answers.every(isQuestionAnswer) &&
			value.checksum.algorithm === 'SHA-256' &&
			typeof value.checksum.value === 'string' &&
			/^[0-9a-f]{64}$/i.test(value.checksum.value)
		);
	}

	async function sha256(value: string): Promise<string> {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
		return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
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
		files.filter((file) => file.payload && !file.duplicate && (file.checksumValid || file.includeInvalid))
	);

	let metrics = $derived.by(() => {
		const grouped = new Map<string, QuestionMetric>();
		for (const file of analyzableFiles) {
			const payload = file.payload;
			if (!payload) continue;
			for (const answer of payload.answers) {
				const key = `${answer.questionId}:${answer.questionRevision}`;
				let metric = grouped.get(key);
				if (!metric) {
					metric = {
						key,
						questionId: answer.questionId,
						revision: answer.questionRevision,
						sectionTitle: answer.sectionTitle,
						question: answer.question,
						type: answer.type,
						attempts: 0,
						wrong: 0,
						items: []
					};
					grouped.set(key, metric);
				}
				metric.attempts++;
				if (!answer.isCorrect) metric.wrong++;

				const itemAnswers = answer.options ?? answer.items ?? [];
				for (const item of itemAnswers) {
					let itemMetric = metric.items.find((candidate) => candidate.id === item.id);
					if (!itemMetric) {
						itemMetric = { id: item.id, text: item.text, attempts: 0, wrong: 0 };
						metric.items.push(itemMetric);
					}
					itemMetric.attempts++;
					if ('selected' in item && item.correct !== item.selected) itemMetric.wrong++;
					if ('selectedTargetId' in item && !item.correct) itemMetric.wrong++;
				}
			}
		}
		return [...grouped.values()].sort((a, b) => {
			const first = sortColumn === 'wrong' ? a.wrong : a.wrong / a.attempts;
			const second = sortColumn === 'wrong' ? b.wrong : b.wrong / b.attempts;
			return second - first || b.wrong - a.wrong || a.questionId.localeCompare(b.questionId);
		});
	});

	let validCount = $derived(files.filter((file) => file.payload && file.checksumValid && !file.duplicate).length);
	let invalidCount = $derived(files.filter((file) => file.payload && !file.checksumValid && !file.duplicate).length);
	let duplicateCount = $derived(files.filter((file) => file.duplicate).length);
</script>

<svelte:head>
	<title>Instructor analysis — WebBasics</title>
	<meta name="description" content="Analyze anonymized course submissions locally in your browser." />
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-900">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
			<a href="/" class="text-lg font-bold tracking-tight">WebBasics</a>
			<a class="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-950" href="/">
				← Courses
			</a>
		</div>
	</header>
	<div class="mx-auto max-w-7xl px-6 py-10">
		<p class="text-sm font-semibold tracking-widest text-orange-700 uppercase">Instructor tools</p>
		<h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Submission analysis</h1>
		<p class="mt-4 max-w-3xl leading-relaxed text-slate-600">
			Upload multiple JSON submissions to compare question and option error rates. Files are read and analyzed in this browser only; they are not sent to a server or saved by this dashboard.
		</p>
		<p class="mt-3 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
			The SHA-256 checksum detects accidental corruption only. Because the app is static, a student can edit a file and calculate a new checksum; this is not tamper-proof verification.
		</p>

		<section class="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label for="submission-files" class="block font-semibold">Upload student JSON files</label>
			<p class="mt-1 text-sm text-slate-600">Multiple submissions can be selected at once. Exact duplicate files are excluded.</p>
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
						<li class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
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

		<section class="mt-8">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 class="text-2xl font-bold">Question and option errors</h2>
					<p class="mt-1 text-sm text-slate-600">Results are grouped by question ID and revision. Question and option error percentages include the number of submitted responses.</p>
				</div>
				<label class="text-sm font-medium">
					Rank by
					<select class="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1" bind:value={sortColumn}>
						<option value="wrong">Wrong count</option>
						<option value="rate">Wrong percentage</option>
					</select>
				</label>
			</div>

			{#if !metrics.length}
				<p class="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
					Upload valid submissions to see aggregate results.
				</p>
			{:else}
				<div class="mt-5 space-y-4">
					{#each metrics as metric (metric.key)}
						<details class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
							<summary class="grid cursor-pointer grid-cols-[minmax(0,1fr)_5rem_6rem_5rem] items-center gap-3 p-4 text-sm">
								<span class="min-w-0">
									<span class="block text-xs font-semibold text-orange-700">{metric.sectionTitle} · {metric.type}</span>
									<span class="mt-1 block font-semibold text-slate-900">{metric.question}</span>
									<span class="mt-1 block text-xs text-slate-500">ID: {metric.questionId} · revision {metric.revision}</span>
								</span>
								<span class="text-right font-semibold">{metric.wrong} wrong</span>
								<span class="text-right">{((metric.wrong / metric.attempts) * 100).toFixed(1)}%</span>
								<span class="text-right text-slate-500">{metric.attempts} tries</span>
							</summary>
							<div class="border-t border-slate-200 bg-slate-50 px-4 py-4">
								<h3 class="text-sm font-semibold">Option / item errors</h3>
								{#if metric.items.length}
									<ul class="mt-3 space-y-2">
										{#each metric.items as item (item.id)}
											<li class="grid grid-cols-[minmax(0,1fr)_5rem_6rem_5rem] gap-3 text-sm">
												<span>{item.text}</span>
												<span class="text-right font-semibold">{item.wrong} wrong</span>
												<span class="text-right">{((item.wrong / item.attempts) * 100).toFixed(1)}%</span>
												<span class="text-right text-slate-500">{item.attempts} tries</span>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="mt-2 text-sm text-slate-600">This question has no individually analyzable choices/items.</p>
								{/if}
							</div>
						</details>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</main>
