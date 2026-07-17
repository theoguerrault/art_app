<script lang="ts">
	import type { Artwork } from '$lib/types/database';

	interface ArtworkCardProps {
		artwork: Artwork;
		movementName?: string;
		oklchToken?: string;
		anecdote?: string;
		description?: string;
	}

	let {
		artwork,
		movementName = 'Historical Art',
		oklchToken = 'var(--movement-theme)',
		anecdote,
		description
	}: ArtworkCardProps = $props();

	let isFlipped = $state(false);

	function toggleFlip() {
		isFlipped = !isFlipped;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleFlip();
		}
	}

	// Derive values safely from props or artwork fallback fields
	let displayMovementName = $derived(
		movementName !== 'Historical Art'
			? movementName
			: ('nom_courant' in artwork && typeof (artwork as any).nom_courant === 'string'
					? (artwork as any).nom_courant
					: 'Historical Art')
	);

	let displayOklchToken = $derived(
		oklchToken !== 'var(--movement-theme)'
			? oklchToken
			: ('oklch_token' in artwork && typeof (artwork as any).oklch_token === 'string'
					? (artwork as any).oklch_token
					: 'var(--movement-theme)')
	);

	let displayAnecdote = $derived(
		anecdote ||
			('anecdote_accroche' in artwork && typeof (artwork as any).anecdote_accroche === 'string'
				? (artwork as any).anecdote_accroche
				: 'Discover the compelling story and historical essence of this masterpiece.')
	);

	let displayDescription = $derived(
		description ||
			('anecdote_technique' in artwork && typeof (artwork as any).anecdote_technique === 'string'
				? (artwork as any).anecdote_technique
				: 'Examine the technical execution, composition rules, and artistic breakthroughs.')
	);

	let cardAspectRatio = $derived(artwork.aspect_ratio ? `${artwork.aspect_ratio}` : '4 / 3');
</script>

<div
	class="artwork-card-container container-card"
	style:--movement-color={displayOklchToken}
>
	<div
		class="flip-card"
		class:is-flipped={isFlipped}
		role="button"
		tabindex="0"
		onclick={toggleFlip}
		onkeydown={handleKeyDown}
		aria-label="Daily Artwork Card: {artwork.titre} by {artwork.artiste}. Click or tap to flip card and read analysis."
	>
		<div class="flip-card-inner">
			<!-- FRONT SIDE -->
			<div class="flip-card-front" style:aspect-ratio={cardAspectRatio}>
				<div class="image-wrapper" style:aspect-ratio={cardAspectRatio}>
					<img
						src={artwork.image_url_full || artwork.image_url_thumb}
						alt="{artwork.titre} by {artwork.artiste}"
						loading="eager"
						decoding="async"
					/>
				</div>
				<div class="card-front-overlay">
					<span class="movement-badge">{displayMovementName}</span>
					<div class="artwork-info">
						<h2 class="artwork-title">{artwork.titre}</h2>
						<p class="artwork-artist">{artwork.artiste} <span class="artwork-date">({artwork.date_creation})</span></p>
					</div>
					<div class="flip-hint" aria-hidden="true">
						<span>Tap to reveal analysis ↻</span>
					</div>
				</div>
			</div>

			<!-- BACK SIDE -->
			<div class="flip-card-back" style:aspect-ratio={cardAspectRatio}>
				<div class="back-content">
					<div class="back-header">
						<span class="movement-badge">{displayMovementName}</span>
						<h3 class="back-title">{artwork.titre}</h3>
						<p class="back-subtitle">{artwork.artiste}, {artwork.date_creation}</p>
					</div>
					
					<div class="anecdote-section">
						<h4 class="section-heading">Key Insight</h4>
						<p class="anecdote-text">{displayAnecdote}</p>
					</div>

					<div class="description-section">
						<h4 class="section-heading">Technical & Historical Context</h4>
						<p class="description-text">{displayDescription}</p>
					</div>

					<div class="flip-hint back-hint" aria-hidden="true">
						<span>↻ Tap to flip back</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.artwork-card-container {
		perspective: 1200px;
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
	}

	.flip-card {
		width: 100%;
		cursor: pointer;
		outline: none;
		border-radius: var(--radius-xl);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.flip-card:focus-visible {
		outline: 3px solid var(--color-primary);
		outline-offset: 4px;
	}

	.flip-card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		text-align: left;
		transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
		transform-style: preserve-3d;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
	}

	.flip-card.is-flipped .flip-card-inner {
		transform: rotateY(180deg);
	}

	.flip-card-front,
	.flip-card-back {
		position: relative;
		width: 100%;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: var(--radius-xl);
		overflow: hidden;
		background-color: var(--color-surface);
		border: 1px solid var(--movement-color, var(--color-border));
		display: flex;
		flex-direction: column;
	}

	/* FRONT STYLES */
	.flip-card-front .image-wrapper {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: var(--color-border-subtle);
	}

	.flip-card-front img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}

	.flip-card:hover .flip-card-front img {
		transform: scale(1.03);
	}

	.card-front-overlay {
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

	.flip-hint {
		margin-top: 1rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: oklch(0.90 0.02 250);
		display: flex;
		align-items: center;
		gap: 0.35rem;
		opacity: 0.9;
	}

	/* BACK STYLES */
	.flip-card-back {
		transform: rotateY(180deg);
		padding: 1.75rem;
		background: radial-gradient(circle at top right, var(--color-surface-elevated), var(--color-surface));
		color: var(--color-text-primary);
		overflow-y: auto;
		justify-content: space-between;
	}

	.back-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		height: 100%;
	}

	.back-header {
		border-bottom: 1px solid var(--color-border-subtle);
		padding-bottom: 0.875rem;
	}

	.back-title {
		font-size: 1.35rem;
		font-weight: 800;
		margin-top: 0.5rem;
		color: var(--color-text-primary);
	}

	.back-subtitle {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.section-heading {
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--movement-color, var(--color-primary));
		margin-bottom: 0.35rem;
	}

	.anecdote-text {
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.45;
		color: var(--color-text-primary);
	}

	.description-text {
		font-size: 0.925rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.back-hint {
		margin-top: auto;
		padding-top: 0.75rem;
		color: var(--color-text-muted);
		border-top: 1px dashed var(--color-border-subtle);
	}

	@container card (min-width: 540px) {
		.artwork-title {
			font-size: 1.85rem;
		}
		.flip-card-front, .flip-card-back {
			padding: 2.25rem;
		}
	}
</style>
