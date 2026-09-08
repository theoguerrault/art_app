<script lang="ts">
	import type { Artwork } from '$lib/types/database';
	import { Bank, Ruler, PaintBrush } from 'phosphor-svelte';

	interface Props {
		artwork: Artwork;
	}

	let { artwork }: Props = $props();
</script>

{#if artwork.musee || artwork.dimensions || artwork.medium}
	<div class="specs-bar">
		{#if artwork.musee}
			<div class="spec-item" title="Musée / Conservation">
				<Bank size={16} weight="bold" />
				<span>{artwork.musee}</span>
			</div>
		{/if}
		{#if artwork.medium}
			<div class="spec-item" title="Médium & Technique">
				<PaintBrush size={16} weight="bold" />
				<span>{artwork.medium}</span>
			</div>
		{/if}
		{#if artwork.dimensions}
			<div class="spec-item" title="Dimensions">
				<Ruler size={16} weight="bold" />
				<span>{artwork.dimensions}</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.specs-bar {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.75rem 1.25rem;
		padding: 0.65rem 1.35rem;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-pill);
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-width: 100%;
	}

	@media (max-width: 480px) {
		.specs-bar {
			border-radius: var(--radius-lg);
			padding: 0.75rem 1rem;
			gap: 0.5rem 0.85rem;
			font-size: 0.8rem;
		}
	}

	.spec-item {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-weight: 500;
	}

	.spec-item :global(svg) {
		color: var(--movement-color, var(--color-primary));
		flex-shrink: 0;
	}
</style>
