<script lang="ts">
  import { Warning, ShieldCheck } from 'phosphor-svelte';
  import AdminPortionItem from './AdminPortionItem.svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { artwork, content, checking }: { artwork: any; content: any; checking: boolean } = $props();

  function getPortions(c: { article_portions?: { type?: string; id?: string; [key: string]: unknown }[] } | undefined | null) {
    return c?.article_portions ?? [];
  }
  let portions = $derived(getPortions(content));
</script>

{#if portions.length > 0}
  <div class="article-section">
    <h3 class="section-subtitle">ARTICLE DÉTAILLÉ</h3>
    <div class="statements-list">
      {#each portions.filter((p: { type?: string }) => p.type === 'article') as portion, index (portion.id || index)}
        <AdminPortionItem 
          {portion} 
          {index} 
          typeLabel="Partie" 
          {artwork} 
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
          {artwork} 
          {checking} 
        />
      {/each}
      </div>
    </div>
  {/if}
{:else if !content?.main_article}
  <div class="empty-state">
    <Warning size={36} weight="duotone" class="empty-icon" />
    <p class="empty-title">Aucune description générée</p>
    <p class="empty-desc">Cliquez sur le bouton "Générer" en haut pour rédiger et fact-checker le contenu de cette œuvre avec l'IA.</p>
  </div>
{:else}
  <div class="empty-state">
    <ShieldCheck size={36} weight="duotone" class="empty-icon" />
    <p class="empty-title">Rapport de vérification non disponible</p>
    <p class="empty-desc">{checking ? 'Fact-checking en cours d\'exécution...' : 'Veuillez regénérer le contenu ou lancer une vérification.'}</p>
  </div>
{/if}

<style>
  .article-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .statements-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .anecdotes-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-subtitle {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border);
    text-align: center;
    color: var(--color-text-secondary);
    gap: 0.5rem;
  }

  .empty-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-text-primary);
    margin: 0.5rem 0 0 0;
  }

  .empty-desc {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    max-width: 450px;
    line-height: 1.5;
    margin: 0;
  }

  :global(.empty-icon) {
    color: var(--color-text-muted);
  }
</style>

