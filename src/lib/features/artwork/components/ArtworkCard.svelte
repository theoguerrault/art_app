<script lang="ts">
	import type { Artwork } from '$lib/types/database';
	import ArtworkVisual from './ArtworkVisual.svelte';
	import ArtworkSpecs from './ArtworkSpecs.svelte';
	import ArtworkInsight from './ArtworkInsight.svelte';

	interface ArtworkCardProps {
		artwork: Artwork;
		movementName?: string;
		oklchToken?: string;
		anecdote?: string;
		description?: string;
	}

	let {
		artwork,
		movementName = 'Art Historique',
		oklchToken = 'var(--movement-theme)',
		anecdote,
		description
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
		anecdote ||
			('anecdote_accroche' in artwork && typeof (artwork as any).anecdote_accroche === 'string'
				? (artwork as any).anecdote_accroche
				: 'Découvrez l\'histoire captivante et l\'essence historique de ce chef-d\'œuvre.')
	);

	let displayDescription = $derived(
		description ||
			('anecdote_technique' in artwork && typeof (artwork as any).anecdote_technique === 'string'
				? (artwork as any).anecdote_technique
				: 'Examinez l\'exécution technique, les règles de composition et les avancées artistiques.')
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

	<ArtworkInsight 
		{displayAnecdote} 
		{displayDescription} 
	/>
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
</style>
