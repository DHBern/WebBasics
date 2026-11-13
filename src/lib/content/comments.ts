import type { ExerciseComment, LearnerComment } from './types.js';

export function isLearnerComment(value: unknown): value is LearnerComment {
	if (typeof value !== 'object' || value === null) return false;
	return (
		'targetId' in value &&
		typeof value.targetId === 'string' &&
		'title' in value &&
		typeof value.title === 'string' &&
		'text' in value &&
		typeof value.text === 'string' &&
		Boolean(value.text.trim()) &&
		'updatedAt' in value &&
		typeof value.updatedAt === 'string' &&
		Number.isFinite(Date.parse(value.updatedAt))
	);
}

export function isExerciseComment(value: unknown): value is ExerciseComment {
	return (
		isLearnerComment(value) &&
		'sectionId' in value &&
		typeof value.sectionId === 'string' &&
		'sectionTitle' in value &&
		typeof value.sectionTitle === 'string' &&
		'revision' in value &&
		typeof value.revision === 'string'
	);
}

export function restoreComments<T extends LearnerComment>(
	value: unknown,
	validate: (value: unknown) => value is T
): Record<string, T> {
	if (value === undefined) return {};
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('Saved comments have an unexpected format.');
	}
	const comments: Record<string, T> = {};
	for (const [id, comment] of Object.entries(value)) {
		if (!validate(comment) || comment.targetId !== id) {
			throw new Error('A saved comment has an unexpected format.');
		}
		comments[id] = comment;
	}
	return comments;
}

export function updateComment<T extends LearnerComment>(
	comments: Record<string, T>,
	comment: T
): Record<string, T> {
	const next = { ...comments };
	const text = comment.text.trim();
	if (text) next[comment.targetId] = { ...comment, text };
	else delete next[comment.targetId];
	return next;
}
