<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import { Sparkle, ShieldCheck, ArrowLeft, Warning, PencilSimple, Check, X } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let { data } = $props();
  let courant = $derived(data.courant);
  let content = $state(untrack(() => data.courant.courant_translations[0]));
  
  $effect(() => {
    content = data.courant.courant_translations[0];
  });
  
  let generating = $state(false);
  let validating = $state(false);
  let editing = $state(false);
  let editContent = $state('');

  async function saveEdit() {
    try {
      const res = await fetch(`/api/admin/courants/${courant.id}/edit-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
        editing = false;
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function generateContent() {
    if (content?.description_courte && !confirm('Du contenu existe déjà. Voulez-vous vraiment le regénérer ?')) return;
    generating = true;
    try {
      const res = await fetch(`/api/admin/courants/${courant.id}/generate`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
      } else {
        alert('Erreur lors de la génération');
      }
    } finally {
      generating = false;
    }
  }

  async function validateManual() {
    validating = true;
    try {
      const res = await fetch(`/api/admin/courants/${courant.id}/validate`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.content) content = json.content;
        await invalidateAll();
      } else {
        alert('Erreur lors de la validation');
      }
    } finally {
      validating = false;
    }
  }
</script>

<div class="admin-detail-view">
  <div class="top-nav">
    <a href="/admin/courants" class="back-link">
      <ArrowLeft size={20} />
      <span>Retour à la liste</span>
    </a>
  </div>

  <div class="detail-header">
    <div class="header-info">
      <h1 class="page-title">{(courant.courant_translations?.[0]?.nom || '')}</h1>
      <p class="subtitle">Mouvement Artistique</p>
    </div>
    <div class="header-actions">
      <Button variant="primary" onclick={generateContent} loading={generating} disabled={generating}>
        <Sparkle size={20} weight="fill" />
        {content?.description_courte ? 'Regénérer le contenu' : 'Générer le contenu'}
      </Button>
    </div>
  </div>

  <div class="content-container">
    <section class="panel">
      <div class="panel-header">
        <h2 class="panel-title mb-0">Contenu (Glossaire)</h2>
        {#if content?.verification_status}
          <div class="status-badge {content.verification_status.toLowerCase()}">
            {content.verification_status}
          </div>
        {:else}
          <div class="status-badge unknown">VIDE</div>
        {/if}
      </div>

      {#if content?.description_courte}
        <div class="description-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 class="section-subtitle mb-0">Description courte (Affichée à l'utilisateur)</h3>
            <div style="display: flex; gap: 0.5rem;">
              {#if editing}
                <Button variant="primary" size="sm" onclick={saveEdit} title="Sauvegarder"><Check size={18} /></Button>
                <Button variant="outline" size="sm" onclick={() => editing = false} title="Annuler"><X size={18} /></Button>
              {:else}
                <Button variant="outline" size="sm" onclick={() => { editContent = content?.description_courte || ''; editing = true; }} title="Éditer"><PencilSimple size={18} /></Button>
              {/if}
            </div>
          </div>

          {#if editing}
            <textarea class="edit-textarea" bind:value={editContent} rows="6"></textarea>
          {:else}
            <div class="rich-text statement-text">
              {@html parseMarkdown(content.description_courte)}
            </div>
          {/if}
          
          {#if content.verification_status !== 'VERIFIED'}
            <div class="statement-actions" style="margin-top: 1rem;">
              <Button variant="primary" size="sm" onclick={validateManual} loading={validating}>
                Valider ce texte
              </Button>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">
            <Warning size={32} weight="duotone" />
          </div>
          <h3>Aucun contenu</h3>
          <p>Cliquez sur "Générer le contenu" pour demander à l'IA de rédiger une courte description pour le glossaire.</p>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .admin-detail-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding-bottom: 4rem;
  }

  .top-nav {
    margin-bottom: -1rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .page-title {
    font-family: 'Instrument Serif', serif;
    font-size: 3rem;
    font-weight: 400;
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .subtitle {
    font-size: 1.1rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .content-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .panel {
    background-color: transparent;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    border: none;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .panel-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge.verified {
    background-color: color-mix(in oklch, var(--color-success) 15%, transparent);
    color: var(--color-success);
  }

  .status-badge.pending {
    background-color: color-mix(in oklch, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
  }

  .status-badge.unknown {
    background-color: color-mix(in oklch, var(--color-text-muted) 15%, transparent);
    color: var(--color-text-muted);
  }

  .section-subtitle {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 0 0 1rem 0;
  }

  .statement-text {
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    padding: 1rem;
    border-radius: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background-color: color-mix(in oklch, var(--color-bg) 50%, transparent);
    border-radius: 12px;
    border: 1px dashed var(--color-border);
  }

  .empty-icon {
    color: var(--color-text-muted);
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
  }

  .empty-state p {
    margin: 0;
    color: var(--color-text-muted);
    max-width: 400px;
    margin: 0 auto;
  }

  .edit-textarea {
    width: 100%;
    background: color-mix(in oklch, var(--color-surface) 50%, transparent);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: 0.95rem;
    line-height: 1.6;
    resize: vertical;
    margin-top: 0.5rem;
  }
  
  .edit-textarea:focus {
    outline: 2px solid var(--color-primary);
    border-color: transparent;
  }

  .mb-0 {
    margin-bottom: 0 !important;
  }
</style>
