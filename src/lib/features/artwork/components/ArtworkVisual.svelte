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

	let { artwork, cardAspectRatio, eager = false }: Props = $props();
	let showFullscreen = $state(false);

	function openFullscreen() {
		showFullscreen = true;
	}

	function closeFullscreen() {
		showFullscreen = false;
	}

	function handleCloseClick() {
		showFullscreen = false;
	}
</script>

<svelte:head>
	{#if eager}
		{#if artwork.image_url_full && artwork.image_url_thumb && artwork.image_url_full !== artwork.image_url_thumb}
			<link rel="preload" as="image" href={artwork.image_url_thumb} media="(max-width: 768px)" fetchpriority="high" />
			<link rel="preload" as="image" href={artwork.image_url_full} media="(min-width: 769px)" fetchpriority="high" />
		{:else}
			<link rel="preload" as="image" href={artwork.image_url_full || artwork.image_url_thumb} fetchpriority="high" />
		{/if}
	{/if}
</svelte:head>

<button class="card-visual" style:aspect-ratio={cardAspectRatio} onclick={openFullscreen} aria-label="Agrandir l'œuvre">
	<div class="image-wrapper">
		{#if artwork.image_url_full && artwork.image_url_thumb && artwork.image_url_full !== artwork.image_url_thumb}
			<picture>
				<source media="(max-width: 768px)" srcset={artwork.image_url_thumb} />
				<source media="(min-width: 769px)" srcset={artwork.image_url_full} />
				<img
					src={artwork.image_url_full}
					alt="{artwork.title} par {artwork.artists?.name || 'Inconnu'}"
					loading={eager ? "eager" : "lazy"}
					fetchpriority={eager ? "high" : "auto"}
					decoding={eager ? "sync" : "async"}
				/>
			</picture>
		{:else}
			<img
				src={artwork.image_url_full || artwork.image_url_thumb}
				alt="{artwork.title} par {artwork.artists?.name || 'Inconnu'}"
				loading={eager ? "eager" : "lazy"}
				fetchpriority={eager ? "high" : "auto"}
				decoding={eager ? "sync" : "async"}
			/>
		{/if}
	</div>
</button>

{#if showFullscreen}
	<div
		class="fullscreen-modal"
		role="dialog"
		aria-modal="true"
		aria-label="Image plein écran"
		transition:fade={{ duration: 200 }}
	>
		<button class="modal-backdrop" onclick={closeFullscreen} aria-label="Fermer l'image plein écran" tabindex="0"></button>
		<button class="close-modal-btn" aria-label="Fermer" onclick={handleCloseClick}>
			<X size={24} weight="bold" />
		</button>
		<img
			src={artwork.image_url_full || artwork.image_url_thumb}
			alt="{artwork.title} par {artwork.artists?.name || 'Inconnu'}"
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
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		background: transparent;
		border: none;
		cursor: zoom-out;
		z-index: 0;
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
