import { dragAndDrop, input, mcq, sort } from '../src/lib/content/course.ts';
import type { Question } from '../src/lib/content/types.ts';

const paragraphs = ['First paragraph.', '```html\n<p>Code</p>\n```', 'Last paragraph.'];
const items = [{ id: 'item', text: 'Item' }];
const targets = [{ id: 'target', label: 'Target' }];
const answerKey = { item: 'target' };

const questions: Question[] = [
	dragAndDrop('drag', paragraphs, paragraphs, items, targets, answerKey, paragraphs, 'bonus'),
	dragAndDrop('url-parts', paragraphs, paragraphs, items, targets, paragraphs, 'bonus'),
	sort('sort', paragraphs, paragraphs, items, targets, answerKey, paragraphs, 'bonus'),
	input('input', paragraphs, paragraphs, paragraphs, 'bonus'),
	mcq('mcq', paragraphs, paragraphs, [{ id: 'a', text: 'A', correct: true }], paragraphs, 'bonus')
];

void questions;
