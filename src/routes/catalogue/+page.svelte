<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import type { PageData } from './$types';
	import CatalogHeader from './components/CatalogHeader.svelte';
	import CatalogMovementSection from './components/CatalogMovementSection.svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let showFavoritesOnly = $state(false);
	let showLikesOnly = $state(false);
	let showDislikesOnly = $state(false);
	let selectedMovements = $state<number[]>([]);

	let scrollY = $state(0);
	let lastScrollY = $state(0);
	let headerVisible = $state(true);
	let isRestored = $state(false);

	function performScrollTargeting(lastId: string | null, lastSlug: string | null, raw: string | null): boolean {
		if (lastId) {
			const el = document.getElementById(`artwork-${lastId}`);
			if (el) {
				el.scrollIntoView({ block: 'center', behavior: 'instant' });
				return true;
			}
		}
		if (lastSlug) {
			const el = document.querySelector(`[data-slug="${lastSlug}"]`);
			if (el) {
				el.scrollIntoView({ block: 'center', behavior: 'instant' });
				return true;
			}
		}
		if (raw) {
			try {
				const saved = JSON.parse(raw);
				if (typeof saved.scrollY === 'number' && saved.scrollY > 0) {
					window.scrollTo({ top: saved.scrollY, behavior: 'instant' });
					return true;
				}
			} catch (e) {}
		}
		return false;
	}

	afterNavigate(() => {
		let raw: string | null = null;
		let lastId: string | null = null;
		let lastSlug: string | null = null;

		try {
			raw = sessionStorage.getItem('catalogue_persisted_state');
			if (raw) {
				const saved = JSON.parse(raw);
				if (typeof saved.searchQuery === 'string') searchQuery = saved.searchQuery;
				if (typeof saved.showFavoritesOnly === 'boolean') showFavoritesOnly = saved.showFavoritesOnly;
				if (typeof saved.showLikesOnly === 'boolean') showLikesOnly = saved.showLikesOnly;
				if (typeof saved.showDislikesOnly === 'boolean') showDislikesOnly = saved.showDislikesOnly;
				if (Array.isArray(saved.selectedMovements)) selectedMovements = saved.selectedMovements;
			}
			lastId = sessionStorage.getItem('catalogue_last_clicked_id');
			lastSlug = sessionStorage.getItem('catalogue_last_clicked_slug');
		} catch (e) {}

		isRestored = true;

		tick().then(() => {
			requestAnimationFrame(() => {
				performScrollTargeting(lastId, lastSlug, raw);
				try {
					sessionStorage.removeItem('catalogue_last_clicked_id');
					sessionStorage.removeItem('catalogue_last_clicked_slug');
				} catch (e) {}
			});
		});
	});

	$effect(() => {
		if (typeof window === 'undefined' || !isRestored) return;
		const stateToSave = {
			searchQuery,
			showFavoritesOnly,
			showLikesOnly,
			showDislikesOnly,
			selectedMovements,
			scrollY
		};

		try {
			sessionStorage.setItem('catalogue_persisted_state', JSON.stringify(stateToSave));
		} catch (e) {}
	});

	$effect(() => {
		if (scrollY < lastScrollY || scrollY < 50) {
			headerVisible = true;
		} else if (scrollY > lastScrollY && scrollY > 50) {
			headerVisible = false;
		}
		lastScrollY = scrollY;
	});

	function toggleMovement(id: number) {
		if (selectedMovements.includes(id)) {
			selectedMovements = selectedMovements.filter(m => m !== id);
		} else {
			selectedMovements = [...selectedMovements, id];
		}
	}

	function toggleFavoritesFilter() {
		showFavoritesOnly = !showFavoritesOnly;
		if (showFavoritesOnly) { showLikesOnly = false; showDislikesOnly = false; }
	}

	function toggleLikesFilter() {
		showLikesOnly = !showLikesOnly;
		if (showLikesOnly) { showFavoritesOnly = false; showDislikesOnly = false; }
	}

	function toggleDislikesFilter() {
		showDislikesOnly = !showDislikesOnly;
		if (showDislikesOnly) { showFavoritesOnly = false; showLikesOnly = false; }
	}

	function computeProgressSet(progressList: { artwork_id?: number; box_level?: number; consecutive_correct?: number }[]) {
		const set = new Set<number>();
		for (const p of progressList || []) {
			if (p && p.artwork_id != null && ((p.box_level ?? 0) > 1 || (p.consecutive_correct && (p.consecutive_correct ?? 0) > 0))) {
				set.add(p.artwork_id);
			}
		}
		return set;
	}
	let progressSet = $derived(computeProgressSet(data.progressList));

	function computeFavoritesSet(favoritesList: number[]) {
		return new Set<number>(favoritesList || []);
	}
	let favoritesSet = $derived(computeFavoritesSet(data.favoritesList));

	function computeLikesSet(list: number[]) { return new Set<number>(list || []); }
	function computeDislikesSet(list: number[]) { return new Set<number>(list || []); }
	let likesSet = $derived(computeLikesSet(data.likesList));
	let dislikesSet = $derived(computeDislikesSet(data.dislikesList));

	function computeNormalizedQuery(query: string) {
		return query.trim().toLowerCase();
	}
	let normalizedQuery = $derived(computeNormalizedQuery(searchQuery));

	type MovementType = { id: number; name?: string; century?: string };
	type ArtworkType = { id?: number; movement_id?: number; title?: string; artists?: { name?: string }; image_url_thumb?: string | null; image_url_full?: string | null; slug?: string };

	function computeGroupedMovements(
		movements: MovementType[],
		artworks: ArtworkType[],
		favSet: Set<number>,
		likSet: Set<number>,
		disSet: Set<number>,
		activeMovements: number[],
		query: string,
		qLower: string,
		showFavs: boolean,
		showLikes: boolean,
		showDislikes: boolean
	) {
		const groups = new Map<number, { movement: MovementType; items: ArtworkType[] }>();

		for (const m of movements || []) {
			groups.set(m.id, { movement: m, items: [] });
		}

		let filtered = artworks || [];

		if (showFavs) {
			filtered = filtered.filter(a => a.id && favSet.has(a.id));
		} else if (showLikes) {
			filtered = filtered.filter(a => a.id && likSet.has(a.id));
		} else if (showDislikes) {
			filtered = filtered.filter(a => a.id && disSet.has(a.id));
		}

		if (activeMovements.length > 0) {
			filtered = filtered.filter(a => a.movement_id && activeMovements.includes(a.movement_id));
		}
		if (query.trim()) {
			filtered = filtered.filter(
				(a) =>
					(a.title && a.title.toLowerCase().includes(qLower)) ||
					(a.artists?.name && a.artists.name.toLowerCase().includes(qLower))
			);
		}

		for (const art of filtered) {
			if (art.movement_id === undefined) continue;
			const grp = groups.get(art.movement_id);
			if (grp) {
				grp.items.push(art);
			}
		}

		return Array.from(groups.values()).filter((g) => {
			if (activeMovements.length > 0 && !activeMovements.includes(g.movement.id)) return false;
			return g.items.length > 0;
		});
	}
	let groupedMovements = $derived(computeGroupedMovements(data.movements, data.artworks, favoritesSet, likesSet, dislikesSet, selectedMovements, searchQuery, normalizedQuery, showFavoritesOnly, showLikesOnly, showDislikesOnly));

	function resetSearch() {
		searchQuery = '';
		showFavoritesOnly = false;
		showLikesOnly = false;
		showDislikesOnly = false;
		selectedMovements = [];
		try {
			sessionStorage.removeItem('catalogue_persisted_state');
		} catch (e) {}
	}
