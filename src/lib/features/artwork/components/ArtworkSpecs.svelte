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
		gap: 1.25rem;
		padding: 0.85rem 1.75rem;
		background-color: var(--color-surface-elevated);
		border-bottom: 1px solid var(--color-border-subtle);
		font-size: 0.88rem;
		color: var(--color-text-secondary);
	}

	.spec-item {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 500;
	}

	.spec-item :global(svg) {
		color: var(--movement-color, var(--color-primary));
		flex-shrink: 0;
	}
</style>
