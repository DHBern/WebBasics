/**
 * @typedef {{
 *   type: string;
 *   tagName?: string;
 *   properties?: Record<string, unknown>;
 *   children?: MarkdownNode[];
 * }} MarkdownNode
 */

export default function markdownLinks() {
	/** @param {MarkdownNode} node */
	function transform(node) {
		if (node.type === 'element' && node.tagName === 'a') {
			node.properties = {
				...node.properties,
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
