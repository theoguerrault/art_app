<script lang="ts">
  import { MagnifyingGlass, PenNib, CheckCircle, Clock } from 'phosphor-svelte';
  import AdminPagination from '../components/AdminPagination.svelte';
  let { data } = $props();
</script>

<div class="admin-view">
  <header class="admin-header sticky-header">
    <h1 class="page-title">Administration des Artistes</h1>
    
    <form class="search-bar" action="/admin/artists" method="GET" data-sveltekit-keepfocus data-sveltekit-replacestate>
      <span class="search-icon" aria-hidden="true">
        <MagnifyingGlass size={18} weight="bold" />
      </span>
      <input 
        type="search" 
        name="q"
        value={data.pagination?.q || ''} 
        placeholder="Rechercher un artiste..."
        aria-label="Rechercher un artiste"
      />
      <input type="hidden" name="page" value="1" />
    </form>
  </header>

  <div class="items-grid">
    {#each data.artists as artist (artist.id)}
      {@const translation = artist.artist_translations?.[0]}
      {@const status = translation?.verification_status?.toUpperCase()}
      <a data-sveltekit-preload-data="hover" href={`/admin/artists/${artist.id}`} class="item-card">
        <div class="card-status-bar">
          {#if translation}
            {#if status === 'VERIFIED'}
              <span class="status-pill verified">
                <CheckCircle size={13} weight="fill" />
                Validé
              </span>
            {:else if status === 'PENDING' || status === 'PENDING_VALIDATION'}
              <span class="status-pill pending">
                <Clock size={13} weight="fill" />
                En attente
              </span>
            {:else}
              <span class="status-pill unknown">
                {translation.verification_status}
              </span>
            {/if}
          {:else}
            <span class="status-pill empty">
              Vide
            </span>
          {/if}
        </div>

        <div class="card-body">
          <h2 class="card-title">{(translation?.name || artist.slug || '')}</h2>
          
          {#if !translation || status !== 'VERIFIED'}
            <div class="action-link verify">
              <PenNib size={14} weight="bold" />
              <span>Vérifier le contenu</span>
            </div>
          {:else}
            <div class="action-link edit">
              <CheckCircle size={14} weight="bold" />
              <span>Éditer le contenu</span>
            </div>
          {/if}
        </div>
      </a>
    {/each}

    {#if data.artists.length === 0}
      <div class="empty-search">
        <p>Aucun résultat pour "{data.pagination?.q || ''}".</p>
      </div>
    {/if}
  </div>

  <AdminPagination pagination={data.pagination} />
</div>

<style>
  .admin-view {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-bottom: 3rem;
  }

  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in oklch, var(--color-bg) 85%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 1rem 1.25rem 1.25rem;
    margin: -1rem -1.25rem 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .page-title {
    font-family: var(--font-body);
    font-size: 1.5rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-primary);
    margin: 0 0 1rem 0;
    line-height: 1.2;
  }

  .search-bar {
    position: relative;
    margin: 0;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    display: flex;
    align-items: center;
    pointer-events: none;
    color: var(--color-text-muted);
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    font-size: 0.95rem;
    transition: border-color 0.2s ease, background-color 0.2s ease;
    -webkit-appearance: none;
    appearance: none;
  }

  .search-bar input:focus {
    outline: none;
    background-color: var(--color-bg);
    border-color: var(--color-primary);
  }

  .search-bar input::placeholder {
    color: var(--color-text-muted);
  }

  .items-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-card {
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--color-border-subtle);
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .item-card:active {
    opacity: 0.7;
  }

  .card-status-bar {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border-subtle);
    background-color: color-mix(in srgb, var(--color-surface) 60%, black);
    display: flex;
    align-items: center;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.65rem;
    border-radius: var(--radius-pill);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .status-pill.verified {
    background-color: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border: 1px solid color-mix(in oklch, var(--color-success) 30%, transparent);
  }

  .status-pill.pending {
    background-color: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border: 1px solid color-mix(in oklch, var(--color-warning) 30%, transparent);
  }

  .status-pill.empty {
    background-color: color-mix(in oklch, var(--color-error) 15%, transparent);
    color: var(--color-error);
    border: 1px solid color-mix(in oklch, var(--color-error) 30%, transparent);
  }

  .status-pill.unknown {
    background-color: color-mix(in oklch, var(--color-text-muted) 15%, transparent);
    color: var(--color-text-muted);
  }

  .card-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-title {
    font-family: var(--font-body);
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary);
  }

  .action-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.82rem;
    font-weight: 600;
    margin-top: 0.25rem;
  }

  .action-link.verify {
    color: var(--color-primary);
  }

  .action-link.edit {
    color: var(--color-text-muted);
  }

  .empty-search {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-muted);
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border);
    font-size: 0.95rem;
  }
</style>
