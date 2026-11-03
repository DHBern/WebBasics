import { marked } from 'marked';

export function renderMarkdown(source: string): string {
	return marked.parse(source, { async: false }) as string;
}

export function renderInline(source: string): string {
	return marked.parseInline(source, { async: false }) as string;
}
