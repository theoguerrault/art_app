<script lang="ts">
	import type { PageData } from './$types';
	import { MagnifyingGlass, X, Check } from 'phosphor-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	$effect(() => {
		document.documentElement.style.setProperty('--artwork-hue', '220');
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

	// Filter artworks using instant client-side derivation
	let filteredArtworks = $derived(
		(data.artworks || []).filter((art) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				(art.titre && art.titre.toLowerCase().includes(q)) ||
				(art.artiste && art.artiste.toLowerCase().includes(q))
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
		return Array.from(groups.values()).filter((g) => g.items.length > 0 || !searchQuery.trim());
	});
</script>

<div class="catalog-view">
	<header class="catalog-header sticky-header">
		<h1 class="page-title">Catalogue</h1>
		<div class="search-bar">
			<span class="search-icon" aria-hidden="true">
				<MagnifyingGlass size={20} weight="bold" />
			</span>
			<input
				type="search"
				placeholder="Rechercher une œuvre..."
				bind:value={searchQuery}
				aria-label="Rechercher une œuvre"
			/>
			{#if searchQuery}
				<button type="button" class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Effacer">
					<X size={18} weight="bold" />
				</button>
			{/if}
		</div>
	</header>

	<div class="movements-list">
		{#each groupedMovements() as group}
			<section class="movement-section" style:--movement-color={group.movement.oklch_token || 'var(--color-primary)'}>
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
					<div class="grid-catalog-minimal">
						{#each group.items as art}
							<a href="/catalogue/{art.slug || art.id}" class="artwork-card-minimal" aria-label="Voir {art.titre}">
								<div class="thumb-wrapper">
									<img src={art.image_url_thumb} alt={art.titre} loading="lazy" decoding="async" />
									{#if progressSet().has(art.id)}
										<span class="discovered-indicator" title="Découverte">
											<Check size={14} weight="bold" />
										</span>
									{/if}
								</div>
								<div class="art-info">
									<h3 class="art-title">{art.titre}</h3>
									<p class="art-artist">{art.artiste}</p>
								</div>
							</a>
						{/each}
					</div>
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
		padding: 1rem 0 1.5rem;
		margin: -1rem 0 0;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.page-title {
		font-size: 2rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin-bottom: 1rem;
		padding: 0 1.25rem;
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
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		width: 2rem;
		height: 2rem;
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
		padding: 0 1.25rem;
	}

	.movement-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.sticky-subheader {
		position: sticky;
		top: 110px; /* Offset to sit below the sticky header */
		z-index: 10;
		background: color-mix(in oklch, var(--color-bg) 92%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		padding: 0.75rem 0;
		margin: 0;
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
	}

	.artwork-card-minimal {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		gap: 0.5rem;
		border-radius: 8px;
		transition: opacity 0.2s ease;
	}

	.artwork-card-minimal:active {
		opacity: 0.6;
	}

	.thumb-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 12px;
		overflow: hidden;
		background-color: var(--color-border-subtle);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	}

	.thumb-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1);
	}

	/* Micro-interaction on desktop */
	@media (hover: hover) {
		.artwork-card-minimal:hover .thumb-wrapper img {
			transform: scale(1.05);
		}
	}

	.discovered-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-success);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		box-shadow: 0 2px 5px rgba(0,0,0,0.15);
	}

	:global([data-theme="dark"]) .discovered-indicator {
		background: rgba(0, 0, 0, 0.6);
	}

	.art-info {
		display: flex;
		flex-direction: column;
		padding: 0 0.15rem;
	}

	.art-title {
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.25;
		color: var(--color-text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.art-artist {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 0.15rem;
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
	}
</style>
