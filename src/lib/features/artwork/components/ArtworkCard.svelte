<script lang="ts">
	import type { Artwork, ActiveLessonView } from '$lib/types/database';
	import ArtworkVisual from './ArtworkVisual.svelte';
	import ArtworkSpecs from './ArtworkSpecs.svelte';
	import ArtworkInsight from './ArtworkInsight.svelte';
	import { browser } from '$app/environment';

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

	const lessonData = {
		get movement_name() { return (artwork as ActiveLessonView).movement_name; },
		get oklch_token() { return (artwork as ActiveLessonView).oklch_token; },
		get main_article() { return (artwork as ActiveLessonView).main_article; },
		get introduction() { return (artwork as ActiveLessonView).introduction; },
		get article_portions() { return (artwork as ActiveLessonView).article_portions; }
	};

	let displayMovementName = $derived(
		movementName !== 'Historical Art'
			? movementName
			: (lessonData.movement_name || 'Art Historique')
	);

	let displayOklchToken = $derived(
		oklchToken !== 'var(--movement-theme)'
			? oklchToken
			: (lessonData.oklch_token || 'var(--movement-theme)')
	);

	let displayAnecdote = $derived(
		article ||
			(lessonData.main_article
				? (lessonData.introduction 
					? `**${lessonData.introduction}**\n\n${lessonData.main_article}` 
					: lessonData.main_article)
				: 'Découvrez l\'histoire captivante et l\'essence historique de ce chef-d\'œuvre.')
	);

	let cardAspectRatio = $derived(artwork.aspect_ratio ? `${artwork.aspect_ratio}` : '4 / 3');

	// Delay rendering of heavy markdown insight to client side to drastically reduce initial HTML size
	let showInsight = $state(false);
	$effect(() => {
		// Use requestAnimationFrame to ensure the browser has painted the main visual (LCP) first
		requestAnimationFrame(() => {
			showInsight = true;
		});
	});
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
{:else if showInsight}
	<ArtworkInsight 
		artworkTitle={`${artwork.title} - ${artwork.artists?.name || 'Inconnu'} (${artwork.creation_date})`}
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
		background: transparent;
		border: none;
		box-shadow: none;
		overflow: visible;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
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
