<script lang="ts">
	import { Sparkle, BookOpen } from 'phosphor-svelte';
	import { parseMarkdown } from '$lib/utils/markdown';

	interface Props {
		artworkTitle?: string;
		displayAnecdote: string;
	}

	let { artworkTitle, displayAnecdote }: Props = $props();
</script>

<div class="card-analysis">
	<div class="analysis-section">
		<div class="section-heading">
			<Sparkle size={18} weight="fill" />
			<span>{artworkTitle || "L'Article"}</span>
		</div>
		<div class="anecdote-text markdown-content">{@html parseMarkdown(displayAnecdote)}</div>
	</div>
</div>

<style>
	.card-analysis {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		background: radial-gradient(circle at top right, var(--color-surface-elevated), var(--color-surface));
	}

	.analysis-section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--movement-color, var(--color-primary));
		margin-bottom: 0.5rem;
	}

	.anecdote-text {
		font-size: 0.98rem;
		line-height: 1.6;
		color: var(--color-text-secondary);
	}

	/* Markdown styles scoped to this component */
	:global(.markdown-content p) {
		margin-bottom: 0.85rem;
	}

	:global(.markdown-content p:last-child) {
		margin-bottom: 0;
	}

	:global(.markdown-content h3) {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin-top: 1rem;
		margin-bottom: 0.2rem;
	}
	
	:global(.markdown-content h3:first-child) {
		margin-top: 0;
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
