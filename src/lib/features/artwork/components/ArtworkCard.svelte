<script lang="ts">
	import type { Artwork, ActiveLessonView } from '$lib/types/database';
	import ArtworkVisual from './ArtworkVisual.svelte';
	import ArtworkSpecs from './ArtworkSpecs.svelte';
	import ArtworkInsight from './ArtworkInsight.svelte';

	interface ArtworkCardProps {
		artwork: Artwork | ActiveLessonView;
		movementName?: string;
		oklchToken?: string;
		article?: string;
		isEmpty?: boolean;
		hideDescription?: boolean;
		eager?: boolean;
	}

	let {
		artwork,
		movementName = 'Art Historique',
		oklchToken = 'var(--movement-theme)',
		article,
		hideDescription = false,
		eager = true
	}: ArtworkCardProps = $props();

	const lessonData = artwork as ActiveLessonView;

	let displayMovementName = $derived(
		movementName !== 'Historical Art'
			? movementName
			: (lessonData.nom_courant || 'Art Historique')
	);

	let displayOklchToken = $derived(
		oklchToken !== 'var(--movement-theme)'
			? oklchToken
			: (lessonData.oklch_token || 'var(--movement-theme)')
	);

	let displayAnecdote = $derived(
		article ||
			(lessonData.article_principal
				? (lessonData.introduction 
					? `**${lessonData.introduction}**\n\n${lessonData.article_principal}` 
					: lessonData.article_principal)
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
		{eager} 
	/>

	<ArtworkSpecs {artwork} />
</div>

{#if hideDescription}
	<div class="hidden-description-box">
		<p>La description est masquée pendant le quiz.</p>
	</div>
{:else}
	<ArtworkInsight 
		artworkTitle={`${artwork.titre} - ${artwork.artistes?.nom || 'Inconnu'} (${artwork.date_creation})`}
		introduction={lessonData.introduction ?? undefined}
		portions={lessonData.article_portions || []}
		articlePrincipal={displayAnecdote} 
	/>
{/if}

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



	.hidden-description-box {
		padding: 3rem 2rem;
		text-align: center;
		background: radial-gradient(circle at center, var(--color-surface-hover), var(--color-surface));
		color: var(--color-text-secondary);
		font-style: italic;
		border-top: 1px dashed var(--color-border);
	}
</style>
