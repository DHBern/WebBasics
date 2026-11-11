import type {
	CourseSection,
	InputQuestion,
	MultipleChoiceQuestion,
	PlacementQuestion,
	Question,
	SortItem,
	SortTarget,
	Strand
} from './types';

type Feedback = Question['feedback'];

type McqArguments =
	| [options: MultipleChoiceQuestion['options'], feedback?: Feedback, bonusId?: string]
	| [description: string[], options: MultipleChoiceQuestion['options'], feedback?: Feedback, bonusId?: string];

function hasMcqDescription(
	args: McqArguments
): args is [string[], MultipleChoiceQuestion['options'], Feedback?, string?] {
	return args[0].length
		? typeof args[0][0] === 'string'
		: Array.isArray(args[1]) && args[1].every((item) => typeof item !== 'string');
}

export const mcq = (
	id: string,
	prompt: string,
	...args: McqArguments
): MultipleChoiceQuestion => {
	if (hasMcqDescription(args)) {
		const [description, options, feedback, bonusId] = args;
		return { id, prompt, type: 'multiple-choice', description, options, feedback, bonusId };
	}
	const [options, feedback, bonusId] = args;
	return { id, prompt, type: 'multiple-choice', options, feedback, bonusId };
};

export const input = (
	id: string,
	prompt: string,
	description?: string[],
	feedback?: Feedback,
	bonusId?: string
): InputQuestion => ({ id, prompt, type: 'input', description, feedback, bonusId });

const option = (id: string, text: string, correct: boolean) => ({ id, text, correct });

const sortAnswerKeys: Record<string, Record<string, string>> = {
	'url-parts': {
		subdomain: 'url-subdomain',
		domain: 'url-domain',
		tld: 'url-tld',
		'route-1': 'url-route-1',
		'route-2': 'url-route-2',
		'query-attribute-1': 'url-query-attribute-1',
		'query-value-1': 'url-query-value-1',
		'query-attribute-2': 'url-query-attribute-2',
		'query-value-2': 'url-query-value-2',
		hash: 'url-hash'
	},
	'html-parts': {
		element: 'element-slot',
		'opening-tag': 'opening-slot',
		'class-attribute': 'class-attribute-slot',
		'class-name': 'class-name-slot',
		'class-names': 'class-names-slot',
		'style-attribute': 'style-attribute-slot',
		'style-name': 'style-name-slot',
		'style-value': 'style-value-slot',
		disabled: 'disabled-slot',
		content: 'content-slot',
		'closing-tag': 'closing-slot'
	},
	'body-element-tree': {
		head: 'invisible-target',
		title: 'invisible-target',
		body: 'body-target',
		header: 'header-target',
		nav: 'nav-target',
		main: 'main-target',
		article: 'article-target',
		section: 'section-target',
		aside: 'aside-target',
		footer: 'footer-target'
	},
	'heading-order': {
		h6: 'heading-position-1',
		h5: 'heading-position-2',
		h4: 'heading-position-3',
		h3: 'heading-position-4',
		h2: 'heading-position-5',
		h1: 'heading-position-6'
	},
	'block-inline-elements': {
		p: 'block',
		h1: 'block',
		h4: 'block',
		strong: 'inline',
		em: 'inline',
		b: 'inline',
		i: 'inline',
		q: 'inline',
		blockquote: 'block',
		span: 'inline',
		div: 'block',
		a: 'inline',
		img: 'inline',
		main: 'block'
	},
	'list-table-elements': {
		ul: 'list-category',
		td: 'table-category',
		ol: 'list-category',
		th: 'table-category',
		table: 'table-category',
		tr: 'table-category',
		li: 'list-category',
		caption: 'table-category'
	}
};

type PlacementArguments =
	| [feedback: Feedback, bonusId?: string]
	| [answerKey: Record<string, string>, feedback?: Feedback, bonusId?: string];

function hasPlacementFeedback(args: PlacementArguments): args is [Feedback, string?] {
	return args[0] === undefined || typeof args[0] === 'string' || Array.isArray(args[0]);
}

