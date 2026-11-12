import assert from 'node:assert/strict';
import test from 'node:test';
import {
	getQuestion,
	mcq,
	input,
	sort,
	dragAndDrop,
	questionRevision,
	requiredQuestionList,
	bonusQuestionIds
} from '../src/lib/content/course.ts';
import { renderInline, renderMarkdown } from '../src/lib/content/markdown.ts';
import { compile } from 'mdsvex';
import markdownLinks from '../src/lib/content/markdown-links.js';
import { analyzeSubmissions } from '../src/lib/content/analysis.ts';

function codeText(html) {
	const code = html.match(/<code\b[^>]*>([\s\S]*?)<\/code>/)?.[1];
	assert.notEqual(code, undefined);
	return code
		.replace(/<\/?span\b[^>]*>/g, '')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&amp;', '&');
}

test('Markdown links open a new tab in block and inline exercise text', () => {
	for (const render of [renderMarkdown, renderInline]) {
		for (const destination of ['https://example.com/', '/courses/html/comments/', '#details']) {
			const html = render(`[Read **more**](${destination} "Details")`);
			assert.match(html, /target="_blank"/);
			assert.match(html, /rel="noopener noreferrer"/);
			assert.match(html, /title="Details"/);
			assert.match(html, /Read <strong>more<\/strong>/);
		}
		assert.doesNotMatch(render('`[Example](https://example.com/)`'), /<a /);
	}
});

test('section Markdown links open new tabs without changing explicit navigation links', async () => {
	const result = await compile(
		'[Read more](https://example.com/)\n\n<a href="/courses/html/comments/">Next section</a>\n\n`[Example](https://example.com/)`',
		{ rehypePlugins: [markdownLinks] }
	);
	const link = result.code.match(/<a\s[^>]*>Read more<\/a>/)?.[0];
	assert.ok(link);
	assert.match(link, /href="https:\/\/example.com\/"/);
	assert.match(link, /target="_blank"/);
	assert.match(link, /rel="[^"]*\bnoopener\b[^"]*"/);
	assert.match(link, /rel="[^"]*\bnoreferrer\b[^"]*"/);
	assert.match(result.code, /<a href="\/courses\/html\/comments\/">Next section<\/a>/);
	assert.equal((result.code.match(/target="_blank"/g) ?? []).length, 1);
});

test('MCQ descriptions retain ordered paragraphs and code blocks inside the question', () => {
	const question = getQuestion('valid-html-comments');
	assert.equal(question.type, 'multiple-choice');
	assert.deepEqual(question.description, ['What are valid ways to wrap a comment in HTML?']);
	const blocks = [
		'Consider the following HTML:',
		'```html\n<p>Visible text</p><!-- internal note -->\n```',
		'Which statement is correct?'
	];
	const exercise = mcq({
		slug: 'example',
		title: 'Title',
		question: blocks,
		options: [{ id: 'a', text: 'A', correct: true }],
		feedback: ['Feedback paragraph.', '```html\n<p>Feedback example</p>\n```', 'Another paragraph.']
	});
	assert.deepEqual(exercise.description, blocks);
	const html = exercise.description.map(renderMarkdown).join('');
	assert.match(html, /<p>Consider the following HTML:<\/p>/);
	assert.match(html, /<pre\b[^>]*><code class="language-html">/);
	assert.match(codeText(html), /<p>Visible text<\/p>/);
	assert.match(html, /<p>Which statement is correct\?<\/p>/);
	const feedback = exercise.feedback.map(renderMarkdown).join('');
	assert.match(feedback, /<p>Feedback paragraph\.<\/p>/);
	assert.match(codeText(feedback), /<p>Feedback example<\/p>/);
	assert.match(feedback, /<p>Another paragraph\.<\/p>/);
	assert.match(
		renderMarkdown('One paragraph.\n\n```html\n<p>Code</p>\n```\n\nAnother paragraph.'),
		/<pre\b[^>]*><code class="language-html">/
	);
	const withoutDescription = mcq({
		slug: 'example-2',
		title: 'Title',
		options: [{ id: 'a', text: 'A', correct: true }],
		feedback: exercise.feedback,
		bonusId: 'bonus'
	});
	assert.equal(withoutDescription.options[0].id, 'a');
	assert.deepEqual(withoutDescription.feedback, exercise.feedback);
	assert.equal(withoutDescription.bonusId, 'bonus');
});

