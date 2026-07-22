<script lang="ts">
	import type { Artwork } from '$lib/types/database';
	import ArtworkVisual from './ArtworkVisual.svelte';
	import ArtworkSpecs from './ArtworkSpecs.svelte';
	import ArtworkInsight from './ArtworkInsight.svelte';

	interface ArtworkCardProps {
		artwork: Artwork;
		movementName?: string;
		oklchToken?: string;
		article?: string;
		isEmpty?: boolean;
	}

	let {
		artwork,
		movementName = 'Art Historique',
		oklchToken = 'var(--movement-theme)',
		article,
		isEmpty = false
	}: ArtworkCardProps = $props();

	let displayMovementName = $derived(
		movementName !== 'Historical Art'
			? movementName
			: ('nom_courant' in artwork && typeof (artwork as any).nom_courant === 'string'
					? (artwork as any).nom_courant
					: 'Art Historique')
	);

	let displayOklchToken = $derived(
		oklchToken !== 'var(--movement-theme)'
			? oklchToken
			: ('oklch_token' in artwork && typeof (artwork as any).oklch_token === 'string'
					? (artwork as any).oklch_token
					: 'var(--movement-theme)')
	);

	let displayAnecdote = $derived(
		article ||
			('article_principal' in artwork && typeof (artwork as any).article_principal === 'string'
				? ('introduction' in artwork && typeof (artwork as any).introduction === 'string' 
					? `**${(artwork as any).introduction}**\n\n${(artwork as any).article_principal}` 
					: (artwork as any).article_principal)
				: 'Découvrez l\'histoire captivante et l\'essence historique de ce chef-d\'œuvre.')
	);

	let cardAspectRatio = $derived(artwork.aspect_ratio ? `${artwork.aspect_ratio}` : '4 / 3');
</script>

<div
	class="artwork-card container-card"
	style:--movement-color={displayOklchToken}
>
	<ArtworkVisual 
		{artwork} 
		{displayMovementName} 
		{displayOklchToken} 
		{cardAspectRatio} 
	/>

	<ArtworkSpecs {artwork} />

	{#if isEmpty}
		<div class="empty-content-box">
			<p>Le contenu éditorial n'est pas encore disponible pour cette œuvre.</p>
			<a href={`/admin/oeuvres/${artwork.id}`} class="admin-redirect-btn">Ajouter le contenu</a>
		</div>
	{:else}
		<ArtworkInsight 
			artworkTitle={`${artwork.titre} - ${artwork.artiste} (${artwork.date_creation})`}
			{displayAnecdote} 
		/>
	{/if}
</div>

<style>
	.artwork-card {
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		background-color: var(--color-surface);
		border-radius: var(--radius-xl);
		border: 1.5px solid var(--movement-color, var(--color-border));
		box-shadow: var(--shadow-md);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: box-shadow 0.2s ease, border-color 0.2s ease;
	}

	.empty-content-box {
		padding: 2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		background: radial-gradient(circle at top right, var(--color-surface-elevated), var(--color-surface));
		color: var(--color-text-secondary);
	}

	.admin-redirect-btn {
		display: inline-block;
		padding: 0.6rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		font-weight: 600;
		text-decoration: none;
		transition: filter 0.2s ease;
	}

	.admin-redirect-btn:hover {
		filter: brightness(1.1);
	}
</style>