export const dragAndDrop = (
	id: string,
	prompt: string,
	instructions: string,
	items: SortItem[],
	targets: SortTarget[],
	...args: PlacementArguments
) => {
	if (hasPlacementFeedback(args)) {
		const [feedback, bonusId] = args;
		const answerKey = sortAnswerKeys[id];
		if (!answerKey) throw new Error(`Missing answer key for "${id}".`);
		return { id, prompt, type: 'drag-n-drop' as const, instructions, items, targets, answerKey, feedback, bonusId };
	}
	const [answerKey, feedback, bonusId] = args;
	return { id, prompt, type: 'drag-n-drop' as const, instructions, items, targets, answerKey, feedback, bonusId };
};

export const sort = (
	id: string,
	prompt: string,
	instructions: string,
	items: SortItem[],
	targets: SortTarget[],
	answerKey: Record<string, string>,
	feedback?: Feedback,
	bonusId?: string
) => ({ id, prompt, type: 'sort' as const, instructions, items, targets, answerKey, feedback, bonusId });

export function isPlacementCorrect(question: PlacementQuestion, itemId: string, targetId: string): boolean {
	const expected = question.answerKey[itemId];
	if (expected === targetId) return true;
	if (question.id !== 'url-parts') return false;
	const group = (id: string) => question.targets.find((target) => target.id === id)?.parentId;
	return Boolean(group(expected) && group(expected) === group(targetId));
}

