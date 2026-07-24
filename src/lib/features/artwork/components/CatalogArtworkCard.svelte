<script lang="ts">
	import { Heart, Check } from 'phosphor-svelte';

	interface Props {
		art: any;
		isFavorite: boolean;
		isDiscovered: boolean;
	}

	let { art, isFavorite, isDiscovered }: Props = $props();
	
	let loaded = $state(false);
</script>

<a href="/catalogue/{art.slug || art.id}" class="artwork-card-minimal" aria-label="Voir {art.titre}">
	<div class="thumb-wrapper" class:loading={!loaded}>
		<img 
			src={art.image_url_thumb} 
			alt={art.titre} 
			loading="lazy" 
			decoding="async"
			onload={() => loaded = true}
			class:loaded
		/>
		<div class="indicators">
			{#if isFavorite}
				<span class="favorite-indicator" title="Favori">
					<Heart size={14} weight="fill" />
				</span>
			{/if}
			{#if isDiscovered}
				<span class="discovered-indicator" title="Découverte">
					<Check size={14} weight="regular" />
				</span>
			{/if}
		</div>
	</div>
	<div class="art-info">
		<h3 class="art-title">{art.titre}</h3>
		<p class="art-artist">{art.artistes?.nom}</p>
	</div>
</a>

<style>
	.artwork-card-minimal {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		gap: 0.5rem;
		border-radius: 8px;
		transition: opacity 0.2s ease;
	}

	.artwork-card-minimal:active {
		opacity: 0.6;
	}

	.thumb-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 12px;
		overflow: hidden;
		background-color: var(--color-border-subtle);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	}

	.thumb-wrapper.loading::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.08),
			transparent
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite linear;
		z-index: 1;
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	.thumb-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
		opacity: 0;
	}

	.thumb-wrapper img.loaded {
		opacity: 1;
	}

	/* Micro-interaction on desktop */
	@media (hover: hover) {
		.artwork-card-minimal:hover .thumb-wrapper img {
			transform: scale(1.05);
		}
	}

	.indicators {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		gap: 0.4rem;
	}

	.discovered-indicator, .favorite-indicator {
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-success);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		box-shadow: 0 2px 5px rgba(0,0,0,0.15);
	}

	.favorite-indicator {
		color: #ff3b30;
	}

	:global([data-theme="dark"]) .discovered-indicator,
	:global([data-theme="dark"]) .favorite-indicator {
		background: rgba(0, 0, 0, 0.6);
	}

	.art-info {
		display: flex;
		flex-direction: column;
		padding: 0 0.15rem;
	}

	.art-title {
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.25;
		color: var(--color-text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.art-artist {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 0.15rem;
	}
</style>
