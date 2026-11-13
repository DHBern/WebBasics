import { Marked, Renderer, type RendererObject } from 'marked';
import Prism from 'prismjs';

const renderer: RendererObject = {
	link(token) {
		return Renderer.prototype.link
			.call(this, token)
			.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
	},
	code({ text, lang }) {
		const language = lang?.split(/\s+/)[0].toLowerCase();
		if (!language || !Object.hasOwn(Prism.languages, language)) return false;
		const grammar = Prism.languages[language];
		if (!grammar || typeof grammar !== 'object') return false;
		return `<pre class="language-${language}"><code class="language-${language}">${Prism.highlight(text, grammar, language)}</code></pre>\n`;
	}
};

const marked = new Marked({ renderer });
const dashboardMarkdown = new Marked({
	renderer: {
		...renderer,
		link(token) {
			const base = 'https://webbasics.invalid/';
			if (
				!URL.canParse(token.href, base) ||
				!['http:', 'https:', 'mailto:'].includes(new URL(token.href, base).protocol)
			) {
				return this.parser.parseInline(token.tokens);
			}
			return Renderer.prototype.link
				.call(this, token)
				.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
		},
		html({ text }) {
			return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
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

export function renderDashboardMarkdown(source: string): string {
	return dashboardMarkdown.parse(source, { async: false }) as string;
}