export const htmlSections: CourseSection[] = [
	{
		id: 'url-structure',
		title: 'URL Structure',
		questions: [
			dragAndDrop(
				'url-parts',
				'Build a URL by dragging each part into the matching position.',
				'The two query-parameter attributes and values are interchangeable.',
				[
					{ id: 'subdomain', text: 'Subdomain' },
					{ id: 'domain', text: 'Domain' },
					{ id: 'tld', text: 'Top-level domain' },
					{ id: 'route-1', text: 'Route' },
					{ id: 'route-2', text: 'Subroute' },
					{ id: 'query-attribute-1', text: 'Query parameter attribute' },
					{ id: 'query-value-1', text: 'Query parameter value' },
					{ id: 'query-attribute-2', text: 'Query parameter attribute' },
					{ id: 'query-value-2', text: 'Query parameter value' },
					{ id: 'hash', text: 'Hash fragment' }
				],
				[
					{ id: 'url-subdomain', label: 'Subdomain', prefix: 'https://', suffix: '.' },
					{ id: 'url-domain', label: 'Domain', suffix: '.' },
					{ id: 'url-tld', label: 'Top-level domain', suffix: '/' },
					{ id: 'url-route-1', label: 'Route', suffix: '/' },
					{ id: 'url-route-2', label: 'Subroute', suffix: '?' },
					{ id: 'url-query-attribute-1', label: 'Query parameter attribute', suffix: '=', parentId: 'url-query-attributes' },
					{ id: 'url-query-value-1', label: 'Query parameter value', suffix: '&', parentId: 'url-query-values' },
					{ id: 'url-query-attribute-2', label: 'Query parameter attribute', suffix: '=', parentId: 'url-query-attributes' },
					{ id: 'url-query-value-2', label: 'Query parameter value', suffix: '#', parentId: 'url-query-values' },
					{ id: 'url-hash', label: 'Hash fragment' }
				],
				{
					subdomain: 'url-subdomain',
					domain: 'url-domain',
					tld: 'url-tld',
					'route-1': 'url-route-1',
					'route-2': 'url-route-2',
					'query-attribute-1': 'url-query-attribute-1',
					'query-value-1': 'url-query-value-1',
					'query-attribute-2': 'url-query-attribute-2',
					'query-value-2': 'url-query-value-2',
					hash: 'url-hash'
				},
				'For this course, the relevant pieces are routes (folders, each containing an `index.html` file) and the hash fragment, which can scroll to an element with the corresponding `id`. For example: https://en.wikipedia.org/wiki/Hashtag#Format\n\n**Bonus Exercise:** Inspect the ID of the corresponding Wikipedia heading in DevTools and find how to link to “Non-commercial use.”\n\n**Bonus Knowledge:** Search parameters often carry information such as queries and page settings. [Swisscovery example](https://swisscovery.slsp.ch/discovery/search?query=any%2Ccontains%2Chtml%2CAND&tab=41SLSP_NETWORK&search_scope=DN_and_CI&vid=41SLSP_NETWORK%3AVU1_UNION&mode=advanced&offset=0)'
			),
			{
				id: 'url-encoding',
				title: 'URL Encoding',
				type: 'lesson',
				text: 'About whitespace and other unusual characters: link a URI converter.'
			}
		]
	},
	{
		id: 'comments',
		title: 'Comments',
		questions: [
			mcq(
				'valid-html-comments',
				'HTML comment syntax',
				['What are valid ways to wrap a comment in HTML? Select all that apply.'],
				[
					option('html-comment', '`<!-- A comment -->`', true),
					option('multiline-html-comment', '`<!-- A multiline comment -->`', true),
					option('slash-comment', '`// ...`', false),
					option('c-comment', '`/* ... */`', false)
				],
				'Answers 1 and 2 use the HTML comment delimiters `<!--` and `-->`; HTML comments can span more than one line, for example:\n\n```html\n<!--\n  This comment spans more than one line.\n-->\n```\n\n`//` is used for single-line JavaScript comments, while `/* ... */` is used for comments in CSS and JavaScript. None of these comment forms is displayed as page content.'
			),
			mcq(
				'comment-visibility',
				'Comments Visibility',
				['"Comments in HTML are invisible to the user." True or false?'],
				[option('true', 'True', true), option('false', 'False', true)],
				'Well, this is a tricky one: HTML comments are not displayed on the rendered page, but they remain visible in the HTML source. This means that anyone can inspect the source and read them. So NEVER put passwords or other secrets in comments.',
				'comment-visibility-bonus'
			),
			input(
				'comment-visibility-bonus',
				'Let's inspect a Wikipedia page',
				'Inspect the source code of [Wikipedia](https://www.wikipedia.org/) and look for HTML comments. Try Ctrl+U (Windows/Linux) or Cmd+U (macOS; the shortcut may vary by browser) to view the source. Alternatively, press F12 or right-click and choose Inspect to open developer tools. Search for `<!--` and report your findings below.'
			)
		]
	},
	{
		id: 'basic-syntax',
		title: 'Basic Syntax (Elements and Attributes)',
		questions: [
			dragAndDrop(
				'html-parts',
				'Place each label at the matching bracket in the HTML example.',
				'Identify the button element, its class and style attributes, and its disabled boolean attribute. The smaller brackets mark attribute names and values; disabled has no value here.',
				[
					{ id: 'element', text: 'Element' },
					{ id: 'opening-tag', text: 'Opening tag' },
					{ id: 'closing-tag', text: 'Closing tag' },
					{ id: 'class-attribute', text: 'class-attribute' },
					{ id: 'class-name', text: 'class-attribute name' },
					{ id: 'class-names', text: 'class-names' },
					{ id: 'style-attribute', text: 'style-attribute' },
					{ id: 'style-name', text: 'style-attribute name' },
					{ id: 'style-value', text: 'CSS declarations' },
					{ id: 'disabled', text: 'Boolean attribute (disabled)' },
					{ id: 'content', text: 'Content' }
				],
				[
					{ id: 'element-slot', label: 'Whole element' },
					{ id: 'opening-slot', label: 'Opening tag', parentId: 'element-slot' },
					{ id: 'class-attribute-slot', label: 'class-attribute', parentId: 'opening-slot' },
					{ id: 'class-name-slot', label: 'class-attribute name', parentId: 'class-attribute-slot' },
					{ id: 'class-names-slot', label: 'class-names', parentId: 'class-attribute-slot' },
					{ id: 'style-attribute-slot', label: 'style-attribute', parentId: 'opening-slot' },
					{ id: 'style-name-slot', label: 'style-attribute name', parentId: 'style-attribute-slot' },
					{ id: 'style-value-slot', label: 'CSS declarations', parentId: 'style-attribute-slot' },
					{ id: 'disabled-slot', label: 'Boolean attribute (disabled)', parentId: 'opening-slot' },
					{ id: 'content-slot', label: 'Content', parentId: 'element-slot' },
					{ id: 'closing-slot', label: 'Closing tag', parentId: 'element-slot' }
				],
				{
					element: 'element-slot',
					'opening-tag': 'opening-slot',
					'class-attribute': 'class-attribute-slot',
					'class-name': 'class-name-slot',
					'class-names': 'class-names-slot',
					'style-attribute': 'style-attribute-slot',
					'style-name': 'style-name-slot',
					'style-value': 'style-value-slot',
					disabled: 'disabled-slot',
					content: 'content-slot',
					'closing-tag': 'closing-slot'
				},
				'An element includes its opening tag, content, and closing tag. The class-attribute assigns class names: `button--external` is a BEM modifier of the `button` block. The style-attribute contains CSS declarations. These two attributes have quoted values. The boolean attribute `disabled` needs no value: its presence disables the button; omitting it leaves the button enabled. Writing `disabled="false"` would still disable it.'
			),
			mcq(
				'html-indentation',
				'Compare the three snippets: (1) all tags on one line, (2) each tag and text on separate lines, and (3) nested tags consistently indented.',
				[
					option('all-valid', 'All three versions are valid HTML.', true),
					option('same-rendering', 'All three versions render the same in the browser.', true),
					option('first-preferred', 'The first version is preferred because it uses less space and therefore less bandwidth.', false),
					option('third-readable', 'The third version is preferred because it is easier to read.', true),
					option('third-collaboration', 'The third version is preferred because it simplifies collaboration.', true)
				],
				'Consistent formatting makes code easier to read and collaborate on. Tools such as [Prettier](https://www.youtube.com/watch?v=RIFWADZzSjM) can format code on demand or on save. Standard formatting avoids noisy diffs caused by each contributor reformatting code to personal taste.'
			),
			mcq(
				'img-void-element',
				'What is wrong with `<img src="../img/icon.jpeg" alt="Icon"></img>`?',
				[
					option('correct', 'Everything is correct.', false),
					option('src', 'There is a mistake in the `src` attribute.', false),
					option('alt', 'There is a mistake in the `alt` attribute.', false),
					option('text', 'Text is missing between `<img>` and `</img>`.', false),
					option('void', 'An `<img>` element is a void element and must not have a closing tag.', true)
				],
				'`img` is a void element and must not have an end tag. Write `<img src="..." alt="Icon">`. The optional trailing slash in `<img ... />` is permitted in HTML, but it does not close the element and is not required.'
			),
			mcq(
				'overlapping-tags',
				`What went wrong here? \`<p>I didn't expect to find the <em>next-door neighbor's <strong>cat</em></strong> here!</p>\``,
				[
					option('works', 'Everything works just fine.', false),
					option('closing-order', 'The closing `</strong>` tag should be before the closing `</em>` tag.', true),
					option('browser-repairs', 'Browsers may repair the markup and render the neighbor’s cat in italics and “cat” in bold.', true),
					option('invalid', 'This is invalid HTML.', true)
				],
				'Browsers may repair misnested formatting elements, but the source is invalid HTML. It is better to write correct markup in the first place. The [HTML validator](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Debugging_HTML#html_validation) can help find errors.'
			)
		],
		lesson: '**Further Reading:** [HTML elements](https://www.w3schools.com/tags/ref_byfunc.asp) · [MDN: Attributes](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax#attributes)'
	},
	{
		id: 'webpage-structure',
		title: 'Webpage Structure',
		questions: [
			mcq(
				'head-header-nav',
				'The main navigation of a website lives inside…',
				[
					option('head', '`<head>`', false),
					option('header', '`<header>`', true),
					option('nav', '`<nav>`', true)
				],
				'The `<head>` contains document metadata. A page’s visible header may contain a `<nav>` element; `<nav>` also has its own semantic meaning.'
			),
			dragAndDrop(
				'body-element-tree',
				'Place the elements in a basic webpage structure. Put elements from the head in the invisible area and the remaining elements in the body tree.',
				'Build the nested structure shown. Both `<head>` and `<title>` belong in the collective invisible area.',
				[
					{ id: 'head', text: '<head>' },
					{ id: 'title', text: '<title>' },
					{ id: 'body', text: '<body>' },
					{ id: 'header', text: '<header>' },
					{ id: 'nav', text: '<nav>' },
					{ id: 'footer', text: '<footer>' },
					{ id: 'aside', text: '<aside>' },
					{ id: 'main', text: '<main>' },
					{ id: 'article', text: '<article>' },
					{ id: 'section', text: '<section>' }
				],
				[
					{ id: 'document', label: '<html>' },
					{ id: 'invisible-target', label: 'Invisible to the user', parentId: 'document' },
					{ id: 'body-target', label: '<body>', parentId: 'document' },
					{ id: 'header-target', label: '<header>', parentId: 'body-target' },
					{ id: 'nav-target', label: '<nav>', parentId: 'header-target' },
					{ id: 'main-target', label: '<main>', parentId: 'body-target' },
					{ id: 'article-target', label: '<article>', parentId: 'main-target' },
					{ id: 'section-target', label: '<section>', parentId: 'article-target' },
					{ id: 'aside-target', label: '<aside>', parentId: 'main-target' },
					{ id: 'footer-target', label: '<footer>', parentId: 'body-target' }
				],
				{
					head: 'invisible-target',
					title: 'invisible-target',
					body: 'body-target',
					header: 'header-target',
					nav: 'nav-target',
					main: 'main-target',
					article: 'article-target',
					section: 'section-target',
					aside: 'aside-target',
					footer: 'footer-target'
				},
				'The `<head>` and `<title>` are not displayed in the page. A `<header>` contains the site navigation; `<main>` contains the article and adjacent related-links `<aside>`, followed by the footer.'
			)
		],
		lesson: '**Further Reading:** [MDN: Structuring documents](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents) · [MDN: Website metadata](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Webpage_metadata)'
	},
	{
		id: 'semantic-html',
		title: 'Semantic HTML',
		questions: [
			{
				id: 'semantic-definition',
				title: 'Definition with examples and motivation',
				type: 'lesson',
				text: 'Give a few examples of semantic HTML elements and explain why they are important. If unsure, read a definition and answer in your own words.'
			},
			mcq(
				'html-without-css',
				'A website without CSS will appear completely unstyled.',
				[option('true', 'True', false), option('false', 'False', true)],
				'Browsers apply default styles to semantic HTML. The result can differ between browsers.'
			)
		],
		lesson:
			'**Most important takeaway (especially for digital humanities students):** “HTML tags must be used for their semantic value, not their appearance. It’s always possible to totally change the look and feel of a given tag using CSS so, when using HTML, take the time to focus on the meaning rather than the appearance.” [Source: MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Cheatsheet)\n\n**Bonus: Micro-project.** With only HTML (no CSS), try to replicate a layout and compare Firefox and Chrome. Use `section`, `aside`, `ul`, `li`, headings, paragraphs, `strong`, `em`, `del`, `ins`, `a`, `form`, `input`, and `button`.\n\n**Bonus:** [Mark up dates and times](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Advanced_text_features#marking_up_times_and_dates)'
	},
	{
		id: 'formatting-text',
		title: 'Formatting Text (Headings, paragraphs, strong, emphasis)',
		questions: [
			sort(
				'heading-order',
				'Sort the headings from smallest to largest.',
				'Reorder the valid headings and move invalid elements into the discard area.',
				[
					{ id: 'h1', text: '<h1>' },
					{ id: 'h2', text: '<h2>' },
					{ id: 'h3', text: '<h3>' },
					{ id: 'h4', text: '<h4>' },
					{ id: 'h5', text: '<h5>' },
					{ id: 'h6', text: '<h6>' },
					{ id: 'h7', text: '<h7>' },
					{ id: 'h8', text: '<h8>' }
				],
				[
					{ id: 'heading-position-1', label: 'Smallest' },
					{ id: 'heading-position-2', label: '2' },
					{ id: 'heading-position-3', label: '3' },
					{ id: 'heading-position-4', label: '4' },
					{ id: 'heading-position-5', label: '5' },
					{ id: 'heading-position-6', label: 'Largest' },
					{ id: 'invalid-headings', label: 'Not valid HTML headings' }
				],
				{
					h6: 'heading-position-1',
					h5: 'heading-position-2',
					h4: 'heading-position-3',
					h3: 'heading-position-4',
					h2: 'heading-position-5',
					h1: 'heading-position-6',
					h7: 'invalid-headings',
					h8: 'invalid-headings'
				},
				'The valid heading elements are `<h1>` through `<h6>`. `<h6>` is the smallest heading level and `<h1>` the largest; `<h7>` and `<h8>` do not exist.'
			),
			dragAndDrop(
				'block-inline-elements',
				'Place each element in its usual display category: block or inline.',
				'These are the elements’ default browser display categories; CSS can change them.',
				[
					{ id: 'p', text: '<p>' },
					{ id: 'h1', text: '<h1>' },
					{ id: 'h4', text: '<h4>' },
					{ id: 'strong', text: '<strong>' },
					{ id: 'em', text: '<em>' },
					{ id: 'b', text: '<b>' },
					{ id: 'i', text: '<i>' },
					{ id: 'q', text: '<q>' },
					{ id: 'blockquote', text: '<blockquote>' },
					{ id: 'span', text: '<span>' },
					{ id: 'div', text: '<div>' },
					{ id: 'a', text: '<a>' },
					{ id: 'img', text: '<img>' },
					{ id: 'main', text: '<main>' }
				],
				[
					{ id: 'block', label: 'Block' },
					{ id: 'inline', label: 'Inline' }
				],
				{
					p: 'block',
					h1: 'block',
					h4: 'block',
					strong: 'inline',
					em: 'inline',
					b: 'inline',
					i: 'inline',
					q: 'inline',
					blockquote: 'block',
					span: 'inline',
					div: 'block',
					a: 'inline',
					img: 'inline',
					main: 'block'
				},
				'The usual browser display is block for `<p>`, headings, `<blockquote>`, `<div>`, and `<main>`; inline for `<strong>`, `<em>`, `<b>`, `<i>`, `<q>`, `<span>`, `<a>`, and `<img>`. CSS can change display behavior. Prefer semantically correct tags; `<span>` and `<div>` have no semantic meaning.\n\n**Further Reading:** [Headings and paragraphs](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs) · [Emphasis and importance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Emphasis_and_importance) · [Advanced text features](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Advanced_text_features)'
			)
		]
	},
	{
		id: 'lists-tables',
		title: 'Lists and Tables',
		questions: [
			dragAndDrop(
				'list-table-elements',
				'Place the elements into table elements, list elements, both, or neither.',
				'Each element belongs in the category describing its HTML role.',
				[
					{ id: 'ul', text: '<ul>' },
					{ id: 'td', text: '<td>' },
					{ id: 'ol', text: '<ol>' },
					{ id: 'th', text: '<th>' },
					{ id: 'table', text: '<table>' },
					{ id: 'tr', text: '<tr>' },
					{ id: 'li', text: '<li>' },
					{ id: 'caption', text: '<caption>' }
				],
				[
					{ id: 'table-category', label: 'Table elements' },
					{ id: 'list-category', label: 'List elements' },
					{ id: 'both-category', label: 'Both' },
					{ id: 'neither-category', label: 'Neither' }
				],
				'List elements include `<ul>`, `<ol>`, and `<li>`. Table elements include `<table>`, `<caption>`, `<tr>`, `<th>`, and `<td>`.'
			)
		]
	},
	{
		id: 'links',
		title: 'Links and Anchors',
		questions: [
			mcq(
				'nesting-anchors',
				'Which of the following anchors are valid HTML?',
				[
					option('anchor-paragraph', 'An anchor inside a paragraph.', true),
					option('anchor-span', 'An anchor inside a `<span>`.', true),
					option('span-anchor', 'An anchor that contains a `<span>`.', true),
					option('heading-anchor', 'An anchor around an `<h1>`.', true),
					option('image-anchor', 'An anchor around an image.', true)
				],
				'All five examples are valid. Wrapping an image in a link is common for a logo that links to the homepage. [MDN: Image links](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links#image_links)\n\nAn anchor can also identify a precise location in a page that can be jumped to. [MDN: Creating links](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links)'
			),
			mcq(
				'link-target-blank',
				'Where will this link open? `You can learn more about this <a href="https://en.wikipedia.org/wiki/HTML" target="_blank">here</a>.`',
				[
					option('same-tab', 'In the existing browser tab.', false),
					option('new-tab', 'In a new browser tab.', true),
					option('attribute-order', 'It will not open because the attributes are in the wrong order.', false),
					option('title-required', 'It will not open because it needs a `title` attribute.', false),
					option('avoid-here', 'Hyperlink text such as “here” or “click here” should be avoided.', true)
				],
				'`target="_blank"` opens the link in a new tab or window. Attribute order does not matter, although consistent formatting helps readability. Meaningful link text is preferable. [MDN: Links](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Test_your_skills/Links#links_3)'
			),
			mcq(
				'link-title-accessibility',
				'Choose the correct statements about link titles.',
				[
					option('title-tooltip', 'The optional `title` attribute can provide a tooltip.', true),
					option('title-accessibility', 'The `title` attribute automatically makes a link more accessible.', false)
				],
				'Do not confuse an anchor’s `title` with an image’s `alt`. A link title is often revealed only on mouse hover, making it difficult for keyboard and touch users. Put important information in the visible link text instead. [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links#adding_supporting_information_with_the_title_attribute)'
			),
			mcq(
				'buttons-vs-anchors',
				'Choose the correct statements about links, buttons, and appearance.',
				[
					option('anchors-style', 'Anchor elements can be styled to look like buttons.', true),
					option('link-preview', 'A benefit of anchors is the URL preview shown by browsers on hover.', true),
					option('semantic-choice', 'Choose HTML elements for semantic meaning rather than their default appearance.', true),
					option('boring-links', 'Links must look boring because they are underlined text.', false)
				],
				'Use anchors for navigation, such as `<a href="/foo/bar">`, and buttons for actions. CSS can make anchors look like buttons without changing their meaning. [Buttons vs. links](https://a11yphant.com/challenges/buttons-vs-links)'
			)
		]
	},
	{
		id: 'images',
		title: 'Images',
		questions: [
			mcq(
				'image-relative-absolute-paths',
				'You are linking an image from `/about/team/teachers/andrea/index.html`. Which paths work?',
				[
					option('deep-relative', '`../../../../img/cat.webp`', true),
					option('root-relative', '`/img/cat.webp`', true),
					option('local-relative', '`img/cat.webp`', false)
				],
				'The long relative path works, but is easy to break. A path beginning with `/` starts at the site root. `img/cat.webp` would look for an `img` folder inside `andrea`. This also applies to stylesheets and other assets.'
			),
			mcq(
				'image-alt-title',
				'For the dinosaur image with `alt`, `width`, `height`, and `title` attributes, choose the correct statement.',
				[
					option('alt-no-title', 'An image with an `alt` attribute does not need a `title` attribute.', false),
					option('title-caption', 'The `title` attribute appears as a figure caption below the image.', false),
					option('title-tooltip', 'The `title` attribute can appear as a tooltip.', true)
				],
				'The `title` attribute may appear as a tooltip; it is not a figure caption. Useful alternative text belongs in `alt`.'
			),
			mcq(
				'image-dimensions',
				'Choose the correct statements about the image `width` and `height` attributes.',
				[
					option('css-properties', 'They are passed as CSS properties.', false),
					option('style-alternative', 'Dimensions could also be set with the `style` attribute.', true),
					option('resolution-double', 'Setting width to `200` doubles the image resolution.', false),
					option('resolution-half', 'Setting width to `200` halves the image resolution.', false),
					option('proportional', 'Changing just one of width or height always scales the image proportionally.', false),
					option('pixels', 'The HTML dimension values are in pixels.', true)
				],
				'HTML width and height values are CSS-pixel dimensions, not image resolution. They affect the displayed size; optimize the image file itself for the web. If only one dimension is set, the browser can preserve the intrinsic aspect ratio; if both are set inconsistently, the image can be distorted. WebP is one useful web image format. [MDN: Images](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_images)\n\n**Bonus:** [Audio and video](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_video_and_audio)'
			)
		]
	},
	{
		id: 'forms-buttons',
		title: 'Forms and Buttons',
		questions: [
			mcq(
				'form-control-terminology',
				'Choose the correct statements.',
				[
					option('radio-multiple', 'A group of radio buttons can have multiple checked items.', false),
					option('checkbox-multiple', 'A group of checkboxes can have multiple checked items.', true),
					option('radio-input', 'A radio button is an `<input type="radio">`, not a `<button>` element.', true)
				]
			),
			mcq(
				'form-needs-server',
				'“For a form to work, we need a web server.”',
				[option('true', 'True', false), option('false', 'False', true)],
				'For common GET and POST forms, a server usually handles the request. A form can also use a `mailto:` action to open an email client with a prefilled address, subject, and message.'
			),
			mcq(
				'form-submit-behavior',
				'Choose the correct statements about submitting a form.',
				[
					option('action-reload', 'After submission, the page navigates/reloads at the route specified by the form’s `action`.', true),
					option('button-submit', 'A button inside a form submits it by default unless its type says otherwise.', true),
					option('explicit-required', 'A form with multiple buttons requires one to explicitly use `type="submit"` for any button to submit.', false)
				],
				'Buttons inside forms default to `type="submit"`. Set `type="button"` for a button that should not submit, and `type="reset"` only when resetting the form is intended.'
			),
			mcq(
				'boolean-disabled',
				'Compare `<button disabled=true>` and `<button disabled>`.',
				[
					option('same-behavior', 'Both buttons behave the same.', true),
					option('value-required', 'The `disabled` attribute must have a value.', false),
					option('cannot-click', 'The user cannot activate the disabled button.', true),
					option('cannot-hover', 'The user cannot hover over the disabled button.', false)
				],
				'Boolean attributes are true when present, regardless of their string value. Therefore `disabled="false"` is still disabled; omit the attribute to enable the button. The same applies to `required`.'
			),
			mcq(
				'label-input-association',
				'Which statement about the two label/input examples is correct?',
				[
					option('first-better', 'The first snippet is better.', false),
					option('second-better', 'The second snippet is better.', false),
					option('only-first', 'Only the first snippet works as written.', true),
					option('only-second', 'Only the second snippet works.', false),
					option('neither', 'Nothing of the above.', false)
				],
				'Explicit `for`/`id` association and wrapping an input in a label can both work. The supplied second example has an extra `</label>` and its password input has no matching `id="pwd"` even though its label has a `for` attribute, so the example does not associate that label with the input. Label structure also affects layout and styling.'
			)
		],
		lesson:
			'**Further Reading:** [MDN: Forms and buttons](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_forms)'
	},
	{
		id: 'embeddings',
		title: 'Embeddings (iframe)',
		questions: [
			mcq(
				'iframe-css-and-tracking',
				'“An `<iframe>` inherits the CSS of its parent page.”',
				[
					option('inherits-css', 'Yes.', false),
					option('css-leaks', 'No, but we must prevent CSS leaking out of the iframe into our page.', false),
					option('isolated-css', 'No. The iframe document has its own styles; CSS does not cross the document boundary.', true)
				],
				'An iframe is a separate document, so styles do not mix. An iframe is not automatically “completely sandboxed”: the `sandbox` attribute adds restrictions. Embedded third-party content may track visitors when it loads. [SRF article reference in source: TODO]'
			)
		],
		lesson:
			'**Further Reading:** [MDN: Embedding technologies](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/General_embedding_technologies#using_iframes_to_embed_webpages) (do not read the full article).'
	}
];

