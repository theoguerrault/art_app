<script lang="ts">
	import type { PageData } from './$types';
	import type { ActiveLessonView } from '$lib/types/database';
	import ArtworkCard from '$lib/features/artwork/components/ArtworkCard.svelte';
	import ArtworkDetailHeader from '$lib/features/artwork/components/ArtworkDetailHeader.svelte';
	import GlossaryBottomSheet from '$lib/components/ui/GlossaryBottomSheet.svelte';
	import { Palette } from 'phosphor-svelte';
	import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
	import { apiClient } from '$lib/utils/api';

	let { data }: { data: PageData } = $props();

	// Only show the artwork if it's 100% verified
	let lesson = $derived<ActiveLessonView | null>(
		data.lesson && (data.lesson as ActiveLessonView).verification_status === 'VERIFIED'
			? (data.lesson as ActiveLessonView)
			: null
	);

	let isFavorite = $state(data.isFavorite ?? false);

	// Sync from local cache when offline (no server fetch in component)
	$effect(() => {
		(async () => {
			if (!lesson || typeof window === 'undefined') return;
			const cacheKey = 'user_favorites_cache';
			const favCache = await readFromLocalCache(cacheKey, 'favorites');
			const cached = favCache ? favCache.data : [];
			if (cached.includes(lesson.id)) {
				isFavorite = true;
			}
		})();
	});

	async function toggleFavorite() {
		if (!lesson) return;
		isFavorite = !isFavorite;
		const res = await apiClient.post('/api/favorites', { id_oeuvre: lesson.id });
		if (!res.ok) {
			isFavorite = !isFavorite;
		} else {
			const cacheKey = 'user_favorites_cache';
			const favCache = await readFromLocalCache(cacheKey, 'favorites');
			let cached = favCache ? favCache.data : [];
			if (isFavorite && !cached.includes(lesson.id)) cached.push(lesson.id);
			if (!isFavorite) cached = cached.filter((id: number) => id !== lesson.id);
			await saveToLocalCache(cacheKey, { id: 'favorites', data: cached });
		}
	}
	let glossaryOpen = $state(false);
	let glossaryTitle = $state('');
	let glossarySubtitle = $state('');
	let glossaryContent = $state('');

	function openGlossary(type: 'artiste' | 'courant') {
		if (!lesson) return;
		if (type === 'artiste' && lesson.glossary?.artiste_description) {
			glossaryTitle = lesson.artistes?.nom || 'Artiste';
			glossarySubtitle = 'Artiste';
			glossaryContent = lesson.glossary.artiste_description;
			glossaryOpen = true;
		} else if (type === 'courant' && lesson.glossary?.courant_description) {
			glossaryTitle = lesson.nom_courant;
			glossarySubtitle = 'Mouvement Artistique';
			glossaryContent = lesson.glossary.courant_description;
			glossaryOpen = true;
		}
	}

	function handleOpenCourant() {
		openGlossary('courant');
	}

	function handleOpenArtiste() {
		openGlossary('artiste');
	}

	function extractHue(oklchToken: string | undefined): number {
		if (!oklchToken) return 45;
		const matches = oklchToken.match(/[\d.]+/g);
		if (matches && matches.length >= 3) {
			return parseFloat(matches[2]);
		}
		return 45;
	}

	$effect(() => {
		if (lesson) {
			const hue = extractHue(lesson.oklch_token);
			document.documentElement.style.setProperty('--artwork-hue', hue.toString());
		} else {
			document.documentElement.style.setProperty('--artwork-hue', '45');
		}
	});
</script>

<div class="today-view">

	<header class="today-header">
		<div class="date-badge">
			<span>À la une aujourd'hui</span>
		</div>
		<h1 class="page-title">Découverte Quotidienne</h1>
		<p class="page-subtitle">Explorez l'œuvre du jour et plongez dans l'histoire de l'art.</p>
	</header>

	{#if lesson}
		<section class="card-section">
			<ArtworkDetailHeader
				artwork={lesson}
				{isFavorite}
				onToggleFavorite={toggleFavorite}
				onOpenCourant={handleOpenCourant}
				onOpenArtiste={handleOpenArtiste}
			/>
			<ArtworkCard
				artwork={lesson}
				movementName={lesson.nom_courant}
				oklchToken={lesson.oklch_token}
				article={lesson.article_principal}
			/>
		</section>
	{:else}
		<div class="empty-state">
			<span class="empty-icon"><Palette size={48} weight="fill" /></span>
			<h3>Tout est à jour !</h3>
			<p>Aucune œuvre disponible pour le moment. Visitez le catalogue pour explorer les mouvements artistiques.</p>
			<a data-sveltekit-preload-data="hover" href="/catalogue" data-sveltekit-prefetch class="cta-link">Explorer le catalogue →</a>
		</div>
	{/if}

	<GlossaryBottomSheet
		bind:isOpen={glossaryOpen}
		title={glossaryTitle}
		subtitle={glossarySubtitle}
		content={glossaryContent}
	/>
</div>

<style>
	.today-view {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		padding-bottom: 2rem;
	}

	.today-header {
		text-align: center;
		margin-top: 0.5rem;
	}

	.date-badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.35rem 0.8rem;
		border-radius: 9999px;
		background-color: var(--color-primary-light);
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.page-title {
		font-size: 2.1rem;
		font-weight: 800;
		line-height: 1.15;
		color: var(--color-text-primary);
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		max-width: 480px;
		margin: 0.35rem auto 0;
	}

	.card-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* ── Empty state ── */
	.empty-state {
		text-align: center;
		padding: 3.5rem 1.5rem;
		background-color: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		margin-top: 1rem;
	}

	.empty-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
		color: var(--color-primary);
	}

	.empty-state h3 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		max-width: 360px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-pill);
		background-color: var(--color-primary);
		color: oklch(0.99 0 0);
		font-weight: 700;
		text-decoration: none;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.cta-link:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>
