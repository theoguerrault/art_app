<script lang="ts">
	import type { PageData } from './$types';
	import { MagnifyingGlass, X, Check, Heart } from 'phosphor-svelte';
	import LazySection from '$lib/components/LazySection.svelte';
	import CatalogArtworkCard from '$lib/features/artwork/components/CatalogArtworkCard.svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let showFavoritesOnly = $state(false);
	let selectedMovements = $state(new Set<number>());

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
		const updated = new Set(selectedMovements);
		if (updated.has(id)) {
			updated.delete(id);
		} else {
			updated.add(id);
		}
		selectedMovements = updated;
	}

	$effect(() => {
		// Removed hue override to keep the primary pink color
	});

	// Map progress by id_oeuvre
	let progressSet = $derived(() => {
		const set = new Set<number>();
		for (const p of data.progressList) {
			if (p && p.id_oeuvre && (p.box_level > 1 || (p.consecutive_correct && p.consecutive_correct > 0))) {
				set.add(p.id_oeuvre);
			}
		}
		return set;
	});

	let favoritesSet = $derived(() => {
		return new Set<number>(data.favoritesList || []);
	});

	let filteredArtworks = $derived(
		(data.artworks || []).filter((art) => {
			if (showFavoritesOnly && (!art.id || !favoritesSet().has(art.id))) return false;
			if (selectedMovements.size > 0 && art.id_courant && !selectedMovements.has(art.id_courant)) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				(art.titre && art.titre.toLowerCase().includes(q)) ||
				(art.artistes?.nom && art.artistes.nom.toLowerCase().includes(q))
			);
		})
	);

	// Group filtered artworks by movement
	let groupedMovements = $derived(() => {
		const groups = new Map<number, { movement: any; items: any[]; discoveredCount: number; totalCount: number }>();
		const pSet = progressSet();

		for (const m of data.movements || []) {
			groups.set(m.id, { movement: m, items: [], discoveredCount: 0, totalCount: 0 });
		}

		// Calculate total inside each movement (before filtering or including filtered)
		for (const art of data.artworks || []) {
			if (art.id_courant && groups.has(art.id_courant)) {
				const grp = groups.get(art.id_courant)!;
				grp.totalCount++;
				if (art.id && pSet.has(art.id)) {
					grp.discoveredCount++;
				}
			}
		}

		for (const art of filteredArtworks) {
			if (art.id_courant && groups.has(art.id_courant)) {
				groups.get(art.id_courant)!.items.push(art);
			}
		}

		// Return only movements that have matching items when searching, or all if no search query
		return Array.from(groups.values()).filter((g) => {
			if (selectedMovements.size > 0 && !selectedMovements.has(g.movement.id)) return false;
			return g.items.length > 0 || (!searchQuery.trim() && !showFavoritesOnly && selectedMovements.size === 0);
		});
	});
</script>
<svelte:window bind:scrollY={scrollY} />

<div class="catalog-view">
	<header class="catalog-header sticky-header" class:hidden={!headerVisible}>
		<div class="search-bar">
			<span class="search-icon" aria-hidden="true">
				<MagnifyingGlass size={20} weight="regular" />
			</span>
			<input
				type="search"
				placeholder="Rechercher une œuvre..."
				bind:value={searchQuery}
				aria-label="Rechercher une œuvre"
			/>
			{#if searchQuery}
				<button type="button" class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Effacer">
					<X size={18} weight="regular" />
				</button>
			{/if}
		</div>
		<div class="filters-bar">
			<button 
				class="filter-pill favorite-pill {showFavoritesOnly ? 'active' : ''}" 
				onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
			>
				<Heart size={16} weight={showFavoritesOnly ? 'fill' : 'regular'} />
				Favoris
			</button>
			<div class="divider"></div>
			{#each data.movements || [] as movement}
				<button 
					class="filter-pill movement-pill {selectedMovements.has(movement.id) ? 'active' : ''}" 
					onclick={() => toggleMovement(movement.id)}
				>
					{movement.nom}
				</button>
			{/each}
		</div>
	</header>

	<div class="movements-list" class:header-hidden={!headerVisible}>
		{#each groupedMovements() as group}
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
					<LazySection itemCount={group.items.length}>
						{#snippet children()}
							<div class="grid-catalog-minimal">
								{#each group.items as art}
									<CatalogArtworkCard 
										{art} 
										isFavorite={favoritesSet().has(art.id)} 
										isDiscovered={progressSet().has(art.id)} 
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

		{#if groupedMovements().length === 0}
			<div class="empty-search">
				<p>Aucun résultat pour "{searchQuery}".</p>
				<button type="button" class="reset-btn" onclick={() => (searchQuery = '')}>Réinitialiser</button>
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

	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in oklch, var(--color-bg) 85%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: 1rem 0 1.25rem;
		margin: -1rem -1.25rem 0;
		border-bottom: 1px solid var(--color-border-subtle);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.sticky-header.hidden {
		transform: translateY(-100%);
	}

	.search-bar {
		position: relative;
		margin: 0 1.25rem;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		display: flex;
		align-items: center;
		pointer-events: none;
		color: var(--color-text-muted);
	}

	.search-bar input {
		width: 100%;
		padding: 0.85rem 2.5rem 0.85rem 2.8rem;
		border-radius: 12px;
		border: none;
		background-color: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 1rem;
		box-shadow: inset 0 0 0 1px var(--color-border);
		transition: box-shadow 0.2s ease, background-color 0.2s ease;
		-webkit-appearance: none;
		appearance: none;
	}

	.search-bar input:focus {
		outline: none;
		background-color: var(--color-bg);
		box-shadow: inset 0 0 0 2px var(--color-primary);
	}

	.search-bar input::placeholder {
		color: var(--color-text-muted);
	}

	.clear-btn {
		position: absolute;
		right: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		width: 44px;
		height: 44px;
		border-radius: 50%;
	}

	.clear-btn:hover {
		color: var(--color-text-primary);
		background: var(--color-surface-hover);
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

	.filters-bar {
		margin: 1rem 1.25rem 0;
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.filters-bar::-webkit-scrollbar {
		display: none;
	}

	.divider {
		width: 1px;
		background: var(--color-border);
		margin: 0 0.25rem;
		flex-shrink: 0;
	}

	.filter-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0 1rem;
		min-height: 40px; /* Better touch target */
		border-radius: 20px;
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		box-shadow: inset 0 0 0 1px var(--color-border);
		transition: all 0.2s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.filter-pill.favorite-pill.active {
		background-color: color-mix(in oklch, #ff3b30 15%, transparent);
		color: #ff3b30;
		box-shadow: inset 0 0 0 1px #ff3b30;
	}

	.filter-pill.movement-pill.active {
		background-color: var(--color-text-primary);
		color: var(--color-bg);
		box-shadow: inset 0 0 0 1px var(--color-text-primary);
	}
</style>
