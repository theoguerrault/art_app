<script lang="ts">
  import { MagnifyingGlass, PenNib, CheckCircle, Clock } from 'phosphor-svelte';
  import AdminPagination from '../components/AdminPagination.svelte';
  let { data } = $props();
</script>

<div class="admin-view">
  <header class="admin-header sticky-header">
    <h1 class="page-title">Administration des Artistes</h1>
    
    <form class="search-bar" action="/admin/artistes" method="GET" data-sveltekit-keepfocus data-sveltekit-replacestate>
      <span class="search-icon" aria-hidden="true">
        <MagnifyingGlass size={20} weight="bold" />
      </span>
      <input 
        type="search" 
        name="q"
        value={data.pagination?.q || ''} 
        placeholder="Rechercher un artiste par nom..."
        aria-label="Rechercher un artiste"
      />
      <input type="hidden" name="page" value="1" />
    </form>
  </header>

  <div class="art-grid">
    {#each data.artistes as artiste (artiste.id)}
      <a href={`/admin/artistes/${artiste.id}`} class="art-card">
        <div class="art-status-wrapper">
          <div class="art-status">
            {#if artiste.artiste_translations[0]}
              {#if artiste.artiste_translations[0].verification_status === 'VERIFIED'}
                <div class="badge verified" title="Contenu validé">
                  <CheckCircle size={16} weight="fill" />
                  <span>Validé</span>
                </div>
              {:else if artiste.artiste_translations[0].verification_status === 'PENDING'}
                <div class="badge pending" title="En attente de vérification">
                  <Clock size={16} weight="fill" />
                  <span>En attente</span>
                </div>
              {:else}
                <div class="badge unknown">
                  <span>{artiste.artiste_translations[0].verification_status}</span>
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
          <h3 class="art-title">{(artiste.artiste_translations?.[0]?.nom || '')}</h3>
          
          {#if !artiste.artiste_translations[0] || artiste.artiste_translations[0].verification_status !== 'VERIFIED'}
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

    {#if data.artistes.length === 0}
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
    padding: 1rem 1.25rem 1.25rem;
    margin: -1rem -1.25rem 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .page-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
    padding: 0;
  }

  .search-bar {
    position: relative;
    margin: 0;
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

  .grid-catalog-minimal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem 0.85rem;
    padding: 0;
  }

  .art-card {
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
    border: 1px solid var(--color-border-subtle);
    height: 100%;
  }

  .art-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.04);
    border-color: var(--color-border);
  }

  .art-status-wrapper {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-subtle);
    background-color: color-mix(in oklch, var(--color-surface) 95%, black);
  }

  .art-status {
    display: flex;
    gap: 0.5rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .badge.verified {
    background-color: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border: 1px solid color-mix(in oklch, var(--color-success) 30%, transparent);
  }

  .badge.pending {
    background-color: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border: 1px solid color-mix(in oklch, var(--color-warning) 30%, transparent);
  }

  .badge.empty {
    background-color: color-mix(in oklch, var(--color-text-muted) 10%, transparent);
    color: var(--color-text-muted);
    border: 1px solid color-mix(in oklch, var(--color-text-muted) 20%, transparent);
  }

  .badge.unknown {
    background-color: color-mix(in oklch, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
  }

  .art-info {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .art-title {
    font-family: 'Instrument Serif', serif;
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .action-verify, .edit-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: auto;
    padding-top: 1rem;
  }

  .action-verify {
    color: var(--color-primary);
  }
  
  .edit-action {
    color: var(--color-text-muted);
  }

  .art-card:hover .action-verify {
    text-decoration: underline;
  }

  .empty-search {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
    background-color: var(--color-surface);
    border-radius: 16px;
    border: 1px dashed var(--color-border);
    font-size: 1.1rem;
  }
</style>
