<script lang="ts">
  import { CaretLeft, CaretRight } from 'phosphor-svelte';

  interface Props {
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      q: string;
    };
  }

  let { pagination }: Props = $props();

  function getPageUrl(page: number) {
    if (typeof window === 'undefined') return '#';
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    if (pagination.q) url.searchParams.set('q', pagination.q);
    else url.searchParams.delete('q');
    return url.pathname + url.search;
  }
</script>

{#if pagination.totalPages > 1}
  <div class="pagination">
    <a 
      href={pagination.page > 1 ? getPageUrl(pagination.page - 1) : null} 
      class="page-btn" 
      class:disabled={pagination.page <= 1}
    >
      <CaretLeft size={16} /> Précédent
    </a>
    
    <span class="page-info">
      Page {pagination.page} / {pagination.totalPages} ({pagination.totalCount})
    </span>

    <a 
      href={pagination.page < pagination.totalPages ? getPageUrl(pagination.page + 1) : null} 
      class="page-btn" 
      class:disabled={pagination.page >= pagination.totalPages}
    >
      Suivant <CaretRight size={16} />
    </a>
  </div>
{/if}

<style>
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    margin-top: 1rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  .page-info {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .page-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .page-btn:hover:not(.disabled) {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .page-btn.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