test('all exercise constructors accept an optional named bonus exercise ID', () => {
	const items = [{ id: 'item', text: 'Item' }];
	const targets = [{ id: 'target', label: 'Target' }];
	const answerKey = { item: 'target' };
	assert.equal(
		mcq({
			slug: 'm',
			title: 'Title',
			options: [],
			bonusId: 'bonus'
		}).bonusId,
		'bonus'
	);
	assert.equal(
		input({
			slug: 'i',
			title: 'Title',
			bonusId: 'bonus'
		}).bonusId,
		'bonus'
	);
	assert.equal(
		sort({
			slug: 's',
			title: 'Title',
			question: 'Instructions',
			items: items,
			targets: targets,
			answerKey: answerKey,
			bonusId: 'bonus'
		}).bonusId,
		'bonus'
	);
	assert.equal(
		dragAndDrop({
			slug: 'd',
			title: 'Title',
			question: 'Instructions',
			items: items,
			targets: targets,
			answerKey: answerKey,
			bonusId: 'bonus'
		}).bonusId,
		'bonus'
	);
	assert.equal(
		dragAndDrop({
			slug: 'url-parts',
			title: 'Title',
			question: 'Instructions',
			items: items,
			targets: targets,
			answerKey: answerKey,
			feedback: 'Feedback',
			bonusId: 'bonus'
		}).bonusId,
		'bonus'
	);
});

test('basic syntax examples use Markdown descriptions without becoming bonus IDs', () => {
	for (const [id, codeBlocks] of [
		['img-void-element', 1],
		['overlapping-tags', 1],
		['html-indentation', 3]
	]) {
		const question = getQuestion(id);
		assert.equal(question.bonusId, undefined);
		const html = question.description.map(renderMarkdown).join('');
		assert.equal((html.match(/<pre\b/g) ?? []).length, codeBlocks);
		assert.match(html, /class="token tag"/);
		assert.notEqual(
			questionRevision({ ...question, description: ['Changed example'] }),
			questionRevision(question)
		);
	}
});

test('description edits invalidate only questions with changed descriptions', () => {
	const question = getQuestion('valid-html-comments');
	const revision = questionRevision(question);
	assert.notEqual(questionRevision({ ...question, description: ['Changed'] }), revision);
	const legacyQuestion = getQuestion('head-header-nav');
	assert.equal(
		questionRevision({ ...legacyQuestion, description: [] }),
		questionRevision(legacyQuestion)
	);
});

test('analysis preserves the exported description for historical revisions', () => {
	const description = ['A question', '```html\n<p>Example</p>\n```'];
	const [metric] = analyzeSubmissions([
		{
			format: 'webbasics-submission',
			formatVersion: 1,
			strandId: 'html',
			strandTitle: 'HTML',
			createdAt: '2026-11-11T00:00:00Z',
			answers: [
				{
					questionId: 'example',
					questionRevision: '1',
					sectionId: 'comments',
					sectionTitle: 'Comments',
					question: 'Title',
					description,
					type: 'multiple-choice',
					response: { selectedOptionIds: [] },
					correctResponse: { selectedOptionIds: [] },
					options: [],
					isCorrect: true
				}
			]
		}
	]);
	assert.deepEqual(metric.versions[0].description, description);
});

test('comment visibility links to a standalone input with the edited Markdown body', () => {
	const question = getQuestion('comment-visibility');
	assert.equal(question.bonusId, 'comment-visibility-bonus');
	const bonus = getQuestion(question.bonusId);
	assert.equal(bonus.type, 'input');
	assert.ok(Array.isArray(bonus.description));
	assert.match(
		bonus.description.map(renderMarkdown).join(''),
		/<a [^>]*href="https:\/\/www\.wikipedia\.org\/">Wikipedia<\/a>/
	);
	assert.ok(bonusQuestionIds.has(bonus.id));
	assert.ok(!requiredQuestionList.some((item) => item.id === bonus.id));
	const ordinary = mcq({
		slug: 'other',
		title: 'Title',
		options: [{ id: 'a', text: 'A', correct: true }]
	});
	assert.equal(ordinary.bonusId, undefined);
	assert.equal(questionRevision({ ...question, bonusId: undefined }), questionRevision(question));
});

