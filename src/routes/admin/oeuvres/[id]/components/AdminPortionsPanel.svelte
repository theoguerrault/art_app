<script lang="ts">
  import { Warning, ShieldCheck } from 'phosphor-svelte';
  import AdminPortionItem from './AdminPortionItem.svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { oeuvre, content, checking }: { oeuvre: any; content: any; checking: boolean } = $props();

  function getPortions(c: { article_portions?: { type?: string; id?: string; [key: string]: unknown }[] } | undefined | null) {
    return c?.article_portions ?? [];
  }
  let portions = $derived(getPortions(content));
</script>

{#if portions.length > 0}

  <div class="article-section">
    <h3 class="section-subtitle">ARTICLE</h3>
    <div class="statements-list">
      {#each portions.filter((p: { type?: string }) => p.type === 'article') as portion, index (portion.id || index)}
        <AdminPortionItem 
          {portion} 
          {index} 
          typeLabel="Partie" 
          {oeuvre} 
          {checking} 
        />
      {/each}
    </div>
  </div>

  {#if portions.some((p: { type?: string }) => p.type === 'anecdote')}
    <div class="anecdotes-section">
      <h3 class="section-subtitle">ANECDOTES</h3>
      <div class="statements-list">
      {#each portions.filter((p: { type?: string }) => p.type === 'anecdote') as portion, index (portion.id || index)}
        <AdminPortionItem 
          {portion} 
          {index} 
          typeLabel="Anecdote" 
          {oeuvre} 
          {checking} 
        />
      {/each}
      </div>
    </div>
  {/if}
{:else if !content?.article_principal}
  <div class="empty-state">
    <Warning size={32} weight="duotone" class="empty-icon" />
    <p>Aucune description générée pour le moment.<br/>Cliquez sur "Générer".</p>
  </div>
{:else}
  <div class="empty-state">
    <ShieldCheck size={32} weight="duotone" class="empty-icon" />
    <p>Aucun rapport disponible.<br/>{checking ? 'Fact-checking en cours...' : 'Veuillez regénérer le contenu.'}</p>
  </div>
{/if}

<style>
  .article-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .anecdotes-section {
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-subtitle {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin: 0;
    margin-bottom: 0.75rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    background: var(--color-surface-hover);
    border-radius: 8px;
    border: 1px dashed var(--color-border);
    text-align: center;
    color: var(--color-text-secondary);
    gap: 1rem;
  }

  :global(.empty-icon) {
    color: var(--color-text-muted);
  }
</style>
