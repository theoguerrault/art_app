<script lang="ts">
	import {
		MagnifyingGlass,
		X,
		Heart,
		ThumbsUp,
		ThumbsDown,
		SlidersHorizontal,
		ArrowCounterClockwise
	} from 'phosphor-svelte';
	import CatalogMovementModal from './CatalogMovementModal.svelte';

	interface Movement {
		id: number;
		name: string;
		century?: string;
	}

	let {
		searchQuery = $bindable(''),
		showFavoritesOnly = false,
		showLikesOnly = false,
		showDislikesOnly = false,
		selectedMovements = $bindable([]),
		headerVisible = true,
		movements = [],
		toggleMovement,
		onToggleFavorites,
		onToggleLikes,
		onToggleDislikes,
		onResetFilters
	}: {
		searchQuery: string;
		showFavoritesOnly: boolean;
		showLikesOnly: boolean;
		showDislikesOnly: boolean;
		selectedMovements: number[];
		headerVisible: boolean;
		movements: Movement[];
		toggleMovement: (id: number) => void;
		onToggleFavorites: () => void;
		onToggleLikes: () => void;
		onToggleDislikes: () => void;
		onResetFilters?: () => void;
	} = $props();

	let isMovementModalOpen = $state(false);

	function handleClearSearch() {
		searchQuery = '';
	}

	function openMovementModal() {
		isMovementModalOpen = true;
	}

	function closeMovementModal() {
		isMovementModalOpen = false;
	}

	function clearAllMovements() {
		selectedMovements = [];
	}

	function handleRemoveMovementClick(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const id = Number(target.dataset.id);
		if (!isNaN(id)) {
			toggleMovement(id);
		}
	}

	function computeActiveMovements(movs: Movement[], selected: number[]) {
		if (!selected.length) return [];
		const set = new Set(selected);
		return movs.filter((m) => set.has(m.id));
	}

	let activeMovementObjects = $derived(computeActiveMovements(movements, selectedMovements));

	let hasActiveFilters = $derived(
		showFavoritesOnly ||
		showLikesOnly ||
		showDislikesOnly ||
		selectedMovements.length > 0 ||
		searchQuery.trim().length > 0
	);
</script>

