import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSubmissions } from '../src/lib/content/analysis.ts';

function answer(overrides = {}) {
	return {
		questionId: 'question-1',
		questionRevision: 'old',
		sectionId: 'section-1',
		sectionTitle: 'Section',
		question: 'Old wording',
		type: 'multiple-choice',
		response: { selectedOptionIds: ['a'] },
		correctResponse: { selectedOptionIds: ['a'] },
		options: [
			{ id: 'a', text: 'Old option', correct: true, selected: true },
			{ id: 'b', text: 'Distractor', correct: false, selected: false }
		],
		isCorrect: true,
		...overrides
	};
}

function payload(createdAt, answers, strandId = 'html') {
	return {
		format: 'webbasics-submission',
		formatVersion: 1,
		strandId,
		strandTitle: strandId,
		createdAt,
		answers
	};
}

test('groups by question ID while keeping revision wording, grading and export dates separate', () => {
	const newer = answer({
		questionRevision: 'new',
		question: 'Corrected wording',
		correctResponse: { selectedOptionIds: [] },
		options: [{ id: 'a', text: 'New option', correct: false, selected: true }],
		isCorrect: false
	});
	const [metric] = analyzeSubmissions([
		payload('2026-11-03T08:00:00Z', [answer()]),
		payload('2026-11-01T10:00:00+02:00', [answer()]),
		payload('2026-11-04T08:00:00Z', [newer])
	]);
	assert.equal(metric.attempts, 3);
	assert.equal(metric.wrong, 1);
	assert.equal(metric.versions.length, 2);
	const [current, old] = metric.versions;
	assert.equal(current.question, 'Corrected wording');
	assert.equal(current.items[0].text, 'New option');
	assert.equal(current.items[0].correctOption, false);
	assert.equal(current.wrong, 1);
	assert.equal(old.question, 'Old wording');
	assert.equal(old.items[0].text, 'Old option');
	assert.equal(old.items[0].correctOption, true);
	assert.equal(old.wrong, 0);
	assert.equal(old.firstExportedAt, '2026-11-01T08:00:00.000Z');
	assert.equal(old.lastExportedAt, '2026-11-03T08:00:00.000Z');
});

test('counts checked and unchecked choices, including unselected correct choices', () => {
	const unchecked = answer({
		options: [
			{ id: 'a', text: 'Old option', correct: true, selected: false },
			{ id: 'b', text: 'Distractor', correct: false, selected: true }
		],
		isCorrect: false
	});
	const [metric] = analyzeSubmissions([
		payload('2026-11-01T08:00:00Z', [answer()]),
		payload('2026-11-02T08:00:00Z', [unchecked])
	]);
	for (const item of metric.versions[0].items) {
		assert.equal(item.checked, 1);
		assert.equal(item.attempts - item.checked, 1);
		assert.equal(item.wrong, 1);
	}
	assert.equal(metric.versions[0].items[0].correctOption, true);
	assert.equal(metric.versions[0].items[1].correctOption, false);
	assert.equal(metric.wrong, 2);
	assert.equal(metric.versions[0].wrong, 2);
});

test('retains sort-item error counts and separates courses sharing a question ID', () => {
	const sort = answer({
		type: 'sort',
		response: { placements: { a: 'wrong-target' } },
		correctResponse: { placements: { a: 'target' } },
		options: undefined,
		items: [
			{
				id: 'a',
				text: 'Item',
				correctTargetId: 'target',
				selectedTargetId: 'wrong-target',
				correct: false
			}
		],
		isCorrect: false
	});
	const metrics = analyzeSubmissions([
		payload('2026-11-01T08:00:00Z', [sort]),
		payload('2026-11-01T08:00:00Z', [answer()], 'css')
	]);
	assert.equal(metrics.length, 2);
	assert.equal(metrics[0].versions[0].items[0].wrong, 1);
	assert.equal(metrics[0].versions[0].items[0].correctOption, false);
	assert.equal(metrics[1].wrong, 0);
});

test('preserves submitted bonus text responses in the question revision metrics', () => {
	const response = {
		prompt: 'Inspect Wikipedia page source.',
		response: '<!-- A comment -->',
		submittedAt: '2026-11-11T12:00:00Z'
	};
	const [metric] = analyzeSubmissions([
		payload('2026-11-11T12:01:00Z', [answer({ bonusResponse: response })])
	]);
	assert.equal(metric.attempts, 1);
	assert.deepEqual(metric.versions[0].bonusResponses, [response]);
});

test('keeps standalone input responses ungraded across exercise type changes', () => {
	const input = answer({
		type: 'input',
		questionRevision: 'input-revision',
		response: { text: '<!-- A comment -->', submittedAt: '2026-11-11T12:00:00Z' },
		correctResponse: {},
		options: undefined,
		isCorrect: null
	});
	const [metric] = analyzeSubmissions([
		payload('2026-11-11T12:01:00Z', [input]),
		payload('2026-11-11T12:02:00Z', [
			answer({
				isCorrect: false,
				options: [{ id: 'a', text: 'Option', correct: true, selected: false }]
			})
		])
	]);
	assert.equal(metric.attempts, 2);
	assert.equal(metric.gradedAttempts, 1);
	assert.equal(metric.wrong, 1);
	assert.deepEqual(metric.versions.find((version) => version.type === 'input').textResponses, [
		{
			response: '<!-- A comment -->',
			submittedAt: '2026-11-11T12:00:00Z'
		}
	]);
});

test('totals wrong subtasks across submissions and revisions instead of failed attempts', () => {
	const incorrect = answer({
		options: [
			{ id: 'a', text: 'Select this', correct: true, selected: false },
			{ id: 'b', text: 'Do not select', correct: false, selected: true },
			{ id: 'c', text: 'Another correct option', correct: true, selected: false }
		],
		isCorrect: false
	});
	const placement = answer({
		questionRevision: 'placement',
		type: 'drag-n-drop',
		options: undefined,
		response: { placements: {} },
		correctResponse: { placements: { a: 'target', b: 'target' } },
		items: [
			{ id: 'a', text: 'A', correctTargetId: 'target', selectedTargetId: null, correct: false },
			{ id: 'b', text: 'B', correctTargetId: 'target', selectedTargetId: null, correct: false }
		],
		isCorrect: false
	});
	const [metric] = analyzeSubmissions([
		payload('2026-11-01T08:00:00Z', [incorrect]),
		payload('2026-11-02T08:00:00Z', [incorrect]),
		payload('2026-11-03T08:00:00Z', [placement])
	]);
	assert.equal(metric.attempts, 3);
	assert.equal(metric.wrong, 8);
	assert.equal(metric.versions.find((version) => version.revision === 'old').wrong, 6);
	assert.equal(metric.versions.find((version) => version.revision === 'placement').wrong, 2);
	for (const version of metric.versions) {
		assert.equal(
			version.wrong,
			version.items.reduce((sum, item) => sum + item.wrong, 0)
		);
	}
});
