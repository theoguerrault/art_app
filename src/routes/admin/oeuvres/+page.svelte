<script lang="ts">
  import { MagnifyingGlass, Funnel, PenNib, CheckCircle, Clock } from 'phosphor-svelte';
  let { data } = $props();

  let searchQuery = $state('');

  let filteredOeuvres = $derived(
    data.oeuvres.filter((oeuvre) => 
      oeuvre.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      oeuvre.artiste.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<div class="admin-view">
  <header class="admin-header sticky-header">
    <h1 class="page-title">Administration des Œuvres</h1>
    
    <div class="search-bar">
      <span class="search-icon" aria-hidden="true">
        <MagnifyingGlass size={20} weight="bold" />
      </span>
      <input 
        type="search" 
        bind:value={searchQuery}
        placeholder="Rechercher une œuvre..." 
        aria-label="Rechercher une œuvre"
      />
    </div>
  </header>

  <div class="grid-catalog-minimal">
    {#each filteredOeuvres as oeuvre}
      <a href={`/admin/oeuvres/${oeuvre.id}`} class="artwork-card-minimal">
        <div class="thumb-wrapper">
          <img src={oeuvre.image_url_thumb} alt={oeuvre.titre} loading="lazy" decoding="async" />
          
          <div class="status-indicator">
            {#if oeuvre.contenus_oeuvres}
              {#if oeuvre.contenus_oeuvres.verification_status === 'VERIFIED'}
                <div class="badge verified" title="Vérifié">
                  <CheckCircle size={14} weight="fill" />
                  <span>Vérifié</span>
                </div>
              {:else if oeuvre.contenus_oeuvres.verification_status === 'PENDING'}
                <div class="badge pending" title="En attente">
                  <Clock size={14} weight="fill" />
                  <span>En attente</span>
                </div>
              {:else}
                <div class="badge unknown">
                  <span>{oeuvre.contenus_oeuvres.verification_status}</span>
                </div>
              {/if}
            {:else}
              <div class="badge empty" title="Sans contenu">
                <span>Vide</span>
              </div>
            {/if}
          </div>
        </div>

        <div class="art-info">
          <h3 class="art-title">{oeuvre.titre}</h3>
          <p class="art-artist">{oeuvre.artiste}</p>
          
          {#if !oeuvre.contenus_oeuvres || oeuvre.contenus_oeuvres.verification_status !== 'VERIFIED'}
            <div class="action-verify">
              <PenNib size={14} weight="bold" /> Vérifier le contenu
            </div>
          {:else}
            <div class="edit-action">
              <CheckCircle size={14} weight="bold" /> Éditer le contenu
            </div>
          {/if}
        </div>
      </a>
    {/each}

    {#if filteredOeuvres.length === 0}
      <div class="empty-search">
        <p>Aucun résultat pour "{searchQuery}".</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .admin-view {
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
    padding: 0.85rem 1rem 0.85rem 2.8rem;
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

  .grid-catalog-minimal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem 0.85rem;
    padding: 0 1.25rem;
  }

  @media (min-width: 768px) {
    .grid-catalog-minimal {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
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

  @media (hover: hover) {
    .artwork-card-minimal:hover .thumb-wrapper img {
      transform: scale(1.05);
    }
  }

  .status-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.3rem 0.5rem;
    border-radius: 2rem;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .badge.verified {
    background: color-mix(in oklch, var(--color-success) 20%, rgba(255,255,255,0.8));
    color: var(--color-success);
    border: 1px solid color-mix(in oklch, var(--color-success) 30%, transparent);
  }

  .badge.pending {
    background: color-mix(in oklch, var(--color-warning) 20%, rgba(255,255,255,0.8));
    color: var(--color-warning);
    border: 1px solid color-mix(in oklch, var(--color-warning) 30%, transparent);
  }

  .badge.empty {
    background: color-mix(in oklch, var(--color-danger) 20%, rgba(255,255,255,0.8));
    color: var(--color-danger);
    border: 1px solid color-mix(in oklch, var(--color-danger) 30%, transparent);
  }

  .badge.unknown {
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
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

  .edit-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.5rem;
    color: var(--color-success);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .action-verify {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.5rem;
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .empty-search {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);
  }
</style>
