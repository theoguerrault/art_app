export function html(node: HTMLElement, content: string | undefined | null) {
	node.innerHTML = content ?? '';
	return {
		update(newContent: string | undefined | null) {
			node.innerHTML = newContent ?? '';
		}
	};
}