<header class="catalog-header sticky-header" class:hidden={!headerVisible}>
	<!-- Search bar -->
	<div class="search-bar">
		<span class="search-icon" aria-hidden="true">
			<MagnifyingGlass size={20} weight="regular" />
		</span>
		<input
			type="search"
			placeholder="Rechercher une œuvre, un artiste..."
			bind:value={searchQuery}
			aria-label="Rechercher une œuvre ou un artiste"
		/>
		{#if searchQuery}
			<button type="button" class="clear-btn" onclick={handleClearSearch} aria-label="Effacer la recherche">
				<X size={18} weight="regular" />
			</button>
		{/if}
	</div>

	<!-- Streamlined Filters Row -->
	<div class="filters-bar">
		<!-- Favoris -->
		<button
			type="button"
			class="filter-pill favorite-pill {showFavoritesOnly ? 'active' : ''}"
			onclick={onToggleFavorites}
			aria-pressed={showFavoritesOnly}
			id="filter-favorites"
		>
			<Heart size={16} weight={showFavoritesOnly ? 'fill' : 'regular'} />
			<span>Favoris</span>
		</button>

		<!-- Likes -->
		<button
			type="button"
			class="filter-pill like-pill {showLikesOnly ? 'active' : ''}"
			onclick={onToggleLikes}
			aria-pressed={showLikesOnly}
			id="filter-likes"
		>
			<ThumbsUp size={16} weight={showLikesOnly ? 'fill' : 'regular'} />
			<span>J'aime</span>
		</button>

		<!-- Dislikes -->
		<button
			type="button"
			class="filter-pill dislike-pill {showDislikesOnly ? 'active' : ''}"
			onclick={onToggleDislikes}
			aria-pressed={showDislikesOnly}
			id="filter-dislikes"
		>
			<ThumbsDown size={16} weight={showDislikesOnly ? 'fill' : 'regular'} />
			<span>J'aime pas</span>
		</button>

		<div class="divider"></div>

		<!-- Movement Filter Trigger -->
		<button
			type="button"
			class="filter-pill movement-trigger-pill {selectedMovements.length > 0 ? 'active' : ''}"
			onclick={openMovementModal}
			aria-haspopup="dialog"
			aria-expanded={isMovementModalOpen}
		>
			<SlidersHorizontal size={16} weight="bold" />
			<span>Mouvements</span>
			{#if selectedMovements.length > 0}
				<span class="count-badge">{selectedMovements.length}</span>
			{/if}
		</button>

		{#if hasActiveFilters && onResetFilters}
			<button
				type="button"
				class="filter-pill reset-pill"
				onclick={onResetFilters}
				title="Réinitialiser tous les filtres"
				aria-label="Réinitialiser tous les filtres"
			>
				<ArrowCounterClockwise size={15} weight="bold" />
				<span>Effacer</span>
			</button>
		{/if}
	</div>

	<!-- Active movement tags if selected -->
	{#if activeMovementObjects.length > 0}
		<div class="active-tags-row">
			{#each activeMovementObjects as mov (mov.id)}
				<button
					type="button"
					class="active-tag"
					data-id={mov.id}
					onclick={handleRemoveMovementClick}
					title="Supprimer le filtre {mov.name}"
				>
					<span>{mov.name}</span>
					<X size={12} weight="bold" />
				</button>
			{/each}
		</div>
	{/if}
</header>

<CatalogMovementModal
	isOpen={isMovementModalOpen}
	{movements}
	bind:selectedMovements
	{toggleMovement}
	onClose={closeMovementModal}
	onClear={clearAllMovements}
/>

<style>
	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in oklch, var(--color-bg) 88%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		padding: 0.85rem 0 1rem;
		margin: -1rem -1.25rem 0;
		border-bottom: 1px solid var(--color-border-subtle);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
		border-radius: var(--radius-pill);
		border: 1px solid var(--color-border-subtle);
		background-color: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 0.95rem;
		transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
		-webkit-appearance: none;
		appearance: none;
	}

	.search-bar input:focus {
		outline: none;
		background-color: var(--color-surface-elevated);
		border-color: var(--color-primary);
		box-shadow: 0 0 12px color-mix(in srgb, var(--color-primary) 25%, transparent);
	}

	.search-bar input::placeholder {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.clear-btn {
		position: absolute;
		right: 0.35rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		transition: background-color 0.15s, color 0.15s;
	}

	.clear-btn:hover {
		color: var(--color-text-primary);
		background: var(--color-surface-hover);
	}

	.filters-bar {
		margin: 0 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.filters-bar::-webkit-scrollbar {
		display: none;
	}

	.divider {
		width: 1px;
		height: 24px;
		background: var(--color-border-subtle);
		margin: 0 0.2rem;
		flex-shrink: 0;
	}

	.filter-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0 0.95rem;
		min-height: 36px;
		border-radius: var(--radius-pill);
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.825rem;
		font-weight: 600;
		border: 1px solid var(--color-border-subtle);
		transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
		cursor: pointer;
	}

	.filter-pill:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	/* Favoris */
	.filter-pill.favorite-pill.active {
		background-color: color-mix(in srgb, #ff3b30 18%, transparent);
		color: #ff3b30;
		border-color: #ff3b30;
	}

	/* Likes */
	.filter-pill.like-pill.active {
		background-color: color-mix(in srgb, #34c759 18%, transparent);
		color: #34c759;
		border-color: #34c759;
	}

	/* Dislikes */
	.filter-pill.dislike-pill.active {
		background-color: color-mix(in srgb, #ff9500 18%, transparent);
		color: #ff9500;
		border-color: #ff9500;
	}

	/* Movement Trigger */
	.filter-pill.movement-trigger-pill.active {
		background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.count-badge {
		background: var(--color-primary);
		color: #000000;
		border-radius: 9999px;
		font-size: 0.725rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		line-height: 1;
	}

	.filter-pill.reset-pill {
		color: var(--color-text-muted);
		border-style: dashed;
	}

	.filter-pill.reset-pill:hover {
		color: var(--color-error);
		border-color: var(--color-error);
		background: var(--color-error-bg);
	}

	/* Active tags row */
	.active-tags-row {
		margin: 0 1.25rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.active-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.65rem;
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s;
	}

	.active-tag:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

</style>
