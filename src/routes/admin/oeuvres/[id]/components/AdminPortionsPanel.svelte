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

  .score-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .score-card.good { background: transparent; }
  .score-card.average { background: transparent; }
  .score-card.bad { background: transparent; }

  .score-label {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .score-value {
    font-size: 1.5rem;
    font-weight: 800;
  }
  .score-card.good .score-value { color: var(--color-success); }
  .score-card.average .score-value { color: var(--color-warning); }
  .score-card.bad .score-value { color: var(--color-danger); }

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

  .portion-index {
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-pill, .statement-status {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 700;
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
  }
  
  .status-pill.verified, .statement-status.verified {
    background: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border-color: color-mix(in oklch, var(--color-success) 30%, transparent);
  }
  .status-pill.pending, .statement-status.pending, .status-pill.unverified, .statement-status.unverified {
    background: color-mix(in oklch, var(--color-text-secondary) 15%, transparent);
    color: var(--color-text-secondary);
    border-color: color-mix(in oklch, var(--color-text-secondary) 30%, transparent);
  }
  .status-pill.pending_validation, .statement-status.pending_validation {
    background: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border-color: color-mix(in oklch, var(--color-warning) 30%, transparent);
  }
  .status-pill.false, .statement-status.false {
    background: color-mix(in oklch, var(--color-error) 15%, transparent);
    color: var(--color-error);
    border-color: color-mix(in oklch, var(--color-error) 30%, transparent);
  }

  .statement-title {
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0.5rem 0;
  }

  .statement-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }

  .statement-feedback {
    background: transparent;
    padding: 0.75rem 0 0 0;
  }

  .statement-card.false .statement-feedback {
    background: transparent;
  }

  .statement-explanation {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .statement-source {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg);
    border-radius: 8px;
    border: 1px solid var(--color-border-subtle);
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .source-label {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
    font-style: normal;
  }

  .statement-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  @media (max-width: 600px) {
    .statement-actions :global(> *) {
      flex: 1 1 calc(50% - 0.25rem);
    }
  }
  
  .edit-textarea, .edit-input {
    width: 100%;
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
    font-family: var(--font-body);
    font-size: 0.9rem;
    resize: vertical;
    margin-bottom: 0.5rem;
  }
  .edit-textarea:focus, .edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
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

  .empty-icon {
    color: var(--color-text-muted);
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
</style>
