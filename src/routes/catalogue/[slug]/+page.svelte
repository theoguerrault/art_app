<script lang="ts">
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import ArtworkCard from "$lib/features/artwork/components/ArtworkCard.svelte";
	import GlossaryBottomSheet from "$lib/components/ui/GlossaryBottomSheet.svelte";
	import {
		ArrowLeft,
		Lightbulb,
		Brain,
		X,
		Bank,
		PaintBrush,
		Ruler,
		Tag,
		Calendar,
		User,
		Info,
		Compass,
		BookOpen,
		Eye,
		Article,
		Heart,
		SealCheck
	} from "phosphor-svelte";
	import { supabase } from "$lib/supabase/client";
	import {
		queueOfflineAnswer,
		saveToLocalCache,
		readFromLocalCache,
	} from "$lib/offline/storage";
	import { parseMarkdown } from '$lib/utils/markdown';

	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	let lesson = $derived(data.lesson);
	let progress = $derived(data.progress);

	let glossaryOpen = $state(false);
	let glossaryTitle = $state('');
	let glossarySubtitle = $state('');
	let glossaryContent = $state('');

	let isFavorite = $state(false);

	onMount(async () => {
		if (lesson && typeof window !== 'undefined') {
			const cacheKey = 'user_favorites_cache';
			const favCache = await readFromLocalCache(cacheKey, 'favorites');
			const cached = favCache ? favCache.data : [];
			if (cached.includes(lesson.id)) {
				isFavorite = true;
			} else if (navigator.onLine) {
				const res = await fetch('/api/favorites');
				if (res.ok) {
					const data = await res.json();
					isFavorite = data.favorites.includes(lesson.id);
					await saveToLocalCache(cacheKey, { id: 'favorites', data: data.favorites });
				}
			}
		}
	});

	async function toggleFavorite() {
		isFavorite = !isFavorite; // Optimistic
		const res = await fetch('/api/favorites', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id_oeuvre: lesson.id })
		});
		if (!res.ok) {
			isFavorite = !isFavorite; // Revert
		} else {
			const cacheKey = 'user_favorites_cache';
			const favCache = await readFromLocalCache(cacheKey, 'favorites');
			let cached = favCache ? favCache.data : [];
			if (isFavorite && !cached.includes(lesson.id)) cached.push(lesson.id);
			if (!isFavorite) cached = cached.filter((id: number) => id !== lesson.id);
			await saveToLocalCache(cacheKey, { id: 'favorites', data: cached });
		}
	}

	function openGlossary(type: 'artiste' | 'courant') {
		const lessonData = lesson as any;
		if (type === 'artiste' && lessonData.glossary?.artiste_description) {
			glossaryTitle = lesson.artistes?.nom || 'Artiste';
			glossarySubtitle = 'Artiste';
			glossaryContent = lessonData.glossary.artiste_description;
			glossaryOpen = true;
		} else if (type === 'courant' && lessonData.glossary?.courant_description) {
			glossaryTitle = lesson.nom_courant;
			glossarySubtitle = 'Mouvement Artistique';
			glossaryContent = lessonData.glossary.courant_description;
			glossaryOpen = true;
		}
	}

	let dynamicArticlePrincipal = $state<string | null>(null);
	
	let isContentEmpty = $derived(isMissingOrPlaceholder(dynamicArticlePrincipal || lesson.article_principal));

	let isFetchingDescription = $state(false);
	
	let lastInitializedSlug = '';

	function isMissingOrPlaceholder(str: string | null | undefined): boolean {
		if (lesson && (lesson as any).article_portions && (lesson as any).article_portions.length > 0) return false;
		if (!str || str.trim() === '') return true;
		const placeholders = [
			'Explorez l\'histoire profonde',
			'Analysez la maîtrise technique',
			'Découvrez les détails cachés',
			'Contenu en cours de rédaction',
		];
		return placeholders.some((p) => str.includes(p));
	}

	function isMissingOrPlaceholderArray(arr: string[] | null | undefined): boolean {
		if (!arr || arr.length === 0) return true;
		return arr.some(str => isMissingOrPlaceholder(str));
	}

	function extractHue(oklch: string): number {
		const match = oklch.match(/oklch\([\d.]+\s+[\d.]+\s+([\d.]+)\)/);
		if (match && match[1]) {
			return parseFloat(match[1]);
		}
		const matches = oklch.match(/oklch\(\s*(?:calc\()?[^,)]+(?:\))?\s*,\s*[^,]+\s*,\s*([\d.]+)\s*\)/);
		if (matches && matches[1]) {
			return parseFloat(matches[1]);
		}
		return 45;
	}

	$effect(() => {
		if (!lesson || typeof window === 'undefined') return;

		// React to lesson.slug changes ONLY
		const currentSlug = lesson.slug;

		untrack(() => {
			if (currentSlug !== lastInitializedSlug) {
				lastInitializedSlug = currentSlug;
				
				// 1. Initialize local states from the new lesson
				const hue = extractHue(lesson.oklch_token);
				document.documentElement.style.setProperty("--artwork-hue", hue.toString());

				dynamicArticlePrincipal = !isMissingOrPlaceholder(lesson.article_principal) ? lesson.article_principal : null;
				
				// 2. Handle Description Fetch
				if (dynamicArticlePrincipal === null && navigator.onLine) {
					isFetchingDescription = true;
					fetch(`/api/artwork-description/${encodeURIComponent(lesson.slug)}`)
						.then((res) => res.json())
						.then((data) => {
							if (data?.article_principal) dynamicArticlePrincipal = data.article_principal;
						})
						.catch((err) => console.warn('[DetailPage] Failed to fetch descriptions:', err))
						.finally(() => {
							isFetchingDescription = false;
						});
				}
			}
		});
	});


