<script lang="ts">
	import { MagnifyingGlass, X, Heart, ThumbsUp, ThumbsDown } from 'phosphor-svelte';


	let {
		searchQuery = $bindable(''),
		showFavoritesOnly,
		showLikesOnly,
		showDislikesOnly,
		selectedMovements = $bindable(),
		headerVisible,
		movements = [],
		toggleMovement,
		onToggleFavorites,
		onToggleLikes,
		onToggleDislikes
	}: {
		searchQuery: string;
		showFavoritesOnly: boolean;
		showLikesOnly: boolean;
		showDislikesOnly: boolean;
		selectedMovements: number[];
		headerVisible: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		movements: any[];
		toggleMovement: (id: number) => void;
		onToggleFavorites: () => void;
		onToggleLikes: () => void;
		onToggleDislikes: () => void;
	} = $props();

	function handleClearSearch() {
		searchQuery = '';
	}

	function handleToggleMovement(e: MouseEvent) {
		const target = e.currentTarget as HTMLButtonElement;
		const id = parseInt(target.dataset.id || '0', 10);
		toggleMovement(id);
	}
</script>

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
			<button type="button" class="clear-btn" onclick={handleClearSearch} aria-label="Effacer">
				<X size={18} weight="regular" />
			</button>
		{/if}
	</div>
	<div class="filters-bar">
		<!-- Favoris -->
		<button 
			class="filter-pill favorite-pill {showFavoritesOnly ? 'active' : ''}" 
			onclick={onToggleFavorites}
			aria-pressed={showFavoritesOnly}
			id="filter-favorites"
		>
			<Heart size={16} weight={showFavoritesOnly ? 'fill' : 'regular'} />
			Favoris
		</button>
		<!-- Likes -->
		<button 
			class="filter-pill like-pill {showLikesOnly ? 'active' : ''}" 
			onclick={onToggleLikes}
			aria-pressed={showLikesOnly}
			id="filter-likes"
		>
			<ThumbsUp size={16} weight={showLikesOnly ? 'fill' : 'regular'} />
			J'aime
		</button>
		<!-- Dislikes -->
		<button 
			class="filter-pill dislike-pill {showDislikesOnly ? 'active' : ''}" 
			onclick={onToggleDislikes}
			aria-pressed={showDislikesOnly}
			id="filter-dislikes"
		>
			<ThumbsDown size={16} weight={showDislikesOnly ? 'fill' : 'regular'} />
			J'aime pas
		</button>
		<div class="divider"></div>
		{#each movements as movement (movement.id || movement)}
			<button 
				class="filter-pill movement-pill {selectedMovements.includes(movement.id) ? 'active' : ''}" 
				data-id={movement.id}
				onclick={handleToggleMovement}
			>
				{movement.name}
			</button>
		{/each}
	</div>
</header>

<style>
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
		min-height: 40px;
		border-radius: 20px;
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		box-shadow: inset 0 0 0 1px var(--color-border);
		transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Favoris — red */
	.filter-pill.favorite-pill.active {
		background-color: color-mix(in oklch, #ff3b30 15%, transparent);
		color: #ff3b30;
		box-shadow: inset 0 0 0 1px #ff3b30;
	}

	/* Likes — green */
	.filter-pill.like-pill.active {
		background-color: color-mix(in oklch, #34c759 15%, transparent);
		color: #34c759;
		box-shadow: inset 0 0 0 1px #34c759;
	}

	/* Dislikes — orange */
	.filter-pill.dislike-pill.active {
		background-color: color-mix(in oklch, #ff9500 15%, transparent);
		color: #ff9500;
		box-shadow: inset 0 0 0 1px #ff9500;
	}

	.filter-pill.movement-pill.active {
		background-color: var(--color-text-primary);
		color: var(--color-bg);
		box-shadow: inset 0 0 0 1px var(--color-text-primary);
	}
</style>
