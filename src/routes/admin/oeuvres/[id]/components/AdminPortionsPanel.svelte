<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import { Warning, ShieldCheck } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let { oeuvre, content, checking }: { oeuvre: any; content: any; checking: boolean } = $props();

  let validatingPortions: Record<string, boolean> = $state({});
  let correctingPortions: Record<string, boolean> = $state({});
  let deletingPortions: Record<string, boolean> = $state({});
  let verifyingPortions: Record<string, boolean> = $state({});

  let editingPortionId = $state<string | null>(null);
  let editPortionTitle = $state('');
  let editPortionText = $state('');
  let savingPortion = $state(false);

  let report = $derived(content?.verification_report as any);
  let portions = $derived((content?.article_portions || []) as any[]);

  async function deletePortion(portionId: string) {
    if (!confirm('Supprimer définitivement ce paragraphe ?')) return;
    deletingPortions[portionId] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/delete-portion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId })
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert('Erreur lors de la suppression');
      }
    } finally {
      deletingPortions[portionId] = false;
    }
  }

  async function correctManual(portionId: string) {
    correctingPortions[portionId] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId })
      });
      if (res.ok) {
        const json = await res.json();
        if (editingPortionId === portionId && json.content) {
          const updatedPortions = json.content.article_portions || [];
          const updatedPortion = updatedPortions.find((p: any) => p.id === portionId);
          if (updatedPortion) {
            editPortionText = updatedPortion.text;
            editPortionTitle = updatedPortion.title || '';
          }
        }
        await invalidateAll();
      } else {
        alert('Erreur lors de la correction');
      }
    } finally {
      correctingPortions[portionId] = false;
    }
  }

  async function factcheckPortion(id: string) {
    verifyingPortions[id] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/factcheck-portion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId: id })
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de la vérification de la partie");
      }
    } finally {
      verifyingPortions[id] = false;
    }
  }

  let unvalidatingPortions: Record<string, boolean> = $state({});

  async function unvalidatePortion(id: string) {
    unvalidatingPortions[id] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/unvalidate-portion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId: id })
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de l'invalidation de la partie");
      }
    } finally {
      unvalidatingPortions[id] = false;
    }
  }

  async function validatePortion(id: string) {
    validatingPortions[id] = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/validate-portion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portionId: id })
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Erreur lors de la validation de la partie");
      }
    } finally {
      validatingPortions[id] = false;
    }
  }

  async function saveEditPortion() {
    if (!editPortionText.trim()) return;
    savingPortion = true;
    try {
      const res = await fetch(`/api/admin/artworks/${oeuvre.id}/edit-portion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portionId: editingPortionId,
          title: editPortionTitle,
          text: editPortionText
        })
      });
      if (res.ok) {
        await invalidateAll();
        editingPortionId = null;
      } else {
        alert('Erreur lors de la modification');
      }
    } finally {
      savingPortion = false;
    }
  }
</script>

{#if portions.length > 0}

  <div class="article-section">
    <h3 class="section-subtitle">ARTICLE</h3>
    <div class="statements-list">
      {#each portions.filter((p: any) => p.type === 'article') as portion, index}
        <div class="statement-card {portion.status.toLowerCase()}">
          <div class="statement-header">
            <span class="portion-index">Partie {index + 1}</span>
            <span class="status-pill {portion.status.toLowerCase()}">{portion.status}</span>
          </div>
          
          {#if editingPortionId === portion.id}
            <input type="text" bind:value={editPortionTitle} class="edit-input" placeholder="Titre de la partie (optionnel)" />
            <textarea bind:value={editPortionText} class="edit-textarea" rows="4"></textarea>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <Button variant="primary" size="sm" onclick={saveEditPortion} loading={savingPortion}>Enregistrer</Button>
              <Button variant="outline" size="sm" onclick={() => correctManual(portion.id)} loading={correctingPortions[portion.id]}>Générer</Button>
              <Button variant="outline" size="sm" onclick={() => editingPortionId = null}>Annuler</Button>
            </div>
          {:else}
            {#if portion.title}
              <h4 class="statement-title">{portion.title}</h4>
            {/if}
            <div class="rich-text statement-text">
              {@html parseMarkdown(portion.text)}
            </div>
          {/if}
          
          {#if portion.explanation || portion.source_quote || portion.status?.toUpperCase() !== 'VERIFIED'}
            <div class="statement-feedback">
              {#if portion.explanation}
                <p class="statement-explanation">{portion.explanation}</p>
              {/if}
              
              {#if portion.source_quote}
                <div class="statement-source">
                  <span class="source-label">Source Wikipédia</span>
                  <p>"{portion.source_quote}"</p>
                </div>
              {/if}

              <div class="statement-actions">
                <Button variant="outline" size="sm" onclick={() => { editingPortionId = portion.id; editPortionTitle = portion.title || ''; editPortionText = portion.text; }}>
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onclick={() => factcheckPortion(portion.id)} loading={verifyingPortions[portion.id]} disabled={portion.status?.toUpperCase() === 'VERIFIED'}>
                  Vérifier
                </Button>

                {#if portion.status?.toUpperCase() === 'VERIFIED'}
                  <Button variant="outline" size="sm" onclick={() => unvalidatePortion(portion.id)} loading={unvalidatingPortions[portion.id]}>
                    Invalider
                  </Button>
                {:else}
                  {#if portion.status?.toUpperCase() === 'FALSE'}
                    <Button variant="danger" size="sm" onclick={() => correctManual(portion.id)} loading={correctingPortions[portion.id]}>
                      Corriger
                    </Button>
                  {/if}
                  <Button variant="outline" size="sm" onclick={() => validatePortion(portion.id)} loading={validatingPortions[portion.id]}>
                    Valider
                  </Button>
                {/if}

                <Button variant="outline" size="sm" onclick={() => deletePortion(portion.id)} loading={deletingPortions[portion.id]}>
                  Supprimer
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if portions.some((p: any) => p.type === 'anecdote')}
    <div class="anecdotes-section">
      <h3 class="section-subtitle">ANECDOTES</h3>
      <div class="statements-list">
      {#each portions.filter((p: any) => p.type === 'anecdote') as portion, index}
        <div class="statement-card {portion.status.toLowerCase()}">
          <div class="statement-header">
            <span class="portion-index">Anecdote {index + 1}</span>
            <span class="status-pill {portion.status.toLowerCase()}">{portion.status}</span>
          </div>
          
          {#if editingPortionId === portion.id}
            <textarea bind:value={editPortionText} class="edit-textarea" rows="4"></textarea>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <Button variant="primary" size="sm" onclick={saveEditPortion} loading={savingPortion}>Enregistrer</Button>
              <Button variant="outline" size="sm" onclick={() => correctManual(portion.id)} loading={correctingPortions[portion.id]}>Générer</Button>
              <Button variant="outline" size="sm" onclick={() => editingPortionId = null}>Annuler</Button>
            </div>
          {:else}
            <div class="rich-text statement-text">
              {@html parseMarkdown(portion.text)}
            </div>
          {/if}
          
          {#if portion.explanation || portion.source_quote || portion.status?.toUpperCase() !== 'VERIFIED'}
            <div class="statement-feedback">
              {#if portion.explanation}
                <p class="statement-explanation">{portion.explanation}</p>
              {/if}
              
              {#if portion.source_quote}
                <div class="statement-source">
                  <span class="source-label">Source Wikipédia</span>
                  <p>"{portion.source_quote}"</p>
                </div>
              {/if}

              <div class="statement-actions">
                <Button variant="outline" size="sm" onclick={() => { editingPortionId = portion.id; editPortionTitle = portion.title || ''; editPortionText = portion.text; }}>
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onclick={() => factcheckPortion(portion.id)} loading={verifyingPortions[portion.id]} disabled={portion.status?.toUpperCase() === 'VERIFIED'}>
                  Vérifier
                </Button>

                {#if portion.status?.toUpperCase() === 'VERIFIED'}
                  <Button variant="outline" size="sm" onclick={() => unvalidatePortion(portion.id)} loading={unvalidatingPortions[portion.id]}>
                    Invalider
                  </Button>
                {:else}
                  {#if portion.status?.toUpperCase() === 'FALSE'}
                    <Button variant="danger" size="sm" onclick={() => correctManual(portion.id)} loading={correctingPortions[portion.id]}>
                      Corriger
                    </Button>
                  {/if}
                  <Button variant="outline" size="sm" onclick={() => validatePortion(portion.id)} loading={validatingPortions[portion.id]}>
                    Valider
                  </Button>
                {/if}

                <Button variant="outline" size="sm" onclick={() => deletePortion(portion.id)} loading={deletingPortions[portion.id]}>
                  Supprimer
                </Button>
              </div>
            </div>
          {/if}
        </div>
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
  }

  .statements-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .statement-card {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border-subtle);
    border-radius: 0;
    padding: 0 0 1.5rem 0;
    transition: all 0.2s ease;
  }

  .statement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
</style>
