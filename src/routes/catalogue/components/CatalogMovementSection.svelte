<script lang="ts">
	import LazySection from '$lib/components/LazySection.svelte';
	import CatalogArtworkCard from '$lib/features/artwork/components/CatalogArtworkCard.svelte';

	interface MovementType {
		id: number;
		name?: string;
		century?: string;
	}

	interface ArtworkType {
		id?: number;
		slug?: string;
		movement_id?: number;
		title?: string;
		artists?: { name?: string };
		image_url_thumb?: string | null;
		image_url_full?: string | null;
	}

	interface MovementGroup {
		movement: MovementType;
		items: ArtworkType[];
	}

	interface Props {
		group: MovementGroup;
		gIndex: number;
		favoritesSet: Set<number>;
		progressSet: Set<number>;
		likesSet: Set<number>;
		dislikesSet: Set<number>;
		initiallyVisible: boolean;
	}

	let {
		group,
		gIndex,
		favoritesSet,
		progressSet,
		likesSet,
		dislikesSet,
		initiallyVisible
	}: Props = $props();
</script>

<section class="movement-section" style:--movement-color="var(--color-primary)">
	<div class="movement-header sticky-subheader">
		<div>
			<h2 class="movement-title">{group.movement.name}</h2>
			<span class="movement-century">{group.movement.century || 'Ère historique'}</span>
		</div>
	</div>

	{#if group.items.length > 0}
		<LazySection itemCount={group.items.length} {initiallyVisible}>
			{#snippet content()}
				<div class="grid-catalog-minimal">
					{#each group.items as art, aIndex (art.id || art.slug || aIndex)}
						<CatalogArtworkCard
							{art}
							isFavorite={art.id != null && favoritesSet.has(art.id)}
							isDiscovered={art.id != null && progressSet.has(art.id)}
							isLiked={art.id != null && likesSet.has(art.id)}
							isDisliked={art.id != null && dislikesSet.has(art.id)}
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

<style>
	.movement-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		content-visibility: auto;
		contain-intrinsic-size: 800px;
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

	:global(.movements-list.header-hidden) .sticky-subheader {
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

	.grid-catalog-minimal {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem 0.85rem;
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
</style>
