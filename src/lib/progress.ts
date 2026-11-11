import { browser } from '$app/env';
import { get, writable } from 'svelte/store';
import { getQuestion, legacyCommentVisibilityRevision, questionRevision } from './content/course.js';
import type { SavedProgress, SubmittedAnswer } from './content/types.js';

const STORAGE_KEY = 'webbasics.progress.v1';

const emptyProgress: SavedProgress = { version: 1, answers: {}, changeNotices: [] };

export const progress = writable<SavedProgress>(emptyProgress);
export const progressLoaded = writable(false);
export const progressError = writable('');

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSubmittedAnswer(value: unknown): value is SubmittedAnswer {
	if (!isRecord(value)) return false;
	return (
		typeof value.questionId === 'string' &&
		typeof value.revision === 'string' &&
		typeof value.submittedAt === 'string' &&
		(value.type === 'multiple-choice' || value.type === 'drag-n-drop' || value.type === 'sort' || value.type === 'input') &&
		(value.type === 'input' ? value.isCorrect === null && typeof value.textResponse === 'string' : typeof value.isCorrect === 'boolean') &&
		(value.selectedOptionIds === undefined || isStringArray(value.selectedOptionIds)) &&
		(value.placements === undefined ||
			(isRecord(value.placements) &&
				Object.values(value.placements).every((targetId) => typeof targetId === 'string'))) &&
		(value.bonusResponse === undefined || typeof value.bonusResponse === 'string') &&
		(value.bonusSubmittedAt === undefined || typeof value.bonusSubmittedAt === 'string')
	);
}

function persist(next: SavedProgress) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch (error) {
		progressError.set(
			error instanceof Error ? `Could not save progress: ${error.message}` : 'Could not save progress.'
		);
		throw error;
	}
}

export function hydrateProgress() {
	if (!browser || get(progressLoaded)) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			progressLoaded.set(true);
			return;
		}

		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed) || !isRecord(parsed.answers)) {
			throw new Error('Saved progress has an unexpected format.');
		}

		const savedAnswers = parsed.answers;
		const notices = isStringArray(parsed.changeNotices) ? parsed.changeNotices : [];
		const restored: SavedProgress = {
			version: 1,
			answers: {},
			changeNotices: [...notices]
		};

		for (const [id, value] of Object.entries(savedAnswers)) {
			if (!isSubmittedAnswer(value)) continue;
			const question = getQuestion(id);
			if (!question) continue;
			if (id === 'comment-visibility' && question.type === 'multiple-choice') {
				const bonus = getQuestion('comment-visibility-bonus');
				if (bonus?.type === 'input' && value.revision === legacyCommentVisibilityRevision(question, bonus)) {
					const { bonusResponse, bonusSubmittedAt, ...answer } = value;
					restored.answers[id] = { ...answer, revision: questionRevision(question) };
					if (bonusResponse?.trim()) {
						restored.answers[bonus.id] = {
							questionId: bonus.id,
							revision: questionRevision(bonus),
							submittedAt: bonusSubmittedAt ?? value.submittedAt,
							type: 'input',
							textResponse: bonusResponse,
							isCorrect: null
						};
					}
					continue;
				}
			}
			if (value.type !== question.type || value.revision !== questionRevision(question)) {
				restored.changeNotices.push(id);
				continue;
			}
			restored.answers[id] = value;
		}

		restored.changeNotices = [...new Set(restored.changeNotices)];
		progress.set(restored);
		if (JSON.stringify(restored) !== raw) persist(restored);
		progressLoaded.set(true);
	} catch (error) {
		progressError.set(
			error instanceof Error
				? `Could not restore saved progress: ${error.message}`
				: 'Could not restore saved progress.'
		);
		progressLoaded.set(true);
	}
}

export function saveAnswer(answer: SubmittedAnswer) {
	const current = get(progress);
	if (current.answers[answer.questionId]) {
		throw new Error('This question has already been answered.');
	}
	const next: SavedProgress = {
		...current,
		answers: { ...current.answers, [answer.questionId]: answer }
	};
	persist(next);
	progress.set(next);
}

export function clearChangeNotice(questionId: string) {
	const current = get(progress);
	if (!current.changeNotices.includes(questionId)) return;
	const next = {
		...current,
		changeNotices: current.changeNotices.filter((id) => id !== questionId)
	};
	persist(next);
	progress.set(next);
}

export function resetProgress() {
	persist(emptyProgress);
	progress.set(emptyProgress);
	progressError.set('');
}