</script>

<svelte:window bind:scrollY={scrollY} />

<div class="catalog-view">
	<CatalogHeader 
		bind:searchQuery 
		{showFavoritesOnly}
		{showLikesOnly}
		{showDislikesOnly}
		onToggleFavorites={toggleFavoritesFilter}
		onToggleLikes={toggleLikesFilter}
		onToggleDislikes={toggleDislikesFilter}
		onResetFilters={resetSearch}
		bind:selectedMovements 
		{headerVisible} 
		movements={data.movements || []} 
		{toggleMovement} 
	/>

	<div class="movements-list" class:header-hidden={!headerVisible}>
		{#each groupedMovements as group, gIndex (group.movement.id)}
			<CatalogMovementSection
				{group}
				{gIndex}
				{favoritesSet}
				{progressSet}
				{likesSet}
				{dislikesSet}
				initiallyVisible={gIndex <= 1}
			/>
		{/each}

		{#if groupedMovements.length === 0}
			<div class="empty-search">
				<p>Aucune œuvre ne correspond à vos filtres actuels.</p>
				<button type="button" class="reset-btn" onclick={resetSearch}>
					Réinitialiser les filtres
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.catalog-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-bottom: 2rem;
	}

	.movements-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 0;
	}

	.empty-search {
		text-align: center;
		padding: 4rem 1.5rem;
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		margin-top: 1rem;
	}

	.empty-search p {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}

	.reset-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary);
		color: #000000;
		border-radius: var(--radius-pill);
		font-weight: 700;
		font-size: 0.9rem;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		min-height: 44px;
	}

	.reset-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}
</style>
