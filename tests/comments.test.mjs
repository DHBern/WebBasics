import assert from 'node:assert/strict';
import test from 'node:test';
import {
	isExerciseComment,
	isLearnerComment,
	restoreComments,
	updateComment
} from '../src/lib/content/comments.ts';
import { renderDashboardMarkdown } from '../src/lib/content/markdown.ts';

const comment = {
	targetId: 'example',
	title: 'Example exercise',
	text: 'The instructions are confusing.',
	updatedAt: '2026-11-13T02:00:00Z',
	sectionId: 'comments',
	sectionTitle: 'Comments',
	revision: 'old-revision'
};

test('comments are optional in older storage and retain historical exercise metadata', () => {
	assert.deepEqual(restoreComments(undefined, isExerciseComment), {});
	const restored = restoreComments({ example: comment }, isExerciseComment);
	assert.deepEqual(restored.example, comment);
	assert.equal(isLearnerComment(comment), true);
	assert.equal(
		isExerciseComment({
			targetId: 'section',
			title: 'Section',
			text: 'Good',
			updatedAt: comment.updatedAt
		}),
		false
	);
	assert.throws(() => restoreComments({ wrong: comment }, isExerciseComment), /unexpected format/);
	assert.throws(
		() => restoreComments({ example: { ...comment, updatedAt: 'invalid' } }, isExerciseComment),
		/unexpected format/
	);
});

test('editing replaces a saved comment and clearing removes it from the exported values', () => {
	const original = { example: comment };
	const edited = updateComment(original, {
		...comment,
		text: '  A clearer suggestion.  ',
		updatedAt: '2026-11-13T03:00:00Z'
	});
	assert.equal(edited.example.text, 'A clearer suggestion.');
	assert.equal(edited.example.updatedAt, '2026-11-13T03:00:00Z');
	assert.equal(original.example.text, 'The instructions are confusing.');
	assert.equal(Object.values(edited).length, 1);
	assert.deepEqual(updateComment(edited, { ...comment, text: ' \n ' }), {});
});

test('dashboard renders highlighted HTML fences while escaping uploaded raw HTML', () => {
	const html = renderDashboardMarkdown(
		'Inspect this:\n\n```html\n<p class="intro">Hello</p>\n```\n\n<img src=x onerror=alert(1)>'
	);
	assert.match(html, /<pre class="language-html"><code class="language-html">/);
	assert.match(html, /class="token tag"/);
	assert.match(html.replace(/<\/?span\b[^>]*>/g, ''), /&lt;p/);
	assert.doesNotMatch(html, /<img /);
	assert.match(html, /&lt;img/);
	assert.doesNotMatch(renderDashboardMarkdown('[bad](javascript:alert%281%29)'), /href=/);
	assert.match(renderDashboardMarkdown('[source](https://example.com/)'), /target="_blank"/);
});
