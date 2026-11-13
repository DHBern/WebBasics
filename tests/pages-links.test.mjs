import assert from 'node:assert/strict';
import test from 'node:test';
import { compile } from 'mdsvex';
import markdownLinks from '../src/lib/content/markdown-links.js';

test('Pages builds prefix internal Markdown links without changing external links or code', async () => {
	const result = await compile(
		'[Course](/courses/html/welcome/)\n\n[External](https://example.com/)\n\n[Shared](//example.com/)\n\n```html\n<a href="/example">Example</a>\n```',
		{ rehypePlugins: [[markdownLinks, { base: '/WebBasics' }]] }
	);
	assert.match(result.code, /href="\/WebBasics\/courses\/html\/welcome\/"/);
	assert.match(result.code, /href="https:\/\/example.com\/"/);
	assert.match(result.code, /href="\/\/example.com\/"/);
	assert.doesNotMatch(result.code, /\/WebBasics\/example/);
});
