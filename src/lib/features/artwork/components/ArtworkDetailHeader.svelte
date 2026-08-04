<script lang="ts">
	import { Heart, SealCheck } from 'phosphor-svelte';
	import type { ActiveLessonView } from '$lib/types/database';

	interface Props {
		artwork: ActiveLessonView;
		isFavorite: boolean;
		onToggleFavorite: () => void;
		onOpenCourant?: () => void;
		onOpenArtiste?: () => void;
	}

	let { artwork, isFavorite, onToggleFavorite, onOpenCourant, onOpenArtiste }: Props = $props();
</script>

<div class="detail-header">
	{#if artwork.glossary?.courant_description && onOpenCourant}
		<button
			type="button"
			class="movement-tag clickable"
			style:background-color={artwork.oklch_token}
			onclick={onOpenCourant}
		>
			{artwork.nom_courant}
		</button>
	{:else}
		<span class="movement-tag" style:background-color={artwork.oklch_token}>
			{artwork.nom_courant}
		</span>
	{/if}
	
	<div class="actions-row">
		{#if artwork.verification_status === 'VERIFIED'}
			<span class="verified-pill" title="Contenu vérifié à 100%">
				<SealCheck size={22} weight="fill" />
			</span>
		{/if}
		<button class="favorite-btn" onclick={onToggleFavorite} aria-label="Toggle Favorite">
			<Heart size={24} weight={isFavorite ? 'fill' : 'bold'} color={isFavorite ? '#ff3b30' : 'currentColor'} />
		</button>
	</div>
	
	<h1 class="artwork-title">{artwork.titre}</h1>
	
	<p class="artwork-meta">
		{#if artwork.glossary?.artiste_description && onOpenArtiste}
			<button type="button" class="artist-link" onclick={onOpenArtiste}>{artwork.artistes?.nom}</button>
		{:else}
			{artwork.artistes?.nom}
		{/if}
		({artwork.date_creation})
	</p>
</div>

<style>
	.detail-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.movement-tag {
		display: inline-block;
		padding: 0.35rem 0.85rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #000000;
		margin-bottom: 0.75rem;
		border: none;
	}

	.movement-tag.clickable {
		cursor: pointer;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.movement-tag.clickable:hover {
		transform: scale(1.05);
		opacity: 0.9;
	}

	.artwork-title {
		font-family: 'Instrument Serif', serif;
		font-size: 2.5rem;
		font-weight: 400;
		margin: 0 0 0.5rem 0;
		color: var(--color-text-primary);
		line-height: 1.1;
	}

	.actions-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.verified-pill {
		color: var(--color-success);
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.favorite-btn {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: transform 0.2s ease, color 0.2s ease;
		flex-shrink: 0;
	}

	.favorite-btn:hover {
		transform: scale(1.1);
	}

	.favorite-btn:active {
		transform: scale(0.95);
	}

	.artwork-meta {
		font-size: 1rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.artist-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--color-text-primary);
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 4px;
		transition: color 0.2s ease;
	}

	.artist-link:hover {
		color: var(--color-primary);
	}
</style>
