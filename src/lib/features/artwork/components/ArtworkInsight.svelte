<script lang="ts">
	import { parseMarkdown } from '$lib/utils/markdown';

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

	let { artworkTitle, introduction, portions = [], articlePrincipal }: Props = $props();

	let articlePortions = $derived(portions.filter((p) => !p.type || p.type === 'article'));
	let anecdotePortions = $derived(portions.filter((p) => p.type === 'anecdote'));
</script>

<div class="card-analysis">
	{#if introduction}
		<div class="analysis-section introduction-section">
			<h3 class="section-subtitle">INTRODUCTION</h3>
			<div class="markdown-content">{@html parseMarkdown(introduction)}</div>
		</div>
	{/if}

	{#if articlePortions.length > 0}
		<div class="analysis-section article-section">
			<h3 class="section-subtitle">ARTICLE</h3>
			<div class="portions-list">
				{#each articlePortions as portion, index}
					<div class="portion-item">
						{#if portion.title}
							<h4 class="portion-title">{portion.title}</h4>
						{/if}
						<div class="markdown-content">{@html parseMarkdown(portion.text)}</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if articlePrincipal}
		<div class="analysis-section article-section">
			<h3 class="section-subtitle">ARTICLE</h3>
			<div class="markdown-content">{@html parseMarkdown(articlePrincipal)}</div>
		</div>
	{/if}

	{#if anecdotePortions.length > 0}
		<div class="analysis-section anecdotes-section">
			<h3 class="section-subtitle">ANECDOTES</h3>
			<div class="portions-list">
				{#each anecdotePortions as portion, index}
					<div class="portion-item">
						{#if portion.title}
							<h4 class="portion-title">{portion.title}</h4>
						{/if}
						<div class="markdown-content">{@html parseMarkdown(portion.text)}</div>
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