export const htmlStrand: Strand = {
	id: 'html',
	title: 'HTML Questions',
	description: 'Review HTML structure, semantics, text, links, images, forms, and embedded content.',
	sections: htmlSections
};

export const strands: Strand[] = [
	htmlStrand,
	{
		id: 'css',
		title: 'CSS Questions',
		description: 'Questions and exercises about CSS will be added later.',
		sections: []
	},
	{
		id: 'advanced-concepts',
		title: 'Advanced Concepts',
		description: 'Advanced course questions will be added later.',
		sections: []
	}
];

export const questionList: Question[] = htmlSections
	.flatMap((section) => section.questions)
	.filter((item): item is Question => item.type !== 'lesson');

export const bonusQuestionIds = new Set(questionList.flatMap((question) => question.bonusId ? [question.bonusId] : []));
export const requiredQuestionList = questionList.filter((question) => !bonusQuestionIds.has(question.id));

export const getQuestion = (id: string) => questionList.find((question) => question.id === id);
export const getCourseItem = (id: string) =>
	htmlSections.flatMap((section) => section.questions).find((item) => item.id === id);

export const questionSection = (questionId: string) =>
	htmlSections.find((section) => section.questions.some((question) => question.id === questionId));

function revisionHash(relevant: object): string {
	let hash = 2166136261;
	for (const character of JSON.stringify(relevant)) {
		hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

export function legacyCommentVisibilityRevision(question: MultipleChoiceQuestion, bonus: InputQuestion): string {
	return revisionHash({
		id: question.id,
		prompt: question.prompt,
		options: question.options.map(({ id, text, correct }) => ({ id, text, correct })),
		bonusPrompt: bonus.prompt,
		...(question.description?.length ? { description: question.description } : {})
	});
}

export function questionRevision(question: Question): string {
	const relevant =
		question.type === 'multiple-choice'
			? {
					id: question.id,
					prompt: question.prompt,
					options: question.options.map(({ id, text, correct }) => ({ id, text, correct })),
					...(question.description?.length ? { description: question.description } : {})
				}
			: question.type === 'input'
			? {
					id: question.id,
					prompt: question.prompt,
					...(question.description?.length ? { description: question.description } : {})
				}
			: {
					id: question.id,
					prompt: question.prompt,
					instructions: question.instructions,
					items: question.items,
					targets: question.targets,
					answerKey: question.answerKey
				};
	return revisionHash(relevant);
}
