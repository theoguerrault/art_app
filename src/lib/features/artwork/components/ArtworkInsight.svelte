<script lang="ts">
	interface Portion {
		id?: string;
		type?: string;
		title?: string;
		text: string;
	}

	interface Props {
		artworkTitle?: string;
		introduction?: string | null;
		portions?: Portion[];
		articlePrincipal?: string;
	}

	let { introduction, portions = [], articlePrincipal }: Props = $props();

	function filterPortions(pts: Portion[], typeStr: string | null) {
		if (typeStr === null) return pts.filter(p => !p.type || p.type === 'article');
		return pts.filter(p => p.type === typeStr);
	}

	let articlePortions = $derived(filterPortions(portions, null));
	let anecdotePortions = $derived(filterPortions(portions, 'anecdote'));

	/**
	 * Lightweight client-side HTML sanitizer.
	 * Uses the browser's own DOMParser to parse & re-serialize HTML,
	 * stripping dangerous tags/attributes without any server-side dep.
	 * This replaces sanitize-html which crashes Vercel due to ESM/CJS conflict.
	 */
	function cleanHtml(html: string | undefined | null): string {
		if (!html) return '';
		const ALLOWED_TAGS = new Set([
			'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'ul', 'ol', 'li',
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'img', 'span'
		]);
		const ALLOWED_ATTRS: Record<string, string[]> = {
			a: ['href', 'title', 'target'],
			img: ['src', 'alt', 'title']
		};
		const doc = new DOMParser().parseFromString(html, 'text/html');
		function sanitizeNode(node: Element) {
			const toRemove: Element[] = [];
			for (const child of Array.from(node.children)) {
				if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
					// Replace disallowed element with its text content
					const text = document.createTextNode(child.textContent || '');
					child.replaceWith(text);
				} else {
					const allowedAttrNames = ALLOWED_ATTRS[child.tagName.toLowerCase()] || [];
					for (const attr of Array.from(child.attributes)) {
						if (!allowedAttrNames.includes(attr.name) || /^javascript:/i.test(attr.value)) {
							toRemove.push(child);
							child.removeAttribute(attr.name);
						}
					}
					sanitizeNode(child);
				}
			}
			for (const el of toRemove) el.remove();
		}
		sanitizeNode(doc.body);
		return doc.body.innerHTML;
	}

	function html(node: HTMLElement, content: string | null | undefined) {
		node.innerHTML = cleanHtml(content);
		return {
			update(newContent: string | null | undefined) {
				node.innerHTML = cleanHtml(newContent);
			}
		};
	}
</script>

<div class="card-analysis">
	{#if introduction}
		<div class="analysis-section introduction-section">
			<h2 class="section-subtitle">INTRODUCTION</h2>
			<div class="markdown-content" use:html={introduction}></div>
		</div>
	{/if}

	{#if articlePortions.length > 0}
		<div class="analysis-section article-section">
			<h2 class="section-subtitle">ARTICLE</h2>
			<div class="portions-list">
				{#each articlePortions as portion, index (portion.id || index)}
					<div class="portion-item">
						{#if portion.title}
							<h3 class="portion-title">{portion.title}</h3>
						{/if}
						<div class="markdown-content" use:html={portion.text}></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if articlePrincipal}
		<div class="analysis-section article-section">
			<h2 class="section-subtitle">ARTICLE</h2>
			<div class="markdown-content" use:html={articlePrincipal}></div>
		</div>
	{/if}

	{#if anecdotePortions.length > 0}
		<div class="analysis-section anecdotes-section">
			<h2 class="section-subtitle">ANECDOTES</h2>
			<div class="portions-list">
				{#each anecdotePortions as portion, index (portion.id || index)}
					<div class="portion-item">
						{#if portion.title}
							<h3 class="portion-title">{portion.title}</h3>
						{/if}
						<div class="markdown-content" use:html={portion.text}></div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.card-analysis {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		background: transparent;
	}

	.analysis-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.analysis-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.section-subtitle {
		font-family: var(--font-body);
		font-size: 0.95rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.portions-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.portion-item {
		background: transparent;
		border: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}



	.portion-title {
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0.5rem 0 0.25rem 0;
	}

	.markdown-content {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-text-primary);
	}

	:global(.markdown-content p) {
		margin-bottom: 0.85rem;
	}

	:global(.markdown-content p:last-child) {
		margin-bottom: 0;
	}

	:global(.markdown-content h3) {
		font-size: 1rem;
		font-weight: 700;
		font-family: var(--font-body);
		color: var(--color-text-primary);
		margin-top: 1rem;
		margin-bottom: 0.3rem;
	}

	:global(.markdown-content ul) {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.markdown-content li) {
		padding-left: 0.25rem;
	}

	:global(.markdown-content strong) {
		font-weight: 700;
		color: var(--color-text-primary);
	}

	@container card (min-width: 540px) {
		.card-analysis {
			padding: 2.25rem;
		}
	}
</style>
