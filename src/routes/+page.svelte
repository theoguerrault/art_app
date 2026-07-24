<script lang="ts">
	import type { PageData } from './$types';
	import ArtworkCard from '$lib/features/artwork/components/ArtworkCard.svelte';
	import GlossaryBottomSheet from '$lib/components/ui/GlossaryBottomSheet.svelte';
	import { Palette, Heart, SealCheck } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';

	let { data }: { data: PageData } = $props();

	// Only show the artwork if it's 100% verified
	let lesson = $derived(
		data.lesson && (data.lesson as any).verification_status === 'VERIFIED' ? data.lesson : null
	);

	let isFavorite = $state(false);

	let glossaryOpen = $state(false);
	let glossaryTitle = $state('');
	let glossarySubtitle = $state('');
	let glossaryContent = $state('');

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
					const resData = await res.json();
					isFavorite = resData.favorites.includes(lesson.id);
					await saveToLocalCache(cacheKey, { id: 'favorites', data: resData.favorites });
				}
			}
		}
	});

	async function toggleFavorite() {
		if (!lesson) return;
		isFavorite = !isFavorite;
		const res = await fetch('/api/favorites', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id_oeuvre: lesson.id })
		});
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

	function openGlossary(type: 'artiste' | 'courant') {
		const lessonData = lesson as any;
		if (type === 'artiste' && lessonData?.glossary?.artiste_description) {
			glossaryTitle = lesson!.artistes?.nom || 'Artiste';
			glossarySubtitle = 'Artiste';
			glossaryContent = lessonData.glossary.artiste_description;
			glossaryOpen = true;
		} else if (type === 'courant' && lessonData?.glossary?.courant_description) {
			glossaryTitle = (lesson as any).nom_courant;
			glossarySubtitle = 'Mouvement Artistique';
			glossaryContent = lessonData.glossary.courant_description;
			glossaryOpen = true;
		}
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
			const hue = extractHue((lesson as any).oklch_token);
			document.documentElement.style.setProperty('--artwork-hue', hue.toString());
		} else {
			document.documentElement.style.setProperty('--artwork-hue', '45');
		}
	});
</script>

<div class="today-view">
	{#if lesson && ((lesson as any).image_url_hd || lesson.image_url_thumb)}
		<img
			src={(lesson as any).image_url_hd || lesson.image_url_thumb}
			alt=""
			class="dynamic-bg-glow"
			aria-hidden="true"
		/>
	{/if}
	<header class="today-header">
		<div class="date-badge">
			<span>À la une aujourd'hui</span>
		</div>
		<h1 class="page-title">Découverte Quotidienne</h1>
		<p class="page-subtitle">Explorez l'œuvre du jour et plongez dans l'histoire de l'art.</p>
	</header>

	{#if lesson}
		<section class="card-section">
			<div class="detail-header">
				{#if (lesson as any).glossary?.courant_description}
					<button
						type="button"
						class="movement-tag clickable"
						style:background-color={(lesson as any).oklch_token}
						onclick={() => openGlossary('courant')}
					>
						{(lesson as any).nom_courant}
					</button>
				{:else}
					<span class="movement-tag" style:background-color={(lesson as any).oklch_token}>
						{(lesson as any).nom_courant}
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
				<h2 class="artwork-title">{lesson.titre}</h2>
				<p class="artwork-meta">
					{#if (lesson as any).glossary?.artiste_description}
						<button type="button" class="artist-link" onclick={() => openGlossary('artiste')}>{lesson.artistes?.nom}</button>
					{:else}
						{lesson.artistes?.nom}
					{/if}
					({lesson.date_creation})
				</p>
			</div>
			<ArtworkCard
				artwork={lesson}
				movementName={(lesson as any).nom_courant}
				oklchToken={(lesson as any).oklch_token}
				article={(lesson as any).article_principal}
			/>
		</section>
	{:else}
		<div class="empty-state">
			<span class="empty-icon"><Palette size={48} weight="fill" /></span>
			<h3>Tout est à jour !</h3>
			<p>Aucune œuvre disponible pour le moment. Visitez le catalogue pour explorer les mouvements artistiques.</p>
			<a href="/catalogue" class="cta-link">Explorer le catalogue →</a>
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

	/* ── Detail-style header (matches [slug]/+page.svelte) ── */
	.detail-header {
		text-align: center;
		margin-bottom: 1.5rem;
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
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.movement-tag.clickable:hover {
		transform: scale(1.05);
		opacity: 0.9;
	}

	.artwork-title {
		font-family: 'Instrument Serif', serif;
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
