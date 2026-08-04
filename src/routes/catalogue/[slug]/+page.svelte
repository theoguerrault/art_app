<script lang="ts">
	let isFetchingDescription = $state(false);

	import type { PageData } from "./$types";
	import ArtworkCard from "$lib/features/artwork/components/ArtworkCard.svelte";
	import ArtworkDetailHeader from '$lib/features/artwork/components/ArtworkDetailHeader.svelte';
	import GlossaryBottomSheet from "$lib/components/ui/GlossaryBottomSheet.svelte";

	import {
		saveToLocalCache,
		readFromLocalCache,
	} from "$lib/offline/storage";
	import { apiClient } from '$lib/utils/api';

	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	let lesson = $derived(data.lesson);


	let glossaryOpen = $state(false);
	let glossaryTitle = $state('');
	let glossarySubtitle = $state('');
	let glossaryContent = $state('');

	let isFavorite = $state(false);

	// Check local cache only — no component-level GET fetch
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
		isFavorite = !isFavorite; // Optimistic
		const res = await apiClient.post('/api/favorites', { id_oeuvre: lesson.id });
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

	function handleOpenCourant() {
		openGlossary('courant');
	}

	function handleOpenArtiste() {
		openGlossary('artiste');
	}

	let dynamicArticlePrincipal = $state<string | null>(null);
	
	let isContentEmpty = $derived(isMissingOrPlaceholder(dynamicArticlePrincipal || lesson.article_principal));


	
	let lastInitializedSlug = '';

	function isMissingOrPlaceholder(str: string | null | undefined): boolean {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
					apiClient.request(`/api/artwork-description/${encodeURIComponent(lesson.slug)}`)
						.then((res) => res.json())
						.then((data) => {
							if (data?.article_principal) dynamicArticlePrincipal = data.article_principal;
						})
						.catch((err) => void('[DetailPage] Failed to fetch descriptions:', err))
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
		<a data-sveltekit-preload-data="hover" href="/catalogue" data-sveltekit-prefetch class="back-link">
			<span>Retour au catalogue</span>
		</a>
	</nav>

	<ArtworkDetailHeader
		artwork={lesson}
		{isFavorite}
		onToggleFavorite={toggleFavorite}
		onOpenCourant={handleOpenCourant}
		onOpenArtiste={handleOpenArtiste}
	/>

	<section class="card-display">
		<ArtworkCard
			artwork={lesson}
			movementName={lesson.nom_courant}
			oklchToken={lesson.oklch_token}
			article={dynamicArticlePrincipal || lesson.article_principal}
			isEmpty={isContentEmpty}
		/>
	</section>

	{#if isContentEmpty || lesson.verification_status !== 'VERIFIED'}
		<div class="admin-quick-action">
			<p>{isContentEmpty ? "Ce contenu n'est pas encore généré." : "Ce contenu est en attente de validation."}</p>
			<a data-sveltekit-preload-data="hover" href={`/admin/oeuvres/${lesson.id}`} class="admin-text-link">
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

	.card-display {
		display: flex;
		flex-direction: column;
		gap: 2rem;
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
		
		.back-nav, :global(.glossary-content) {
			padding-left: 1.25rem;
			padding-right: 1.25rem;
		}

		:global(.artwork-card) {
			border-radius: 0 ;
			border-left: none ;
			border-right: none ;
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
