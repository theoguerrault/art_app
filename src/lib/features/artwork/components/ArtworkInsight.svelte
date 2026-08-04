<script lang="ts">
	import sanitizeHtml from 'sanitize-html';

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

	function cleanHtml(html: string | undefined | null) {
		if (!html) return '';
		return sanitizeHtml(html, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span'])
		});
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
