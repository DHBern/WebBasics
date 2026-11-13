import type {
	CourseSection,
	DragAndDropQuestion,
	InputQuestion,
	MultipleChoiceQuestion,
	PlacementQuestion,
	Question,
	SortItem,
	SortQuestion,
	SortTarget,
	Strand
} from './types';

type Feedback = Question['feedback'];

type ExerciseConfig = {
	slug: string;
	title: string | string[];
	question?: string | string[];
	feedback?: Feedback;
	bonusId?: string;
};

type PlacementConfig = ExerciseConfig & {
	question: string | string[];
	items: SortItem[];
	targets: SortTarget[];
	answerKey: Record<string, string>;
};

function exerciseFields({ slug, title, feedback, bonusId }: ExerciseConfig) {
	return {
		id: slug,
		prompt: Array.isArray(title) ? title.join('\n\n') : title,
		feedback,
		bonusId
	};
}

function descriptionBlocks(question: ExerciseConfig['question']) {
	return typeof question === 'string' ? [question] : question;
}

export const mcq = (
	config: ExerciseConfig & { options: MultipleChoiceQuestion['options'] }
): MultipleChoiceQuestion => ({
	...exerciseFields(config),
	type: 'multiple-choice',
	description: descriptionBlocks(config.question),
	options: config.options
});

export const input = (config: ExerciseConfig): InputQuestion => ({
	...exerciseFields(config),
	type: 'input',
	description: descriptionBlocks(config.question)
});

const option = (id: string, text: string, correct: boolean) => ({
	id,
	text,
	correct
});

export const dragAndDrop = (config: PlacementConfig): DragAndDropQuestion => ({
	...exerciseFields(config),
	type: 'drag-n-drop',
	instructions: config.question,
	items: config.items,
	targets: config.targets,
	answerKey: config.answerKey
});

export const sort = (config: PlacementConfig): SortQuestion => ({
	...exerciseFields(config),
	type: 'sort',
	instructions: config.question,
	items: config.items,
	targets: config.targets,
	answerKey: config.answerKey
});

export function isPlacementCorrect(
	question: PlacementQuestion,
	itemId: string,
	targetId: string
): boolean {
	return question.answerKey[itemId] === targetId;
}

