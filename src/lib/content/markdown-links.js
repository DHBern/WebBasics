/**
 * @typedef {{
 *   type: string;
 *   tagName?: string;
 *   properties?: Record<string, unknown>;
 *   children?: MarkdownNode[];
 * }} MarkdownNode
 */

/** @param {{ base?: string }} [options] */
export default function markdownLinks({ base = '' } = {}) {
	/** @param {MarkdownNode} node */
	function transform(node) {
		if (node.type === 'element' && node.tagName === 'a') {
			node.properties = {
				...node.properties,
				...(typeof node.properties?.href === 'string' &&
				node.properties.href.startsWith('/') &&
				!node.properties.href.startsWith('//')
					? { href: `${base}${node.properties.href}` }
					: {}),
				target: '_blank',
				rel: [
					...new Set(
						`${node.properties?.rel ?? ''}`
							.split(/[,\s]+/)
							.filter(Boolean)
							.concat('noopener', 'noreferrer')
					)
				]
			};
		}
		node.children?.forEach(transform);
	}
	return transform;
}
