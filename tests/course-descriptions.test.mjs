import assert from 'node:assert/strict';
import test from 'node:test';
import { getQuestion, questionRevision } from '../src/lib/content/course.ts';
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
	const html = blocks.map(renderMarkdown).join('');
	assert.match(html, /<p>Consider the following HTML:<\/p>/);
	assert.match(html, /<pre><code class="language-html">/);
	assert.match(html, /&lt;p&gt;Visible text&lt;\/p&gt;/);
	assert.match(html, /<p>Which statement is correct\?<\/p>/);
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
	assert.match(renderInline(question.bonusPrompt), /<a href="https:\/\/www\.wikipedia\.org\/">Wikipedia<\/a>/);
});
