import { Marked } from 'marked';
import Prism from 'prismjs';

const marked = new Marked({
	renderer: {
		code({ text, lang }) {
			const language = lang?.split(/\s+/)[0].toLowerCase();
			if (!language || !Object.hasOwn(Prism.languages, language)) return false;
			const grammar = Prism.languages[language];
			if (!grammar || typeof grammar !== 'object') return false;
			return `<pre class="language-${language}"><code class="language-${language}">${Prism.highlight(text, grammar, language)}</code></pre>\n`;
		}
	}
});

export function renderMarkdown(source: string): string {
	return (marked.parse(source, { async: false }) as string).replace(
		/<p>(?=<strong>Bonus(?:\b|:))/g,
		'<p class="feedback-bonus">'
	);
}

export function renderInline(source: string): string {
	return marked.parseInline(source, { async: false }) as string;
}
