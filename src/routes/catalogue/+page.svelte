<script lang="ts">
	let isOnline = $state(true);

	import type { PageData } from './$types';
	import LazySection from '$lib/components/LazySection.svelte';
	import CatalogArtworkCard from '$lib/features/artwork/components/CatalogArtworkCard.svelte';
	import CatalogHeader from './components/CatalogHeader.svelte';

	let { data }: { data: PageData } = $props();



	let searchQuery = $state('');
	let showFavoritesOnly = $state(false);
	let selectedMovements = $state<number[]>([]);

	let scrollY = $state(0);
	let lastScrollY = $state(0);
	let headerVisible = $state(true);

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
	}

	function computeProgressSet(progressList: { id_oeuvre?: number; box_level?: number; consecutive_correct?: number }[]) {
		const set = new Set<number>();
		for (const p of progressList) {
			if (p && p.id_oeuvre && (p.box_level > 1 || (p.consecutive_correct && p.consecutive_correct > 0))) {
				set.add(p.id_oeuvre);
			}
		}
		return set;
	}
	let progressSet = $derived(computeProgressSet(data.progressList));

	function computeFavoritesSet(favoritesList: number[]) {
		return new Set<number>(favoritesList || []);
	}
	let favoritesSet = $derived(computeFavoritesSet(data.favoritesList));

	function computeNormalizedQuery(query: string) {
		return query.trim().toLowerCase();
	}
	let normalizedQuery = $derived(computeNormalizedQuery(searchQuery));

	$effect(() => {
		const handleOnline = () => (isOnline = true);
		const handleOffline = () => (isOnline = false);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	type MovementType = { id: number; nom?: string; siecle?: string };
	type ArtworkType = { id?: number; id_courant?: number; titre?: string; artistes?: { nom?: string } };

	function computeGroupedMovements(
		movements: MovementType[],
		artworks: ArtworkType[],
		pSet: Set<number>,
		favSet: Set<number>,
		activeMovements: number[],
		query: string,
		qLower: string,
		showFavs: boolean
	) {
		const groups = new Map<number, { movement: MovementType; items: ArtworkType[]; discoveredCount: number; totalCount: number }>();

		for (const m of movements || []) {
			groups.set(m.id, { movement: m, items: [], discoveredCount: 0, totalCount: 0 });
		}

		let filtered = artworks || [];

		if (showFavs) {
			filtered = filtered.filter(a => a.id && favSet.has(a.id));
		}
		if (activeMovements.length > 0) {
			filtered = filtered.filter(a => a.id_courant && activeMovements.includes(a.id_courant));
		}
		if (query.trim()) {
			filtered = filtered.filter(
				(a) =>
					(a.titre && a.titre.toLowerCase().includes(qLower)) ||
					(a.artistes?.nom && a.artistes.nom.toLowerCase().includes(qLower))
			);
		}

		for (const art of filtered) {
			if (art.id_courant === undefined) continue;
			const grp = groups.get(art.id_courant);
			if (grp) {
				grp.totalCount++;
				if (art.id && pSet.has(art.id)) {
					grp.discoveredCount++;
				}
				grp.items.push(art);
			}
		}

		return Array.from(groups.values()).filter((g) => {
			if (activeMovements.length > 0 && !activeMovements.includes(g.movement.id)) return false;
			return g.items.length > 0 || (!query.trim() && !showFavs && activeMovements.length === 0);
		});
	}
	let groupedMovements = $derived(computeGroupedMovements(data.movements, data.artworks, progressSet, favoritesSet, selectedMovements, searchQuery, normalizedQuery, showFavoritesOnly));
	function resetSearch() {
		searchQuery = '';
	}
</script>
<svelte:window bind:scrollY={scrollY} />

<div class="catalog-view">
	<CatalogHeader 
		bind:searchQuery 
		{showFavoritesOnly}
		onToggleFavorites={toggleFavoritesFilter}
		bind:selectedMovements 
		{headerVisible} 
		movements={data.movements || []} 
		{toggleMovement} 
	/>

	<div class="movements-list" class:header-hidden={!headerVisible}>
		{#each groupedMovements as group, gIndex (group.movement.id)}
			<section class="movement-section" style:--movement-color="var(--color-primary)">
				<div class="movement-header sticky-subheader">
					<div>
						<h2 class="movement-title">{group.movement.nom}</h2>
						<span class="movement-century">{group.movement.siecle || 'Ère historique'}</span>
					</div>
					<div class="progress-simple">
						{group.discoveredCount}/{group.totalCount}
					</div>
				</div>

				{#if group.items.length > 0}
					<LazySection itemCount={group.items.length} initiallyVisible={gIndex <= 1}>
						{#snippet content()}
							<div class="grid-catalog-minimal">
								{#each group.items as art, aIndex (art.id)}
									<CatalogArtworkCard 
										{art} 
										isFavorite={favoritesSet.has(art.id)} 
										isDiscovered={progressSet.has(art.id)} 
										eager={gIndex === 0 && aIndex < 6}
									/>
								{/each}
							</div>
						{/snippet}
					</LazySection>
				{:else}
					<p class="no-items-note">Aucune œuvre trouvée.</p>
				{/if}
			</section>
		{/each}

		{#if groupedMovements.length === 0}
			<div class="empty-search">
				<p>Aucun résultat pour "{searchQuery}".</p>
				<button type="button" class="reset-btn" onclick={resetSearch}>Réinitialiser</button>
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

	.movement-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		content-visibility: auto;
		contain-intrinsic-size: 1000px;
	}

	.sticky-subheader {
		position: sticky;
		top: 100px;
		z-index: 10;
		background: color-mix(in oklch, var(--color-bg) 92%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		padding: 0.75rem 0;
		margin: 0;
		transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.movements-list.header-hidden .sticky-subheader {
		top: 0;
	}

	.movement-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		border-bottom: 2px solid var(--movement-color);
		padding-bottom: 0.25rem;
	}

	.movement-title {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.movement-century {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		display: block;
		margin-top: 0.15rem;
	}

	.progress-simple {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--movement-color);
		background: color-mix(in oklch, var(--movement-color) 15%, transparent);
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		margin-bottom: 0.25rem;
	}

	.grid-catalog-minimal {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem 0.85rem;
		/* padding already handled by parent */
	}

	@media (min-width: 768px) {
		.grid-catalog-minimal {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
	}


	.no-items-note {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		padding: 1rem 0;
	}

	.empty-search {
		text-align: center;
		padding: 3rem 1rem;
	}

	.empty-search p {
		color: var(--color-text-secondary);
		margin-bottom: 1rem;
	}

	.reset-btn {
		padding: 0.6rem 1.25rem;
		background: var(--color-surface);
		color: var(--color-text-primary);
		border-radius: 20px;
		font-weight: 600;
		box-shadow: inset 0 0 0 1px var(--color-border);
		min-height: 44px;
	}




</style>
