export function autosize(node: HTMLTextAreaElement) {
	function resize() {
		node.style.height = 'auto';
		node.style.height = `${Math.max(node.scrollHeight, 60)}px`;
	}

	node.style.overflowY = 'hidden';
	node.addEventListener('input', resize);
	// Initial resize on mount after render tick
	requestAnimationFrame(resize);

	return {
		update() {
			resize();
		},
		destroy() {
			node.removeEventListener('input', resize);
		}
	};
}
