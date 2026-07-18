<script lang="ts">
	import type { Artwork } from '$lib/types/database';

	interface Props {
		artwork: Artwork;
		displayMovementName: string;
		displayOklchToken: string;
		cardAspectRatio: string;
	}

	let { artwork, displayMovementName, displayOklchToken, cardAspectRatio }: Props = $props();
</script>

<div class="card-visual" style:aspect-ratio={cardAspectRatio}>
	<div class="image-wrapper">
		<img
			src={artwork.image_url_full || artwork.image_url_thumb}
			alt="{artwork.titre} par {artwork.artiste}"
			loading="eager"
			decoding="async"
		/>
	</div>
	<div class="visual-overlay">
		<span class="movement-badge">{displayMovementName}</span>
		<div class="artwork-info">
			<h2 class="artwork-title">{artwork.titre}</h2>
			<p class="artwork-artist">{artwork.artiste} <span class="artwork-date">({artwork.date_creation})</span></p>
		</div>
	</div>
</div>

<style>
	.card-visual {
		position: relative;
		width: 100%;
		overflow: hidden;
		background-color: var(--color-border-subtle);
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

	.visual-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding: 1.5rem;
		background: linear-gradient(
			to top,
			oklch(0.12 0.02 250 / 0.92) 0%,
			oklch(0.12 0.02 250 / 0.65) 45%,
			oklch(0.12 0.02 250 / 0) 100%
		);
		color: oklch(0.98 0.01 250);
		z-index: 2;
	}

	.movement-badge {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		background-color: var(--movement-color, var(--color-primary));
		color: oklch(0.99 0 0);
		box-shadow: var(--shadow-sm);
		margin-bottom: 0.75rem;
	}

	.artwork-title {
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.15;
		color: oklch(0.99 0.005 250);
		margin-bottom: 0.25rem;
		text-shadow: 0 2px 4px oklch(0 0 0 / 0.4);
	}

	.artwork-artist {
		font-size: 1rem;
		font-weight: 500;
		color: oklch(0.88 0.015 250);
	}

	.artwork-date {
		font-weight: 400;
		color: oklch(0.78 0.015 250);
	}

	@container card (min-width: 540px) {
		.artwork-title {
			font-size: 1.85rem;
		}
		.visual-overlay {
			padding: 2.25rem;
		}
	}
</style>