</script>

<div class="detail-view">
	<nav class="back-nav">
		<a href="/catalogue" class="back-link">
			<span>Retour au catalogue</span>
		</a>
	</nav>

	<header class="detail-header">
		{#if (lesson as any).glossary?.courant_description}
			<button type="button" class="movement-tag clickable" style:background-color={lesson.oklch_token} onclick={() => openGlossary('courant')}>
				{lesson.nom_courant}
			</button>
		{:else}
			<span class="movement-tag" style:background-color={lesson.oklch_token}>
				{lesson.nom_courant}
			</span>
		{/if}
		<div class="actions-row">
			{#if (lesson as any).verification_status === 'VERIFIED'}
				<span class="verified-pill" title="Contenu vérifié à 100%">
					<SealCheck size={22} weight="fill" />
				</span>
			{/if}
			<button class="favorite-btn" onclick={toggleFavorite} aria-label="Toggle Favorite">
				<Heart size={24} weight={isFavorite ? 'fill' : 'bold'} color={isFavorite ? '#ff3b30' : 'currentColor'} />
			</button>
		</div>
		<h1 class="artwork-title">{lesson.titre}</h1>
		<p class="artwork-meta">
			{#if (lesson as any).glossary?.artiste_description}
				<button type="button" class="artist-link" onclick={() => openGlossary('artiste')}>{lesson.artistes?.nom}</button>
			{:else}
				{lesson.artistes?.nom}
			{/if}
			({lesson.date_creation})
		</p>
	</header>

	<section class="card-display">
		<ArtworkCard
			artwork={lesson}
			movementName={lesson.nom_courant}
			oklchToken={lesson.oklch_token}
			article={dynamicArticlePrincipal || lesson.article_principal}
			isEmpty={isContentEmpty}
		/>
	</section>

	{#if isContentEmpty || (lesson as any).verification_status !== 'VERIFIED'}
		<div class="admin-quick-action">
			<p>{isContentEmpty ? "Ce contenu n'est pas encore généré." : "Ce contenu est en attente de validation."}</p>
			<a href={`/admin/oeuvres/${lesson.id}`} class="admin-text-link">
				Éditer dans l'Admin →
			</a>
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
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 3rem;
	}

	.back-nav {
		margin-top: 0.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.detail-header {
		text-align: center;
	}

	.movement-tag {
		display: inline-block;
		padding: 0.35rem 0.85rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-bg);
		margin-bottom: 0.75rem;
		border: none;
	}

	.movement-tag.clickable {
		cursor: pointer;
		position: relative;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.movement-tag.clickable:hover {
		transform: scale(1.05);
		opacity: 0.9;
	}

	.artwork-title {
		font-family: "Instrument Serif", serif;
		font-size: 2.5rem;
		font-weight: 400;
		margin: 0 0 0.5rem 0;
		color: var(--color-text-primary);
		line-height: 1.1;
	}

	.actions-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	/* Remove the orphan rule — artwork-title is now standalone */

	.verified-pill {
		color: var(--color-success);
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.favorite-btn {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: transform 0.2s ease, color 0.2s ease;
		flex-shrink: 0;
	}

	.favorite-btn:hover {
		transform: scale(1.1);
	}
	.favorite-btn:active {
		transform: scale(0.95);
	}

	.artwork-meta {
		font-size: 1rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.artist-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--color-text-primary);
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 4px;
		transition: color 0.2s ease;
	}

	.artist-link:hover {
		color: var(--color-primary);
	}



	.quiz-container {
		text-align: left;
		background: var(--color-surface);
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		animation: fadeIn 0.25s ease;
	}

	.quiz-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@media (max-width: 600px) {
		.detail-view {
			margin-left: -1.25rem;
			margin-right: -1.25rem;
		}
		
		.back-nav, .detail-header, .quiz-container, :global(.glossary-content) {
			padding-left: 1.25rem;
			padding-right: 1.25rem;
		}

		:global(.artwork-card) {
			border-radius: 0 !important;
			border-left: none !important;
			border-right: none !important;
		}
	}

	.admin-quick-action {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin: 1rem auto 2rem;
	}

	.admin-quick-action p {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.admin-text-link {
		color: var(--color-primary);
		font-weight: 700;
		font-size: 0.9rem;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.admin-text-link:hover {
		opacity: 0.8;
		text-decoration: underline;
	}
</style>