test('all exercise types preserve Markdown bodies, feedback and linked bonuses', () => {
	const blocks = ['First paragraph.', '```html\n<p>Code</p>\n```', 'Last paragraph.'];
	const feedback = ['Feedback paragraph.', '```html\n<!-- Explanation -->\n```'];
	const items = [{ id: 'item', text: 'Item' }];
	const targets = [{ id: 'target', label: 'Target' }];
	const key = { item: 'target' };
	for (const body of [blocks, blocks.join('\n\n')]) {
		const exercises = [
			mcq({
				slug: 'm',
				title: 'Title',
				question: body,
				options: [{ id: 'a', text: 'A', correct: true }],
				feedback: feedback,
				bonusId: 'bonus'
			}),
			input({
				slug: 'i',
				title: 'Title',
				question: body,
				feedback: feedback,
				bonusId: 'bonus'
			}),
			dragAndDrop({
				slug: 'd',
				title: 'Title',
				question: body,
				items: items,
				targets: targets,
				answerKey: key,
				feedback: feedback,
				bonusId: 'bonus'
			}),
			sort({
				slug: 's',
				title: 'Title',
				question: body,
				items: items,
				targets: targets,
				answerKey: key,
				feedback: feedback,
				bonusId: 'bonus'
			})
		];
		for (const exercise of exercises) {
			const description = exercise.description ?? exercise.instructions;
			const html = (Array.isArray(description) ? description : [description])
				.map(renderMarkdown)
				.join('');
			assert.match(html, /<p>First paragraph\.<\/p>/);
			assert.match(codeText(html), /<p>Code<\/p>/);
			assert.match(html, /<p>Last paragraph\.<\/p>/);
			assert.deepEqual(exercise.feedback, feedback);
			assert.equal(exercise.bonusId, 'bonus');
			const changed =
				exercise.type === 'multiple-choice' || exercise.type === 'input'
					? { ...exercise, description: ['Changed'] }
					: { ...exercise, instructions: ['Changed'] };
			assert.notEqual(questionRevision(changed), questionRevision(exercise));
		}
	}
});

test('all exercise types preserve Markdown arrays in the title field', () => {
	const prompt = ['First paragraph.', '```html\n<p>Code</p>\n```', 'Last paragraph.'];
	const items = [{ id: 'item', text: 'Item' }];
	const targets = [{ id: 'target', label: 'Target' }];
	const key = { item: 'target' };
	const questions = [
		dragAndDrop({
			slug: 'd',
			title: prompt,
			question: 'Instructions',
			items: items,
			targets: targets,
			answerKey: key
		}),
		sort({
			slug: 's',
			title: prompt,
			question: 'Instructions',
			items: items,
			targets: targets,
			answerKey: key
		}),
		input({
			slug: 'i',
			title: prompt
		}),
		mcq({
			slug: 'm',
			title: prompt,
			options: [{ id: 'a', text: 'A', correct: true }]
		})
	];
	for (const question of questions) {
		assert.equal(question.prompt, prompt.join('\n\n'));
		const html = renderMarkdown(question.prompt);
		assert.match(html, /<p>First paragraph\.<\/p>/);
		assert.match(codeText(html), /<p>Code<\/p>/);
		assert.match(html, /<p>Last paragraph\.<\/p>/);
		assert.notEqual(
			questionRevision(question),
			questionRevision({ ...question, prompt: 'Changed' })
		);
	}
});

test('Markdown highlights HTML tags, attributes and comments without rendering the example', () => {
	const source = '<!-- note -->\n<button class="example" disabled>Click & learn</button>';
	const html = renderMarkdown(`\`\`\`html\n${source}\n\`\`\``);
	assert.match(html, /class="token tag"/);
	assert.match(html, /class="token attr-name"/);
	assert.match(html, /class="token attr-value"/);
	assert.match(html, /class="token comment"/);
	assert.doesNotMatch(html, /<button\b/);
	assert.equal(codeText(html), source);
});

test('unlabelled and unknown code fences remain escaped readable code', () => {
	for (const language of ['', 'unknown-language']) {
		const html = renderMarkdown(`\`\`\`${language}\n<p>Example & text</p>\n\`\`\``);
		assert.match(html, /<pre><code/);
		assert.doesNotMatch(html, /class="token/);
		assert.doesNotMatch(html, /<p>Example/);
		assert.equal(codeText(html).trimEnd(), '<p>Example & text</p>');
	}
});

test('text-elements explains semantics in grouped paragraphs and renders every taught element', () => {
	const question = getQuestion('text-elements');
	assert.equal(question.type, 'drag-n-drop');
	for (const item of question.items) {
		assert.ok(question.targets.some((target) => target.id === question.answerKey[item.id]));
	}
	const explanations = question.feedback.slice(0, -1).map(renderMarkdown).join('');
	assert.match(explanations, /<p><strong>Importance and emphasis\.<\/strong>/);
	assert.match(explanations, /<p><strong>Quotations and sources\.<\/strong>/);
	assert.match(explanations, /<strong>title of a work<\/strong>/);
	assert.doesNotMatch(explanations, /COMMENT ON/);
	const example = renderMarkdown(question.feedback.at(-1));
	for (const item of question.items) {
		const tag = item.id;
		assert.match(example, new RegExp(`<${tag}(?:\\s|>)`), `${item.text} has a rendered example`);
	}
	assert.match(example, /&lt;p class="transcription"&gt;/);
	assert.doesNotMatch(example, /<p class="transcription">/);
});
