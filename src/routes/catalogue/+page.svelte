<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

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
	<header class="catalog-header">
		<h1 class="page-title">Art Movements Catalog</h1>
		<p class="page-subtitle">Chronological progression of artistic mastery across centuries.</p>

		<div class="search-bar">
			<span class="search-icon" aria-hidden="true">🔍</span>
			<input
				type="search"
				placeholder="Filter by artwork title or artist..."
				bind:value={searchQuery}
				aria-label="Filter artworks by title or artist"
			/>
			{#if searchQuery}
				<button type="button" class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
					✕
				</button>
			{/if}
		</div>
	</header>

	<div class="movements-list">
		{#each groupedMovements() as group}
			<section
				class="movement-section"
				style:--movement-color={group.movement.oklch_token || 'var(--color-primary)'}
			>
				<div class="movement-header">
					<div>
						<h2 class="movement-title">{group.movement.nom}</h2>
						<span class="movement-century">{group.movement.siecle || 'Historical Era'}</span>
					</div>
					<div class="progress-badge">
						<span>{group.discoveredCount} / {group.totalCount} discovered</span>
					</div>
				</div>

				{#if group.items.length > 0}
					<div class="grid-catalog">
						{#each group.items as art}
							<a
								href="/catalogue/{art.slug || art.id}"
								class="artwork-item grid-subgrid-rows"
								aria-label="View details for {art.titre} by {art.artiste}"
							>
								<div class="thumb-wrapper">
									<img
										src={art.image_url_thumb}
										alt="{art.titre} by {art.artiste}"
										loading="lazy"
										decoding="async"
									/>
									{#if progressSet().has(art.id)}
										<span class="discovered-indicator" title="Discovered">✓</span>
									{/if}
								</div>
								<h3 class="art-title">{art.titre}</h3>
								<p class="art-artist">{art.artiste}</p>
								<span class="art-date">{art.date_creation}</span>
							</a>
						{/each}
					</div>
				{:else}
					<p class="no-items-note">No matching artworks found in this movement.</p>
				{/if}
			</section>
		{/each}

		{#if groupedMovements().length === 0}
			<div class="empty-search">
				<p>No artworks matched your search "{searchQuery}".</p>
				<button type="button" class="reset-btn" onclick={() => (searchQuery = '')}>Reset Search</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.catalog-view {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 2rem;
	}

	.catalog-header {
		text-align: center;
		margin-top: 0.5rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		margin: 0.35rem auto 1.25rem;
	}

	.search-bar {
		position: relative;
		max-width: 500px;
		margin: 0 auto;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		font-size: 1.1rem;
		pointer-events: none;
		color: var(--color-text-muted);
	}

	.search-bar input {
		width: 100%;
		padding: 0.8rem 2.8rem;
		border-radius: 9999px;
		border: 1.5px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 0.95rem;
		box-shadow: var(--shadow-sm);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.search-bar input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	.clear-btn {
		position: absolute;
		right: 1rem;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-muted);
		padding: 0.25rem;
	}

	.clear-btn:hover {
		color: var(--color-text-primary);
	}

	.movements-list {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.movement-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		background-color: var(--color-surface);
		border-left: 5px solid var(--movement-color);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.movement-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		border-bottom: 1px solid var(--color-border-subtle);
		padding-bottom: 0.85rem;
	}

	.movement-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}

	.movement-century {
		font-size: 0.825rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.progress-badge {
		font-size: 0.8125rem;
		font-weight: 700;
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		background-color: var(--color-bg);
		border: 1px solid var(--movement-color);
		color: var(--color-text-primary);
	}

	.grid-catalog {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1.25rem;
	}

	.artwork-item {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.85rem;
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
	}

	.artwork-item:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
		border-color: var(--movement-color);
	}

	.thumb-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background-color: var(--color-border-subtle);
		margin-bottom: 0.75rem;
	}

	.thumb-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.artwork-item:hover .thumb-wrapper img {
		transform: scale(1.04);
	}

	.discovered-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-success);
		color: oklch(0.99 0 0);
		font-weight: 800;
		font-size: 0.75rem;
		width: 1.6rem;
		height: 1.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		box-shadow: var(--shadow-sm);
	}

	.art-title {
		font-size: 0.95rem;
		font-weight: 700;
		line-height: 1.3;
		color: var(--color-text-primary);
		margin-bottom: 0.2rem;
	}

	.art-artist {
		font-size: 0.825rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.art-date {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.35rem;
	}

	.no-items-note {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		font-style: italic;
	}

	.empty-search {
		text-align: center;
		padding: 3rem;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
	}

	.reset-btn {
		margin-top: 1rem;
		padding: 0.6rem 1.25rem;
		background: var(--color-primary);
		color: oklch(0.99 0 0);
		border-radius: var(--radius-md);
		font-weight: 600;
	}
</style>
