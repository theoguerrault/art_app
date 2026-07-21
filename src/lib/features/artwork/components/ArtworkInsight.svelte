<script lang="ts">
	import { Sparkle, BookOpen } from 'phosphor-svelte';

	interface Props {
		displayAnecdote: string;
		displayDescription?: string;
	}

	let { displayAnecdote, displayDescription }: Props = $props();
</script>

<div class="card-analysis">
	<div class="analysis-section">
		<div class="section-heading">
			<Sparkle size={18} weight="fill" />
			<span>L'Essentiel</span>
		</div>
		<p class="anecdote-text">{displayAnecdote}</p>
	</div>

	{#if displayDescription}
		<div class="analysis-section description-section">
			<div class="section-heading">
				<BookOpen size={18} weight="fill" />
				<span>Contexte technique & historique</span>
			</div>
			<p class="description-text">{displayDescription}</p>
		</div>
	{/if}
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
	}

	.anecdote-text {
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.45;
		color: var(--color-text-primary);
	}

	.description-text {
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.description-section {
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-border-subtle);
	}

	@container card (min-width: 540px) {
		.card-analysis {
			padding: 2.25rem;
		}
	}
</style>