export const htmlSections: CourseSection[] = [
	{
		id: 'url-structure',
		title: 'URLs',
		questions: [
			dragAndDrop({
				answerKey: {
					protocol: 'url-protocol',
					subdomain: 'url-subdomain',
					domain: 'url-domain',
					tld: 'url-tld',
					path: 'url-path',
					fragment: 'url-fragment'
				},
				slug: 'url-parts',
				title: 'Identify the parts of and URL.',
				question:
					"URLs consists of different parts with different functions and names. Let's analyse [https://en.wikipedia.org/wiki/Digital_humanities#Digital_archives](https://en.wikipedia.org/wiki/Digital_humanities#Digital_archives). Do you know what each part stands for and how it's called?",
				items: [
					{ id: 'protocol', text: 'Protocol' },
					{ id: 'subdomain', text: 'Subdomain' },
					{ id: 'domain', text: 'Domain' },
					{ id: 'tld', text: 'Top-level domain' },
					{ id: 'path', text: 'Path' },
					{ id: 'fragment', text: 'Fragment' }
				],
				targets: [
					{
						id: 'url-protocol',
						label: 'Protocol',
						displayText: 'https',
						suffix: '://'
					},
					{
						id: 'url-subdomain',
						label: 'Subdomain',
						displayText: 'en',
						suffix: '.'
					},
					{
						id: 'url-domain',
						label: 'Domain',
						displayText: 'wikipedia',
						suffix: '.'
					},
					{ id: 'url-tld', label: 'Top-level domain', displayText: 'org' },
					{
						id: 'url-path',
						label: 'Path',
						displayText: '/wiki/Digital_humanities'
					},
					{
						id: 'url-fragment',
						label: 'Fragment',
						prefix: '#',
						displayText: 'Digital_archives'
					}
				],
				feedback: [
					'The complete answer, from left to right, is `https` (protocol), `en` (subdomain), `wikipedia` (domain), `org` (top-level domain), `/wiki/Digital_humanities` (path), and `Digital_archives` (fragment).',
					'Formally, `https` is the URL scheme, often called its protocol. The path is one URL component; its `wiki` and `Digital_humanities` segments can be described as a route and subroute. The `#` symbol starts the fragment, and `Digital_archives` is its value. A fragment can identify a location within a page.'
				]
			}),
			dragAndDrop({
				slug: 'url-query-params',
				title: 'Query parameters',
				question: [
					'Consider the following URL for a simple web search: `https://duckduckgo.com/?q=Digital%20Humanities&df=d&ia=web`',
					'After the `?` it contains three so called *query parameters*, separated by an `&`. Each of them carries information about the search. Read each query parameter as a name/value pair (written `name=value`). Can you guess the meaning of each query parameter?'
				],
				items: [
					{ id: 'search-term', text: 'Search term' },
					{ id: 'date-filter', text: 'Date filter' },
					{ id: 'search-type', text: 'Search type' }
				],
				targets: [
					{
						id: 'query-search-term',
						label: 'Search term parameter',
						prefix: 'https://duckduckgo.com/?',
						displayText: 'q=Digital%20Humanities',
						suffix: '&'
					},
					{
						id: 'query-date-filter',
						label: 'Date filter parameter',
						displayText: 'df=d',
						suffix: '&'
					},
					{
						id: 'query-search-type',
						label: 'Search type parameter',
						displayText: 'ia=web'
					}
				],
				answerKey: {
					'search-term': 'query-search-term',
					'date-filter': 'query-date-filter',
					'search-type': 'query-search-type'
				},
				feedback:
					'Each query parameter is a name/value pair. `q=Digital%20Humanities` uses the name `q` for the search term, whose value decodes to “Digital Humanities.” `df=d` uses `df` to request results from the past day. `ia=web` selects web results. The `?` starts the query string, `=` separates a name from its value, and `&` separates one parameter pair from the next. These are URL query parameters, not HTML attributes.'
			}),
			{
				id: 'url-encoding',
				prompt: 'URL Encodings.',
				type: 'drag-n-drop',
				instructions: [
					'The search term in the last exercise contains `Digital%20Humanities`. This is beause whitespaces are not allowed as part of URLs, so they must be encoded with `%20`. Use this [URL Encoder/Decoder Tool](https://www.urlencoder.io/) to find what the encoded symbols represent, then match each code to its decoded character.'
				],
				items: [
					{ id: 'encoded-space', text: '%20' },
					{ id: 'encoded-slash', text: '%2F' },
					{ id: 'encoded-question', text: '%3F' },
					{ id: 'encoded-ampersand', text: '%26' },
					{ id: 'encoded-equals', text: '%3D' }
				],
				targets: [
					{ id: 'decoded-space', label: 'Space', displayText: 'space' },
					{ id: 'decoded-slash', label: 'Slash', displayText: '/' },
					{ id: 'decoded-question', label: 'Question mark', displayText: '?' },
					{ id: 'decoded-ampersand', label: 'Ampersand', displayText: '&' },
					{ id: 'decoded-equals', label: 'Equals sign', displayText: '=' }
				],
				answerKey: {
					'encoded-space': 'decoded-space',
					'encoded-slash': 'decoded-slash',
					'encoded-question': 'decoded-question',
					'encoded-ampersand': 'decoded-ampersand',
					'encoded-equals': 'decoded-equals'
				},
				feedback:
					'In `Digital%20Humanities`, `%20` decodes to a space, producing “Digital Humanities.” Other useful examples are `%2F` for `/`, `%3F` for `?`, `%26` for `&`, and `%3D` for `=`. These percent-encoded forms represent a byte using `%` followed by two hexadecimal digits. Encoding reserved characters inside a value keeps them from being mistaken for URL separators: for example, `&` separates query parameters and `=` separates each name from its value.'
			}
		]
	},
	{
		id: 'comments',
		title: 'Comments',
		questions: [
			mcq({
				slug: 'valid-html-comments',
				title: 'HTML Comment Syntax',
				question: ['What are valid ways to wrap a comment in HTML?'],
				options: [
					option('html-comment', '`<!-- A comment -->`', true),
					option('multiline-html-comment', '`<!-- A multiline comment -->`', true),
					option('slash-comment', '`// ...`', false),
					option('c-comment', '`/* ... */`', false)
				],
				feedback: [
					'Answers 1 and 2 use the HTML comment delimiters `<!--` and `-->`; HTML comments can span more than one line, for example:\n\n```html\n<!--\n  This comment\n  spans more than\n  one line.\n-->\n```\n\n',
					'`//` is used for JavaScript comments, while `/* ... */` is used for comments in CSS and JavaScript.'
				]
			}),
			mcq({
				slug: 'comment-visibility',
				title: 'Comments Visibility',
				question: ['"Comments in HTML are invisible to the user." True or false?'],
				options: [option('true', 'True', true), option('false', 'False', true)],
				feedback:
					'Well, this was a tricky one: HTML comments are not displayed on the rendered page, but they remain visible in the HTML source. This means that anyone can inspect the source and read them. So NEVER put passwords or other secrets in comments.',
				bonusId: 'comment-visibility-bonus'
			}),
			input({
				slug: 'comment-visibility-bonus',
				title: "Let's test this on a real page!",
				question: [
					'Inspect the source code of [Wikipedia](https://www.wikipedia.org/) and look for HTML comments. Try Ctrl+U (Windows/Linux) or Cmd+U (macOS; the shortcut may vary by browser) to view the source. Alternatively, press F12 or right-click and choose Inspect to open developer tools. Search for `<!--` and report your findings below.'
				]
			})
		]
	},
	{
		id: 'basic-syntax',
		title: 'Basic Syntax (Elements and Attributes)',
		questions: [
			dragAndDrop({
				slug: 'html-parts',
				title: 'Parts of an HTML element',
				question: 'Place each label at the matching bracket in the HTML example.',
				items: [
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
				targets: [
					{ id: 'element-slot', label: 'Whole element' },
					{
						id: 'opening-slot',
						label: 'Opening tag',
						parentId: 'element-slot'
					},
					{
						id: 'class-attribute-slot',
						label: 'class-attribute',
						parentId: 'opening-slot'
					},
					{
						id: 'class-name-slot',
						label: 'class-attribute name',
						parentId: 'class-attribute-slot'
					},
					{
						id: 'class-names-slot',
						label: 'class-names',
						parentId: 'class-attribute-slot'
					},
					{
						id: 'style-attribute-slot',
						label: 'style-attribute',
						parentId: 'opening-slot'
					},
					{
						id: 'style-name-slot',
						label: 'style-attribute name',
						parentId: 'style-attribute-slot'
					},
					{
						id: 'style-value-slot',
						label: 'CSS declarations',
						parentId: 'style-attribute-slot'
					},
					{
						id: 'disabled-slot',
						label: 'Boolean attribute (disabled)',
						parentId: 'opening-slot'
					},
					{ id: 'content-slot', label: 'Content', parentId: 'element-slot' },
					{
						id: 'closing-slot',
						label: 'Closing tag',
						parentId: 'element-slot'
					}
				],
				answerKey: {
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
				feedback:
					'In this example, the **element** consists of the opening tag, the content (`Click me`), and the closing tag. Attributes belong in the opening tag and provide additional information or settings.\n\nThe **`class` attribute** assigns class names, which CSS can use to select elements. Here, its value contains two class names: `link--external` and `text_large`. A space separates them; hyphens (`-`) and underscores (`_`) can be part of a class name. The name `link--external` follows a naming convention called **BEM**, where `--` indicates a variant. This convention helps people organize their code; HTML does not require it. Despite its name, the class does not make this button a link.\n\nThe **`style` attribute** contains CSS declarations applied directly to this element. In `border: 2px solid black;`, `border` is the property, and `2px solid black` is its value.\n\n**`disabled` is a boolean attribute:** its presence disables the button; leaving it out leaves the button enabled. A useful trap to remember: even `disabled="false"` disables the button—its presence, not the text of its value, is what matters.'
			}),
			mcq({
				slug: 'img-void-element',
				title: 'Debugging an image',
				question:
					'What is wrong with this HTML?\n\n```html\n<img src="../img/icon.jpeg" alt="Icon"></img>\n```',
				options: [
					option('correct', 'Everything is correct.', false),
					option('src', 'There is a mistake in the `src` attribute.', false),
					option('alt', 'There is a mistake in the `alt` attribute.', false),
					option('text', 'Text is missing between `<img>` and `</img>`.', false),
					option('void', 'An `<img>` element must not have a closing tag.', true)
				],
				feedback: [
					'`img` is a so called **void element** (also called **self-closing element**) and must not have an end tag. Write `<img src="..." alt="Icon">`. The optional trailing slash in `<img ... />` is permitted in HTML, but it is not required.',
					'Other common examples for void elements are `<br>` (for breaks), `<hr>` (for thematic breaks), and `<input>` (for text-inputs in forms).'
				]
			}),
			mcq({
				slug: 'overlapping-tags',
				title: 'Debugging Nested Elements',
				question:
					"What went wrong here?\n\n```html\n<p>I didn't expect to find the <em>neighbor's <strong>cat</em></strong> here!</p>\n```",
				options: [
					option('works', 'Everything works just fine.', false),
					option(
						'closing-order',
						'The closing `</strong>` tag should be before the closing `</em>` tag.',
						true
					),
					option(
						'browser-repairs',
						'Browsers may repair the markup and render the neighbor’s cat in italics and “cat” in bold.',
						true
					),
					option('invalid', 'This is invalid HTML.', true)
				],
				feedback:[
				"This is an important learning: **HTML tags must never intersect.** So `<strong>` must close before `<em>`.",
					"Browsers indeed may repair misnested formatting elements, but the source is invalid HTML. It is better to write correct markup in the first place. Tools like [Mozilla's HTML validator](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Debugging_HTML#html_validation) can help find errors."
				]
			}),
			mcq({
				slug: 'overlapping-marks',
				title: 'Multiple Comments',
				question:
					'Consider the following code snippet with two highlighted passages:\n\n```html\nLorem ipsum (/ˌlɔː.rəm ˈɪp.səm/ LOR-əm IP-səm) is a <mark data-comment="1">dummy\nor placeholder text commonly used in <mark data-comment="2">graphic design</mark>,\npublishing, and web development.</mark>```',
				options: [
					option(
						'g-1',
						'The text "graphic design" is part of comment 1',
						false
					),
					option(
						'g-2',
						'The text "graphic design" is part of comment 2',
						false
					),
					option(
						'g-both',
						'The text "graphic design" is part of both comments',
						true
					),
					option(
						'w-1',
						'The text "web development" is part of comment 1',
						true
					),
					option(
						'w-2',
						'The text "web development" is part of comment 2',
						false
					),
					option(
						'w-b',
						'The text "web development" is part of both comments',
						false
					),
					option('invalid', 'This is invalid HTML.', false)
				],
				feedback:[
					"This time the HTML is valid. However, the code may not do what you expect it to do, and again, this is related to the inability of HTML tags to intersect.",
					'Since `</ANY_ELEMENT>` always closes the last opened element of the same kind (in this case `<mark>`) comment 2 closes before "web development" making it part of only comment 1.',
					"In cases where comment 2 is fully contained within comment 1, we are just fine. **But what if the two comments would overlap?** In this case, we have to more explicit work (see the Bonus exercise).",
					"The syntax `data-comment`, by the way, is called a **data-attribute**. Data attributes allow you to invent almost any attribute name you like, just with the condition that it starts with `'data-'`"
			],
			bonusId: "overlapping-marks-bonus"
			}),
			input({
				slug: 'overlapping-marks-bonus',
				title: "Find a workaround for the overlapping marks",
				question: [
					"**Hint 1:** You have to introduce more `<mark>` elements.",
					"**Hint 2:** Use multiple attribute-values or data-attributes per `<mark>`."
				]
			}),
			mcq({
				slug: 'html-indentation',
				title: 'Code Indentation',
				question:
					'Compare these three code snippets.\n\n**1. One line**\n\n```html\n<html><body><p>Why should I care about formatting?</p></body></html>\n```\n\n**2. Separate lines**\n\n```html\n<html>\n<body>\n<p>\nWhy should I care about formatting?\n</p>\n</body>\n</html>\n```\n\n**3. Consistent indentation**\n\n```html\n<html>\n\t<body>\n\t\t<p>Why should I care about formatting?</p>\n\t</body>\n</html>\n```',
				options: [
					option('all-valid', 'All three versions are valid HTML.', true),
					option('same-rendering', 'All three versions render the same in the browser.', true),
					option(
						'first-preferred',
						'The first version is preferred because it uses less space and therefore less bandwidth.',
						false
					),
					option(
						'third-readable',
						'The third version is preferred because it is easier to read.',
						true
					),
					option(
						'third-collaboration',
						'The third version is preferred because it simplifies collaboration.',
						true
					)
				],
				feedback:
					'Consistent formatting makes code easier to read and collaborate on. Tools such as [Prettier](https://www.youtube.com/watch?v=RIFWADZzSjM) can format code on demand or on save. Standard formatting avoids noisy diffs caused by each contributor reformatting code to personal taste.'
			})
		]
	},
	{
		id: 'webpage-structure',
		title: 'Webpage Structure',
		questions: [
			mcq({
				slug: 'head-header-nav',
				title: 'The main navigation of a website lives inside…',
				options: [
					option('head', '`<head>`', false),
					option('header', '`<header>`', true),
					option('nav', '`<nav>`', true)
				],
				feedback: [
					'The `<head>` contains document metadata and is invisible to the user.',
					'A `<header>`, in turn, is rendered on the page and may contain a `<nav>` element. This is where you usually would place the main navigation.'
				]
			}),
			dragAndDrop({
				slug: 'body-element-tree',
				title: 'Basic Website Structure',
				question: [
					'Use the provided elements to build up the given webpage structure. Put invisible elements to the corresponding area and all the remaining elements in the body tree.'
				],
				items: [
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
				targets: [
					{ id: 'document', label: '<html>' },
					{
						id: 'invisible-target',
						label: 'Invisible to the user',
						parentId: 'document'
					},
					{ id: 'body-target', label: '<body>', parentId: 'document' },
					{ id: 'header-target', label: '<header>', parentId: 'body-target' },
					{ id: 'nav-target', label: '<nav>', parentId: 'header-target' },
					{ id: 'main-target', label: '<main>', parentId: 'body-target' },
					{ id: 'article-target', label: '<article>', parentId: 'main-target' },
					{
						id: 'section-target',
						label: '<section>',
						parentId: 'article-target'
					},
					{ id: 'aside-target', label: '<aside>', parentId: 'main-target' },
					{ id: 'footer-target', label: '<footer>', parentId: 'body-target' }
				],
				answerKey: {
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
				feedback: [
					'The `<head>` and `<title>` are not displayed in the page. A `<header>` contains the site navigation; `<main>` contains one or multiple `<article>` elements, each of which can be devided into sections using `<section>`. Related material like cross-references and related links belong inside the `<aside>` or `<footer>` block.',
					"Note that `<aside>` will not automatically appear beside the article — by default it just sits below like any other element. Placing it on the side is CSS's job, not HTML's. What semantic elements give you instead is meaning: screen readers for visually impaired users can navigate by landmarks, and browser reading modes can tell content from clutter.",
					"**Try it yourself:** visit this [article by SRF Meteo](https://www.srf.ch/radio-srf-1/sieben-fakten-warum-nebel-hohe-toene-schluckt-und-gespenster-erscheinen-laesst) and toggle on the **Reading mode** of your browser. The ads, navigation, and asides disappear, leaving only the article — and that's thanks to `<main>`."
				]
			})
		]
	},
	{
		id: 'semantic-html',
		title: 'Semantic HTML',
		questions: [
			input({
				slug: 'semantic-definition',
				title: 'Recap: Define with examples',
				question: [
					'Give a few examples of semantic HTML elements (e.g. from the previous section) and explain what distinguishes them from `<div>` and `<span>`. If you are unsure, you can [catch up here](https://developer.mozilla.org/en-US/curriculum/core/semantic-html/).',
					"It's important for your learning, that you answer in your own words."
				]
			}),
			mcq({
				slug: 'html-without-css',
				title: 'No CSS',
				question: '"A website without CSS will appear completely unstyled."',
				options: [option('true', 'True', false), option('false', 'False', true)],
				feedback:
					'The reason why this is wrong, is that **browsers apply default styles** to semantic HTML. Note, however, that the result will differ between browsers.'
			}),
			mcq({
				slug: 'html-full-of-divs',
				title: 'How about `<divs>`?',
				question: [
					'Consider these two button componenets',
					'```html\n<div>\n\t<div>\n\t\t<div>Link A</div>\n\t</div>\n\t<div>\n\t\t<div>Link B</div>\n\t</div>\n</div>',
					'```html\n<ul>\n\t<li>\n\t\t<a>Link A</a>\n\t</li>\n\t<li>\n\t\t<a>Link B</a>\n\t</li>\n</ul>'
				],
				options: [
					option(
						'div-for-everything',
						'`<div>` has no semantic meaning, so you can use them for everything.',
						true
					),
					option(
						'styling',
						'With the propper CSS, both code-blocks can be styled exactly the same.',
						true
					),
					option(
						'div-vs-span',
						'`<div>` could be replaced with `<span>` with just the same effect.',
						false
					)
				],
				feedback: [
					'So, while the first answer technically is correct, **you should never do this.** `<div>` elements are meant as structural wrappers around other elements, but not to replace semantic elements. Even if it seems to produce the same output at first glance.',
					"It's true, that `<div>` elements can be styled to *visually (!)* resemble their semantic counter-parts. You can also do the oposite and *remove* or *overwrite* default browser styling from semantic elements. This, by the way, is a pretty common technique, if you prefer to start styling from scratch.",
					"Lastly, it's true that `<span>` has no semantic meaning either. However, there is an important difference between `<div>` and `<span>` which we will cover just in a bit. In short: `<div>` is a block-element, which means it behaves like a rectangular box, whereas `<span>` appears inline, able to wrap around corners. Therefore the given code snippet with just `<span>` would style very differently."
				]
			})
		]
	},
	{
		id: 'formatting-text',
		title: 'Formatting Text (Headings, paragraphs, strong, emphasis)',
		questions: [
			sort({
				slug: 'heading-order',
				title: 'Sort the headings from smallest to largest.',
				question: 'Reorder the valid headings and move invalid elements into the discard area.',
				items: [
					{ id: 'h0', text: '<h0>' },
					{ id: 'h1', text: '<h1>' },
					{ id: 'h2', text: '<h2>' },
					{ id: 'h3', text: '<h3>' },
					{ id: 'h4', text: '<h4>' },
					{ id: 'h5', text: '<h5>' },
					{ id: 'h6', text: '<h6>' },
					{ id: 'h7', text: '<h7>' },
					{ id: 'h8', text: '<h8>' }
				],
				targets: [
					{ id: 'heading-position-1', label: 'Smallest' },
					{ id: 'heading-position-2', label: '2' },
					{ id: 'heading-position-3', label: '3' },
					{ id: 'heading-position-4', label: '4' },
					{ id: 'heading-position-5', label: '5' },
					{ id: 'heading-position-6', label: 'Largest' },
					{ id: 'invalid-headings', label: 'Not valid HTML headings' }
				],
				answerKey: {
					h6: 'heading-position-1',
					h5: 'heading-position-2',
					h4: 'heading-position-3',
					h3: 'heading-position-4',
					h2: 'heading-position-5',
					h1: 'heading-position-6',
					h0: 'invalid-headings',
					h7: 'invalid-headings',
					h8: 'invalid-headings'
				},
				feedback:
					'The valid heading elements are `<h1>` through `<h6>`. `<h1>` is the largest heading level and `<h6>` the smallest; `<h0>`, `<h7>` and `<h8>` do not exist.'
			}),
			dragAndDrop({
				slug: 'text-elements',
				title: 'Elements for textual mark-up',
				question: [
					'Match each element with its meaning. Focus on what it communicates, not just how the browser displays it.'
				],
				items: [
					{ id: 'p', text: '<p>' },
					{ id: 'strong', text: '<strong>' },
					{ id: 'em', text: '<em>' },
					{ id: 'b', text: '<b>' },
					{ id: 'i', text: '<i>' },
					{ id: 'br', text: '<br>' },
					{ id: 'hr', text: '<hr>' },
					{ id: 'q', text: '<q>' },
					{ id: 'blockquote', text: '<blockquote>' },
					{ id: 'cite', text: '<cite>' },
					{ id: 'pre', text: '<pre>' },
					{ id: 'span', text: '<span>' },
					{ id: 'mark', text: '<mark>' },
					{ id: 'small', text: '<small>' },
					{ id: 'sub', text: '<sub>' },
					{ id: 'sup', text: '<sup>' },
					{ id: 'abbr', text: '<abbr>' },
					{ id: 'code', text: '<code>' },
					{ id: 'del', text: '<del>' },
					{ id: 'ins', text: '<ins>' }
				],
				targets: [
					{ id: 'p', label: 'A paragraph' },
					{ id: 'strong', label: 'Strong importance, seriousness, or urgency' },
					{ id: 'em', label: 'Stress emphasis' },
					{ id: 'b', label: 'Attention without extra importance, such as a keyword' },
					{ id: 'i', label: 'An alternate voice or convention, such as a technical term' },
					{ id: 'br', label: 'A line break within text' },
					{ id: 'hr', label: 'A thematic break between passages' },
					{ id: 'q', label: 'A short quotation within a sentence' },
					{ id: 'blockquote', label: 'A quotation in its own block' },
					{ id: 'cite', label: 'The title of a work being referenced' },
					{ id: 'pre', label: 'Text with preserved whitespace and line breaks' },
					{ id: 'span', label: 'A generic inline container with no special meaning' },
					{ id: 'mark', label: 'Text highlighted as relevant in the current context' },
					{ id: 'small', label: 'Side comments or small print' },
					{ id: 'sub', label: 'Subscript, such as the number in a chemical formula' },
					{ id: 'sup', label: 'Superscript, such as an exponent or footnote marker' },
					{ id: 'abbr', label: 'An abbreviation or acronym' },
					{ id: 'code', label: 'A fragment of computer code' },
					{ id: 'del', label: 'Text deleted from a document' },
					{ id: 'ins', label: 'Text inserted into a document' }
				],
				answerKey: {
					p: 'p',
					strong: 'strong',
					em: 'em',
					b: 'b',
					i: 'i',
					br: 'br',
					hr: 'hr',
					q: 'q',
					blockquote: 'blockquote',
					cite: 'cite',
					pre: 'pre',
					span: 'span',
					mark: 'mark',
					small: 'small',
					sub: 'sub',
					sup: 'sup',
					abbr: 'abbr',
					code: 'code',
					del: 'del',
					ins: 'ins'
				},
				feedback: [
					"As discussed in the section on semantic HTML, it is important to always choose an element for its purpose, not simply because it looks bold, italic, or small. For purely visual styling, use `<span>` with CSS as a neutral container instead.",
					'**Importance and emphasis.** `<strong>` marks importance, seriousness, or urgency; `<em>` marks stress emphasis. Compare “Do **not** touch the manuscript” with “I said *this* manuscript, not that one.” Browsers commonly show them in bold and italic, respectively, but the meaning is the reason to use them.',
					'**Attention and alternate voices.** `<b>` draws attention without adding importance, for example to a keyword in a summary. `<i>` marks text set apart by convention or voice, such as a technical term, a taxonomic name, or a thought. Neither is merely a request for a font style, eventhough their naming hints that they once were created for formatting, and later repurposed.',
					'**Paragraphs and breaks.** `<p>` groups a paragraph. `<br>` breaks a line within text, useful for verse or an address; do not pile up line breaks to create paragraph margins. `<hr>` marks a thematic break, often displayed as a horizontal line. Both `<br>` and `<hr>` are void elements, so they have no closing tags.',
					'**Quotations and sources.** `<q>` marks a short inline quotation; browsers normally supply quotation marks. `<blockquote>` marks a quotation in a separate block, often indented. `<cite>` identifies the title of a work, not the name of its author. The optional `cite` *attribute* on `<q>` or `<blockquote>` can hold a source URL, but does not create a visible reference.',
					'**Preserving text and showing code.** `<pre>` preserves spaces and line breaks, useful when spacing matters in a transcription. `<code>` identifies computer code; combine `<pre><code>…</code></pre>` for a code block. To display literal HTML tags, escape angle brackets as `&lt;` and `&gt;` rather than letting the browser interpret them as elements.',
					'**Abbreviations and titles.** `<abbr>` marks an abbreviation; `title` can supply its expansion. Explain unfamiliar abbreviations in the visible text too, since a hover hint is not accessible to everyone.',
					'**Raised or lowered text.** `<sub>` and `<sup>` represent conventional subscripts and superscripts, such as H₂O and x², rather than arbitrary visual positioning.',
					'**Annotations.** `<mark>` highlights text relevant to the current context, such as a search match. `<small>` marks side comments or small print.',
					'**Document changes.** `<del>` marks a deletion and `<ins>` an insertion. They can help communicate an editorial correction, often shown with a strike-through and an underline. For scholarly transcriptions, explain your editorial conventions: HTML alone does not distinguish every kind of correction or uncertainty.',
				]
			}),
			dragAndDrop({
				slug: 'block-inline-elements',
				title: 'Block and inline Elements',
				question: ['Place each element in its usual display category: block or inline.'],
				items: [
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
				targets: [
					{ id: 'block', label: 'Block' },
					{ id: 'inline', label: 'Inline' }
				],
				answerKey: {
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
				feedback: [
					'Note, these are the elements’ default browser display categories. CSS can change them.',
					'For example, `<img style="display:block" />` makes the image behave like it was a block element, eventhough it natively would flow inline with the text.'
				]
			})
		]
	},
	{
		id: 'lists-tables',
		title: 'Lists and Tables',
		questions: [
			dragAndDrop({
				answerKey: {
					ul: 'list-category',
					td: 'table-category',
					ol: 'list-category',
					th: 'table-category',
					table: 'table-category',
					tr: 'table-category',
					li: 'list-category',
					caption: 'table-category'
				},
				slug: 'list-table-elements',
				title: 'Place the elements into table elements, list elements, both, or neither.',
				question: 'Each element belongs in the category describing its HTML role.',
				items: [
					{ id: 'ul', text: '<ul>' },
					{ id: 'td', text: '<td>' },
					{ id: 'ol', text: '<ol>' },
					{ id: 'th', text: '<th>' },
					{ id: 'table', text: '<table>' },
					{ id: 'tr', text: '<tr>' },
					{ id: 'li', text: '<li>' },
					{ id: 'caption', text: '<caption>' }
				],
				targets: [
					{ id: 'table-category', label: 'Table elements' },
					{ id: 'list-category', label: 'List elements' },
					{ id: 'both-category', label: 'Both' },
					{ id: 'neither-category', label: 'Neither' }
				],
				feedback:
					['List elements include `<ul>`, `<ol>`, and `<li>`. Table elements include `<table>`, `<caption>`, `<tr>`, `<th>`, and `<td>`.',
					"<h3>List Elements</h3>\n<table>\n  <thead>\n    <tr>\n      <th scope=\"col\">Tag</th>\n      <th scope=\"col\">What it does</th>\n      <th scope=\"col\">Example</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>ul</td>\n      <td>Unordered (bulleted) list</td>\n      <td>&lt;ul&gt;&lt;li&gt;A&lt;/li&gt;&lt;/ul&gt;</td>\n    </tr>\n    <tr>\n      <td>ol</td>\n      <td>Ordered (numbered) list</td>\n      <td>&lt;ol&gt;&lt;li&gt;First&lt;/li&gt;&lt;/ol&gt;</td>\n    </tr>\n    <tr>\n      <td>li</td>\n      <td>A single list item</td>\n      <td>&lt;li&gt;Item&lt;/li&gt;</td>\n    </tr>\n  </tbody>\n</table>\n\n**Nesting.** You can nest lists by inserting a full `<ul>` or `<ol>` block inside a `<li>` element. Like so you can also mix ordered and unordered lists.",
					"<h3>Table Elements</h3>\n<table>\n  <thead>\n    <tr>\n      <th scope=\"col\">Tag</th>\n      <th scope=\"col\">What it does</th>\n      <th scope=\"col\">Example</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>table</td>\n      <td>Wraps the whole table</td>\n      <td>&lt;table&gt;...&lt;/table&gt;</td>\n    </tr>\n    <tr>\n      <td>caption</td>\n      <td>A title for the table</td>\n      <td>&lt;caption&gt;Prices&lt;/caption&gt;</td>\n    </tr>\n    <tr>\n      <td>thead / tbody / tfoot</td>\n      <td>Head, body, and footer groups</td>\n      <td>&lt;tbody&gt;...&lt;/tbody&gt;</td>\n    </tr>\n    <tr>\n      <td>tr</td>\n      <td>A table row</td>\n      <td>&lt;tr&gt;...&lt;/tr&gt;</td>\n    </tr>\n    <tr>\n      <td>th</td>\n      <td>A header cell with a scope</td>\n      <td>&lt;th scope=\"col\"&gt;Name&lt;/th&gt;</td>\n    </tr>\n    <tr>\n      <td>td</td>\n      <td>A data cell; can span cells</td>\n      <td>&lt;td colspan=\"2\" rowspan=\"2\"&gt;X&lt;/td&gt;</td>\n    </tr>\n  </tbody>\n</table>"]
			})
		]
	},
	{
		id: 'links',
		title: 'Links and Anchors',
		questions: [
			mcq({
				slug: 'nesting-anchors',
				title: 'Nesting anchor tags',
				question: ["There are many ways in which anchors can be nested with other elements. Which of the following code snippets are valid HTML?",
					'**1:**\n```html\n<p>Here is a <a href="page.html">link</a> in text.</p>',
					'**2:**\n```html\n<span class="inline"><a href="page.html">click here</a></span>',
					'**3:**\n```html\n<a href="page.html"><span class="highlight">styled link</span></a>',
					'**4:**\n```html\n<h1><a href="/home">Welcome to our page!</a></h1>',
					'**5:**\n```html\n<a href="/index.html"><img src="pic.jpg" alt="image" /></a>'
				],
				options: [
					option('anchor-paragraph', "1: Anchor tag inside a paragraph", true),
					option('anchor-span', "2: Anchor tag inside a span", true),
					option('span-anchor', "3: Anchor tag that contains a span", true),
					option('heading-anchor', "4: Anchor tag around a heading", true),
					option('image-anchor', "5: Anchor tag around an image", true)
				],
				feedback:
					'All five examples are valid. Wrapping an image in a link is common for a [logo that links to the homepage](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links#image_links).'
			}),
			mcq({
				slug: 'link-target-blank',
				title: "Link targets",
				question: [
					'Where will this link open?',
					'```html\nPlease find the source material <a href="https://en.wikipedia.org/wiki/HTML" target="_blank">here</a>!'],
				options: [
					option('same-tab', 'In the existing browser tab.', false),
					option('new-tab', 'In a new browser tab.', true),
					option(
						'attribute-order',
						'It will not open because the attributes are in the wrong order.',
						false
					),
					option('title-required', 'It will not open because anchors require a `title` attribute.', false),
					option(
						'avoid-here',
						'Hyperlink text such as “here” or “click here” should be avoided.',
						true
					)
				],
				feedback:[
					'Attribute order does not matter, although consistent formatting helps readability.',
					'&nbsp;', 
					'Oh, and since we are talking about readability...',
				],
				bonusId: 'meaningful-link-bonus'
			}),
			input({
				slug: 'meaningful-link-bonus',
				title: "How would you rename the above link?",
				question: "As a preparation you may want to solve [three short exercises by MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Test_your_skills/Links#links_3)."
			}),
			mcq({
				slug: 'link-title-accessibility',
				title: 'Link titles',
				question: 'Choose the correct statements.',
				options: [
					option('title-tooltip', 'The optional `title` attribute can provide a tooltip.', true),
					option(
						'title-accessibility',
						'The `title` attribute automatically makes a link more accessible.',
						false
					)
				],
				feedback:[
					'Do not confuse an anchor’s `title` with an image\'s `alt` attribute. While the latter indeed is intended to improve accessibility (it is read by screenreaders) a link title is only revealed as a tooltip on mouse hover.', 
					'This means "that people relying on keyboard controls or touchscreens to navigate web pages will have difficulty accessing title information. If a title\'s information is truly important to the usability of the page, then you should present it in a manner that will be accessible to all users, for example by putting it in the regular text."<br>&mdash;[Quote: MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links#adding_supporting_information_with_the_title_attribute)',
				]
			}),
			mcq({
				slug: 'buttons-vs-anchors',
				title: 'Anchors vs. Buttons',
				question: 'Given what you\'ve just read above, choose the correct statements.',
				options: [
					option('anchors-style', 'Anchor elements can be styled to look like fancy three-dimensional buttons.', true),
					option(
						'link-preview',
						'A benefit of anchors for navigation is the small URL preview in the bottom left of your browser window when you hover a hyperlink.',
						true
					),
					option(
						'semantic-choice',
						'Choose HTML elements for semantic meaning rather than their default appearance.',
						true
					),
				],
				feedback:
					['Use anchors for navigation, such as `<a href="/foo/bar">`, and buttons for actions. CSS can make anchors look like buttons without changing their meaning.',
					
					'For accessibility limitations regarding buttons and anchors, check out the [challenges on a11yphant.com](https://a11yphant.com/challenges/buttons-vs-links).']
			})
		]
	},
	{
		id: 'images',
		title: 'Images',
		questions: [
			mcq({
				slug: 'image-relative-absolute-paths',
				title:
				'Relative vs. absolute paths',
				question: 'On a deeply nested sub-route `/about/team/teachers/index.html` you want to add an image which lives in your `/img` folder. Which paths work?',
				options: [
					option('deep-relative', '`../../../img/cat.webp`', true),
					option('root-relative', '`/img/cat.webp`', true),
					option('local-relative', '`img/cat.webp`', false)
				],
				feedback:
					["The long relative path works, but is easy to break. A path beginning with `/` starts at the site root. `img/cat.webp`, however, looks for an `img` folder inside `teachers`.",
					"Please note, that all of this also applies to linking stylesheets and other assets."]
			}),
			mcq({
				slug: 'image-alt-title',
				title:
				"Image title and alt-text",
				question:[
					'For the dinosaur image with `alt`, `width`, `height`, and `title` attributes, choose all correct statements.',
					'```html\n<img\n	src="images/dinosaur.jpg"\n	alt="The head and torso of a dinosaur skeleton; it has a large head with long sharp teeth"\n	width="400"\n	height="341"\n	title="A T-Rex on display in the Manchester University Museum"\n/>',
				],
				options: [
					option(
						'alt-no-title',
						'An image with an `alt` attribute does not need a `title` attribute.',
						false
					),
					option(
						'title-caption',
						'The `title` attribute appears as a figure caption below the image.',
						false
					),
					option('title-tooltip', 'The `title` attribute can appear as a tooltip.', true)
				],
				feedback:
					['The `title` attribute may appear as a tooltip; for captions use `<figcaption>`.',
					'Useful alternative text belongs in `alt`. This is the text that a screenreader would use to describe the image. The alt-text furthermore gets displayed before the image is downloaded&mdash;or in your email inbox, when you block external content to automatically load.']
			}),
			mcq({
				slug: 'image-dimensions',
				title: "Image Dimensions",
				question: ['Choose the correct statements about the image `width` and `height` attributes.',
				'```html\n<img\n  src="images/dinosaur.jpg"\n  width="400"\n  height="341"\n />\n'
				],
				options: [
					option('pixels', 'The dimension values are in pixels.', true),
					option('css-properties', '`width` and `height` are passed here as inline CSS style-properties.', false),
					option(
						'style-alternative',
						'Dimensions could also be set with the `style` attribute.',
						true
					),
					option(
						'resolution-double',
						'Setting width to `200` doubles the image resolution.',
						false
					),
					option('resolution-half', 'Setting width to `200` halves the image resolution.', false),
					option(
						'proportional',
						'Changing just one of width or height always scales the image proportionally.',
						false
					),
				],
				feedback:[
					"HTML width and height values are CSS-pixel dimensions and affect the displayed size. If only one dimension is set, the browser can preserve the intrinsic aspect ratio; if both are set inconsistently, the image can be distorted.",
					"Width and height won\'t affect the resolution of the downloaded image. To make sure images load fast in your browser, you should optimize the image files for the web. This includes reducing its resolution to what is actually needed on the page.",
					"Besides image resolution, there are also different formats to be considered. A useful format for the web is `.webp`.",
			]
			})
		]
	},
	{
		id: 'forms-buttons',
		title: 'Forms and Buttons',
		questions: [
			mcq({
				slug: 'form-control-terminology',
				title: "Checkboxes and Radio buttons",
				question: 'Choose the correct statements.',
				options: [
					option(
						'radio-multiple',
						'A group of radio buttons can have multiple checked items.',
						false
					),
					option(
						'checkbox-multiple',
						'A group of checkboxes can have multiple checked items.',
						true
					),
					option(
						'radio-input',
						'A radio button is an `<input type="radio">`, not a `<button>` element.',
						true
					)
				]
			}),
			mcq({
				slug: 'form-needs-server',
				title: "Servers",
				question: '“For a form to work, we need a web server.”',
				options: [option('true', 'True', false), option('false', 'False', true)],
				feedback: [
					"If you clicked *yes* this is absolutely fine, since for common GET and POST forms, a server usually handles the request. However, a form can also use a `mailto:` action to open an email client with a prefilled address, subject, and message. This works without a server and you are going to use this in the *Mini project*."
				]
			}),
			mcq({
				slug: 'form-submit-behavior',
				title: "Form submit behavior",
				question: 'Choose the correct statements.',
				options: [
					option(
						'action-reload',
						'After submission, the page navigates/reloads at the route specified by the form’s `action`.',
						true
					),
					option(
						'button-submit',
						'A button inside a form submits it by default unless its type says otherwise.',
						true
					),
					option(
						'explicit-required',
						'A form with multiple buttons requires one to explicitly use `type="submit"` for any button to submit.',
						false
					)
				],
				feedback:
					'Buttons inside forms default to `type="submit"`. Set `type="button"` for a button that should *not* submit. Setting `type="reset"` resets the form.'
			}),
			mcq({
				slug: 'boolean-disabled',
				title: "Disabling Buttons",
				question: 'Compare `<button disabled=true>` and `<button disabled>`. Which statements are correct?',
				options: [
					option('same-behavior', 'Both buttons behave the same.', true),
					option('value-required', 'The `disabled` attribute must have a value.', false),
					option('cannot-click', 'The user cannot activate the disabled button.', true),
					option('cannot-hover', 'The user cannot hover over the disabled button.', false)
				],
				feedback:
					'Boolean attributes are true when present, regardless of their string value. Therefore `disabled="false"` is still disabled; omit the attribute to enable the button. The same applies to `required`.'
			}),
			mcq({
				slug: 'label-input-association',
				title: "Labels",
				question: ['Compare the two code snippets. Which statements are correct?',
					'```html\n<form>\n	<label for="uid">User ID</label>\n	<input type="text" id="uid" name="uid" />\n	<label for="pwd">Password</label>\n	<input type="password" id="pwd" name="pwd" />\n	<button>Log in</button>\n</form>```',
					'```html\n<form>\n  <label>User ID\n    <input type="text" name="uid">\n  </label>\n  <label>Password\n    <input type="password" name="pwd">\n  </label>\n  <button>Log in</button>\n</form>'
				],
				options: [
					option('first-better', 'The first snippet is better.', false),
					option('second-better', 'The second snippet is better.', false),
					option('only-first', 'Only the first snippet works as written.', false),
					option('only-second', 'Only the second snippet works.', false),
					option('neither', 'Nothing of the above.', true)
				],
				feedback:[
					'Both variants work, but they have their own advantages and disadvantages. While wrapping a input inside its label spares you to set an id (which must be unique over the full page), it changes the relative hierarchy in which the label and the input stand to each other. This heavily influences how you have to position and style the labels with CSS.'
				]
			})
		]
	},
	{
		id: 'embeddings',
		title: 'Embeddings (iframe)',
		questions: [
			mcq({
				slug: 'iframe-css-and-tracking',
				title: '`<iframe>`',
				question: '“An `<iframe>` inherits the CSS of its parent page.”',
				options: [
					option('inherits-css', 'Yes.', false),
					option(
						'css-leaks',
						'No, but we must prevent CSS leaking out of the iframe into our page.',
						false
					),
					option(
						'isolated-css',
						'No. The iframe document has its own styles; CSS does not cross the document boundary.',
						true
					)
				],
				feedback:""
					// 'An iframe is a separate document, so styles do not mix. An iframe is not automatically “completely sandboxed”: the `sandbox` attribute adds restrictions. Embedded third-party content may track visitors when it loads. [SRF article reference in source: TODO]'
			})
		]
	}
];

export const htmlStrand: Strand = {
	id: 'html',
	title: 'HTML Questions',
	description:
		'Review HTML structure, semantics, text, links, images, forms, and embedded content.',
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

export const questionList: Question[] = htmlSections.flatMap((section) => section.questions);

export const bonusQuestionIds = new Set(
	questionList.flatMap((question) => (question.bonusId ? [question.bonusId] : []))
);
export const requiredQuestionList = questionList.filter(
	(question) => !bonusQuestionIds.has(question.id)
);

export const getQuestion = (id: string) => questionList.find((question) => question.id === id);
export const questionSection = (questionId: string) =>
	htmlSections.find((section) => section.questions.some((question) => question.id === questionId));

function revisionHash(relevant: object): string {
	let hash = 2166136261;
	for (const character of JSON.stringify(relevant)) {
		hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

export function legacyCommentVisibilityRevision(
	question: MultipleChoiceQuestion,
	bonus: InputQuestion
): string {
	return revisionHash({
		id: question.id,
		prompt: question.prompt,
		options: question.options.map(({ id, text, correct }) => ({
			id,
			text,
			correct
		})),
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
					options: question.options.map(({ id, text, correct }) => ({
						id,
						text,
						correct
					})),
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
