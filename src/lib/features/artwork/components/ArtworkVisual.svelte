<script lang="ts">
	import type { Artwork } from '$lib/types/database';

	import { X } from 'phosphor-svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		artwork: Artwork;
		displayMovementName: string;
		displayOklchToken: string;
		cardAspectRatio: string;
		eager?: boolean;
	}

	let { artwork, displayMovementName, displayOklchToken, cardAspectRatio, eager = false }: Props = $props();
	let showFullscreen = $state(false);
</script>

<button class="card-visual" style:aspect-ratio={cardAspectRatio} onclick={() => showFullscreen = true} aria-label="Agrandir l'œuvre">
	<div class="image-wrapper">
		<img
			src={artwork.image_url_full || artwork.image_url_thumb}
			alt="{artwork.titre} par {artwork.artistes?.nom || 'Inconnu'}"
			loading={eager ? "eager" : "lazy"}
			decoding="async"
		/>
	</div>
</button>

{#if showFullscreen}
	<div 
		class="fullscreen-modal" 
		role="dialog" 
		aria-modal="true" 
		onclick={() => showFullscreen = false}
		onkeydown={(e) => e.key === 'Escape' && (showFullscreen = false)}
		tabindex="0"
		transition:fade={{ duration: 200 }}
	>
		<button class="close-modal-btn" aria-label="Fermer" onclick={(e) => { e.stopPropagation(); showFullscreen = false; }}>
			<X size={24} weight="bold" />
		</button>
		<img 
			src={artwork.image_url_full || artwork.image_url_thumb} 
			alt="{artwork.titre} par {artwork.artistes?.nom || 'Inconnu'}"
			transition:scale={{ duration: 300, start: 0.95 }}
		/>
	</div>
{/if}

<style>
	.card-visual {
		position: relative;
		width: 100%;
		overflow: hidden;
		background-color: var(--color-border-subtle);
		padding: 0;
		border: none;
		cursor: pointer;
		display: block;
	}

	.card-visual:focus-visible {
		outline: 2px solid var(--movement-color, var(--color-primary));
		outline-offset: 2px;
	}

	.image-wrapper {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}

	.card-visual:hover .image-wrapper img {
		transform: scale(1.03);
	}

	.fullscreen-modal {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		cursor: zoom-out;
	}

	.fullscreen-modal img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-xl);
	}

	.close-modal-btn {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s;
		z-index: 10000;
	}

	.close-modal-btn:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}
</style>
