<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { parseMarkdown } from '$lib/utils/markdown';
  import { html } from '$lib/actions/html';
  import { autosize } from '$lib/actions/autosize';
  import { Sparkle, ArrowLeft, Warning, PencilSimple, Check, X } from 'phosphor-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiClient } from '$lib/utils/api';
  import { toast } from '$lib/utils/toast.svelte';

  let { data } = $props();
  let artist = $derived(data.artist);
  let content = $derived(data.artist.artist_translations[0]);
  let isVerified = $derived(content?.verification_status?.toUpperCase() === 'VERIFIED');
  
  let generating = $state(false);
  let validating = $state(false);
  let unvalidating = $state(false);
  let editing = $state(false);
  let editContent = $state('');
  let isSaving = $state(false);

  async function saveEdit() {
    if (!editContent.trim()) return;
    isSaving = true;
    try {
      const res = await apiClient.post(`/api/admin/artists/${artist.id}/edit-description`, { content: editContent });
      if (res.ok) {
        await invalidateAll();
        editing = false;
        toast.success("Description enregistrée");
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur réseau lors de la sauvegarde');
    } finally {
      isSaving = false;
    }
  }

  async function generateContent() {
    if (content?.short_description && !confirm('Du contenu existe déjà. Voulez-vous vraiment le regénérer par IA ?')) return;
    generating = true;
    toast.info("Génération du glossaire par IA...");
    try {
      const res = await apiClient.post(`/api/admin/artists/${artist.id}/generate`);
      if (res.ok) {
        await invalidateAll();
        toast.success("Description générée par IA");
      } else {
        toast.error('Erreur lors de la génération');
      }
    } catch {
      toast.error('Erreur réseau lors de la génération');
    } finally {
      generating = false;
    }
  }

  async function validateManual() {
    validating = true;
    try {
      const res = await apiClient.post(`/api/admin/artists/${artist.id}/validate`);
      if (res.ok) {
        await invalidateAll();
        toast.success("Description validée");
      } else {
        toast.error('Erreur lors de la validation');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      validating = false;
    }
  }

  async function unvalidateManual() {
    unvalidating = true;
    try {
      const res = await apiClient.post(`/api/admin/artists/${artist.id}/unvalidate`);
      if (res.ok) {
        await invalidateAll();
        toast.info("Statut invalidé");
      } else {
        toast.error("Erreur lors de l'invalidation");
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      unvalidating = false;
    }
  }

  function handleCancelEdit() {
    editing = false;
  }

  function handleStartEdit() {
    editContent = content?.short_description || '';
    editing = true;
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }
</script>

<div class="admin-detail-view">
  <!-- Sticky Header -->
  <header class="header-section sticky-header">
    <a data-sveltekit-preload-data="hover" href="/admin/artists" data-sveltekit-prefetch class="back-link">
      <ArrowLeft size={18} weight="bold" />
      Retour
    </a>
    
    <div class="title-row">
      <div class="title-info">
        <h1 class="page-title">{artist.artist_translations?.[0]?.name || ''}</h1>
        <p class="page-subtitle">Artiste</p>
      </div>
      
      <div class="action-buttons">
        <Button 
          variant="primary" 
          onclick={generateContent} 
          loading={generating} 
          disabled={generating}
        >
          <Sparkle size={16} weight="fill" />
          <span>{generating ? 'Génération...' : content?.short_description ? 'Régénérer' : 'Générer'}</span>
        </Button>
      </div>
    </div>
  </header>

  <div class="mobile-flow">
    <!-- Status Summary Card -->
    <div class="summary-card">
      <div class="summary-header">
        <span class="summary-label">Statut de vérification</span>
        {#if content?.verification_status}
          <div class="status-pill {content.verification_status.toLowerCase()}">
            {content.verification_status}
          </div>
        {:else}
          <div class="status-pill empty">VIDE</div>
        {/if}
      </div>

      {#if isVerified}
        <Button variant="ghost" size="sm" onclick={unvalidateManual} loading={unvalidating} class="unvalidate-btn">
          Invalider le contenu
        </Button>
      {/if}
    </div>

    <!-- Editorial Description Section -->
    <section class="editorial-section">
      <div class="panel-header">
        <h2 class="panel-title">DESCRIPTION GLOSSAIRE</h2>
        {#if !editing && content?.short_description}
          <div class="header-actions">
            {#if isVerified}
              <Button variant="outline" size="sm" onclick={handleStartEdit}>
                <PencilSimple size={14} weight="bold" />
                Modifier
              </Button>
              <Button variant="ghost" size="sm" onclick={unvalidateManual} loading={unvalidating}>
                <X size={14} weight="bold" />
                Invalider
              </Button>
            {:else}
              <Button variant="primary" size="sm" onclick={validateManual} loading={validating}>
                <Check size={14} weight="bold" />
                Valider
              </Button>
              <Button variant="outline" size="sm" onclick={handleStartEdit}>
                <PencilSimple size={14} weight="bold" />
                Modifier
              </Button>
            {/if}
          </div>
        {/if}
      </div>

      {#if editing}
        <div class="edit-box">
          <textarea 
            class="edit-textarea" 
            bind:value={editContent} 
            use:autosize
            onkeydown={handleKeydown}
            rows="5"
            placeholder="Description de l'artiste pour le glossaire..."
          ></textarea>

          <div class="edit-footer">
            <span class="shortcut-hint">
              <kbd>⌘</kbd>+<kbd>Entrée</kbd> pour sauvegarder • <kbd>Échap</kbd> pour annuler
            </span>
            <div class="edit-actions">
              <Button variant="ghost" size="sm" onclick={handleCancelEdit}>Annuler</Button>
              <Button variant="primary" size="sm" onclick={saveEdit} loading={isSaving}>
                <Check size={14} weight="bold" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      {:else if content?.short_description}
        <div class="statement-card {isVerified ? 'verified' : 'pending'}">
          <div class="rich-text" use:html={parseMarkdown(content.short_description)}></div>
        </div>
      {:else}
        <div class="empty-state">
          <Warning size={36} weight="duotone" class="empty-icon" />
          <p class="empty-title">Aucune description disponible</p>
          <p class="empty-desc">Cliquez sur le bouton "Générer" ci-dessus pour rédiger une notice glossaire via l'IA.</p>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .admin-detail-view { display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 5rem; width: 100%; }
  .sticky-header { position: sticky; top: 0; z-index: 20; background: color-mix(in oklch, var(--color-bg) 85%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 1rem 1.25rem 1.25rem; margin: -1rem -1.25rem 0; border-bottom: 1px solid var(--color-border-subtle); }
  .back-link { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-secondary); font-size: 0.88rem; font-weight: 600; text-decoration: none; margin-bottom: 0.75rem; transition: color 0.2s ease; }
  .back-link:hover { color: var(--color-primary); }
  .title-row { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
  .title-info { flex: 1 1 200px; }
  .page-title { font-family: var(--font-body); font-size: 1.5rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-primary); margin: 0 0 0.2rem 0; line-height: 1.2; }
  .page-subtitle { font-size: 0.9rem; color: var(--color-text-secondary); margin: 0; }
  .action-buttons { display: flex; gap: 0.5rem; }
  .mobile-flow { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; }
  .summary-card { padding: 1rem 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 0.75rem; }
  .summary-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  .summary-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
  :global(.unvalidate-btn) { width: 100%; margin-top: 0.25rem; }
  .status-pill { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.7rem; font-weight: 700; font-family: var(--font-body); text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid transparent; }
  .status-pill.verified { background: color-mix(in oklch, var(--color-success) 15%, transparent); color: var(--color-success); border-color: color-mix(in oklch, var(--color-success) 30%, transparent); }
  .status-pill.pending, .status-pill.pending_validation { background: color-mix(in oklch, var(--color-warning) 15%, transparent); color: var(--color-warning); border-color: color-mix(in oklch, var(--color-warning) 30%, transparent); }
  .status-pill.empty { background: color-mix(in oklch, var(--color-error) 15%, transparent); color: var(--color-error); border-color: color-mix(in oklch, var(--color-error) 30%, transparent); }
  .editorial-section { display: flex; flex-direction: column; gap: 1rem; }
  .panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap; }
  .panel-title { font-family: var(--font-body); font-size: 1.05rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-primary); margin: 0; }
  .header-actions { display: flex; gap: 0.5rem; align-items: center; }
  .statement-card { padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border-subtle); line-height: 1.65; }
  .statement-card.verified { border-color: color-mix(in oklch, var(--color-success) 35%, transparent); background: color-mix(in oklch, var(--color-success) 3%, var(--color-surface)); }
  .statement-card.pending { border-color: color-mix(in oklch, var(--color-warning) 35%, transparent); background: color-mix(in oklch, var(--color-warning) 3%, var(--color-surface)); }
  .rich-text { line-height: 1.65; color: var(--color-text-primary); font-size: 0.95rem; }
  .edit-box { display: flex; flex-direction: column; gap: 0.5rem; }
  .edit-textarea { width: 100%; background-color: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-family: var(--font-body); font-size: 0.95rem; line-height: 1.6; }
  .edit-textarea:focus { outline: none; border-color: var(--color-primary); }
  .edit-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.25rem; }
  .shortcut-hint { font-size: 0.75rem; color: var(--color-text-muted); }
  .shortcut-hint kbd { background: var(--color-surface-hover); padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid var(--color-border-subtle); font-size: 0.7rem; }
  .edit-actions { display: flex; gap: 0.5rem; margin-left: auto; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; background: var(--color-surface); border-radius: var(--radius-lg); border: 1px dashed var(--color-border); text-align: center; color: var(--color-text-secondary); gap: 0.5rem; }
  .empty-title { font-weight: 700; font-size: 1rem; color: var(--color-text-primary); margin: 0.5rem 0 0 0; }
  .empty-desc { font-size: 0.88rem; color: var(--color-text-muted); max-width: 450px; line-height: 1.5; margin: 0; }
  :global(.empty-icon) { color: var(--color-text-muted); }
</style>

