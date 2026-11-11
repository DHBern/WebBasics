import { get } from 'svelte/store';
import { htmlStrand, isPlacementCorrect, questionList, questionRevision, questionSection } from './course.js';
import { progress } from '#lib/progress.js';
import type { SubmissionFile, SubmissionPayload } from './types.js';

export function allQuestionsAnswered(): boolean {
	const answers = get(progress).answers;
	return questionList.every((question) => answers[question.id]);
}

export async function makeSubmission(): Promise<SubmissionFile> {
	const answers = get(progress).answers;
	if (!questionList.every((question) => answers[question.id])) {
		throw new Error('Answer every interactive question before exporting.');
	}

	const payload: SubmissionPayload = {
		format: 'webbasics-submission',
		formatVersion: 1,
		strandId: htmlStrand.id,
		strandTitle: htmlStrand.title,
		createdAt: new Date().toISOString(),
		answers: questionList.map((question) => {
			const section = questionSection(question.id);
			const submitted = answers[question.id];
			if (!section || !submitted) throw new Error(`Missing data for question "${question.id}".`);
			const base = {
				questionId: question.id,
				questionRevision: questionRevision(question),
				sectionId: section.id,
				sectionTitle: section.title,
				question: question.prompt,
				type: question.type,
				isCorrect: submitted.isCorrect,
				...(question.bonusPrompt && submitted.bonusResponse
					? {
							bonusResponse: {
								prompt: question.bonusPrompt,
								response: submitted.bonusResponse,
								submittedAt: submitted.bonusSubmittedAt ?? submitted.submittedAt
							}
						}
					: {})
			};
			if (question.type === 'multiple-choice') {
				const selected = new Set(submitted.selectedOptionIds ?? []);
				return {
					...base,
					...(question.description?.length ? { description: question.description } : {}),
					response: { selectedOptionIds: [...selected] },
					correctResponse: {
						selectedOptionIds: question.options
							.filter((option) => option.correct)
							.map((option) => option.id)
					},
					options: question.options.map((option) => ({
						id: option.id,
						text: option.text,
						correct: option.correct,
						selected: selected.has(option.id)
					}))
				};
			}
			const placements = submitted.placements ?? {};
			return {
				...base,
				response: { placements },
				correctResponse: { placements: question.answerKey },
				items: question.items.map((item) => ({
					id: item.id,
					text: item.text,
					correctTargetId: question.answerKey[item.id] ?? '',
					selectedTargetId: placements[item.id] ?? null,
					correct: isPlacementCorrect(question, item.id, placements[item.id] ?? '')
				}))
			};
		})
	};

	const canonicalPayload = JSON.stringify(payload);
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalPayload));
	const checksum = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
	return { payload, checksum: { algorithm: 'SHA-256', value: checksum } };
}

export async function downloadSubmission() {
	const submission = await makeSubmission();
	const blob = new Blob([JSON.stringify(submission, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `html-questions-${new Date().toISOString().slice(0, 10)}.json`;
	link.click();
	URL.revokeObjectURL(url);
}
