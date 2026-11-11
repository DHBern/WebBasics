import assert from 'node:assert/strict';
import test from 'node:test';
import { getQuestion, legacyCommentVisibilityRevision, mcq, input, sort, dragAndDrop, questionRevision, requiredQuestionList, bonusQuestionIds } from '../src/lib/content/course.ts';
import { renderInline, renderMarkdown } from '../src/lib/content/markdown.ts';
import { analyzeSubmissions } from '../src/lib/content/analysis.ts';

test('MCQ descriptions retain ordered paragraphs and code blocks inside the question', () => {
	const question = getQuestion('valid-html-comments');
	assert.equal(question.type, 'multiple-choice');
	assert.deepEqual(question.description, ['What are valid ways to wrap a comment in HTML? Select all that apply.']);
	const blocks = [
		'Consider the following HTML:',
		'```html\n<p>Visible text</p><!-- internal note -->\n```',
		'Which statement is correct?'
	];
	const exercise = mcq('example', 'Title', blocks, [{ id: 'a', text: 'A', correct: true }], [
		'Feedback paragraph.',
		'```html\n<p>Feedback example</p>\n```',
		'Another paragraph.'
	]);
	assert.deepEqual(exercise.description, blocks);
	const html = exercise.description.map(renderMarkdown).join('');
	assert.match(html, /<p>Consider the following HTML:<\/p>/);
	assert.match(html, /<pre><code class="language-html">/);
	assert.match(html, /&lt;p&gt;Visible text&lt;\/p&gt;/);
	assert.match(html, /<p>Which statement is correct\?<\/p>/);
	const feedback = exercise.feedback.map(renderMarkdown).join('');
	assert.match(feedback, /<p>Feedback paragraph\.<\/p>/);
	assert.match(feedback, /<pre><code class="language-html">&lt;p&gt;Feedback example&lt;\/p&gt;/);
	assert.match(feedback, /<p>Another paragraph\.<\/p>/);
	assert.match(renderMarkdown('One paragraph.\n\n```html\n<p>Code</p>\n```\n\nAnother paragraph.'), /<pre><code class="language-html">/);
	const withoutDescription = mcq('example-2', 'Title', [{ id: 'a', text: 'A', correct: true }], exercise.feedback, 'bonus');
	assert.equal(withoutDescription.options[0].id, 'a');
	assert.deepEqual(withoutDescription.feedback, exercise.feedback);
	assert.equal(withoutDescription.bonusId, 'bonus');
});

test('all exercise constructors accept an optional final bonus exercise ID', () => {
	const items = [{ id: 'item', text: 'Item' }];
	const targets = [{ id: 'target', label: 'Target' }];
	const answerKey = { item: 'target' };
	assert.equal(mcq('m', 'Title', [], undefined, 'bonus').bonusId, 'bonus');
	assert.equal(input('i', 'Title', undefined, undefined, 'bonus').bonusId, 'bonus');
	assert.equal(sort('s', 'Title', 'Instructions', items, targets, answerKey, undefined, 'bonus').bonusId, 'bonus');
	assert.equal(dragAndDrop('d', 'Title', 'Instructions', items, targets, answerKey, undefined, 'bonus').bonusId, 'bonus');
	assert.equal(dragAndDrop('url-parts', 'Title', 'Instructions', items, targets, 'Feedback', 'bonus').bonusId, 'bonus');
});

test('description edits invalidate only questions with changed descriptions', () => {
	const question = getQuestion('valid-html-comments');
	const revision = questionRevision(question);
	assert.notEqual(questionRevision({ ...question, description: ['Changed'] }), revision);
	const legacyQuestion = getQuestion('html-indentation');
	assert.equal(questionRevision({ ...legacyQuestion, description: [] }), questionRevision(legacyQuestion));
});

test('analysis preserves the exported description for historical revisions', () => {
	const description = ['A question', '```html\n<p>Example</p>\n```'];
	const [metric] = analyzeSubmissions([{
		format: 'webbasics-submission', formatVersion: 1, strandId: 'html', strandTitle: 'HTML',
		createdAt: '2026-11-11T00:00:00Z',
		answers: [{
			questionId: 'example', questionRevision: '1', sectionId: 'comments',
			sectionTitle: 'Comments', question: 'Title', description, type: 'multiple-choice',
			response: { selectedOptionIds: [] }, correctResponse: { selectedOptionIds: [] },
			options: [], isCorrect: true
		}]
	}]);
	assert.deepEqual(metric.versions[0].description, description);
});

test('comment visibility retains the original choices and a clickable Wikipedia bonus link', () => {
	const question = getQuestion('comment-visibility');
	assert.equal(question.prompt, '“Comments in HTML are invisible to the user.”');
	assert.deepEqual(question.options.map(({ text, correct }) => ({ text, correct })), [
		{ text: 'Yes', correct: false },
		{ text: 'No', correct: true }
	]);
	assert.equal(question.bonusId, 'comment-visibility-bonus');
	const bonus = getQuestion(question.bonusId);
	assert.equal(bonus.type, 'input');
	assert.match(renderInline(bonus.prompt), /<a href="https:\/\/www\.wikipedia\.org\/">Wikipedia<\/a>/);
	assert.equal(legacyCommentVisibilityRevision(question, bonus), '9bdc5394');
	assert.ok(bonusQuestionIds.has(bonus.id));
	assert.ok(!requiredQuestionList.some((item) => item.id === bonus.id));
	const ordinary = mcq('other', 'Title', [{ id: 'a', text: 'A', correct: true }]);
	assert.equal(ordinary.bonusId, undefined);
	assert.equal(questionRevision({ ...question, bonusId: undefined }), questionRevision(question));
});
