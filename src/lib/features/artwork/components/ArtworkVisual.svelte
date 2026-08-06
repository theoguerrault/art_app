<script lang="ts">
	import type { Artwork } from '$lib/types/database';

	import { X, MagnifyingGlassPlus } from 'phosphor-svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		artwork: Artwork;
		displayMovementName?: string;
		displayOklchToken?: string;
		cardAspectRatio?: string;
		eager?: boolean;
	}

	let { artwork, eager = false }: Props = $props();
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

<button class="card-visual" onclick={openFullscreen} aria-label="Agrandir l'œuvre">
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

		<div class="zoom-badge" aria-hidden="true">
			<MagnifyingGlassPlus size={16} weight="bold" />
			<span>Agrandir</span>
		</div>
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
		background: transparent;
		padding: 0;
		border: none;
		cursor: zoom-in;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: visible;
	}

	.card-visual:focus-visible {
		outline: 2px solid var(--movement-color, var(--color-primary));
		outline-offset: 4px;
		border-radius: var(--radius-lg);
	}

	.image-wrapper {
		position: relative;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		max-width: 100%;
	}

	.image-wrapper picture {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		max-width: 100%;
	}

	.image-wrapper img {
		max-width: 100%;
		height: auto;
		max-height: 75vh;
		object-fit: contain;
		display: block;
		margin: 0 auto;
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
		transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s ease;
	}

	.card-visual:hover .image-wrapper img {
		transform: scale(1.015);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
	}

	.zoom-badge {
		position: absolute;
		bottom: 0.75rem;
		right: 0.75rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.85rem;
		background: rgba(18, 18, 18, 0.85);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: #ffffff;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		opacity: 0;
		transform: translateY(6px);
		transition: opacity 0.25s ease, transform 0.25s ease;
		pointer-events: none;
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	}

	.card-visual:hover .zoom-badge,
	.card-visual:focus-visible .zoom-badge {
		opacity: 1;
		transform: translateY(0);
	}

	.fullscreen-modal {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background-color: rgba(0, 0, 0, 0.92);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
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
		background-color: rgba(255, 255, 255, 0.12);
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
		background-color: rgba(255, 255, 255, 0.25);
	}
</style>

